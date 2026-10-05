// gosplit: mueve declaraciones de nivel superior de un archivo Go a otro del mismo paquete.
//
// Uso: gosplit <src.go> <dst.go> <header-file|-> name1 name2 ...
//
// Un nombre es `Func`, `Tipo.Metodo` o el primer nombre de un bloque const/var/type. El texto de
// cada declaración se copia byte a byte con su doc comment: no se reformatea nada salvo con gofmt.
// Si dst existe, las declaraciones se agregan al final. El header de un dst nuevo es el texto de
// header-file, o el comentario de cabecera de src si es "-". Después se podan en los dos archivos
// los imports que quedaron sin uso.
package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"os/exec"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

func declName(d ast.Decl) []string {
	switch x := d.(type) {
	case *ast.FuncDecl:
		if x.Recv != nil && len(x.Recv.List) > 0 {
			t := x.Recv.List[0].Type
			if s, ok := t.(*ast.StarExpr); ok {
				t = s.X
			}
			if ix, ok := t.(*ast.IndexExpr); ok {
				t = ix.X
			}
			if id, ok := t.(*ast.Ident); ok {
				return []string{id.Name + "." + x.Name.Name}
			}
		}
		return []string{x.Name.Name}
	case *ast.GenDecl:
		var out []string
		for _, s := range x.Specs {
			switch sp := s.(type) {
			case *ast.TypeSpec:
				out = append(out, sp.Name.Name)
			case *ast.ValueSpec:
				for _, n := range sp.Names {
					out = append(out, n.Name)
				}
			}
		}
		return out
	}
	return nil
}

type span struct{ start, end int }

var emptyImport = regexp.MustCompile(`(?m)^import \(\s*\)\n`)

func main() {
	src, dst, hdr := os.Args[1], os.Args[2], os.Args[3]
	want := map[string]bool{}
	for _, n := range os.Args[4:] {
		want[n] = true
	}
	data, err := os.ReadFile(src)
	must(err)
	text := strings.ReplaceAll(string(data), "\r\n", "\n")
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, src, text, parser.ParseComments)
	must(err)

	var spans []span
	found := map[string]bool{}
	for _, d := range f.Decls {
		names := declName(d)
		hit := false
		for _, n := range names {
			if want[n] {
				hit, found[n] = true, true
			}
		}
		if !hit {
			continue
		}
		start := d.Pos()
		switch x := d.(type) {
		case *ast.FuncDecl:
			if x.Doc != nil {
				start = x.Doc.Pos()
			}
		case *ast.GenDecl:
			if x.Doc != nil {
				start = x.Doc.Pos()
			}
		}
		s, e := fset.Position(start).Offset, fset.Position(d.End()).Offset
		e = trailingComment(text, e)
		for e < len(text) && text[e] == '\n' {
			e++
		}
		spans = append(spans, span{s, e})
	}
	for n := range want {
		if !found[n] {
			fmt.Fprintf(os.Stderr, "gosplit: no encontré %q en %s\n", n, src)
			os.Exit(1)
		}
	}
	sort.Slice(spans, func(i, j int) bool { return spans[i].start < spans[j].start })

	var moved []string
	rest := text
	for i := len(spans) - 1; i >= 0; i-- {
		sp := spans[i]
		moved = append([]string{strings.TrimRight(text[sp.start:sp.end], "\n")}, moved...)
		rest = rest[:sp.start] + rest[sp.end:]
	}

	pkgOff := fset.Position(f.Package).Offset
	importBlock := importText(f, fset, text)

	var out string
	if existing, err := os.ReadFile(dst); err == nil {
		out = strings.TrimRight(strings.ReplaceAll(string(existing), "\r\n", "\n"), "\n") + "\n\n" +
			strings.Join(moved, "\n\n") + "\n"
		out = addImports(out, f)
	} else {
		header := text[:pkgOff]
		if hdr != "-" {
			h, err := os.ReadFile(hdr)
			must(err)
			header = strings.TrimRight(strings.ReplaceAll(string(h), "\r\n", "\n"), "\n") + "\n\n"
		}
		out = header + "package " + f.Name.Name + "\n\n" + importBlock + "\n\n" + strings.Join(moved, "\n\n") + "\n"
	}

	must(os.WriteFile(src, []byte(rest), 0o644))
	must(os.WriteFile(dst, []byte(out), 0o644))
	prune(src)
	prune(dst)
	regroup(dst)
	must(exec.Command("gofmt", "-w", src, dst).Run())
}

// trailingComment extiende el fin de la declaración hasta el final de su última línea si ahí hay
// un comentario, como un `//nolint:` al costado: el árbol sintáctico no lo cuenta dentro de la
// declaración, y sin esto se queda en el archivo de origen, huérfano.
func trailingComment(text string, e int) int {
	i := e
	for i < len(text) && (text[i] == ' ' || text[i] == '\t') {
		i++
	}
	if !strings.HasPrefix(text[i:], "//") {
		return e
	}
	for i < len(text) && text[i] != '\n' {
		i++
	}
	return i
}

func importText(f *ast.File, fset *token.FileSet, text string) string {
	var lines []string
	for _, im := range f.Imports {
		s := fset.Position(im.Pos()).Offset
		e := fset.Position(im.End()).Offset
		lines = append(lines, "\t"+text[s:e])
	}
	if len(lines) == 0 {
		return ""
	}
	return "import (\n" + strings.Join(lines, "\n") + "\n)"
}

// addImports agrega al archivo destino existente los imports de src que no tenga; prune
// después saca los que sobren.
func addImports(out string, f *ast.File) string {
	var add []string
	for _, im := range f.Imports {
		spec := im.Path.Value
		if im.Name != nil {
			spec = im.Name.Name + " " + spec
		}
		if !strings.Contains(out, im.Path.Value) {
			add = append(add, "\t"+spec)
		}
	}
	if len(add) == 0 {
		return out
	}
	if i := strings.Index(out, "import (\n"); i >= 0 {
		j := i + len("import (\n")
		return out[:j] + strings.Join(add, "\n") + "\n" + out[j:]
	}
	i := strings.Index(out, "\npackage ")
	k := i + 1 + strings.Index(out[i+1:], "\n")
	return out[:k+1] + "\nimport (\n" + strings.Join(add, "\n") + "\n)\n" + out[k+1:]
}

func localName(im *ast.ImportSpec) string {
	if im.Name != nil {
		return im.Name.Name
	}
	p, _ := strconv.Unquote(im.Path.Value)
	parts := strings.Split(p, "/")
	last := parts[len(parts)-1]
	if len(parts) > 1 && len(last) > 1 && last[0] == 'v' && strings.Trim(last[1:], "0123456789") == "" {
		last = parts[len(parts)-2]
	}
	return last
}

func prune(path string) {
	data, err := os.ReadFile(path)
	must(err)
	text := string(data)
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, path, text, parser.ParseComments)
	must(err)
	used := map[string]bool{}
	ast.Inspect(f, func(n ast.Node) bool {
		if sel, ok := n.(*ast.SelectorExpr); ok {
			if id, ok := sel.X.(*ast.Ident); ok {
				used[id.Name] = true
			}
		}
		return true
	})
	var cut []span
	for _, im := range f.Imports {
		n := localName(im)
		if n == "_" || n == "." || used[n] {
			continue
		}
		s := fset.Position(im.Pos()).Offset
		e := fset.Position(im.End()).Offset
		for s > 0 && text[s-1] != '\n' {
			s--
		}
		if e < len(text) && text[e] == '\n' {
			e++
		}
		cut = append(cut, span{s, e})
	}
	for i := len(cut) - 1; i >= 0; i-- {
		text = text[:cut[i].start] + text[cut[i].end:]
	}
	// El bloque que queda vacío puede traer la línea en blanco que separaba los dos grupos.
	text = emptyImport.ReplaceAllString(text, "")
	for strings.Contains(text, "\n\n\n") {
		text = strings.ReplaceAll(text, "\n\n\n", "\n\n")
	}
	must(os.WriteFile(path, []byte(text), 0o644))
}

func must(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "gosplit:", err)
		os.Exit(1)
	}
}

// regroup deja el bloque de imports en dos grupos: la biblioteca estándar y el resto.
func regroup(path string) {
	data, err := os.ReadFile(path)
	must(err)
	text := string(data)
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, path, text, parser.ImportsOnly|parser.ParseComments)
	must(err)
	var decl *ast.GenDecl
	for _, d := range f.Decls {
		if g, ok := d.(*ast.GenDecl); ok && g.Tok == token.IMPORT {
			if decl != nil {
				return
			}
			decl = g
		}
	}
	if decl == nil || !decl.Lparen.IsValid() {
		return
	}
	var std, other []string
	for _, sp := range decl.Specs {
		im := sp.(*ast.ImportSpec)
		line := "\t" + text[fset.Position(im.Pos()).Offset:fset.Position(im.End()).Offset]
		p, _ := strconv.Unquote(im.Path.Value)
		if strings.Contains(strings.Split(p, "/")[0], ".") || strings.HasPrefix(p, "asistencia") {
			other = append(other, line)
		} else {
			std = append(std, line)
		}
	}
	body := strings.Join(std, "\n")
	if len(std) > 0 && len(other) > 0 {
		body += "\n\n"
	}
	body += strings.Join(other, "\n")
	s := fset.Position(decl.Pos()).Offset
	e := fset.Position(decl.End()).Offset
	text = text[:s] + "import (\n" + body + "\n)" + text[e:]
	must(os.WriteFile(path, []byte(text), 0o644))
}

// gocoup: por paquete de Go -> archivos, tipos (Nc), interfaces (Na) y paquetes del mismo módulo
// que importa. Mide la producción: salta los _test.go, testdata/ y las carpetas ocultas. Ca, Ce,
// I, A y D los calcula coupling.py con el grafo entero.
// Trazabilidad: standards/Metricas_final.md §3.1, §3.4 y §5 · CODE_STANDARDS §7.3.1
package main

import (
	"bufio"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type pkg struct {
	files, nc, na int
	deps          map[string]bool
}

func modulePath(root string) string {
	f, err := os.Open(filepath.Join(root, "go.mod"))
	if err != nil {
		return ""
	}
	defer f.Close()
	s := bufio.NewScanner(f)
	for s.Scan() {
		if l := strings.TrimSpace(s.Text()); strings.HasPrefix(l, "module ") {
			return strings.TrimSpace(strings.TrimPrefix(l, "module "))
		}
	}
	return ""
}

func main() {
	root := os.Args[1]
	mod := modulePath(root)
	pkgs := map[string]*pkg{}
	filepath.Walk(root, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() && p != root && (info.Name() == "testdata" || strings.HasPrefix(info.Name(), ".")) {
			return filepath.SkipDir
		}
		if info.IsDir() || !strings.HasSuffix(p, ".go") || strings.HasSuffix(p, "_test.go") {
			return nil
		}
		f, perr := parser.ParseFile(token.NewFileSet(), p, nil, parser.SkipObjectResolution)
		if perr != nil {
			return nil
		}
		rel, _ := filepath.Rel(root, filepath.Dir(p))
		rel = filepath.ToSlash(rel)
		k := pkgs[rel]
		if k == nil {
			k = &pkg{deps: map[string]bool{}}
			pkgs[rel] = k
		}
		k.files++
		for _, imp := range f.Imports {
			path := strings.Trim(imp.Path.Value, `"`)
			if strings.HasPrefix(path, mod+"/") && strings.TrimPrefix(path, mod+"/") != rel {
				k.deps[strings.TrimPrefix(path, mod+"/")] = true
			}
		}
		for _, d := range f.Decls {
			g, ok := d.(*ast.GenDecl)
			if !ok || g.Tok != token.TYPE {
				continue
			}
			for _, s := range g.Specs {
				k.nc++
				if _, ok := s.(*ast.TypeSpec).Type.(*ast.InterfaceType); ok {
					k.na++
				}
			}
		}
		return nil
	})
	names := make([]string, 0, len(pkgs))
	for n := range pkgs {
		names = append(names, n)
	}
	sort.Strings(names)
	fmt.Println("component\tfiles\tnc\tna\tdeps")
	for _, n := range names {
		k := pkgs[n]
		deps := make([]string, 0, len(k.deps))
		for d := range k.deps {
			deps = append(deps, d)
		}
		sort.Strings(deps)
		fmt.Printf("%s\t%d\t%d\t%d\t%s\n", n, k.files, k.nc, k.na, strings.Join(deps, ","))
	}
}

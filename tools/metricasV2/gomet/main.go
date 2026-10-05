// gomet: por archivo .go -> total, comentario, blanco, LOC (sin comentario, con blancos),
// funciones, G sumado (McCabe), G máximo por función y su nombre, la G de cada función, y la
// G máxima entre las que juzga el techo por función, con su nombre.
//
// El techo por función no juzga la que declara la excepción 1 de CODE_STANDARDS §7.3 con
// `//nolint:cyclop` en su doc comment, igual que cc-check (§7.3.1).
package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/scanner"
	"go/token"
	"os"
	"path/filepath"
	"strings"
)

func cc(body ast.Node) int {
	c := 1
	ast.Inspect(body, func(n ast.Node) bool {
		switch x := n.(type) {
		case *ast.IfStmt, *ast.ForStmt, *ast.RangeStmt, *ast.CommClause:
			c++
		case *ast.CaseClause:
			if len(x.List) > 0 {
				c++
			}
		case *ast.BinaryExpr:
			if x.Op == token.LAND || x.Op == token.LOR {
				c++
			}
		case *ast.FuncLit:
			// los literales de función suman a la función que los contiene
		}
		return true
	})
	return c
}

// exempt mira los comentarios crudos: Doc.Text() descarta las directivas como `//nolint`.
func exempt(fn *ast.FuncDecl) bool {
	if fn.Doc == nil {
		return false
	}
	for _, c := range fn.Doc.List {
		if strings.Contains(c.Text, "nolint:cyclop") {
			return true
		}
	}
	return false
}

func lines(src []byte) (total, comment, blank int) {
	text := string(src)
	all := strings.Split(strings.ReplaceAll(text, "\r\n", "\n"), "\n")
	if len(all) > 0 && all[len(all)-1] == "" {
		all = all[:len(all)-1]
	}
	total = len(all)
	code := make([]bool, total+2)
	com := make([]bool, total+2)
	fset := token.NewFileSet()
	f := fset.AddFile("x", -1, len(src))
	var s scanner.Scanner
	s.Init(f, src, nil, scanner.ScanComments)
	for {
		pos, tok, lit := s.Scan()
		if tok == token.EOF {
			break
		}
		if tok == token.SEMICOLON && lit == "\n" {
			continue
		}
		start := fset.Position(pos).Line
		end := start + strings.Count(lit, "\n")
		for l := start; l <= end && l <= total; l++ {
			if tok == token.COMMENT {
				com[l] = true
			} else {
				code[l] = true
			}
		}
	}
	for i := 1; i <= total; i++ {
		if strings.TrimSpace(all[i-1]) == "" {
			blank++
		} else if com[i] && !code[i] {
			comment++
		}
	}
	return
}

func main() {
	root := os.Args[1]
	fmt.Println("file\ttotal\tcomment\tblank\tloc\tfuncs\tg_sum\tg_max\tg_max_fn\tg_fns\tg_gate\tg_gate_fn")
	filepath.Walk(root, func(p string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || !strings.HasSuffix(p, ".go") {
			return nil
		}
		src, _ := os.ReadFile(p)
		t, c, b := lines(src)
		fset := token.NewFileSet()
		file, perr := parser.ParseFile(fset, p, src, parser.ParseComments)
		funcs, gsum, gmax, gname, gate, gatename := 0, 0, 0, "", 0, ""
		gs := []string{}
		if perr == nil {
			for _, d := range file.Decls {
				fn, ok := d.(*ast.FuncDecl)
				if !ok || fn.Body == nil {
					continue
				}
				funcs++
				g := cc(fn.Body)
				gsum += g
				gs = append(gs, fmt.Sprint(g))
				if g > gmax {
					gmax, gname = g, fn.Name.Name
				}
				if g > gate && !exempt(fn) {
					gate, gatename = g, fn.Name.Name
				}
			}
		}
		rel, _ := filepath.Rel(root, p)
		fmt.Printf("%s\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%s\t%s\t%d\t%s\n", filepath.ToSlash(rel), t, c, b, t-c,
			funcs, gsum, gmax, gname, strings.Join(gs, ","), gate, gatename)
		return nil
	})
}

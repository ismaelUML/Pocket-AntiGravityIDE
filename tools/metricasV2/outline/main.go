// outline <file.go>...: una línea por declaración de nivel superior: líneas, G, nombre, primera línea
// del doc. G es la de McCabe con la misma cuenta que gomet, y 0 en lo que no es función; la última
// línea es la suma, que es lo que CODE_STANDARDS §7.3.1 limita por archivo.
package main

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
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
		}
		return true
	})
	return c
}

// main lista cada archivo que recibe. Con más de uno, cada lista va detrás de una línea «== <archivo>»,
// y el que no se puede leer queda con la suya vacía: así una sola corrida sirve al reporte del hook.
func main() {
	files := os.Args[1:]
	for _, path := range files {
		if len(files) > 1 {
			fmt.Printf("== %s\n", path)
		}
		err := outline(path)
		if err != nil && len(files) == 1 {
			panic(err)
		}
	}
}

func outline(path string) error {
	fset := token.NewFileSet()
	f, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
	if err != nil {
		return err
	}
	total := 0
	for _, d := range f.Decls {
		start := d.Pos()
		name, doc, g := "", "", 0
		switch x := d.(type) {
		case *ast.FuncDecl:
			name = x.Name.Name
			if x.Recv != nil {
				t := x.Recv.List[0].Type
				if s, ok := t.(*ast.StarExpr); ok {
					t = s.X
				}
				if ix, ok := t.(*ast.IndexExpr); ok {
					t = ix.X
				}
				if id, ok := t.(*ast.Ident); ok {
					name = id.Name + "." + name
				}
			}
			if x.Body != nil {
				g = cc(x.Body)
			}
			if x.Doc != nil {
				start, doc = x.Doc.Pos(), x.Doc.List[0].Text
			}
		case *ast.GenDecl:
			if x.Tok == token.IMPORT {
				continue
			}
			for _, s := range x.Specs {
				switch sp := s.(type) {
				case *ast.TypeSpec:
					name += sp.Name.Name + " "
				case *ast.ValueSpec:
					name += sp.Names[0].Name + " "
				}
			}
			name = x.Tok.String() + " " + strings.TrimSpace(name)
			if x.Doc != nil {
				start, doc = x.Doc.Pos(), x.Doc.List[0].Text
			}
		}
		total += g
		a, b := fset.Position(start).Line, fset.Position(d.End()).Line
		if runes := []rune(doc); len(runes) > 70 {
			doc = string(runes[:70])
		}
		fmt.Printf("%4d-%-4d %3d %2d  %-55s %s\n", a, b, b-a+1, g, name, doc)
	}
	fmt.Printf("G sumado: %d\n", total)
	return nil
}

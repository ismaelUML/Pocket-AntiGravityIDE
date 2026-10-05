// dartmet: por archivo .dart -> total, comentario, blanco, LOC, funciones, G sumado, G máximo, la G
// de cada función y la que juzga el techo por función, que en Dart es la máxima: la marca que
// declara el switch exhaustivo, `//nolint:cyclop`, es de Go (CODE_STANDARDS §7.3.1).
import 'dart:io';

import 'package:analyzer/dart/analysis/utilities.dart';
import 'package:analyzer/dart/ast/ast.dart';
import 'package:analyzer/dart/ast/token.dart';
import 'package:analyzer/dart/ast/visitor.dart';

class Cc extends RecursiveAstVisitor<void> {
  int c = 1;
  @override
  void visitIfStatement(IfStatement n) { c++; super.visitIfStatement(n); }
  @override
  void visitIfElement(IfElement n) { c++; super.visitIfElement(n); }
  @override
  void visitForStatement(ForStatement n) { c++; super.visitForStatement(n); }
  @override
  void visitForElement(ForElement n) { c++; super.visitForElement(n); }
  @override
  void visitWhileStatement(WhileStatement n) { c++; super.visitWhileStatement(n); }
  @override
  void visitDoStatement(DoStatement n) { c++; super.visitDoStatement(n); }
  @override
  void visitSwitchCase(SwitchCase n) { c++; super.visitSwitchCase(n); }
  @override
  void visitSwitchPatternCase(SwitchPatternCase n) { c++; super.visitSwitchPatternCase(n); }
  @override
  void visitSwitchExpressionCase(SwitchExpressionCase n) { c++; super.visitSwitchExpressionCase(n); }
  @override
  void visitConditionalExpression(ConditionalExpression n) { c++; super.visitConditionalExpression(n); }
  @override
  void visitCatchClause(CatchClause n) { c++; super.visitCatchClause(n); }
  @override
  void visitBinaryExpression(BinaryExpression n) {
    final t = n.operator.type;
    if (t == TokenType.AMPERSAND_AMPERSAND || t == TokenType.BAR_BAR || t == TokenType.QUESTION_QUESTION) c++;
    super.visitBinaryExpression(n);
  }
}

class Fns extends RecursiveAstVisitor<void> {
  final List<(String, int)> out = [];
  void add(String name, AstNode body) { final v = Cc(); body.accept(v); out.add((name, v.c)); }
  @override
  void visitFunctionDeclaration(FunctionDeclaration n) { add(n.name.lexeme, n.functionExpression.body); }
  @override
  void visitMethodDeclaration(MethodDeclaration n) { add(n.name.lexeme, n.body); }
  @override
  void visitConstructorDeclaration(ConstructorDeclaration n) { add(n.name?.lexeme ?? 'new', n); }
}

void main(List<String> args) {
  final root = Directory(args[0]);
  print('file\ttotal\tcomment\tblank\tloc\tfuncs\tg_sum\tg_max\tg_max_fn\tg_fns\tg_gate\tg_gate_fn');
  for (final e in root.listSync(recursive: true)) {
    if (e is! File || !e.path.endsWith('.dart')) continue;
    final p = e.path.replaceAll('\\', '/');
    if (p.contains('/build/') || p.contains('/.dart_tool/')) continue;
    final src = e.readAsStringSync().replaceAll('\r\n', '\n');
    final res = parseString(content: src, throwIfDiagnostics: false);
    final li = res.lineInfo;
    final lines = src.split('\n');
    if (lines.isNotEmpty && lines.last.isEmpty) lines.removeLast();
    final code = List<bool>.filled(lines.length + 2, false);
    final com = List<bool>.filled(lines.length + 2, false);
    void mark(int off, int end, List<bool> arr) {
      final a = li.getLocation(off).lineNumber, b = li.getLocation(end).lineNumber;
      for (var l = a; l <= b && l <= lines.length; l++) arr[l] = true;
    }
    Token? t = res.unit.beginToken;
    while (t != null && t.type != TokenType.EOF) {
      Token? c = t.precedingComments;
      while (c != null) { mark(c.offset, c.end, com); c = c.next; }
      mark(t.offset, t.end, code);
      t = t.next;
    }
    Token? c = t?.precedingComments;
    while (c != null) { mark(c.offset, c.end, com); c = c.next; }
    var comment = 0, blank = 0;
    for (var i = 1; i <= lines.length; i++) {
      if (lines[i - 1].trim().isEmpty) {
        blank++;
      } else if (com[i] && !code[i]) {
        comment++;
      }
    }
    final f = Fns();
    res.unit.accept(f);
    var gsum = 0, gmax = 0, gname = '';
    for (final (n, g) in f.out) { gsum += g; if (g > gmax) { gmax = g; gname = n; } }
    final rel = p.substring(root.path.replaceAll('\\', '/').length + 1);
    print('$rel\t${lines.length}\t$comment\t$blank\t${lines.length - comment}\t${f.out.length}\t$gsum\t$gmax\t$gname'
        '\t${f.out.map((e) => e.$2).join(',')}\t$gmax\t$gname');
  }
}

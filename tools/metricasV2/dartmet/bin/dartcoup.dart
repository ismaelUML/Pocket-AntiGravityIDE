// dartcoup: por paquete local -> archivos de su lib/, tipos (Nc), tipos abstractos (Na) y paquetes
// locales que importa o exporta. El paquete local es la raíz o una carpeta de packages/ con su
// pubspec.yaml. Tipo: clase, mixin o enum; abstracto: abstract, interface, sealed o mixin.
// Ca, Ce, I, A y D los calcula coupling.py con el grafo entero.
// Trazabilidad: standards/Metricas_final.md §3.1, §3.4 y §5 · CODE_STANDARDS §3.3 y §7.3.1
import 'dart:io';

import 'package:analyzer/dart/analysis/utilities.dart';
import 'package:analyzer/dart/ast/ast.dart';

String? nameOf(String dir) {
  final pubspec = File('$dir/pubspec.yaml');
  if (!pubspec.existsSync()) return null;
  return RegExp(r'^name:\s*(\S+)', multiLine: true).firstMatch(pubspec.readAsStringSync())?.group(1);
}

Map<String, String> packagesOf(String root) {
  final byName = <String, String>{};
  final rootName = nameOf(root);
  if (rootName != null) byName[rootName] = '';
  final dir = Directory('$root/packages');
  if (!dir.existsSync()) return byName;
  for (final e in dir.listSync()) {
    final n = e is Directory ? nameOf(e.path) : null;
    if (n != null) byName[n] = 'packages/${e.path.replaceAll('\\', '/').split('/').last}';
  }
  return byName;
}

void main(List<String> args) {
  final root = args[0].replaceAll('\\', '/');
  final byName = packagesOf(root);
  final comps = <String, List<int>>{};
  final deps = <String, Set<String>>{};
  for (final comp in byName.values) {
    final lib = Directory(comp.isEmpty ? '$root/lib' : '$root/$comp/lib');
    if (!lib.existsSync()) continue;
    final c = comps.putIfAbsent(comp, () => [0, 0, 0]);
    final d = deps.putIfAbsent(comp, () => <String>{});
    for (final e in lib.listSync(recursive: true)) {
      if (e is! File || !e.path.endsWith('.dart')) continue;
      c[0]++;
      final unit = parseString(content: e.readAsStringSync(), throwIfDiagnostics: false).unit;
      for (final dir in unit.directives) {
        if (dir is! NamespaceDirective) continue;
        final uri = dir.uri.stringValue ?? '';
        if (!uri.startsWith('package:')) continue;
        final target = byName[uri.substring('package:'.length).split('/').first];
        if (target != null && target != comp) d.add(target);
      }
      for (final decl in unit.declarations) {
        if (decl is ClassDeclaration) {
          c[1]++;
          if (decl.abstractKeyword != null || decl.interfaceKeyword != null ||
              decl.sealedKeyword != null || decl.mixinKeyword != null) c[2]++;
        } else if (decl is MixinDeclaration) {
          c[1]++;
          c[2]++;
        } else if (decl is EnumDeclaration) {
          c[1]++;
        }
      }
    }
  }
  print('component\tfiles\tnc\tna\tdeps');
  for (final k in comps.keys.toList()..sort()) {
    final c = comps[k]!;
    print('$k\t${c[0]}\t${c[1]}\t${c[2]}\t${(deps[k]!.toList()..sort()).join(',')}');
  }
}

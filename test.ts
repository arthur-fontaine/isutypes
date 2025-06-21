// isu-print.ts
import { Project } from "ts-morph";
import path from "path";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

project.addSourceFilesAtPaths("src/**/*.ts");

const sourceFile = project.getSourceFileOrThrow("src/test.ts");
const interfaceName = 'IStore';

const iface = sourceFile.getInterface(interfaceName);
if (!iface) {
  console.error(`❌ Interface '${interfaceName}' not found in ${sourceFile.getBaseName()}`);
  process.exit(1);
}

function resolveType(type: import("ts-morph").Type, depth = 0, visited = new Set<string>()): string {
  const indent = "  ".repeat(depth);

  if (type.isArray()) {
    return `${resolveType(type.getArrayElementTypeOrThrow(), depth, visited)}[]`;
  }

  if (type.isStringLiteral()) {
    return `\"${type.getLiteralValue()}\"`;
  }

  if (type.isLiteral()) {
    return JSON.stringify(type.getLiteralValue());
  }

  if (type.isEnumLiteral()) {
    return type.getText();
  }

  const primitiveOrGlobal = [
    "string", "number", "boolean", "Date", "null", "undefined", "any"
  ];

  const text = type.getText();
  if (primitiveOrGlobal.some(t => text === t || text.startsWith(`${t} |`))) {
    return text;
  }

  if (type.isUnion()) {
    return type.getUnionTypes().map(t => resolveType(t, depth, visited)).join(" | ");
  }

  const apparent = type.getApparentType();
  const key = apparent.getText();

  if (visited.has(key)) return "{ /* circular */ }";
  visited.add(key);

  const props = apparent.getProperties();
  if (props.length === 0) {
    visited.delete(key);
    return text.replace(/import\(".*?"\)\./g, "");
  }

  const lines = props
    .filter(prop => !/^__@.+@\d+$/.test(prop.getName())) // 🚫 ignore private symbol-like fields
    .map(prop => {
      const propName = prop.getName();
      const propType = prop.getTypeAtLocation(sourceFile);
      const optional = prop.isOptional?.() ?? false;
      return `${indent}  ${propName}${optional ? "?" : ""}: ${resolveType(propType, depth + 1, visited)};`;
    });

  visited.delete(key);
  return `{
${lines.join("\n")}
${indent}}`;
}

const printable = `interface ${iface.getName()} ${resolveType(iface.getType())}`;
console.log(printable);
// mock-generator.ts
import { Project } from "ts-morph";
import { faker } from "@faker-js/faker";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

project.addSourceFilesAtPaths("src/**/*.ts");

const sourceFile = project.getSourceFileOrThrow("src/test.ts");
const interfaceName = 'IInsertTransaction';

const iface = sourceFile.getInterface(interfaceName);
if (!iface) {
  console.error(`❌ Interface '${interfaceName}' not found in ${sourceFile.getBaseName()}`);
  process.exit(1);
}

function generateMockValue(type: import("ts-morph").Type, depth = 0, visited = new Set<string>()): string {
  const indent = "  ".repeat(depth);

  if (type.isArray()) {
    const elementMock = generateMockValue(type.getArrayElementTypeOrThrow(), depth, visited);
    return `[${elementMock}, ${elementMock}]`; // Génère un tableau avec 2 éléments
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

  const text = type.getText();

  // Types primitifs et globaux avec Faker
  if (text === "string") {
    return "faker.lorem.word()";
  }
  if (text === "number") {
    return "faker.number.int({ min: 1, max: 100 })";
  }
  if (text === "boolean") {
    return "faker.datatype.boolean()";
  }
  if (text === "Date") {
    return "faker.date.recent()";
  }
  if (text === "null") {
    return "null";
  }
  if (text === "undefined") {
    return "undefined";
  }
  if (text === "any") {
    return "faker.lorem.word()";
  }

  // Types union
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    return `faker.helpers.arrayElement([${unionTypes.map(t => generateMockValue(t, depth, visited)).join(", ")}])`;
  }

  const apparent = type.getApparentType();
  const key = apparent.getText();

  if (visited.has(key)) return "{}"; // Évite la récursion circulaire
  visited.add(key);

  if (type.getAliasSymbol()?.getName() === "Record") {
    const [keyType, valueType] = type.getAliasTypeArguments();
    if (!keyType || !valueType) {
      visited.delete(key);
      return "{}";
    }
    const keyMock = generateMockValue(keyType, depth + 1, visited);
    const mockValue = generateMockValue(valueType, depth + 1, visited);
    return `Object.fromEntries(Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => [${keyMock}, ${mockValue}]))`;
  }

  const props = apparent.getProperties();
  if (props.length === 0) {
    visited.delete(key);
    return "{}";
  }

  const lines = props
    .filter(prop => !/^__@.+@\d+$/.test(prop.getName()))
    .map(prop => {
      const propName = prop.getName();
      const propType = prop.getTypeAtLocation(sourceFile);
      const optional = prop.isOptional?.() ?? false;
      
      // Si la propriété est optionnelle, on peut parfois l'omettre
      if (optional && Math.random() > 0.7) {
        return null; // 30% de chance d'omettre une propriété optionnelle
      }

      const mockValue = generateMockValue(propType, depth + 1, visited);
      return `${indent}  ${propName}: ${mockValue},`;
    })
    .filter(Boolean); // Retire les valeurs null

  visited.delete(key);
  return `{
${lines.join("\n")}
${indent}}`;
}

// Génère le mock complet
const mockGenerator = `
function create${iface.getName()}Mock() {
  return ${generateMockValue(iface.getType())};
}

// Fonction pour générer plusieurs mocks
function create${iface.getName()}Mocks(count = 5) {
  return Array.from({ length: count }, () => create${iface.getName()}Mock());
}

(create${iface.getName()}Mocks);
`;

console.log(mockGenerator);
const generate = (function(faker) { return eval(mockGenerator) })(faker);
const mockDate = generate(3);

console.log(JSON.stringify(mockDate, null, 2));

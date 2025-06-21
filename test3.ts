// src/index.ts
import { Project, SourceFile, InterfaceDeclaration, Type } from "ts-morph";
import { faker } from "@faker-js/faker";
import * as path from "path";
import * as fs from "fs";

interface MockOptions {
  arrayLength?: number;
  optionalPropertyChance?: number;
  recordLength?: { min: number; max: number };
}

class MockInterfaceGenerator {
  private project: Project | null = null;
  private sourceFiles = new Map<string, SourceFile>();

  private initProject(filePath: string): Project {
    if (this.project) return this.project;

    // Recherche du tsconfig.json
    const tsConfigPath = this.findTsConfig(filePath);
    
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
    });

    return this.project;
  }

  private findTsConfig(startPath: string): string {
    let currentDir = path.dirname(startPath);
    
    while (currentDir !== path.dirname(currentDir)) {
      const tsConfigPath = path.join(currentDir, 'tsconfig.json');
      if (fs.existsSync(tsConfigPath)) {
        return tsConfigPath;
      }
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback: créer un tsconfig minimal
    console.warn('⚠️  tsconfig.json not found, using default configuration');
    return undefined as any; // ts-morph utilisera sa config par défaut
  }

  private getSourceFile(filePath: string): SourceFile {
    if (this.sourceFiles.has(filePath)) {
      return this.sourceFiles.get(filePath)!;
    }

    const project = this.initProject(filePath);
    
    // Ajouter le fichier source s'il n'est pas déjà dans le projet
    let sourceFile = project.getSourceFile(filePath);
    if (!sourceFile) {
      sourceFile = project.addSourceFileAtPath(filePath);
    }

    this.sourceFiles.set(filePath, sourceFile);
    return sourceFile;
  }

  private generateMockValue(
    type: Type,
    sourceFile: SourceFile,
    options: MockOptions,
    depth = 0,
    visited = new Set<string>(),
    propName?: string
  ): string {
    const indent = "  ".repeat(depth);

    if (type.isArray()) {
      const elementMock = this.generateMockValue(
        type.getArrayElementTypeOrThrow(),
        sourceFile,
        options,
        depth,
        visited
      );
      const length = options.arrayLength || 2;
      return `Array.from({ length: ${length} }, () => ${elementMock})`;
    }

    if (type.isStringLiteral()) {
      return `"${type.getLiteralValue()}"`;
    }

    if (type.isLiteral()) {
      return JSON.stringify(type.getLiteralValue());
    }

    if (type.isEnumLiteral()) {
      return type.getText();
    }

    const text = type.getText();

    // Types primitifs avec Faker
    if (text === "string") {
      if (propName) {
        const lowerProp = propName.toLowerCase();
        if (lowerProp.includes("email")) return "faker.internet.email()";
        if (lowerProp.includes("currency")) return "faker.finance.currencyCode()";
        if (lowerProp.includes("name")) return "faker.person.fullName()";
        if (lowerProp.includes("phone")) return "faker.phone.number()";
        if (lowerProp.includes("address")) return "faker.location.streetAddress()";
        if (lowerProp.includes("city")) return "faker.location.city()";
        if (lowerProp.includes("country")) return "faker.location.country()";
        if (lowerProp.includes("url") || lowerProp.includes("link")) return "faker.internet.url()";
        if (lowerProp.includes("id")) return "faker.string.uuid()";
      }
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
      const mockValues = unionTypes
        .map(t => this.generateMockValue(t, sourceFile, options, depth, visited))
        .join(", ");
      return `faker.helpers.arrayElement([${mockValues}])`;
    }

    const apparent = type.getApparentType();
    const key = apparent.getText();

    if (visited.has(key)) return "{}";
    visited.add(key);

    // Gestion des Record types
    if (type.getAliasSymbol()?.getName() === "Record") {
      const [keyType, valueType] = type.getAliasTypeArguments();
      if (!keyType || !valueType) {
        visited.delete(key);
        return "{}";
      }
      const keyMock = this.generateMockValue(keyType, sourceFile, options, depth + 1, visited);
      const mockValue = this.generateMockValue(valueType, sourceFile, options, depth + 1, visited);
      const { min, max } = options.recordLength || { min: 1, max: 5 };
      return `Object.fromEntries(Array.from({ length: faker.number.int({ min: ${min}, max: ${max} }) }, () => [${keyMock}, ${mockValue}]))`;
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
        
        if (optional && Math.random() > (options.optionalPropertyChance || 0.7)) {
          return null;
        }

        const mockValue = this.generateMockValue(propType, sourceFile, options, depth + 1, visited, propName);
        return `${indent}  ${propName}: ${mockValue},`;
      })
      .filter(Boolean);

    visited.delete(key);
    return `{
${lines.join("\n")}
${indent}}`;
  }

  generateMockFunction(
    interfaceName: string,
    filePath: string,
    options: MockOptions = {}
  ): Function {
    const sourceFile = this.getSourceFile(filePath);
    
    const iface = sourceFile.getInterface(interfaceName);
    if (!iface) {
      throw new Error(`Interface '${interfaceName}' not found in ${path.basename(filePath)}`);
    }

    const mockGenerator = `
      function create${interfaceName}Mock() {
        return ${this.generateMockValue(iface.getType(), sourceFile, options)};
      }

      function create${interfaceName}Mocks(count = 1) {
        return Array.from({ length: count }, () => create${interfaceName}Mock());
      }

      return create${interfaceName}Mocks;
    `;

    return new Function('faker', mockGenerator)(faker);
  }
}

// Instance singleton
const generator = new MockInterfaceGenerator();

/**
 * Génère une fonction de mock pour une interface TypeScript
 * @param interfaceName Nom de l'interface à mocker
 * @param filePath Chemin vers le fichier contenant l'interface (__filename)
 * @param options Options de génération
 * @returns Objet avec les méthodes single() et multiple(count?)
 */
export function mockInterface<T>(
  interfaceName: string,
  filePath: string,
  options: MockOptions = {}
): (count?: number) => T[] {
  return generator.generateMockFunction(interfaceName, filePath, options);
}

export default mockInterface;

// Export des types pour les utilisateurs
export { MockOptions };

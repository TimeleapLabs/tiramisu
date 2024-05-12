/**
 * This is a minimal script that generates TypeScript definitions
 * from a Chevrotain parser.
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { generateCstDts } from "chevrotain";
import { TiramisuProductions } from "../dist/parser.js";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dtsString = generateCstDts(TiramisuProductions);
const dtsPath = resolve(__dirname, "..", "src", "types", "parser.ts");
writeFileSync(dtsPath, dtsString);

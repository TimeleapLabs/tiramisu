import path, { dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createSyntaxDiagramsCode } from "chevrotain";
import { TiramisuParserInstance } from "../dist/parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const serializedGrammar = TiramisuParserInstance.getSerializedGastProductions();
const htmlText = createSyntaxDiagramsCode(serializedGrammar);

// Write the HTML file to disk
const outPath = path.resolve(__dirname, "..", "diagram.html");
fs.writeFileSync(outPath, htmlText);

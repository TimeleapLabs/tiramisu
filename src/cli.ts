#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { compile } from "./index.js";
import { logError } from "./utils/log.js";

import { IRecognitionException, ILexingError } from "chevrotain";

const program = new Command();

program
  .name("tiramisu")
  .description("A delightful language for structured textual data.")
  .version("1.1.0");

program
  .command("compile")
  .description("Compile a .tiramisu file")
  .argument("<file>", "file to compile")
  .option("--string", "display the result as a string")
  .action((file, options) => {
    const src = readFileSync(file, "utf-8");
    try {
      const result = compile(src);
      console.log(options.string ? result.toString() : result);
    } catch (error) {
      logError(src, file, error as ILexingError | IRecognitionException);
      process.exitCode = 1;
    }
  });

program.parse();

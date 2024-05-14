#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { compile } from "./index.js";
import { logError } from "./utils/log.js";
import { resolve } from "path";

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
  .option("-s, --string", "display the result as a string")
  .option("-t, --translate <file>", "use a custom translation map")
  .action(async (file, options) => {
    const src = readFileSync(file, "utf-8");
    try {
      const result = compile(src);

      if (options.string && options.translate) {
        const fileOrModule = options.translate.startsWith(".")
          ? resolve(options.translate)
          : options.translate;

        const { default: translateMap } = await import(fileOrModule).catch(
          () => ({ default: null })
        );

        if (!translateMap) {
          console.error("Invalid translation map.");
          process.exitCode = 1;
          return;
        }

        try {
          return console.log(result.toString(translateMap));
        } catch (error) {
          console.error("Invalid translation map.");
          console.error(error);
          process.exitCode = 1;
          return;
        }
      }

      if (options.string) {
        return console.log(result.toString());
      }

      return console.dir(result, { depth: null });
    } catch (error) {
      logError(src, file, error as ILexingError | IRecognitionException);
      process.exitCode = 1;
    }
  });

program.parse();

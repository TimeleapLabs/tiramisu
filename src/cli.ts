#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync, writeFileSync } from "fs";
import { compile, TiramisuError, format } from "./index.js";
import { logTiramisuError } from "./utils/log.js";
import { resolve } from "path";

const program = new Command();

program
  .name("tiramisu")
  .description("A delightful language for structured textual data.")
  .version("1.8.0");

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
      if (error instanceof TiramisuError) {
        error.file = error.file ?? file;
        logTiramisuError(src, error);
      } else {
        console.error("Unexpected error:", error);
      }
      process.exitCode = 1;
    }
  });

program
  .command("format")
  .description("Format .tiramisu files")
  .argument("[files...]", "files to format")
  .option("--check", "check if files are formatted (exit 1 if not)")
  .option("--indent <n>", "indentation size", "2")
  .option("--line-width <n>", "max line width", "80")
  .action((files: string[], options: { check?: boolean; indent: string; lineWidth: string }) => {
    const formatOpts = {
      indent: parseInt(options.indent),
      lineWidth: parseInt(options.lineWidth),
    };

    // Stdin mode
    if (files.length === 0) {
      if (process.stdin.isTTY) {
        program.commands.find((c) => c.name() === "format")!.help();
        return;
      }
      const chunks: Buffer[] = [];
      process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
      process.stdin.on("end", () => {
        const src = Buffer.concat(chunks).toString("utf-8");
        try {
          process.stdout.write(format(src, formatOpts));
        } catch (error) {
          if (error instanceof TiramisuError) {
            logTiramisuError(src, error);
          } else {
            console.error("Unexpected error:", error);
          }
          process.exitCode = 1;
        }
      });
      return;
    }

    // File mode
    let unformatted = 0;
    for (const file of files) {
      const src = readFileSync(file, "utf-8");
      try {
        const formatted = format(src, formatOpts);
        if (options.check) {
          if (src !== formatted) {
            console.log(file);
            unformatted++;
          }
        } else {
          if (src !== formatted) {
            writeFileSync(file, formatted);
          }
        }
      } catch (error) {
        if (error instanceof TiramisuError) {
          (error as TiramisuError).file = (error as TiramisuError).file ?? file;
          logTiramisuError(src, error as TiramisuError);
        } else {
          console.error(`Error formatting ${file}:`, error);
        }
        process.exitCode = 1;
      }
    }

    if (options.check && unformatted > 0) {
      console.error(`${unformatted} file(s) need formatting`);
      process.exitCode = 1;
    }
  });

program.parse();

import { IRecognitionException, ILexingError } from "chevrotain";
import { TiramisuError } from "./error.js";

const getLines = (src: string, line: number) =>
  src
    .split("\n")
    .slice(line - 3, line)
    .join("\n");

const addCaret = (src: string, line: number, column: number) => {
  const lines = getLines(src, line);
  const caret = " ".repeat(column - 1) + "↑";
  return lines + "\n" + caret;
};

export const logLexerError = (
  src: string,
  filename: string,
  error: ILexingError
) => {
  const code = addCaret(src, error.line as number, error.column as number);
  console.log(
    `Lexing error in ${filename} at line ${error.line}:${error.column}\n`
  );
  console.log(`${code}\n`);
  console.log(error.message);
};

export const logParserError = (
  src: string,
  filename: string,
  error: IRecognitionException
) => {
  const code = addCaret(
    src,
    error.token.startLine as number,
    error.token.startColumn as number
  );
  console.log(
    `Parsing error in ${filename} at line ${error.token.startLine}:${error.token.startColumn}\n`
  );
  console.log(`${code}\n`);
  console.log(error.message);
};

export const logTiramisuError = (src: string, error: TiramisuError) => {
  const file = error.file ?? "<input>";
  const code = addCaret(src, error.line, error.column);
  console.error(`Error in ${file} at ${error.line}:${error.column}\n`);
  console.error(`${code}\n`);
  if (error.hint) console.error(error.hint);
};

export const logError = (
  src: string,
  filename: string,
  error: IRecognitionException | ILexingError
) => {
  if ("token" in error) {
    logParserError(src, filename, error);
  } else {
    logLexerError(src, filename, error);
  }
};

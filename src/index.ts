import { IRecognitionException } from "chevrotain";
import { TiramisuLexerInstance } from "./lexer.js";
import { TiramisuParserInstance } from "./parser.js";
import { Tiramisu } from "./types/nodes.js";
import { TiramisuError } from "./utils/error.js";
import { TiramisuVisitor } from "./visitor.js";

export { TiramisuError } from "./utils/error.js";

function getParserHint(err: IRecognitionException): string {
  switch (err.name) {
    case "MismatchedTokenException":
      return "Unexpected token. Check for missing or extra braces, brackets, or commas.";
    case "NoViableAltException":
      return "Could not match this input to any known pattern.";
    case "NotAllInputParsedException":
      return "Extra input after end of document. You may have an unmatched closing brace.";
    case "EarlyExitException":
      return "Expected at least one element here but found none.";
    default:
      return "";
  }
}

export const compile = (src: string) => {
  const lexResult = TiramisuLexerInstance.tokenize(src);

  TiramisuParserInstance.input = lexResult.tokens;
  const cst = TiramisuParserInstance.tiramisu();

  if (TiramisuParserInstance.errors.length > 0) {
    const err = TiramisuParserInstance.errors[0];
    throw new TiramisuError({
      message: err.message,
      hint: getParserHint(err),
      line: (err.token.startLine ?? 1),
      column: (err.token.startColumn ?? 1),
      length: (err.token.image?.length ?? 1),
    });
  }

  const TiramisuVisitorInstance = new TiramisuVisitor(src);
  const result = TiramisuVisitorInstance.visit(cst);

  return result as Tiramisu;
};

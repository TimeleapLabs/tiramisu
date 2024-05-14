import { TiramisuLexerInstance } from "./lexer.js";
import { TiramisuParserInstance } from "./parser.js";
import { TiramisuVisitor } from "./visitor.js";

export const compile = (src: string) => {
  const lexResult = TiramisuLexerInstance.tokenize(src);

  if (lexResult.errors.length > 0) {
    throw lexResult.errors[0];
  }

  TiramisuParserInstance.input = lexResult.tokens;
  const cst = TiramisuParserInstance.tiramisu();

  if (TiramisuParserInstance.errors.length > 0) {
    throw TiramisuParserInstance.errors[0];
  }

  const TiramisuVisitorInstance = new TiramisuVisitor(src);
  const result = TiramisuVisitorInstance.visit(cst);

  return result;
};

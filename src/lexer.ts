import {
  createToken,
  ILexingResult,
  Lexer,
  TokenType,
  IMultiModeLexerDefinition,
  ILexerConfig,
} from "chevrotain";

const LCurly = createToken({ name: "LCurly", pattern: /{/ });
const RCurly = createToken({ name: "RCurly", pattern: /}/ });
const LSquare = createToken({ name: "LSquare", pattern: /\[/ });
const RSquare = createToken({ name: "RSquare", pattern: /]/ });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const Equal = createToken({ name: "Equal", pattern: /=/ });
const Function = createToken({ name: "Function", pattern: Lexer.NA });

const Text = createToken({
  name: "Text",
  pattern: /(\\[\\{}[\],=]|[^\s{}[\],=])+/,
});

const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /("{1,})[\s\S]*?\1/,
  line_breaks: true,
});

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[^\S\r\n]+/,
});

const LineBreak = createToken({
  name: "LineBreak",
  pattern: /\r?\n/,
  line_breaks: true,
});

const MultiLineBreak = createToken({
  name: "MultiLineBreak",
  pattern: /(\r?\n){2,}/,
  line_breaks: true,
});

export const TiramisuTokens = [
  LCurly,
  RCurly,
  LSquare,
  RSquare,
  Comma,
  Equal,
  StringLiteral,
  Text,
  WhiteSpace,
  MultiLineBreak,
  LineBreak,
  Function,
];

export class TiramisuLexer extends Lexer {
  constructor(
    lexerDefinition: TokenType[] | IMultiModeLexerDefinition,
    config?: ILexerConfig | undefined
  ) {
    super(lexerDefinition, config);
  }

  public tokenize(
    text: string,
    initialMode?: string | undefined
  ): ILexingResult {
    const lexResult = super.tokenize(text, initialMode);

    if (lexResult.errors.length > 0) {
      throw Error(lexResult.errors[0].message);
    }

    let curlyCount = 0;
    let previousToken;

    for (const token of lexResult.tokens) {
      if (token.tokenType.name === "LCurly") {
        if (previousToken && previousToken.tokenType.name === "Text") {
          previousToken.tokenType = Function;
          if (Function.tokenTypeIdx) {
            previousToken.tokenTypeIdx = Function.tokenTypeIdx;
          }
        }
        curlyCount++;
      } else if (token.tokenType.name === "RCurly") {
        curlyCount--;
      }

      if (curlyCount === 0 && treatAsText.includes(token.tokenType.name)) {
        if (token.tokenType.name === "StringLiteral") {
          const numberOfQuotes = token.image.match(/^"*/)?.[0].length || 0;
          token.image = token.image.slice(numberOfQuotes, -numberOfQuotes);
        }

        token.tokenType = Text;
        if (Text.tokenTypeIdx) {
          token.tokenTypeIdx = Text.tokenTypeIdx;
        }
      }

      if (
        token.tokenType.name !== "WhiteSpace" &&
        token.tokenType.name !== "LineBreak" &&
        token.tokenType.name !== "MultiLineBreak"
      ) {
        previousToken = token;
      }
    }

    return lexResult;
  }
}

export const TiramisuLexerInstance = new TiramisuLexer(TiramisuTokens);

export {
  LCurly,
  RCurly,
  LSquare,
  RSquare,
  Comma,
  Equal,
  StringLiteral,
  Text,
  WhiteSpace,
  MultiLineBreak,
  LineBreak,
  Function,
};

const treatAsText = ["Comma", "Equal", "LSquare", "RSquare", "StringLiteral"];

import {
  createToken,
  ILexingResult,
  Lexer,
  TokenType,
  IMultiModeLexerDefinition,
  ILexerConfig,
} from "chevrotain";
import { TiramisuError } from "./utils/error.js";

const LCurly = createToken({ name: "LCurly", pattern: /{/ });
const RCurly = createToken({ name: "RCurly", pattern: /}/ });
const LSquare = createToken({ name: "LSquare", pattern: /\[/ });
const RSquare = createToken({ name: "RSquare", pattern: /]/ });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const Equal = createToken({ name: "Equal", pattern: /=/ });
const Function = createToken({ name: "Function", pattern: Lexer.NA });

const Text = createToken({
  name: "Text",
  pattern: /(\\[\\{}[\],="]|[^\s{}[\],=])+/,
});

const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /("{1,})(\\[\s\S]|[\s\S])*?\1/,
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
      const err = lexResult.errors[0];
      throw new TiramisuError({
        message: err.message,
        hint: "The lexer encountered a character it doesn't recognize.",
        line: err.line ?? 1,
        column: err.column ?? 1,
        length: err.length ?? 1,
      });
    }

    const identifierRe = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    const unescapeRe = /\\([\\{}\[\],="])/g;

    function isEscapedFunctionName(image: string): boolean {
      if (image.length < 2 || image[0] !== "\\") return false;
      return !"\\{}[],=\"".includes(image[1]);
    }

    // Pre-pass: split Text tokens like "(bold" into Text("(") + Text("bold")
    // when followed by LCurly, so function name validation works correctly.
    for (let i = 0; i < lexResult.tokens.length; i++) {
      const token = lexResult.tokens[i];
      if (token.tokenType.name !== "Text") continue;

      // Find the next non-whitespace token
      let next = null;
      for (let j = i + 1; j < lexResult.tokens.length; j++) {
        const t = lexResult.tokens[j];
        if (t.tokenType.name !== "WhiteSpace" && t.tokenType.name !== "LineBreak" && t.tokenType.name !== "MultiLineBreak") {
          next = t;
          break;
        }
      }
      if (!next || next.tokenType.name !== "LCurly") continue;

      const unescaped = token.image.replace(unescapeRe, "$1");
      if (identifierRe.test(unescaped)) continue; // already a valid identifier
      if (isEscapedFunctionName(token.image)) continue; // escaped function name
      // Skip tokens that start with an escape sequence (e.g. \\bold)
      if (/^\\[\\{}\[\],="]/.test(token.image)) continue;

      // Only split if identifier suffix is preceded by a non-word character
      const match = unescaped.match(/(?<=[^a-zA-Z0-9_])([a-zA-Z][a-zA-Z0-9_]*)$/);
      if (match) {
        const funcName = match[1];
        const prefix = token.image.slice(0, token.image.length - funcName.length);
        token.image = prefix;
        const funcToken = {
          ...token,
          image: funcName,
          startOffset: token.startOffset + prefix.length,
          startColumn: (token.startColumn ?? 1) + prefix.length,
        };
        lexResult.tokens.splice(i + 1, 0, funcToken);
      }
    }

    let curlyCount = 0;
    let escapedBraceDepth = 0;
    let previousToken;

    for (const token of lexResult.tokens) {
      if (token.tokenType.name === "LCurly") {
        if (escapedBraceDepth > 0) {
          token.tokenType = Text;
          if (Text.tokenTypeIdx) {
            token.tokenTypeIdx = Text.tokenTypeIdx;
          }
          token.image = "{";
          escapedBraceDepth++;
        } else if (previousToken && previousToken.tokenType.name === "Text" && isEscapedFunctionName(previousToken.image)) {
          // Strip leading backslash but do NOT reclassify to Function
          previousToken.image = previousToken.image.slice(1);
          token.tokenType = Text;
          if (Text.tokenTypeIdx) {
            token.tokenTypeIdx = Text.tokenTypeIdx;
          }
          token.image = "{";
          escapedBraceDepth++;
        } else {
          if (previousToken && previousToken.tokenType.name === "Text" && identifierRe.test(previousToken.image.replace(unescapeRe, "$1"))) {
            previousToken.tokenType = Function;
            if (Function.tokenTypeIdx) {
              previousToken.tokenTypeIdx = Function.tokenTypeIdx;
            }
            curlyCount++;
          } else if (!previousToken || previousToken.tokenType.name !== "Text") {
            // No preceding text token — bare { is a valid block opener
            curlyCount++;
          } else {
            // Preceding text is not a valid identifier — treat { as literal text
            token.tokenType = Text;
            if (Text.tokenTypeIdx) {
              token.tokenTypeIdx = Text.tokenTypeIdx;
            }
            token.image = "{";
            escapedBraceDepth++;
          }
        }
      } else if (token.tokenType.name === "RCurly") {
        if (escapedBraceDepth > 0) {
          token.tokenType = Text;
          if (Text.tokenTypeIdx) {
            token.tokenTypeIdx = Text.tokenTypeIdx;
          }
          token.image = "}";
          escapedBraceDepth--;
        } else {
          curlyCount--;
        }
      }

      if (curlyCount === 0 && escapedBraceDepth === 0 && treatAsText.includes(token.tokenType.name)) {
        if (token.tokenType.name === "StringLiteral") {
          const numberOfQuotes = token.image.match(/^"*/)?.[0].length || 0;
          token.image = token.image.slice(numberOfQuotes, -numberOfQuotes).replace(/\\"/g, '"');
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

    // Second pass: unescape backslash sequences in Text tokens
    for (const token of lexResult.tokens) {
      if (token.tokenType.name === "Text" || token.tokenType.name === "Function") {
        token.image = token.image.replace(/\\([\\{}\[\],="])/g, "$1");
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

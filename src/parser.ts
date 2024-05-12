import { CstParser, Rule } from "chevrotain";
import { TiramisuTokens } from "./lexer.js";

import {
  LCurly,
  RCurly,
  LSquare,
  RSquare,
  Comma,
  Equal,
  Text,
  WhiteSpace,
  LineBreak,
  MultiLineBreak,
  Function,
} from "./lexer.js";

class TiramisuParser extends CstParser {
  constructor() {
    super(TiramisuTokens, { nodeLocationTracking: "full", maxLookahead: 3 });
    this.performSelfAnalysis();
  }

  public tiramisu = this.RULE("tiramisu", () => {
    this.MANY(() => this.SUBRULE(this.paragraph));
  });

  public anyWhite = this.RULE("anyWhite", () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.CONSUME(WhiteSpace) },
        { ALT: () => this.CONSUME(LineBreak) },
      ]);
    });
  });

  public pureText = this.RULE("pureText", () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.CONSUME(Text) },
        { ALT: () => this.CONSUME(Comma) },
        { ALT: () => this.CONSUME(Equal) },
        { ALT: () => this.CONSUME(LSquare) },
        { ALT: () => this.CONSUME(RSquare) },
        { ALT: () => this.SUBRULE(this.anyWhite) },
      ]);
    });
  });

  public paragraph = this.RULE("paragraph", () => {
    this.SUBRULE(this.text);
    this.OPTION(() => this.CONSUME(MultiLineBreak));
  });

  public text = this.RULE("text", () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.call) },
        { ALT: () => this.SUBRULE(this.pureText) },
      ]);
    });
  });

  public pureTextValue = this.RULE("pureTextValue", () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.CONSUME(Text) },
        { ALT: () => this.SUBRULE(this.anyWhite) },
      ]);
    });
  });

  public textValue = this.RULE("textValue", () => {
    this.AT_LEAST_ONE(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.call) },
        { ALT: () => this.SUBRULE(this.pureTextValue) },
      ]);
    });
  });

  public paragraphValue = this.RULE("paragraphValue", () => {
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.textValue);
      this.OPTION(() => this.CONSUME(MultiLineBreak));
    });
  });

  public call = this.RULE("call", () => {
    this.CONSUME(Function);
    this.CONSUME(WhiteSpace);
    this.CONSUME(LCurly);
    this.SUBRULE(this.parameters);
    this.CONSUME(RCurly);
  });

  public parameters = this.RULE("parameters", () => {
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.parameter),
    });
  });

  public parameter = this.RULE("parameter", () => {
    this.MANY(() => this.SUBRULE(this.anyWhite));
    this.OR([
      { ALT: () => this.SUBRULE(this.array) },
      { ALT: () => this.SUBRULE(this.namedParameter) },
      { ALT: () => this.SUBRULE(this.paragraphValue) },
    ]);
    this.MANY1(() => this.SUBRULE1(this.anyWhite));
  });

  public namedParameter = this.RULE("namedParameter", () => {
    this.CONSUME(Text);
    this.CONSUME(WhiteSpace);
    this.CONSUME(Equal);
    this.SUBRULE(this.anyWhite);
    this.OR([
      { ALT: () => this.SUBRULE(this.array) },
      { ALT: () => this.SUBRULE1(this.paragraphValue) },
    ]);
  });

  public array = this.RULE("array", () => {
    this.CONSUME(LSquare);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => this.SUBRULE(this.arrayItem),
    });
    this.CONSUME(RSquare);
  });

  public arrayItem = this.RULE("arrayItem", () => {
    this.MANY(() => this.SUBRULE(this.anyWhite));
    this.MANY1(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.array) },
        { ALT: () => this.SUBRULE(this.paragraphValue) },
      ]);
    });
    this.MANY2(() => this.SUBRULE1(this.anyWhite));
  });
}

export const TiramisuParserInstance = new TiramisuParser();

export const TiramisuProductions: Record<string, Rule> =
  TiramisuParserInstance.getGAstProductions();

import { TiramisuParserInstance } from "./parser.js";
import { CstNode, IToken } from "chevrotain";

import {
  AnyWhiteCstChildren,
  ArrayCstChildren,
  CallCstChildren,
  NamedParameterCstChildren,
  ParagraphCstChildren,
  ParagraphValueCstChildren,
  ParametersCstChildren,
  PureTextCstChildren,
  PureTextValueCstChildren,
  TextCstChildren,
  TextValueCstChildren,
  TiramisuCstChildren,
  ParameterCstChildren,
  ArrayItemCstChildren,
  StringLiteralCstChildren,
} from "./types/parser.js";

import {
  ArrayValue,
  FunctionCall,
  MixedText,
  NamedParameter,
  Paragraph,
  PureText,
  Node,
  Parameter,
  Tiramisu,
  Parameters,
  ArrayItem,
} from "./types/nodes.js";

export const BaseTiramisuCstVisitor =
  TiramisuParserInstance.getBaseCstVisitorConstructor();

export class TiramisuVisitor extends BaseTiramisuCstVisitor {
  src: string = "";

  constructor(src: string) {
    super();
    this.validateVisitor();
    this.src = src;
  }

  getLocationOf(ctx: CstNode | IToken): number {
    if ("startOffset" in ctx) {
      return ctx.startOffset;
    }
    return ctx.location?.startOffset || 0;
  }

  flattenAndSort<T>(ctx: { [key: string]: T[] }): T[] {
    return Object.values(ctx)
      .flat()
      .sort(
        (a, b) =>
          this.getLocationOf(a as CstNode | IToken) -
          this.getLocationOf(b as CstNode | IToken)
      );
  }

  imageOrVisit = (node: CstNode | IToken): string | Node => {
    return "image" in node ? node.image : this.visit(node);
  };

  tiramisu(ctx: TiramisuCstChildren): Node {
    return new Tiramisu(
      this.flattenAndSort<CstNode>(ctx).map((node) => this.visit(node))
    );
  }

  text(ctx: TextCstChildren): Node {
    return new MixedText(
      this.flattenAndSort<IToken | CstNode>(ctx).map((node) =>
        this.imageOrVisit(node)
      )
    );
  }

  pureText(ctx: PureTextCstChildren): Node {
    return new PureText(
      this.flattenAndSort<IToken | CstNode>(ctx).map(
        (node) => this.imageOrVisit(node) as string
      )
    );
  }

  textValue(ctx: TextValueCstChildren): Node {
    return new MixedText(
      this.flattenAndSort<IToken | CstNode>(ctx).map((node) =>
        this.imageOrVisit(node)
      )
    );
  }

  pureTextValue(ctx: PureTextValueCstChildren): Node {
    return new PureText(
      this.flattenAndSort<IToken | CstNode>(ctx).map(
        (node) => this.imageOrVisit(node) as string
      )
    );
  }

  call(ctx: CallCstChildren): Node {
    const functionName = ctx.Function.map((fn) => fn.image).join("");
    const parameters = ctx.parameters ? this.visit(ctx.parameters) : [];
    return new FunctionCall(functionName, parameters);
  }

  array(ctx: ArrayCstChildren): Node {
    const values = {
      arrayItem: ctx.arrayItem || [],
    };
    return new ArrayValue(
      this.flattenAndSort<CstNode>(values).map((node) => this.visit(node))
    );
  }

  arrayItem(ctx: ArrayItemCstChildren): Node {
    const values = {
      array: ctx.array || [],
      textValue: ctx.paragraphValue || [],
      anyWhite: ctx.anyWhite || [],
    };
    return new ArrayItem(
      this.flattenAndSort<CstNode>(values).map((node) => this.visit(node))
    );
  }

  parameters(ctx: ParametersCstChildren): Node {
    const values = {
      parameter: ctx.parameter || [],
      namedParameter: ctx.namedParameter || [],
    };
    return new Parameters(
      this.flattenAndSort<CstNode | IToken>(values).map((node) =>
        this.imageOrVisit(node)
      )
    );
  }

  parameter(ctx: ParameterCstChildren): Node {
    return new Parameter(
      this.flattenAndSort<CstNode | IToken>(ctx).map((node) =>
        this.imageOrVisit(node)
      )
    );
  }

  namedParameter(ctx: NamedParameterCstChildren): Node {
    const values = {
      array: ctx.array || [],
      textValue: ctx.paragraphValue || [],
    };
    return new NamedParameter(
      ctx.Text.map((t) => t.image).join(""),
      this.flattenAndSort<CstNode>(values).map((node) => this.visit(node))
    );
  }

  anyWhite(ctx: AnyWhiteCstChildren): string {
    return this.flattenAndSort<IToken>(ctx)
      .map((node) => this.imageOrVisit(node))
      .join("");
  }

  paragraph(ctx: ParagraphCstChildren): Node {
    const children = this.flattenAndSort<CstNode | IToken>(ctx).map((node) =>
      this.imageOrVisit(node)
    );
    return ctx.MultiLineBreak
      ? new Paragraph(children)
      : new MixedText(children);
  }

  paragraphValue(ctx: ParagraphValueCstChildren): Node {
    const children = this.flattenAndSort<CstNode | IToken>(ctx).map((node) =>
      this.imageOrVisit(node)
    );
    return ctx.MultiLineBreak
      ? new Paragraph(children)
      : new MixedText(children);
  }

  stringLiteral(ctx: StringLiteralCstChildren): Node {
    return new PureText([
      ctx.StringLiteral.map((s) => {
        const numberOfQuotes = s.image.match(/^"*/)?.[0].length || 0;
        return s.image.slice(numberOfQuotes, -numberOfQuotes);
      }).join(""),
    ]);
  }
}

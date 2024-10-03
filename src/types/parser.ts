import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface TiramisuCstNode extends CstNode {
  name: "tiramisu";
  children: TiramisuCstChildren;
}

export type TiramisuCstChildren = {
  paragraph?: ParagraphCstNode[];
};

export interface AnyWhiteCstNode extends CstNode {
  name: "anyWhite";
  children: AnyWhiteCstChildren;
}

export type AnyWhiteCstChildren = {
  WhiteSpace?: IToken[];
  LineBreak?: IToken[];
};

export interface PureTextCstNode extends CstNode {
  name: "pureText";
  children: PureTextCstChildren;
}

export type PureTextCstChildren = {
  Text?: IToken[];
  Comma?: IToken[];
  Equal?: IToken[];
  LSquare?: IToken[];
  RSquare?: IToken[];
  anyWhite?: AnyWhiteCstNode[];
};

export interface ParagraphCstNode extends CstNode {
  name: "paragraph";
  children: ParagraphCstChildren;
}

export type ParagraphCstChildren = {
  text: TextCstNode[];
  MultiLineBreak?: IToken[];
};

export interface TextCstNode extends CstNode {
  name: "text";
  children: TextCstChildren;
}

export type TextCstChildren = {
  call?: CallCstNode[];
  pureText?: PureTextCstNode[];
};

export interface StringLiteralCstNode extends CstNode {
  name: "stringLiteral";
  children: StringLiteralCstChildren;
}

export type StringLiteralCstChildren = {
  StringLiteral: IToken[];
};

export interface PureTextValueCstNode extends CstNode {
  name: "pureTextValue";
  children: PureTextValueCstChildren;
}

export type PureTextValueCstChildren = {
  Text?: IToken[];
  stringLiteral?: StringLiteralCstNode[];
  anyWhite?: AnyWhiteCstNode[];
};

export interface TextValueCstNode extends CstNode {
  name: "textValue";
  children: TextValueCstChildren;
}

export type TextValueCstChildren = {
  call?: CallCstNode[];
  pureTextValue?: PureTextValueCstNode[];
};

export interface ParagraphValueCstNode extends CstNode {
  name: "paragraphValue";
  children: ParagraphValueCstChildren;
}

export type ParagraphValueCstChildren = {
  textValue: TextValueCstNode[];
  MultiLineBreak?: IToken[];
};

export interface CallCstNode extends CstNode {
  name: "call";
  children: CallCstChildren;
}

export type CallCstChildren = {
  Function: IToken[];
  WhiteSpace: IToken[];
  LCurly: IToken[];
  parameters: ParametersCstNode[];
  RCurly: IToken[];
};

export interface ParametersCstNode extends CstNode {
  name: "parameters";
  children: ParametersCstChildren;
}

export type ParametersCstChildren = {
  parameter?: ParameterCstNode[];
  namedParameter?: NamedParameterCstNode[];
  Comma?: IToken[];
};

export interface ParameterCstNode extends CstNode {
  name: "parameter";
  children: ParameterCstChildren;
}

export type ParameterCstChildren = {
  anyWhite?: AnyWhiteCstNode[];
  array?: ArrayCstNode[];
  namedParameter?: NamedParameterCstNode[];
  paragraphValue?: ParagraphValueCstNode[];
};

export interface NamedParameterCstNode extends CstNode {
  name: "namedParameter";
  children: NamedParameterCstChildren;
}

export type NamedParameterCstChildren = {
  Text: IToken[];
  WhiteSpace: IToken[];
  Equal: IToken[];
  anyWhite: AnyWhiteCstNode[];
  array?: ArrayCstNode[];
  paragraphValue?: ParagraphValueCstNode[];
};

export interface ArrayCstNode extends CstNode {
  name: "array";
  children: ArrayCstChildren;
}

export type ArrayCstChildren = {
  LSquare: IToken[];
  arrayItem?: ArrayItemCstNode[];
  Comma?: IToken[];
  RSquare: IToken[];
};

export interface ArrayItemCstNode extends CstNode {
  name: "arrayItem";
  children: ArrayItemCstChildren;
}

export type ArrayItemCstChildren = {
  anyWhite?: AnyWhiteCstNode[];
  array?: ArrayCstNode[];
  paragraphValue?: ParagraphValueCstNode[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  tiramisu(children: TiramisuCstChildren, param?: IN): OUT;
  anyWhite(children: AnyWhiteCstChildren, param?: IN): OUT;
  pureText(children: PureTextCstChildren, param?: IN): OUT;
  paragraph(children: ParagraphCstChildren, param?: IN): OUT;
  text(children: TextCstChildren, param?: IN): OUT;
  stringLiteral(children: StringLiteralCstChildren, param?: IN): OUT;
  pureTextValue(children: PureTextValueCstChildren, param?: IN): OUT;
  textValue(children: TextValueCstChildren, param?: IN): OUT;
  paragraphValue(children: ParagraphValueCstChildren, param?: IN): OUT;
  call(children: CallCstChildren, param?: IN): OUT;
  parameters(children: ParametersCstChildren, param?: IN): OUT;
  parameter(children: ParameterCstChildren, param?: IN): OUT;
  namedParameter(children: NamedParameterCstChildren, param?: IN): OUT;
  array(children: ArrayCstChildren, param?: IN): OUT;
  arrayItem(children: ArrayItemCstChildren, param?: IN): OUT;
}

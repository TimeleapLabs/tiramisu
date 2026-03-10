import { compile } from "./index.js";
import {
  Tiramisu,
  Paragraph,
  MixedText,
  PureText,
  FunctionCall,
  Parameters,
  Parameter,
  NamedParameter,
  ArrayValue,
  ArrayItem,
  Node,
} from "./types/nodes.js";

export interface FormatOptions {
  indent?: number;
  lineWidth?: number;
}

interface PrintContext {
  indent: number;
  lineWidth: number;
  depth: number;
  insideFunction: boolean;
}

export const format = (src: string, options?: FormatOptions): string => {
  const ast = compile(src);
  const ctx: PrintContext = {
    indent: options?.indent ?? 2,
    lineWidth: options?.lineWidth ?? 80,
    depth: 0,
    insideFunction: false,
  };
  const result = printNode(ast, ctx);
  // Trim trailing whitespace and ensure single trailing newline
  return result.replace(/\s*$/, "\n");
};

const printNode = (node: Node, ctx: PrintContext): string => {
  if (node instanceof Tiramisu) return printTiramisu(node, ctx);
  if (node instanceof Paragraph) return printParagraph(node, ctx);
  if (node instanceof MixedText) return printMixedText(node, ctx);
  if (node instanceof PureText) return printPureText(node, ctx);
  if (node instanceof FunctionCall) return printFunctionCall(node, ctx);
  if (node instanceof Parameters) return printParameters(node, ctx);
  if (node instanceof Parameter) return printParameter(node, ctx);
  if (node instanceof NamedParameter) return printNamedParameter(node, ctx);
  if (node instanceof ArrayValue) return printArrayValue(node, ctx);
  if (node instanceof ArrayItem) return printArrayItem(node, ctx);
  // Fallback for string shards in MixedText
  return String(node);
};

const printTiramisu = (node: Tiramisu, ctx: PrintContext): string => {
  return node.children.map((child) => printNode(child, ctx)).join("");
};

const printParagraph = (node: Paragraph, ctx: PrintContext): string => {
  return node.children.map((child) => {
    if (typeof child === "string") return child;
    return printNode(child, ctx);
  }).join("");
};

const printMixedText = (node: MixedText, ctx: PrintContext): string => {
  return node.shards.map((shard) => {
    if (typeof shard === "string") return shard;
    return printNode(shard, ctx);
  }).join("");
};

const printPureText = (node: PureText, ctx: PrintContext): string => {
  return node.shards.join("");
};

// Stubs for now — implemented in later tasks
const printFunctionCall = (node: FunctionCall, ctx: PrintContext): string => "";
const printParameters = (node: Parameters, ctx: PrintContext): string => "";
const printParameter = (node: Parameter, ctx: PrintContext): string => "";
const printNamedParameter = (node: NamedParameter, ctx: PrintContext): string => "";
const printArrayValue = (node: ArrayValue, ctx: PrintContext): string => "";
const printArrayItem = (node: ArrayItem, ctx: PrintContext): string => "";

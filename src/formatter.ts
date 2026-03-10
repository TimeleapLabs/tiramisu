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
  if (node instanceof Parameters) return printParametersInline(node, ctx);
  if (node instanceof Parameter) return printParameter(node, ctx);
  if (node instanceof NamedParameter) return printNamedParameter(node, ctx);
  if (node instanceof ArrayValue) return printArrayValue(node, ctx);
  if (node instanceof ArrayItem) return printArrayItem(node, ctx);
  // Fallback for string shards in MixedText
  return String(node);
};

const printTiramisu = (node: Tiramisu, ctx: PrintContext): string => {
  const parts: string[] = [];
  for (const child of node.children) {
    if (typeof child === "string") continue;
    const printed = printNode(child, ctx).trimEnd();
    if (printed !== "") parts.push(printed);
  }
  return parts.join("\n\n");
};

const printParagraph = (node: Paragraph, ctx: PrintContext): string => {
  return node.children
    .filter((child) => typeof child !== "string" || child.trim() !== "")
    .map((child) => {
      if (typeof child === "string") return child;
      return printNode(child, ctx);
    })
    .join("");
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

const printFunctionCall = (node: FunctionCall, ctx: PrintContext): string => {
  const innerCtx = { ...ctx, depth: ctx.depth + 1, insideFunction: true };
  const params = printParametersInline(node.parameters, innerCtx);
  return `${node.functionName} { ${params} }`;
};

const printParametersInline = (node: Parameters, ctx: PrintContext): string => {
  return node.parameters
    .map((p) => printNode(p, ctx).trimEnd())
    .join(", ");
};

const printParameter = (node: Parameter, ctx: PrintContext): string => {
  if (node.value instanceof ArrayValue) {
    return printArrayValue(node.value, ctx);
  }
  return node.value.map((v) => printNode(v, ctx)).join("").trimEnd();
};

const printNamedParameter = (node: NamedParameter, ctx: PrintContext): string => {
  if (node.value instanceof ArrayValue) {
    return `${node.name} = ${printArrayValue(node.value, ctx)}`;
  }
  const value = node.value.map((v) => printNode(v, ctx)).join("").trimEnd();
  return `${node.name} = ${value}`;
};

// Stubs for now — implemented in later tasks
const printArrayValue = (node: ArrayValue, ctx: PrintContext): string => "";
const printArrayItem = (node: ArrayItem, ctx: PrintContext): string => "";

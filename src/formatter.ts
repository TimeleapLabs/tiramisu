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

const needsQuoting = (text: string): boolean => {
  return /[,=\[\]{}"]/.test(text) || text.includes("\n");
};

const needsQuotingTopLevel = (text: string): boolean => {
  return /[a-zA-Z][a-zA-Z0-9_]*\s*\{/.test(text) || /[{}]/.test(text);
};

const quoteString = (text: string): string => {
  if (text.includes("\n")) {
    // Multi-line: use triple quotes (or more if content contains """)
    let quotes = '"""';
    while (text.includes(quotes)) {
      quotes += '"';
    }
    const prefix = text.startsWith("\n") ? "" : "\n";
    const suffix = text.endsWith("\n") ? "" : "\n";
    return `${quotes}${prefix}${text}${suffix}${quotes}`;
  }
  // Single-line: use double quotes with \" escaping
  const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
};

const escapeTopLevel = (text: string): string => {
  // Escape { that would be parsed as function call openers
  let result = text.replace(/([a-zA-Z][a-zA-Z0-9_]*\s*)\{/g, "$1\\{");
  // Escape } that would be parsed as unmatched closing braces
  result = result.replace(/}/g, "\\}");
  return result;
};

const printPureText = (node: PureText, ctx: PrintContext): string => {
  // PureText.shards is typed as string[] but at runtime can contain PureText
  // objects from parsed string literals (the visitor casts them).
  if (ctx.insideFunction) {
    const parts: string[] = [];
    for (const shard of node.shards as (string | PureText)[]) {
      if (typeof shard === "string") {
        parts.push(shard);
      } else {
        const text = shard.shards.join("");
        if (needsQuoting(text)) {
          parts.push(quoteString(text));
        } else {
          parts.push(text);
        }
      }
    }
    return parts.join("");
  }

  // At top level: collect all text first, then apply escaping so that
  // cross-shard patterns (e.g. identifier + "{") are handled correctly.
  const segments: { text: string; isStringLiteral: boolean }[] = [];
  for (const shard of node.shards as (string | PureText)[]) {
    if (typeof shard === "string") {
      segments.push({ text: shard, isStringLiteral: false });
    } else {
      const text = shard.shards.join("");
      segments.push({ text, isStringLiteral: true });
    }
  }

  // Build final text, quoting string literals that need it and escaping
  // plain text shards.
  const parts: string[] = [];
  // Accumulate plain text to escape as a batch
  let plainBuf = "";
  const flushPlain = () => {
    if (plainBuf) {
      parts.push(escapeTopLevel(plainBuf));
      plainBuf = "";
    }
  };
  for (const seg of segments) {
    if (seg.isStringLiteral) {
      flushPlain();
      if (needsQuotingTopLevel(seg.text)) {
        parts.push(quoteString(seg.text));
      } else {
        parts.push(seg.text);
      }
    } else {
      plainBuf += seg.text;
    }
  }
  flushPlain();
  return parts.join("");
};

const indentStr = (ctx: PrintContext): string => {
  return " ".repeat(ctx.indent * ctx.depth);
};

const printFunctionCall = (node: FunctionCall, ctx: PrintContext): string => {
  const innerCtx = { ...ctx, depth: ctx.depth + 1, insideFunction: true };

  // Try inline
  const inlineParams = printParametersInline(node.parameters, innerCtx);
  const inline = `${node.functionName} { ${inlineParams} }`;
  const currentIndent = ctx.indent * ctx.depth;

  if (currentIndent + inline.length <= ctx.lineWidth) {
    return inline;
  }

  // Multi-line
  const paramIndent = indentStr(innerCtx);
  const params = node.parameters.parameters.map((p, i) => {
    const printed = printNode(p, innerCtx).trimEnd();
    const comma = i < node.parameters.parameters.length - 1 ? "," : "";
    return `${paramIndent}${printed}${comma}`;
  });

  return `${node.functionName} {\n${params.join("\n")}\n${indentStr(ctx)}}`;
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

const printArrayValue = (node: ArrayValue, ctx: PrintContext): string => {
  const innerCtx = { ...ctx, depth: ctx.depth + 1 };

  // Try inline
  const items = node.values.map((v) => printNode(v, innerCtx).trimEnd());
  const inline = `[${items.join(", ")}]`;
  const currentIndent = ctx.indent * ctx.depth;

  if (currentIndent + inline.length <= ctx.lineWidth) {
    return inline;
  }

  // Multi-line
  const itemIndent = indentStr(innerCtx);
  const multiItems = items.map((item, i) => {
    const comma = i < items.length - 1 ? "," : "";
    return `${itemIndent}${item}${comma}`;
  });

  return `[\n${multiItems.join("\n")}\n${indentStr(ctx)}]`;
};

const printArrayItem = (node: ArrayItem, ctx: PrintContext): string => {
  return node.value.map((v) => printNode(v, ctx)).join("").trimEnd();
};

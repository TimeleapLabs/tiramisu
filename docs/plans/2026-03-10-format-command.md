# `tiramisu format` Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `tiramisu format` CLI command that pretty-prints `.tiramisu` files with consistent indentation, spacing, and line wrapping.

**Architecture:** AST-based formatter in `src/formatter.ts`. Parses source with `compile()`, walks the AST to emit canonical formatted source. CLI command in `src/cli.ts` supports files, stdin, and `--check` mode.

**Tech Stack:** TypeScript, Bun (test runner), Commander.js (CLI)

**Design doc:** `docs/plans/2026-03-10-format-command-design.md`

---

### Task 1: Create formatter module with PureText and MixedText printing

**Files:**
- Create: `src/formatter.ts`
- Create: `tests/formatter.test.ts`

The formatter's public API and the two simplest node types. PureText just joins shards. MixedText joins shards, dispatching to `printNode` for non-string nodes.

**Step 1: Write the failing test**

```ts
// tests/formatter.test.ts
import { describe, expect, test } from "bun:test";
import { format } from "../src/formatter.ts";

describe("formatter", () => {
  describe("plain text", () => {
    test("plain text is preserved", () => {
      expect(format("hello world")).toBe("hello world\n");
    });

    test("trailing whitespace is trimmed", () => {
      expect(format("hello world   ")).toBe("hello world\n");
    });

    test("trailing newline is added", () => {
      expect(format("hello")).toBe("hello\n");
    });

    test("multiple trailing newlines are collapsed", () => {
      expect(format("hello\n\n\n")).toBe("hello\n");
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/formatter.test.ts`
Expected: FAIL — cannot find module `../src/formatter.ts`

**Step 3: Write minimal implementation**

```ts
// src/formatter.ts
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
  // Ensure single trailing newline
  return result.replace(/\n*$/, "\n");
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
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/formatter.test.ts`
Expected: PASS

**Step 5: Commit**

```
git add src/formatter.ts tests/formatter.test.ts
git commit -m "feat: add formatter module with plain text support"
```

---

### Task 2: Paragraph separation

**Files:**
- Modify: `tests/formatter.test.ts`
- Modify: `src/formatter.ts`

Paragraphs are separated by `\n\n` in the AST. The formatter preserves paragraph breaks.

**Step 1: Write the failing test**

```ts
  describe("paragraphs", () => {
    test("paragraphs are separated by double newline", () => {
      expect(format("hello\n\nworld")).toBe("hello\n\nworld\n");
    });

    test("three+ newlines between paragraphs collapse to two", () => {
      expect(format("hello\n\n\n\nworld")).toBe("hello\n\nworld\n");
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/formatter.test.ts`
Expected: FAIL

**Step 3: Implement paragraph printing**

The AST stores `\n\n` as string children in Paragraph nodes. Update `printTiramisu` to join children with `\n\n`:

```ts
const printTiramisu = (node: Tiramisu, ctx: PrintContext): string => {
  const parts: string[] = [];
  for (const child of node.children) {
    const printed = printNode(child, ctx);
    // Skip whitespace-only nodes between paragraphs
    if (typeof child === "string") continue;
    parts.push(printed.trimEnd());
  }
  return parts.join("\n\n");
};
```

Adjust `printParagraph` to join its children, filtering out the `\n\n` string separators:

```ts
const printParagraph = (node: Paragraph, ctx: PrintContext): string => {
  return node.children
    .filter((child) => typeof child !== "string" || child.trim() !== "")
    .map((child) => {
      if (typeof child === "string") return child;
      return printNode(child, ctx);
    })
    .join("");
};
```

Note: the exact implementation may need adjustment based on how the AST represents paragraph boundaries. The key insight from the AST dump is that `\n\n` appears as string children inside Paragraph. Iterate until the tests pass.

**Step 4: Run test to verify it passes**

Run: `bun test tests/formatter.test.ts`
Expected: PASS

**Step 5: Commit**

```
git add src/formatter.ts tests/formatter.test.ts
git commit -m "feat: format paragraph separation"
```

---

### Task 3: Inline function calls

**Files:**
- Modify: `tests/formatter.test.ts`
- Modify: `src/formatter.ts`

Implement `printFunctionCall`, `printParameters`, `printParameter`, and `printNamedParameter` for the inline (single-line) case.

**Step 1: Write the failing tests**

```ts
  describe("inline function calls", () => {
    test("simple function call", () => {
      expect(format("bold { hello }")).toBe("bold { hello }\n");
    });

    test("normalizes spacing around braces", () => {
      expect(format("bold {hello}")).toBe("bold { hello }\n");
    });

    test("nested function calls", () => {
      expect(format("bold { italic { text } }")).toBe("bold { italic { text } }\n");
    });

    test("named parameter", () => {
      expect(format("heading { level = 1, Tiramisu }")).toBe(
        "heading { level = 1, Tiramisu }\n"
      );
    });

    test("normalizes spacing around equals", () => {
      expect(format("heading { level=1, Tiramisu }")).toBe(
        "heading { level = 1, Tiramisu }\n"
      );
    });

    test("function in text", () => {
      expect(format("This is bold { text }.")).toBe("This is bold { text }.\n");
    });
  });
```

**Step 2: Run test to verify they fail**

Run: `bun test tests/formatter.test.ts`
Expected: FAIL — function call stubs return empty string

**Step 3: Implement inline function call printing**

The key node types and their AST shapes (from the AST dump):

- `FunctionCall` has `.functionName` (string) and `.parameters` (Parameters)
- `Parameters` has `.parameters` (array of Parameter | NamedParameter)
- `Parameter` has `.value` (Node[] or ArrayValue)
- `NamedParameter` has `.name` (string) and `.value` (Node[] or ArrayValue)

Each Parameter/NamedParameter's value wraps the text in layers: Parameter → MixedText → PureText → string shards.

```ts
const printFunctionCall = (node: FunctionCall, ctx: PrintContext): string => {
  const innerCtx = { ...ctx, depth: ctx.depth + 1, insideFunction: true };
  const params = printParameters(node.parameters, innerCtx);
  return `${node.functionName} { ${params} }`;
};

const printParameters = (node: Parameters, ctx: PrintContext): string => {
  return node.parameters
    .map((p) => printNode(p, ctx).trimEnd())
    .join(", ");
};

const printParameter = (node: Parameter, ctx: PrintContext): string => {
  if (node.value instanceof ArrayValue) {
    return printArrayValue(node.value, ctx);
  }
  return (node.value as Node[]).map((v) => printNode(v, ctx)).join("").trimEnd();
};

const printNamedParameter = (node: NamedParameter, ctx: PrintContext): string => {
  if (node.value instanceof ArrayValue) {
    return `${node.name} = ${printArrayValue(node.value, ctx)}`;
  }
  const value = (node.value as Node[]).map((v) => printNode(v, ctx)).join("").trimEnd();
  return `${node.name} = ${value}`;
};
```

**Step 4: Run test to verify they pass**

Run: `bun test tests/formatter.test.ts`
Expected: PASS

**Step 5: Commit**

```
git add src/formatter.ts tests/formatter.test.ts
git commit -m "feat: format inline function calls"
```

---

### Task 4: Multi-line function calls (line wrapping)

**Files:**
- Modify: `tests/formatter.test.ts`
- Modify: `src/formatter.ts`

When a function call exceeds `lineWidth`, break parameters onto separate lines with indentation.

**Step 1: Write the failing tests**

```ts
  describe("multi-line function calls", () => {
    test("long function call breaks to multi-line", () => {
      const input = "table { row = [Price, Terms of Use], row = [$10.0, xyz link { https://example.com/tos }] }";
      const expected = [
        "table {",
        "  row = [Price, Terms of Use],",
        "  row = [$10.0, xyz link { https://example.com/tos }]",
        "}",
        "",
      ].join("\n");
      expect(format(input)).toBe(expected);
    });

    test("multi-param function breaks to multi-line when exceeding line width", () => {
      const input = "list { item = one, item = two, item = three }";
      const expected = [
        "list {",
        "  item = one,",
        "  item = two,",
        "  item = three",
        "}",
        "",
      ].join("\n");
      expect(format(input, { lineWidth: 40 })).toBe(expected);
    });

    test("short multi-param stays inline when it fits", () => {
      expect(format("list { one, two, three }")).toBe(
        "list { one, two, three }\n"
      );
    });
  });
```

**Step 2: Run test to verify they fail**

Run: `bun test tests/formatter.test.ts`
Expected: FAIL

**Step 3: Implement inline-or-break logic**

Update `printFunctionCall` to try inline first, then break:

```ts
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

// Rename original printParameters to printParametersInline
const printParametersInline = (node: Parameters, ctx: PrintContext): string => {
  return node.parameters
    .map((p) => printNode(p, ctx).trimEnd())
    .join(", ");
};
```

**Step 4: Run test to verify they pass**

Run: `bun test tests/formatter.test.ts`
Expected: PASS

**Step 5: Commit**

```
git add src/formatter.ts tests/formatter.test.ts
git commit -m "feat: multi-line function call formatting with line wrapping"
```

---

### Task 5: Array formatting

**Files:**
- Modify: `tests/formatter.test.ts`
- Modify: `src/formatter.ts`

Arrays use the same inline-or-break strategy as function calls.

**Step 1: Write the failing tests**

```ts
  describe("arrays", () => {
    test("short array stays inline", () => {
      expect(format("list { [one, two, three] }")).toBe(
        "list { [one, two, three] }\n"
      );
    });

    test("long array breaks to multi-line", () => {
      const input = "func { [very long item one, very long item two, very long item three] }";
      const result = format(input, { lineWidth: 40 });
      expect(result).toContain("[\n");
      expect(result).toContain("very long item one,");
    });
  });
```

**Step 2: Run test to verify they fail**

Run: `bun test tests/formatter.test.ts`
Expected: FAIL

**Step 3: Implement array formatting**

```ts
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
  return (node.value as Node[]).map((v) => printNode(v, ctx)).join("").trimEnd();
};
```

**Step 4: Run test to verify they pass**

Run: `bun test tests/formatter.test.ts`
Expected: PASS

**Step 5: Commit**

```
git add src/formatter.ts tests/formatter.test.ts
git commit -m "feat: array formatting with inline/multi-line"
```

---

### Task 6: String literal and escaping in parameters

**Files:**
- Modify: `tests/formatter.test.ts`
- Modify: `src/formatter.ts`

When text inside function parameters contains special characters, emit it as a string literal. When text contains `"`, use `\"` or multi-quote strings.

**Step 1: Write the failing tests**

```ts
  describe("string literals and escaping", () => {
    test("text with commas in parameters uses string literal", () => {
      expect(format('list { one, "two, three" }')).toBe(
        'list { one, "two, three" }\n'
      );
    });

    test("text with quotes uses escaped quotes", () => {
      expect(format('func { "say \\"hello\\"" }')).toBe(
        'func { "say \\"hello\\"" }\n'
      );
    });

    test("multiline string uses triple quotes", () => {
      const input = 'code { language = python, """\n  def hello():\n    print("world")\n""" }';
      const result = format(input);
      expect(result).toContain('"""');
    });
  });
```

**Step 2: Run test to verify they fail**

Run: `bun test tests/formatter.test.ts`
Expected: FAIL

**Step 3: Implement string literal handling**

The AST's PureText nodes contain the already-unescaped content. When printing inside a function, detect if the text needs quoting:

```ts
const needsQuoting = (text: string): boolean => {
  return /[,=\[\]{}]/.test(text);
};

const quoteString = (text: string): string => {
  if (text.includes("\n")) {
    // Multi-line: use triple quotes (or more if content contains """)
    let quotes = '"""';
    while (text.includes(quotes)) {
      quotes += '"';
    }
    return `${quotes}\n${text}\n${quotes}`;
  }
  // Single-line: use double quotes with \" escaping
  const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
};
```

Integrate into `printPureText`:

```ts
const printPureText = (node: PureText, ctx: PrintContext): string => {
  const text = node.shards.join("");
  if (ctx.insideFunction && needsQuoting(text)) {
    return quoteString(text);
  }
  return text;
};
```

Note: The exact implementation of `needsQuoting` and `quoteString` may need to be adjusted as tests reveal edge cases. The key principle: prefer readability — use string literals when there are special chars, plain text otherwise.

**Step 4: Run test to verify they pass**

Run: `bun test tests/formatter.test.ts`
Expected: PASS

**Step 5: Commit**

```
git add src/formatter.ts tests/formatter.test.ts
git commit -m "feat: string literal and escaping in formatter"
```

---

### Task 7: Top-level escaping

**Files:**
- Modify: `tests/formatter.test.ts`
- Modify: `src/formatter.ts`

At the top level, the only escape needed is `\{` when a literal `{` would otherwise be parsed as a function call block. The AST loses the information about whether `{` was originally escaped, so the formatter must detect when re-emitting text that looks like `identifier {` and escape the `{`.

**Step 1: Write the failing tests**

```ts
  describe("top-level escaping", () => {
    test("literal { after identifier-like text is escaped", () => {
      // Source: "not\\{ a function" compiles to text "not{ a function"
      // Formatter must re-emit: "not\\{ a function" to prevent parsing "not" as function
      expect(format("not\\{ a function")).toBe("not\\{ a function\n");
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/formatter.test.ts`
Expected: FAIL

**Step 3: Implement**

When printing PureText at top level, scan for `{` characters and escape them if preceded by identifier-like text:

```ts
const escapeTopLevel = (text: string): string => {
  // Escape { that would be parsed as function call openers
  return text.replace(/([a-zA-Z][a-zA-Z0-9_]*\s*)\{/g, "$1\\{");
};
```

Update `printPureText` to apply top-level escaping when `!ctx.insideFunction`.

**Step 4: Run test to verify it passes**

Run: `bun test tests/formatter.test.ts`
Expected: PASS

**Step 5: Commit**

```
git add src/formatter.ts tests/formatter.test.ts
git commit -m "feat: top-level { escaping in formatter"
```

---

### Task 8: Export format from index.ts

**Files:**
- Modify: `src/index.ts`

**Step 1: Add export**

Add to `src/index.ts`:

```ts
export { format, FormatOptions } from "./formatter.js";
```

**Step 2: Run all tests to verify nothing broke**

Run: `bun test`
Expected: all pass

**Step 3: Run build**

Run: `bun run build`
Expected: clean compile

**Step 4: Commit**

```
git add src/index.ts
git commit -m "feat: export format from package"
```

---

### Task 9: CLI format command

**Files:**
- Modify: `src/cli.ts`

**Step 1: Add the format command**

```ts
import { format } from "./formatter.js";
import { readFileSync, writeFileSync } from "fs";

program
  .command("format")
  .description("Format .tiramisu files")
  .argument("[files...]", "files to format")
  .option("--check", "check if files are formatted (exit 1 if not)")
  .option("--indent <n>", "indentation size", "2")
  .option("--line-width <n>", "max line width", "80")
  .action((files, options) => {
    const formatOpts = {
      indent: parseInt(options.indent),
      lineWidth: parseInt(options.lineWidth),
    };

    // Stdin mode
    if (files.length === 0) {
      if (process.stdin.isTTY) {
        program.commands.find((c) => c.name() === "format")!.help();
        return;
      }
      const chunks: Buffer[] = [];
      process.stdin.on("data", (chunk) => chunks.push(chunk));
      process.stdin.on("end", () => {
        const src = Buffer.concat(chunks).toString("utf-8");
        try {
          process.stdout.write(format(src, formatOpts));
        } catch (error) {
          if (error instanceof TiramisuError) {
            logTiramisuError(src, error);
          } else {
            console.error("Unexpected error:", error);
          }
          process.exitCode = 1;
        }
      });
      return;
    }

    // File mode
    let unformatted = 0;
    for (const file of files) {
      const src = readFileSync(file, "utf-8");
      try {
        const formatted = format(src, formatOpts);
        if (options.check) {
          if (src !== formatted) {
            console.log(file);
            unformatted++;
          }
        } else {
          if (src !== formatted) {
            writeFileSync(file, formatted);
          }
        }
      } catch (error) {
        if (error instanceof TiramisuError) {
          (error as TiramisuError).file = (error as TiramisuError).file ?? file;
          logTiramisuError(src, error as TiramisuError);
        } else {
          console.error(`Error formatting ${file}:`, error);
        }
        process.exitCode = 1;
      }
    }

    if (options.check && unformatted > 0) {
      console.error(`${unformatted} file(s) need formatting`);
      process.exitCode = 1;
    }
  });
```

**Step 2: Build and manually test**

Run: `bun run build`
Run: `echo "bold {hello}" | node dist/cli.js format`
Expected: `bold { hello }`

Run: `node dist/cli.js format example.tiramisu --check`
Expected: reports whether the example file needs formatting

**Step 3: Commit**

```
git add src/cli.ts
git commit -m "feat: add tiramisu format CLI command"
```

---

### Task 10: Integration test with example file

**Files:**
- Modify: `tests/formatter.test.ts`

**Step 1: Write integration test**

```ts
  describe("integration", () => {
    test("formatting is idempotent", () => {
      const input = "bold {hello}\n\nlist { one,two,three }";
      const once = format(input);
      const twice = format(once);
      expect(once).toBe(twice);
    });

    test("example file roundtrips", () => {
      const fs = require("fs");
      const src = fs.readFileSync("example.tiramisu", "utf-8");
      const formatted = format(src);
      // Should parse without errors
      const reparsed = format(formatted);
      // Idempotent
      expect(formatted).toBe(reparsed);
    });
  });
```

**Step 2: Run test**

Run: `bun test tests/formatter.test.ts`
Expected: PASS

**Step 3: Fix any issues found during integration**

The example file exercises many features (nested functions, named params, arrays, string literals, code blocks). Fix any formatting bugs that surface.

**Step 4: Run full test suite**

Run: `bun test`
Expected: all pass

**Step 5: Run build**

Run: `bun run build`
Expected: clean

**Step 6: Commit**

```
git add tests/formatter.test.ts src/formatter.ts
git commit -m "test: add integration tests for formatter"
```

---

### Task 11: Version bump and final verification

**Files:**
- Modify: `package.json`

**Step 1: Bump minor version**

Change `"version": "1.7.4"` to `"version": "1.8.0"` (new feature = minor bump).

**Step 2: Run full verification**

Run: `bun test` — all tests pass
Run: `bun run build` — clean compile
Run: `echo "bold {hello}" | node dist/cli.js format` — outputs `bold { hello }`

**Step 3: Commit and tag**

```
git add package.json
git commit -m "1.8.0"
git tag v1.8.0
```

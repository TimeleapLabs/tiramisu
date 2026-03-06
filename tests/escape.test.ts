import { describe, expect, test } from "bun:test";
import { compile } from "../src/index.ts";

describe("backslash escape sequences", () => {
  test("\\{ produces literal {", () => {
    const result = compile("\\{");
    expect(result.toString()).toBe("{");
  });

  test("\\} produces literal }", () => {
    const result = compile("\\}");
    expect(result.toString()).toBe("}");
  });

  test("\\, produces literal ,", () => {
    const result = compile("\\,");
    expect(result.toString()).toBe(",");
  });

  test("\\= produces literal =", () => {
    const result = compile("\\=");
    expect(result.toString()).toBe("=");
  });

  test("\\\\ produces literal \\", () => {
    const result = compile("\\\\");
    expect(result.toString()).toBe("\\");
  });

  test("multiple escapes in one token: \\{\\} produces {}", () => {
    const result = compile("\\{\\}");
    expect(result.toString()).toBe("{}");
  });

  test("escapes inside function parameters", () => {
    const result = compile("bold { hello\\, world }");
    expect(result.toString()).toBe("bold([hello, world])");
  });
});

describe("escaped function names", () => {
  test("\\bold { text } produces literal text, not function call", () => {
    const result = compile("\\bold { text }");
    expect(result.toString()).toBe("bold { text }");
  });

  test("\\\\bold { text } produces literal \\ followed by function call", () => {
    const result = compile("\\\\bold { text }");
    expect(result.toString()).toBe("\\bold([text])");
  });

  test("nested escaped blocks: \\a { \\b { c } }", () => {
    const result = compile("\\a { \\b { c } }");
    expect(result.toString()).toBe("a { \\b { c } }");
  });
});

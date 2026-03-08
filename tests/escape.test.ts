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

  test('\\" produces literal "', () => {
    const result = compile('\\"hello\\"');
    expect(result.toString()).toBe('"hello"');
  });

  test('\\" inside function parameters preserves quotes', () => {
    const result = compile('code { \\"string\\".toUpperCase() }');
    expect(result.toString()).toBe('code(["string".toUpperCase()])');
  });
});

describe("function name validation", () => {
  test("non-identifier prefix is preserved as text around function call", () => {
    const result = compile("(bold { xyz })");
    expect(result.toString()).toBe("(bold([xyz]))");
  });

  test("token starting with digit is not a function name", () => {
    const result = compile("2func { xyz }");
    expect(result.toString()).toBe("2func { xyz }");
  });
});

describe("escaped function names", () => {
  test("\\bold { text } produces literal text, not function call", () => {
    const result = compile("\\bold { text }");
    expect(result.toString()).toBe("bold { text }");
  });

  test("\\\\bold { text } produces literal text, not function call", () => {
    const result = compile("\\\\bold { text }");
    expect(result.toString()).toBe("\\bold { text }");
  });

  test("nested escaped blocks: \\a { \\b { c } }", () => {
    const result = compile("\\a { \\b { c } }");
    expect(result.toString()).toBe("a { \\b { c } }");
  });
});

import { describe, expect, test } from "bun:test";
import { compile } from "../src/index.ts";

describe("edge cases", () => {
  test("empty input", () => {
    const result = compile("");
    expect(result.toString()).toBe("");
  });

  test("whitespace-only input", () => {
    const result = compile("   ");
    expect(result.toString()).toBe("   ");
  });

  test("deeply nested function calls", () => {
    const result = compile("a { b { c { text } } }");
    expect(result.toString()).toBe("a([b([c([text])])])");
  });

  test("mixed escaped and non-escaped function calls", () => {
    const result = compile("\\bold { text } bold { text }");
    expect(result.toString()).toBe("bold { text } bold([text])");
  });

  test("plain text with no special characters", () => {
    const result = compile("hello world");
    expect(result.toString()).toBe("hello world");
  });
});

import { describe, expect, test } from "bun:test";
import { compile } from "../src/index.ts";

describe("string literals", () => {
  test("single quotes in text mode become plain text", () => {
    const result = compile('"hello, world"');
    expect(result.toString()).toBe("hello, world");
  });

  test("triple quotes preserve inner quotes", () => {
    const result = compile('"""hello "world" end"""');
    expect(result.toString()).toBe('hello "world" end');
  });

  test("empty string literal", () => {
    const result = compile('""');
    expect(result.toString()).toBe("");
  });

  test("string literal inside function parameter", () => {
    const result = compile('bold { "hello, world" }');
    expect(result.toString()).toBe("bold([hello, world])");
  });
});

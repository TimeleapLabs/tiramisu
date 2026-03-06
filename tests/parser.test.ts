import { describe, expect, test } from "bun:test";
import { compile } from "../src/index.ts";

describe("parameter whitespace", () => {
  test("no trailing whitespace in parameters", () => {
    const result = compile("func { text }");
    expect(result.toString()).toBe("func([text])");
  });

  test("no trailing whitespace in array items", () => {
    const result = compile("func { [a, b] }");
    expect(result.toString()).toBe("func([[a, b]])");
  });

  test("named parameters work correctly", () => {
    const result = compile("func { key = value }");
    expect(result.toString()).toBe("func([key=value])");
  });

  test("multiple parameters separated by commas", () => {
    const result = compile("func { a, b }");
    expect(result.toString()).toBe("func([a, b])");
  });
});

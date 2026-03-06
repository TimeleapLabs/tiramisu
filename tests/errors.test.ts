import { describe, expect, test } from "bun:test";
import { compile } from "../src/index.ts";
import { TiramisuError } from "../src/utils/error.ts";

describe("error reporting", () => {
  test("parser error is a TiramisuError with line and column", () => {
    try {
      compile("func {=}");
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(TiramisuError);
      const err = e as TiramisuError;
      expect(err.line).toBeGreaterThanOrEqual(1);
      expect(err.column).toBeGreaterThanOrEqual(1);
    }
  });

  test("TiramisuError carries structured location info", () => {
    const err = new TiramisuError({
      message: "test error",
      hint: "test hint",
      line: 3,
      column: 5,
      length: 2,
      file: "test.tiramisu",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("TiramisuError");
    expect(err.line).toBe(3);
    expect(err.column).toBe(5);
    expect(err.length).toBe(2);
    expect(err.hint).toBe("test hint");
    expect(err.file).toBe("test.tiramisu");
    expect(err.message).toBe("test error");
  });

  test("unclosed brace produces MismatchedTokenException hint", () => {
    try {
      compile("func {");
      expect.unreachable("should have thrown");
    } catch (e) {
      const err = e as TiramisuError;
      expect(err.hint).toContain("missing or extra braces");
    }
  });

  test("extra closing brace produces a hint", () => {
    try {
      compile("func { } }");
      expect.unreachable("should have thrown");
    } catch (e) {
      const err = e as TiramisuError;
      expect(err.hint).toBeTruthy();
      expect(err.hint).not.toContain("Expecting token of type");
    }
  });

  test("error hint contains human-readable text", () => {
    try {
      compile("func {=}");
      expect.unreachable("should have thrown");
    } catch (e) {
      const err = e as TiramisuError;
      expect(err.hint).toBeTruthy();
      // Should NOT contain raw Chevrotain output
      expect(err.hint).not.toContain("Expecting token of type");
    }
  });
});

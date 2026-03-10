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

  describe("paragraphs", () => {
    test("paragraphs are separated by double newline", () => {
      expect(format("hello\n\nworld")).toBe("hello\n\nworld\n");
    });

    test("three+ newlines between paragraphs collapse to two", () => {
      expect(format("hello\n\n\n\nworld")).toBe("hello\n\nworld\n");
    });
  });

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
      expect(format("heading { level  =  1, Tiramisu }")).toBe(
        "heading { level = 1, Tiramisu }\n"
      );
    });

    test("function in text", () => {
      expect(format("This is bold { text }.")).toBe("This is bold { text }.\n");
    });
  });
});

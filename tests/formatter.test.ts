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

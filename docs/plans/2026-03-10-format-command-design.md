# Design: `tiramisu format` CLI Command

## Purpose

A pretty-printer/formatter for `.tiramisu` files. Parses source to AST, then re-emits canonical formatted source with consistent indentation, spacing, and line wrapping. Similar to `gofmt` or `prettier`.

## Approach

AST-based formatter as a standalone module (`src/formatter.ts`). Separate from `toString()` which is for rendering with translation maps, not source roundtripping.

## CLI Interface

```
tiramisu format [files...]              # format files in-place
tiramisu format                         # read stdin, write stdout
tiramisu format --check [files...]      # exit 1 if any file needs formatting
tiramisu format --indent <n> [files...] # override indent (default 2)
tiramisu format --line-width <n>        # override line width (default 80)
```

- Accepts multiple files and glob patterns (via shell expansion)
- Stdin mode: if no file arguments and stdin is not a TTY, reads stdin and writes to stdout
- If no file arguments and stdin IS a TTY, prints usage help

## Formatting Rules

### Whitespace normalization
- Single space after commas: `a, b`
- Single space around `=`: `key = value`
- Single space before `{` and after `{`, before `}`
- Trim trailing whitespace on all lines
- Single trailing newline at end of file

### Indentation
- 2 spaces per level (configurable via `--indent`)
- Top-level content at indent 0
- Function body content indented one level deeper
- Array items indented one level deeper than `[`

### Parameter layout
- Single parameter, short: inline -- `bold { text }`
- Multiple parameters or long content: one per line with trailing commas

### Line wrapping
- Default 80 columns (configurable via `--line-width`)
- If a function call fits on one line, keep it inline
- If not, break parameters onto separate lines
- Plain text paragraphs are NOT reflowed (preserving author intent)

### Paragraph separation
- Double newline between paragraphs

### String literals
- Use minimum number of quotes needed
- Escape `\"` inside single-quoted strings when needed
- Multiline content uses triple-quoted strings `""" ... """`
- Indentation inside triple-quoted strings preserved as-is

## Escaping Rules

- **Top level:** No escaping needed except `\{` for a literal `{` that would otherwise start a function call
- **Inside function parameters:** Special characters (`,`, `=`, `[`, `]`, `{`, `}`) need escaping or quoting. Prefer string literals (`"text with, commas"`) over escape sequences when text contains multiple special chars

## Inline-or-Break Strategy

1. Try printing the function call on one line
2. Measure against `lineWidth - currentIndent`
3. If it fits, use inline version
4. If not, break to multi-line with indented parameters

## Architecture

### New files
- `src/formatter.ts` -- core formatter module
- `tests/formatter.test.ts` -- formatter tests

### Modified files
- `src/cli.ts` -- add `format` command
- `src/index.ts` -- export `format` function

### Public API

```ts
export interface FormatOptions {
  indent?: number;     // default 2
  lineWidth?: number;  // default 80
}

export const format = (src: string, options?: FormatOptions): string;
```

### Implementation

`printNode` recursively walks the AST dispatching on node type: `Tiramisu`, `Paragraph`, `MixedText`, `PureText`, `FunctionCall`, `Parameters`, `Parameter`, `NamedParameter`, `ArrayValue`, `ArrayItem`. Each type has inline and multi-line rendering paths.

## Error Handling

- If input doesn't parse, report the error and exit 1
- No partial formatting of broken files

## Edge Cases

- Empty parameters: `func { }` stays as `func { }`
- Code blocks with triple-quoted strings: preserve internal indentation
- Files that are already correctly formatted: no-op (no unnecessary writes)

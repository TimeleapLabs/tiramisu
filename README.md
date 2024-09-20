# Tiramisu

A delightful language for structured textual data.

## Goals

Tiramisu aims to be a lightweight, parsable, verbose yet readable and
understandable, extensible, and flexible technical writing and documentation
language.

### Obviousness

A first-timer reading the following Markdown code won't know what's going on:

```markdown
**xyz**
_xyz_
**xyz**
_xyz_
[abc](https://abc.com)
```

Comapre the above with the equivalent Tiramisu code:

```tiramisu
bold { xyz }
italic { xyz }
link { abc, to = https://abc.com }
```

### Parsable

Markdown is not
[context-free](https://clehaxze.tw/gemlog/2022/03-31-markdown-is-not-context-free.gmi)
and not easily parsable. Tiramisu is easily parsable by an LL parser.

### Extensible

Tiramisu is extensible. You can write custom "translators" to compile Tiramisu into
ANYTHING. You can also plug in your custom functions without needing to modify the
language parser or grammar.

## Language Guide

Tiramisu has two modes:

1. **Text Mode**: Anything written _outside_ but not before curly braces is
   considered text. Textual tokens that are not separated by _more than one_
   line break are grouped like paragraphs.
2. **Function Mode**: A function starts with a function name and a pair of
   curly braces right after the function name. Functions accept four types
   of parameters, separated by ",":

   - Simple parameters: Any text or function call. You can escape special
     characters with or use the `escape {}` macro.

   - Strings: If there are too many characters to escape in your simple
     parameter, or you don't want to use `escape`, then you can wrap your text
     in double quotes: `"like this"`.

   - Arrays: Arrays are comma "," separated lists of strings or simple
     parameters. You can use square brackets to define an array.

   - Named parameters: In the form of `name = value` where value can be a
     simple parameter, a string, or an array.

### Available Functions

Tiramisu doesn't define ANY functions by default. The `escape` macro has the
exact syntax as a function but it gets evaluated on parse-time. Tiramisu
leaves the choice of functions to distributions, target language translators,
and applications building on Tiramisu. For example, a documentation generator
based on Tiramisu can define

- `bold { this is italic { bold and italic } }`
- `chart { import { data.json } }`
- `map { x = dummy, y = dummy }`

functions.

### Example

See [example.tiramisu](./example.tiramisu).

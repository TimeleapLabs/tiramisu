export interface TranslateMap {
  [key: string]: (node: Node) => string;
}

export interface Node {
  toString(map?: TranslateMap): string;
}

export class FunctionCall {
  functionName: string = "";
  parameters: Parameters;

  constructor(functionName: string, parameters: Parameters) {
    this.functionName = functionName.trim();
    this.parameters = parameters;
  }

  toString(map?: TranslateMap): string {
    if (map && this.functionName in map) {
      return map[this.functionName](this);
    }

    return `${this.functionName}(${this.parameters.toString(map)})`;
  }
}

export class NamedParameter implements Node {
  name: string = "";
  value: Node[] = [];

  constructor(name: string, value: Node[]) {
    this.name = name;
    this.value = value;
  }

  toString(map?: TranslateMap): string {
    if (map && "namedParameter" in map) {
      return map[this.name](this);
    }

    const value = this.value.map((value) => value.toString(map)).join("");
    return `${this.name}=${value}`;
  }
}

export class ArrayValue implements Node {
  values: Node[] = [];

  constructor(values: Node[]) {
    this.values = values;
  }

  toString(map?: TranslateMap): string {
    if (map && "arrayValue" in map) {
      return map["arrayValue"](this);
    }
    return (
      "[" + this.values.map((value) => value.toString(map)).join(", ") + "]"
    );
  }
}

export class ArrayItem implements Node {
  value: Node[] = [];

  constructor(value: Node[]) {
    this.value = value;
  }

  toString(map?: TranslateMap): string {
    if (map && "arrayItem" in map) {
      return map["arrayItem"](this);
    }
    return this.value.map((value) => value.toString(map)).join("");
  }
}

export class PureText implements Node {
  shards: string[] = [];

  constructor(shards: string[]) {
    this.shards = shards;
  }

  toString(map?: TranslateMap): string {
    if (map && "pureText" in map) {
      return map["pureText"](this);
    }
    return this.shards.join("");
  }
}

export class MixedText implements Node {
  shards: Node[] = [];

  constructor(shards: Node[]) {
    this.shards = shards;
  }

  toString(map?: TranslateMap): string {
    if (map && "mixedText" in map) {
      return map["mixedText"](this);
    }
    return this.shards.map((shard) => shard.toString(map)).join("");
  }
}

export class Paragraph implements Node {
  children: Node[] = [];

  constructor(children: Node[]) {
    this.children = children;
  }

  toString(map?: TranslateMap): string {
    if (map && "paragraph" in map) {
      return map["paragraph"](this);
    }
    return this.children.map((child) => child.toString(map)).join("");
  }
}

export class Parameter implements Node {
  value: Node[] = [];

  constructor(value: Node[]) {
    this.value = value;
  }

  toString(map?: TranslateMap): string {
    if (map && "parameter" in map) {
      return map["parameter"](this);
    }
    return this.value.map((value) => value.toString(map)).join("");
  }
}

export class Parameters implements Node {
  parameters: Node[] = [];

  constructor(parameters: Node[]) {
    this.parameters = parameters;
  }

  toString(map?: TranslateMap): string {
    if (map && "parameters" in map) {
      return map["parameters"](this);
    }
    return (
      "[" +
      this.parameters.map((parameter) => parameter.toString(map)).join(", ") +
      "]"
    );
  }
}

export class Tiramisu implements Node {
  children: Node[] = [];

  constructor(children: Node[]) {
    this.children = children;
  }

  toString(map?: TranslateMap): string {
    if (map && "tiramisu" in map) {
      return map["tiramisu"](this);
    }
    return this.children.map((child) => child.toString(map)).join("");
  }
}

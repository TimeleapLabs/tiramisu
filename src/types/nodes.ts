export interface Node {
  toString(): string;
}

export class FunctionCall {
  functionName: string = "";
  parameters: Node[] = [];

  constructor(functionName: string, parameters: Node[]) {
    this.functionName = functionName;
    this.parameters = parameters;
  }

  toString(): string {
    return `${this.functionName}(${this.parameters.toString()})`;
  }
}

export class NamedParameter implements Node {
  name: string = "";
  value: Node = "";

  constructor(name: string, value: Node = "") {
    this.name = name;
    this.value = value;
  }

  toString(): string {
    return `${this.name}=${this.value.toString()}`;
  }
}

export class ArrayValue implements Node {
  values: Node[] = [];

  constructor(values: Node[]) {
    this.values = values;
  }

  toString(): string {
    return "[" + this.values.map((value) => value.toString()).join(", ") + "]";
  }
}

export class ArrayItem implements Node {
  value: Node[] = [];

  constructor(value: Node[]) {
    this.value = value;
  }

  toString(): string {
    return this.value.map((value) => value.toString()).join("");
  }
}

export class PureText implements Node {
  shards: string[] = [];

  constructor(shards: string[]) {
    this.shards = shards;
  }

  toString(): string {
    return this.shards.join("");
  }
}

export class MixedText implements Node {
  shards: Node[] = [];

  constructor(shards: Node[]) {
    this.shards = shards;
  }

  toString(): string {
    return this.shards.map((shard) => shard.toString()).join("");
  }
}

export class Paragraph implements Node {
  children: Node[] = [];

  constructor(children: Node[]) {
    this.children = children;
  }

  toString(): string {
    return this.children.map((child) => child.toString()).join("");
  }
}

export class Parameter implements Node {
  value: Node[] = [];

  constructor(value: Node[]) {
    this.value = value;
  }

  toString(): string {
    return this.value.map((value) => value.toString()).join("");
  }
}

export class Parameters implements Node {
  parameters: Node[] = [];

  constructor(parameters: Node[]) {
    this.parameters = parameters;
  }

  toString(): string {
    return (
      "[" +
      this.parameters.map((parameter) => parameter.toString()).join(", ") +
      "]"
    );
  }
}

export class Tiramisu implements Node {
  children: Node[] = [];

  constructor(children: Node[]) {
    this.children = children;
  }

  toString(): string {
    return this.children.map((child) => child.toString()).join("");
  }
}

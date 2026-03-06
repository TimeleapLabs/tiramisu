export class TiramisuError extends Error {
  public file?: string;
  public line: number;
  public column: number;
  public length: number;
  public hint: string;

  constructor(opts: {
    message: string;
    hint: string;
    line: number;
    column: number;
    length: number;
    file?: string;
  }) {
    super(opts.message);
    this.name = "TiramisuError";
    this.hint = opts.hint;
    this.line = opts.line;
    this.column = opts.column;
    this.length = opts.length;
    this.file = opts.file;
  }
}

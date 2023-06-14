export class FancyError extends Error {
  public code: number;
  constructor(message: string, code: number = 404) {
    super(message);
    this.name = "FancyError";
    this.code = code;
  }
}

export class DbError extends Error {
  code: string;
  status: number;
  errorBody?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status = 400,
    errorBody?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DbError";
    this.code = code;
    this.status = status;
    this.errorBody = errorBody;
  }
}
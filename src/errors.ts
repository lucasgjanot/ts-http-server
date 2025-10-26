export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = new.target.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UserNotAuthenticatedError extends HttpError {
  constructor(message: string) {
    super(401, message);
  }
}

export class UserForbiddenError extends HttpError {
  constructor(message: string) {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
  }
}


export class DatabaseError extends Error {
  public originalError: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = "DatabaseError";
    this.originalError = originalError;
  }
}

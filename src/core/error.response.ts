import { StatusCodes, ReasonPhrases } from './http/httpStatusCode';

class ErrorResponse extends Error {
    public status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor(
        message: string = ReasonPhrases.CONFLICT,
        statusCode: number = StatusCodes.CONFLICT,
    ) {
        super(message, statusCode);
    }
}

class BadRequestError extends ErrorResponse {
    constructor(
        message: string = ReasonPhrases.BAD_REQUEST,
        statusCode: number = StatusCodes.BAD_REQUEST,
    ) {
        super(message, statusCode);
    }
}

class ForbiddenError extends ErrorResponse {
    constructor(
        message: string = ReasonPhrases.FORBIDDEN,
        statusCode: number = StatusCodes.FORBIDDEN,
    ) {
        super(message, statusCode);
    }
}

class AuthFailureError extends ErrorResponse {
    constructor(
        message: string = ReasonPhrases.UNAUTHORIZED,
        statusCode: number = StatusCodes.UNAUTHORIZED,
    ) {
        super(message, statusCode);
    }
}

class NotFoundError extends ErrorResponse {
    constructor(
        message: string = ReasonPhrases.NOT_FOUND,
        statusCode: number = StatusCodes.NOT_FOUND,
    ) {
        super(message, statusCode);
    }
}

class UnauthorizedError extends ErrorResponse {
    constructor(
        message: string = ReasonPhrases.UNAUTHORIZED,
        statusCode: number = StatusCodes.UNAUTHORIZED,
    ) {
        super(message, statusCode);
    }
}

export {
    BadRequestError,
    ConflictRequestError,
    ForbiddenError,
    AuthFailureError,
    NotFoundError,
    UnauthorizedError,
};

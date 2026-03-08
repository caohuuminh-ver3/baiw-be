import { Response } from 'express';
import { StatusCodes, ReasonPhrases } from './http/httpStatusCode';

interface SuccessResponseOptions {
    message?: string;
    statusCode?: number;
    reasonStatusCode?: string;
    data?: Record<string, any> | any[];
    meta?: Record<string, any>;
}

class SuccessResponse {
    public message: string;
    public status: number;

    public data: Record<string, any> | any[];
    public meta?: Record<string, any>;

    constructor({
        message,
        statusCode = StatusCodes.OK,
        reasonStatusCode = ReasonPhrases.OK,
        data = {},
        meta = {},
    }: SuccessResponseOptions) {
        this.message = message ? message : reasonStatusCode;
        this.status = statusCode;
        this.data = data;
        this.meta = meta;
    }

    send(res: Response, header: Record<string, any> = {}): Response {
        return res.status(this.status).json(this);
    }
}

interface OKOptions {
    message?: string;
    data?: Record<string, any> | any[];
    meta?: Record<string, any>;
}

class OK extends SuccessResponse {
    constructor({ message, data, meta }: OKOptions) {
        super({ message, data, meta });
    }
}

interface CREATEDOptions {
    message?: string;
    statusCode?: number;
    reasonStatusCode?: string;
    data?: Record<string, any> | any[];
    meta?: Record<string, any>;
}

class CREATED extends SuccessResponse {
    constructor({
        message,
        statusCode = StatusCodes.CREATED,
        reasonStatusCode = ReasonPhrases.CREATED,
        data = {},
        meta = {},
    }: CREATEDOptions) {
        super({ message, statusCode, reasonStatusCode, data, meta });
    }
}

interface NoContentResponseOptions {
    message?: string;
    statusCode?: number;
    reasonStatusCode?: string;
    data?: Record<string, any>;
}

class NoContentResponse extends SuccessResponse {
    constructor({
        message,
        statusCode = StatusCodes.NO_CONTENT,
        reasonStatusCode = ReasonPhrases.NO_CONTENT,
        data = {},
    }: NoContentResponseOptions) {
        super({ message, statusCode, reasonStatusCode, data });
    }
}

export { OK, CREATED, SuccessResponse, NoContentResponse };

import { Request, Response, NextFunction } from "express";

export type AsyncFunction = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<any>;

export type MiddlewareFunction = (
    req: Request,
    res: Response,
    next: NextFunction,
) => void;

const asyncHandler = (fn: AsyncFunction): MiddlewareFunction => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};

export default asyncHandler;

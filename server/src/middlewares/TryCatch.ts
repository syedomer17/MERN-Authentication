import { Request, Response, NextFunction } from "express";
import { AsyncHandler } from "../types/AsyncHandler"; 

const TryCatch = (fn: AsyncHandler) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  };
};

export default TryCatch;
import crypto from "crypto";
import { Response, Request, NextFunction } from "express";
import { redisClient } from "./redis";

export const generateCsrfToken = async (
  userId: string,
  res: Response
): Promise<string> => {
  const csrfToken = crypto.randomBytes(32).toString("hex");

  const csrfkey = `csrf:${userId}`;

  await redisClient.setEx(csrfkey, 3600, csrfToken); // Token valid for 1 hour

  res.cookie("csrfToken", csrfToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 3600 * 1000, // 1 hour
  });

  return csrfToken;
};

export const verifyCSRFToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.method === "GET") {
      return next();
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const clinetToken =
      (req.headers["x-csrf-token"] as string) ||
      (req.headers["x-xsrf-token"] as string) ||
      (req.headers["csrf-token"] as string);

    if (!clinetToken) {
      return res
        .status(403)
        .json({
          message: "CSRF token missing. Please Refresh the page and try again.",
          code: "CSRF_TOKEN_MISSING",
        });
    }

    const csrfkey = `csrf:${userId}`;
    const storedToken = await redisClient.get(csrfkey);

    if (!storedToken) {
      return res
        .status(403)
        .json({
          message: "CSRF token expired. Please Refresh the page and try again.",
          code: "CSRF_TOKEN_EXPIRED",
        });
    }

    if (storedToken !== clinetToken) {
      return res
        .status(403)
        .json({
          message: "Invalid CSRF token. Please Refresh the page and try again.",
          code: "CSRF_TOKEN_INVALID",
        });
    }

    next();
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Internal server error during CSRF verification",
        error: error,
        code: "CSRF_INTERNAL_ERROR",
      });
  }
};

export const revokeCSRFToken = async (userId: string) => {
    const csrfKey = `csrf:${userId}`;

    await redisClient.del(csrfKey);
};

export const refreshCSRFToken = async (userId: string, res: Response): Promise<string> => {
    await revokeCSRFToken(userId);
    
    return await generateCsrfToken(userId, res);
}
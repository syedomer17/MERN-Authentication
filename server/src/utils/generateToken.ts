import jwt from "jsonwebtoken";
import { Response } from "express";
import { redisClient } from "../config/redis";

type TokenPayload = {
  id: string;
};

type GeneratedTokens = {
  accessToken: string;
  refreshToken: string;
};

export const generateToken = async (
  id: string,
  res: Response
): Promise<GeneratedTokens> => {
  const accessToken = jwt.sign(
    { id },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "7d" }
  );

  const refreshTokenKey = `refreshToken:${id}`;

  await redisClient.setEx(
    refreshTokenKey,
    7 * 24 * 60 * 60,
    refreshToken
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

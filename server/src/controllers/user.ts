import { z } from "zod";
import { registerUserSchema } from "../config/zod";
import TryCatch from "../middlewares/TryCatch";
import sanitize from "mongo-sanitize";
import { redisClient } from "../config/redis";
import User from "../models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendMail from "../utils/sendMail";
import { getVerifyEmailHtml } from "../template/html";

type ZodFormattedError = {
  field: string;
  message: string;
  code: string;
};

export const registerUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);

  const validation = registerUserSchema.safeParse(sanitizedBody);

  if (!validation.success) {
    const zodError = validation.error;
    let firstErrorMessage = "validation failed";
    let allErrors: ZodFormattedError[] = [];

    allErrors = zodError.issues.map((issue) => ({
      field: issue.path.join(".") || "unknown",
      message: issue.message,
      code: issue.code,
    }));

    firstErrorMessage = allErrors[0]?.message ?? "validation error";

    res.status(400).json({
      message: firstErrorMessage,
      errors: allErrors,
    });
    return;
  }

  const { name, email, password } = validation.data;

  const rateLimitKey = `register-rate-limit-${req.ip}:${validation.data.email}`;

  if(await redisClient.get(rateLimitKey)) {
    res.status(429).json({
      message: "Too many registration attempts. Please try again later.",
    });
    return;
  }

  const existingUser = await User.findOne({email});

  if(existingUser) {
    res.status(409).json({
      message: "Email is already Exists.",
    });
    return;
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const verifyToken = crypto.randomBytes(32).toString("hex");

  const verifyKey = `verify:${verifyToken}`;

  const dataToStore = JSON.stringify({
    name,
    email,
    password: hashPassword,
  });

  await redisClient.set(verifyKey, dataToStore, { EX: 300});

  const subject = "Verify your email";
  const html =getVerifyEmailHtml({ email, token: verifyToken });

  await sendMail(email, subject, html);

  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  res.status(201).json({
    message: "User registered successfully. Please verify your email. within 5 minutes.",
  });
});

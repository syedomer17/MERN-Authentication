import { z } from "zod";
import { registerUserSchema } from "../config/zod";
import TryCatch from "../middlewares/TryCatch";
import sanitize from "mongo-sanitize";
import { redisClient } from "../config/redis";
import User from "../models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendMail from "../utils/sendMail";
import { getOtpHtml, getVerifyEmailHtml } from "../template/html";
import { loginUserSchema } from "../config/zod";
import { generateAccessToken, generateToken, revokeRefreshToken, verifyRefreshToken } from "../utils/generateToken";

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

  if (await redisClient.get(rateLimitKey)) {
    res.status(429).json({
      message: "Too many registration attempts. Please try again later.",
    });
    return;
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
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

  await redisClient.set(verifyKey, dataToStore, { EX: 300 });

  const subject = "Verify your email";
  const html = getVerifyEmailHtml({ email, token: verifyToken });

  await sendMail(email, subject, html);

  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  res.status(201).json({
    message:
      "User registered successfully. Please verify your email. within 5 minutes.",
  });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { token } = req.params;

  if (!token || typeof token !== "string") {
    res.status(400).json({
      message: "Invalid or missing token.",
    });
    return;
  }

  const verifyKey = `verify:${token}`;

  const userDataJson = await redisClient.get(verifyKey);

  if (!userDataJson) {
    res.status(400).json({
      message: "Verification Link is invalid or has expired.",
    });
    return;
  }

  await redisClient.del(verifyKey);

  const userData = JSON.parse(userDataJson);

  const existingUser = await User.findOne({ email: userData.email });

  if (existingUser) {
    res.status(409).json({
      message: "Email is already Exists.",
    });
    return;
  }

  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });

  res.status(200).json({
    message: "Email verified successfully. You can now log in.",
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  });
});

export const loginUser = TryCatch(async (req, res) => {
  const sanitizedBody = sanitize(req.body);

  const validation = loginUserSchema.safeParse(sanitizedBody);

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

  const { email, password } = validation.data;

  const rateLimitKey = `login-rate-limit-${req.ip}:${email}`;

  if (await redisClient.get(rateLimitKey)) {
    res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
    return;
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401).json({
      message: "Invalid email or password.",
    });
    return;
  }

  const comparePassword = await bcrypt.compare(password, user.password);

  if (!comparePassword) {
    res.status(401).json({
      message: "Invalid email or password.",
    });
    return;
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  const otpKey = `otp:${email}`;

  await redisClient.set(otpKey, JSON.stringify({ otp }), { EX: 300 });

  const subject = "Your Login OTP Code";

  const html = getOtpHtml({ email, otp });

  await sendMail(email, subject, html);

  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  res.cookie("otp_email", email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 5 * 60 * 1000,
  });

  res.status(200).json({
    message: "OTP has been sent to your email. It will expire in 5 minutes.",
  });
});

export const verifyOtp = TryCatch(async (req, res) => {
  const { otp } = req.body;

  const email = req.cookies.otp_email;

  if (!email || !otp) {
    res.status(400).json({
      message: "Email and OTP are required.",
    });
    return;
  }

  const otpKey = `otp:${email}`;

  const storedOtpString = await redisClient.get(otpKey);

  if (!storedOtpString) {
    res.status(400).json({
      message: "OTP is invalid or has expired.",
    });
    return;
  }

  const storedOtp = JSON.parse(storedOtpString);

  if (storedOtp.otp !== otp) {
    res.status(400).json({
      message: "Invalid OTP.",
    });
    return;
  }

  await redisClient.del(otpKey);

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404).json({
      message: "User not found",
    });
    return;
  }

  const tokenData = await generateToken(user._id.toString(), res);

  res.status(200).json({
    message: `Welcome ${user.name}`,
    user:{
      _id: user._id,
      name: user.name,
      email: user.email,
    }
  });
});

export const myProfile = TryCatch(async (req, res) => {
  

  if (!req.user) {
    res.status(404).json({
      message: "User not found",
    });
    return;
  }
  
  const user = req.user;
  
  res.status(200).json({
    message: "User profile fetched successfully.",
    user,
  });
});

export const refreshToken = TryCatch(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      message: "Invalid Refresh token.",
    });
    return;
  }

  const decoded = await verifyRefreshToken(refreshToken);

  if (!decoded) {
    res.status(401).json({
      message: "Invalid Refresh token.",
    });
    return;
  }

  generateAccessToken(decoded.id, res);

  res.status(200).json({
    message: "Access token refreshed successfully.",
  });
});

export const logoutUser = TryCatch(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      message: "Unauthorized.",
    });
    return;
  }
  
  await revokeRefreshToken(userId.toString());

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  await redisClient.del(`refreshToken:${userId}`);

  res.status(200).json({
    message: "Logged out successfully.",
  });
})
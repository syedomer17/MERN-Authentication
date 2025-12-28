import express, { Application } from "express";
import connectDB from "./config/db";
import { connectRedis } from "./config/redis";

// routes
import userRoutes from "./routes/user";

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 5000;

// Middleware
app.use(express.json());

// Routes
app.get("/", (_req, res) => {
  res.send("Hello, World!");
});

// User Routes
app.use("/api/v1", userRoutes);

try {
  connectDB();

  connectRedis();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("🔥 Server startup failed:", error);
  process.exit(1);
}

export default app;

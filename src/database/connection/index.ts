import mongoose from "mongoose";
import { config } from "../../../config";

const dbUrl: string = config.DB_URL;

mongoose.set("strictQuery", false);
mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 0);

export const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      connectTimeoutMS: 30000,

      family: 4,              // 🔥 FORCE IPV4
      retryWrites: true,
      tls: true
    });

    console.log("✅ Database successfully connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1);
  }
};

mongoose.connection.on("connected", () => {
  console.log("🟢 MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
  console.error("🔴 MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🟡 MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime error:", err);
});

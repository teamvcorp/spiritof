// lib/db.ts
import "server-only";
import mongoose, { type ConnectOptions } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI env var");
}

// Use the typed global from types/mongoose-global.d.ts
const cached =
  global._mongoose ??
  (global._mongoose = { conn: null as typeof mongoose | null, promise: null as Promise<typeof mongoose> | null });

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = { bufferCommands: false } satisfies ConnectOptions;
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

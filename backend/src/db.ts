import mongoose from "mongoose";

let connected = false;

// Connects to MongoDB if MONGODB_URI is set. If it isn't, the server still boots
// and the core analysis flow works — only the account features are disabled.
export async function connectDb(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return false;
  await mongoose.connect(uri);
  connected = true;
  return true;
}

export function dbReady(): boolean {
  return connected && mongoose.connection.readyState === 1;
}

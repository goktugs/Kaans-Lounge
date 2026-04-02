export interface ApiConfig {
  port: number;
  mongodbUri: string;
  mongodbDatabase: string;
}

export function loadConfig(): ApiConfig {
  return {
    port: Number(process.env.API_PORT) || 3000,
    mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/kaans-lounge",
    mongodbDatabase: process.env.MONGODB_DB || "kaans-lounge",
  };
}

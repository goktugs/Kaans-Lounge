import { startServer } from "./server";

void startServer().catch((error) => {
  const message = (error as { message?: string }).message || "Unknown startup error";
  console.error(JSON.stringify({ level: "error", message }));
  process.exitCode = 1;
});

import { createHash } from "node:crypto";

export function createTextHash(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

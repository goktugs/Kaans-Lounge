import { randomUUID } from "node:crypto";

import type { RawCommentMessage } from "../../shared/types/comment";
import { createTextHash } from "../../shared/utils/text-hash";

const COMMENT_LIBRARY = [
  "Great food and cozy atmosphere.",
  "The grilled meat was tender and full of flavor.",
  "Service was slow but the desserts were worth the wait.",
  "Amazing mezze selection and fresh bread.",
  "Music was a bit loud, though the staff stayed very friendly.",
  "Beautiful plating and generous portions.",
  "Coffee arrived cold, but the main dishes were excellent.",
  "We loved the lounge vibe and the quick service.",
];

export class CommentGenerator {
  private readonly reusableTexts: string[] = [];

  generate(): RawCommentMessage {
    const text = this.pickText();

    return {
      commentId: randomUUID(),
      text,
      textHash: createTextHash(text),
      createdAt: new Date().toISOString(),
    };
  }

  private pickText(): string {
    const reuseExistingText = this.reusableTexts.length > 0 && Math.random() < 0.35;

    if (reuseExistingText) {
      return this.reusableTexts[this.randomIndex(this.reusableTexts.length)];
    }

    const text = COMMENT_LIBRARY[this.randomIndex(COMMENT_LIBRARY.length)];

    if (!this.reusableTexts.includes(text)) {
      this.reusableTexts.push(text);
    }

    return text;
  }

  private randomIndex(length: number): number {
    return Math.floor(Math.random() * length);
  }
}

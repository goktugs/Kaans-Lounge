export class DeduplicationStore {
  private readonly processedCommentIds = new Set<string>();

  has(commentId: string): boolean {
    return this.processedCommentIds.has(commentId);
  }

  mark(commentId: string): void {
    this.processedCommentIds.add(commentId);
  }
}

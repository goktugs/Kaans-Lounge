import type {
  ProcessedCommentRecord,
  ProcessingStatus,
} from "../../../shared/types/processed-comment";
import type { SentimentLabel } from "../../../shared/types/sentiment";

export interface ListCommentsParams {
  sentiment?: SentimentLabel;
  status?: ProcessingStatus;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export interface ListCommentsResult {
  items: ProcessedCommentRecord[];
  page: number;
  limit: number;
  total: number;
}

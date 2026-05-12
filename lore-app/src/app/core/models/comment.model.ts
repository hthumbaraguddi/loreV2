/**
 * Comment Model
 * Represents a threaded comment on a block
 */
export interface BlockComment {
  id: string;
  blockId: string;
  noteId: string;
  author: string; // User name or email
  text: string;
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  replies: BlockComment[]; // Nested replies
  parentId?: string; // If this is a reply, reference the parent comment
}

/**
 * Comment Thread
 * Groups related comments together
 */
export interface CommentThread {
  id: string;
  blockId: string;
  noteId: string;
  rootComment: BlockComment;
  replyCount: number;
  isResolved: boolean;
  lastUpdated: Date;
}

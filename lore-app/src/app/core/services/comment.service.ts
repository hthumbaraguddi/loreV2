import { Injectable, inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import { BlockComment, CommentThread } from '../models/comment.model';

/**
 * CommentService
 * Manages block comments and threaded discussions.
 * Stores comments in localStorage under 'lore-comments-{noteId}' key.
 */
@Injectable({ providedIn: 'root' })
export class CommentService {
  // Map of noteId -> comments[]
  private commentsMap = signal<Map<string, BlockComment[]>>(new Map());

  constructor() {
    this.loadAllComments();
  }

  /**
   * Load all comments from localStorage
   */
  private loadAllComments(): void {
    const map = new Map<string, BlockComment[]>();
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith('lore-comments-')) {
        const noteId = key.replace('lore-comments-', '');
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          map.set(noteId, data);
        } catch (e) {
          console.error(`Failed to load comments for note ${noteId}:`, e);
        }
      }
    });

    this.commentsMap.set(map);
  }

  /**
   * Get all comments for a block
   */
  getBlockComments(noteId: string, blockId: string): BlockComment[] {
    const noteComments = this.commentsMap().get(noteId) || [];
    return noteComments.filter((c) => c.blockId === blockId && !c.parentId);
  }

  /**
   * Get comment thread (root + replies)
   */
  getCommentThread(noteId: string, commentId: string): CommentThread | null {
    const noteComments = this.commentsMap().get(noteId) || [];
    const rootComment = noteComments.find((c) => c.id === commentId);

    if (!rootComment) return null;

    const replies = noteComments.filter((c) => c.parentId === commentId);
    rootComment.replies = replies;

    const replyCount = replies.length;
    const isResolved = rootComment.resolved;
    const lastUpdated =
      replies.length > 0
        ? new Date(
            Math.max(...replies.map((r) => new Date(r.updatedAt).getTime())),
          )
        : rootComment.updatedAt;

    return {
      id: rootComment.id,
      blockId: rootComment.blockId,
      noteId: rootComment.noteId,
      rootComment,
      replyCount,
      isResolved,
      lastUpdated,
    };
  }

  /**
   * Get count of comments on a block
   */
  getBlockCommentCount(noteId: string, blockId: string): number {
    const noteComments = this.commentsMap().get(noteId) || [];
    return noteComments.filter((c) => c.blockId === blockId && !c.parentId)
      .length;
  }

  /**
   * Add a new comment to a block
   */
  addComment(
    noteId: string,
    blockId: string,
    text: string,
    author = 'User',
  ): BlockComment {
    const noteComments = this.commentsMap().get(noteId) || [];

    const comment: BlockComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      blockId,
      noteId,
      author,
      text,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      replies: [],
    };

    const updated = [...noteComments, comment];
    const map = new Map(this.commentsMap());
    map.set(noteId, updated);
    this.commentsMap.set(map);
    this.persistComments(noteId, updated);

    return comment;
  }

  /**
   * Reply to a comment
   */
  addReply(
    noteId: string,
    parentCommentId: string,
    text: string,
    author = 'User',
  ): BlockComment | null {
    const noteComments = this.commentsMap().get(noteId) || [];
    const parentComment = noteComments.find((c) => c.id === parentCommentId);

    if (!parentComment) return null;

    const reply: BlockComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      blockId: parentComment.blockId,
      noteId,
      author,
      text,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
      replies: [],
      parentId: parentCommentId,
    };

    const updated = [...noteComments, reply];
    const map = new Map(this.commentsMap());
    map.set(noteId, updated);
    this.commentsMap.set(map);
    this.persistComments(noteId, updated);

    return reply;
  }

  /**
   * Edit a comment
   */
  editComment(noteId: string, commentId: string, newText: string): boolean {
    const noteComments = this.commentsMap().get(noteId) || [];
    const idx = noteComments.findIndex((c) => c.id === commentId);

    if (idx === -1) return false;

    noteComments[idx].text = newText;
    noteComments[idx].updatedAt = new Date();

    const map = new Map(this.commentsMap());
    map.set(noteId, noteComments);
    this.commentsMap.set(map);
    this.persistComments(noteId, noteComments);

    return true;
  }

  /**
   * Delete a comment (and its replies)
   */
  deleteComment(noteId: string, commentId: string): boolean {
    const noteComments = this.commentsMap().get(noteId) || [];

    // Remove the comment and all its replies
    const updated = noteComments.filter(
      (c) => c.id !== commentId && c.parentId !== commentId,
    );

    if (updated.length === noteComments.length) return false; // Not found

    const map = new Map(this.commentsMap());
    map.set(noteId, updated);
    this.commentsMap.set(map);
    this.persistComments(noteId, updated);

    return true;
  }

  /**
   * Resolve/unresolve a comment thread
   */
  toggleResolved(noteId: string, commentId: string): boolean {
    const noteComments = this.commentsMap().get(noteId) || [];
    const comment = noteComments.find((c) => c.id === commentId);

    if (!comment) return false;

    comment.resolved = !comment.resolved;
    comment.updatedAt = new Date();

    const map = new Map(this.commentsMap());
    map.set(noteId, noteComments);
    this.commentsMap.set(map);
    this.persistComments(noteId, noteComments);

    return true;
  }

  /**
   * Delete all comments on a block (when block is deleted)
   */
  deleteBlockComments(noteId: string, blockId: string): void {
    const noteComments = this.commentsMap().get(noteId) || [];
    const updated = noteComments.filter((c) => c.blockId !== blockId);

    const map = new Map(this.commentsMap());
    map.set(noteId, updated);
    this.commentsMap.set(map);
    this.persistComments(noteId, updated);
  }

  /**
   * Persist comments to localStorage
   */
  private persistComments(noteId: string, comments: BlockComment[]): void {
    const key = `lore-comments-${noteId}`;
    if (comments.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(comments));
    }
  }

  /**
   * Clear all comments for a note (when note is deleted)
   */
  clearNoteComments(noteId: string): void {
    const key = `lore-comments-${noteId}`;
    localStorage.removeItem(key);

    const map = new Map(this.commentsMap());
    map.delete(noteId);
    this.commentsMap.set(map);
  }
}

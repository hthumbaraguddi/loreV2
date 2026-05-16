import { Injectable, signal, computed, inject } from '@angular/core';
import { ShelfService } from './shelf.service';
import { Note } from '../models/shelf.model';

export interface BacklinkInfo {
  noteId: string;
  noteTitle: string;
  notePath: string;
  noteType: string;
  linkCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BacklinksService {
  private shelfService = inject(ShelfService);

  /**
   * Gets all backlinks for a specific note
   */
  getBacklinks(noteId: string): BacklinkInfo[] {
    const allNotes = this.shelfService.getAllNotes();
    const backlinks: BacklinkInfo[] = [];

    allNotes.forEach(note => {
      if (note.id !== noteId && note.linkedNoteIds?.includes(noteId)) {
        backlinks.push({
          noteId: note.id,
          noteTitle: note.title || 'Untitled',
          notePath: this.getNotePath(note),
          noteType: note.type,
          linkCount: note.linkedNoteIds.length
        });
      }
    });

    return backlinks;
  }

  /**
   * Gets all forward links for a specific note
   */
  getForwardLinks(noteId: string): BacklinkInfo[] {
    const note = this.shelfService.getAllNotes().find(n => n.id === noteId);
    if (!note || !note.linkedNoteIds || note.linkedNoteIds.length === 0) return [];

    const allNotes = this.shelfService.getAllNotes();
    const forwardLinks: BacklinkInfo[] = [];

    note.linkedNoteIds.forEach(linkedId => {
      const linkedNote = allNotes.find(n => n.id === linkedId);
      if (linkedNote) {
        forwardLinks.push({
          noteId: linkedNote.id,
          noteTitle: linkedNote.title || 'Untitled',
          notePath: this.getNotePath(linkedNote),
          noteType: linkedNote.type,
          linkCount: linkedNote.linkedNoteIds?.length || 0
        });
      }
    });

    return forwardLinks;
  }

  /**
   * Gets all links (both forward and back) for a note
   */
  getAllLinks(noteId: string): { forward: BacklinkInfo[]; back: BacklinkInfo[] } {
    return {
      forward: this.getForwardLinks(noteId),
      back: this.getBacklinks(noteId)
    };
  }

  /**
   * Adds a link from one note to another
   */
  addLink(fromNoteId: string, toNoteId: string): void {
    const fromNote = this.shelfService.getAllNotes().find(n => n.id === fromNoteId);
    if (fromNote) {
      const currentLinks = fromNote.linkedNoteIds || [];
      if (!currentLinks.includes(toNoteId)) {
        const updatedLinks = [...currentLinks, toNoteId];
        this.shelfService.updateNote(fromNote.id, { linkedNoteIds: updatedLinks });
      }
    }
  }

  /**
   * Removes a link from one note to another
   */
  removeLink(fromNoteId: string, toNoteId: string): void {
    const fromNote = this.shelfService.getAllNotes().find(n => n.id === fromNoteId);
    if (fromNote && fromNote.linkedNoteIds) {
      const updatedLinks = fromNote.linkedNoteIds.filter(id => id !== toNoteId);
      this.shelfService.updateNote(fromNote.id, { linkedNoteIds: updatedLinks });
    }
  }

  /**
   * Gets the link graph for visualization
   */
  getLinkGraph(): {
    nodes: Array<{ id: string; title: string; type: string }>;
    edges: Array<{ source: string; target: string }>;
  } {
    const allNotes = this.shelfService.getAllNotes();
    const nodes = allNotes.map(note => ({
      id: note.id,
      title: note.title || 'Untitled',
      type: note.type
    }));

    const edges: Array<{ source: string; target: string }> = [];
    allNotes.forEach(note => {
      if (note.linkedNoteIds) {
        note.linkedNoteIds.forEach(linkedId => {
          edges.push({
            source: note.id,
            target: linkedId
          });
        });
      }
    });

    return { nodes, edges };
  }

  /**
   * Gets link statistics
   */
  getLinkStats(): {
    totalLinks: number;
    mostLinked: { noteId: string; noteTitle: string; count: number } | null;
    orphanedNotes: string[];
    linkedNotes: string[];
  } {
    const allNotes = this.shelfService.getAllNotes();
    let totalLinks = 0;
    const linkCounts = new Map<string, number>();
    const linkedIds = new Set<string>();

    allNotes.forEach(note => {
      if (note.linkedNoteIds) {
        totalLinks += note.linkedNoteIds.length;
        note.linkedNoteIds.forEach(linkedId => {
          linkedIds.add(linkedId);
          linkCounts.set(linkedId, (linkCounts.get(linkedId) || 0) + 1);
        });
      }
    });

    // Find most linked note
    let mostLinked: { noteId: string; noteTitle: string; count: number } | null = null;
    let maxCount = 0;
    linkCounts.forEach((count, noteId) => {
      if (count > maxCount) {
        maxCount = count;
        const note = allNotes.find(n => n.id === noteId);
        if (note) {
          mostLinked = {
            noteId,
            noteTitle: note.title || 'Untitled',
            count
          };
        }
      }
    });

    // Find orphaned notes (no links in or out)
    const orphanedNotes = allNotes
      .filter(note => {
        const hasOutgoing = note.linkedNoteIds && note.linkedNoteIds.length > 0;
        const hasIncoming = linkedIds.has(note.id);
        return !hasOutgoing && !hasIncoming;
      })
      .map(n => n.id);

    return {
      totalLinks,
      mostLinked,
      orphanedNotes,
      linkedNotes: Array.from(linkedIds)
    };
  }

  /**
   * Finds broken links (links to non-existent notes)
   */
  findBrokenLinks(): Array<{ fromNoteId: string; brokenLinkId: string }> {
    const allNotes = this.shelfService.getAllNotes();
    const noteIds = new Set(allNotes.map(n => n.id));
    const brokenLinks: Array<{ fromNoteId: string; brokenLinkId: string }> = [];

    allNotes.forEach(note => {
      if (note.linkedNoteIds) {
        note.linkedNoteIds.forEach(linkedId => {
          if (!noteIds.has(linkedId)) {
            brokenLinks.push({
              fromNoteId: note.id,
              brokenLinkId: linkedId
            });
          }
        });
      }
    });

    return brokenLinks;
  }

  /**
   * Fixes broken links by removing them
   */
  fixBrokenLinks(): number {
    const brokenLinks = this.findBrokenLinks();
    brokenLinks.forEach(({ fromNoteId, brokenLinkId }) => {
      this.removeLink(fromNoteId, brokenLinkId);
    });
    return brokenLinks.length;
  }

  /**
   * Finds unlinked mentions - notes whose titles appear in this note's content but aren't formally linked
   */
  findUnlinkedMentions(noteId: string): BacklinkInfo[] {
    const allNotes = this.shelfService.getAllNotes();
    const note = allNotes.find(n => n.id === noteId);
    if (!note || !note.content) return [];

    const content = note.content.toLowerCase();
    const existingLinks = new Set(note.linkedNoteIds || []);
    const mentions: BacklinkInfo[] = [];

    allNotes.forEach(otherNote => {
      if (otherNote.id === noteId) return;
      if (existingLinks.has(otherNote.id)) return;

      const title = (otherNote.title || '').toLowerCase().trim();
      if (title.length < 3) return; // Skip very short titles to avoid noise

      if (content.includes(title)) {
        mentions.push({
          noteId: otherNote.id,
          noteTitle: otherNote.title || 'Untitled',
          notePath: this.getNotePath(otherNote),
          noteType: otherNote.type,
          linkCount: otherNote.linkedNoteIds?.length || 0
        });
      }
    });

    return mentions;
  }

  /**
   * Gets the path to a note (Shelf › Notebook)
   */
  private getNotePath(note: Note): string {
    const shelves = this.shelfService.shelves();
    for (const shelf of shelves) {
      for (const notebook of shelf.notebooks) {
        if (notebook.notes.some(n => n.id === note.id)) {
          return `${shelf.name} › ${notebook.name}`;
        }
      }
    }
    return 'Unknown';
  }
}

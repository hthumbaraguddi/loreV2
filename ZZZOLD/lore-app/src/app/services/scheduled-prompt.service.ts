import { Injectable, inject } from '@angular/core';
import { PromptService } from './prompt.service';
import { AnthropicService } from './anthropic.service';
import { DataService } from './data.service';
import { PromptSchedule, SavedPrompt } from '../models';

@Injectable({ providedIn: 'root' })
export class ScheduledPromptService {
  private promptService = inject(PromptService);
  private ai = inject(AnthropicService);
  private data = inject(DataService);

  /** Call once after user data is loaded. Runs any overdue scheduled prompts. */
  async runOverdue(): Promise<void> {
    if (!this.ai.getApiKey()) return;

    const prompts = this.promptService.getAll().filter(p => p.schedule?.frequency);
    const now = Date.now();

    for (const prompt of prompts) {
      const sched = prompt.schedule!;
      if (!this.isOverdue(sched, now)) continue;
      await this.runScheduled(prompt, sched, now);
    }
  }

  private isOverdue(sched: PromptSchedule, now: number): boolean {
    const last = sched.lastScheduledRunAt;
    const [hh, mm] = (sched.scheduleTime || '00:00').split(':').map(Number);

    // Build the "scheduled fire time" for today
    const todayFire = new Date();
    todayFire.setHours(hh, mm, 0, 0);
    const todayFireMs = todayFire.getTime();

    // If we haven't passed today's fire time yet, not due
    if (now < todayFireMs) return false;

    if (!last) return true;

    const periodMs = this.frequencyMs(sched.frequency);
    // Due if the last run was more than one period ago
    return now - last >= periodMs;
  }

  private frequencyMs(freq: string): number {
    if (freq === 'daily')   return 24 * 60 * 60 * 1000;
    if (freq === 'weekly')  return 7 * 24 * 60 * 60 * 1000;
    if (freq === 'monthly') return 30 * 24 * 60 * 60 * 1000;
    return Infinity;
  }

  private async runScheduled(prompt: SavedPrompt, sched: PromptSchedule, now: number): Promise<void> {
    // Build the prompt body using last run values (no variables to fill interactively)
    let body = prompt.body;
    for (const [k, v] of Object.entries(prompt.lastRunValues || {})) {
      body = body.replaceAll(`{{${k}}}`, v);
    }

    let result = '';
    try {
      await this.ai.sendMessage(
        [{ role: 'user', content: body }],
        chunk => { result += chunk; }
      );
    } catch (e) {
      console.warn(`[Scheduler] failed to run prompt "${prompt.name}":`, e);
      return;
    }

    if (!result.trim()) return;

    const title = `${prompt.name} — ${new Date(now).toLocaleDateString()}`;
    const saved = this.data.addNoteToSection(sched.targetSectionId, title, 'page', {
      icon: '✦',
      blocks: [{ type: 'text', content: result }],
      tags: ['scheduled', prompt.category.toLowerCase()],
    });

    if (saved) {
      // Update lastScheduledRunAt
      const updated: SavedPrompt = {
        ...prompt,
        schedule: { ...sched, lastScheduledRunAt: now },
      };
      this.promptService.save(updated);
      this.data.showToast(`✦ Scheduled prompt "${prompt.name}" saved as note`);
    }
  }
}

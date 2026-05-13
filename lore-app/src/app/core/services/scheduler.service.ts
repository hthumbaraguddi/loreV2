import { Injectable, signal, computed } from '@angular/core';
import { Prompt, PromptSchedule } from '../models/prompt.model';

/**
 * SchedulerService
 * Manages scheduled prompt execution using cron expressions
 */
@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  private checkInterval: any;
  private readonly CHECK_INTERVAL_MS = 60000; // Check every minute

  // Signal for active schedules
  private activeSchedulesSignal = signal<Map<string, PromptSchedule>>(new Map());
  
  activeSchedules = this.activeSchedulesSignal.asReadonly();
  
  // Computed signal for next scheduled run
  nextScheduledRun = computed(() => {
    const schedules = Array.from(this.activeSchedulesSignal().values());
    if (schedules.length === 0) return null;
    
    const nextRuns = schedules
      .filter(s => s.enabled && s.nextRun)
      .map(s => s.nextRun!)
      .sort((a, b) => a.getTime() - b.getTime());
    
    return nextRuns.length > 0 ? nextRuns[0] : null;
  });

  constructor() {
    this.startScheduler();
  }

  /**
   * Start the scheduler interval
   */
  private startScheduler(): void {
    this.checkInterval = setInterval(() => {
      this.checkSchedules();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop the scheduler interval
   */
  stopScheduler(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check all schedules and trigger due prompts
   */
  private checkSchedules(): void {
    const now = new Date();
    const schedules = this.activeSchedulesSignal();
    
    schedules.forEach((schedule, promptId) => {
      if (schedule.enabled && schedule.nextRun && schedule.nextRun <= now) {
        this.triggerScheduledPrompt(promptId);
      }
    });
  }

  /**
   * Trigger a scheduled prompt execution
   */
  private triggerScheduledPrompt(promptId: string): void {
    // Emit event for prompt execution
    window.dispatchEvent(new CustomEvent('scheduled-prompt-trigger', {
      detail: { promptId }
    }));
    
    // Update last run and calculate next run
    const schedule = this.activeSchedulesSignal().get(promptId);
    if (schedule) {
      const now = new Date();
      const nextRun = this.calculateNextRun(schedule.cronExpression, now);
      
      this.updateSchedule(promptId, {
        ...schedule,
        lastRun: now,
        nextRun
      });
    }
  }

  /**
   * Register a prompt schedule
   */
  registerSchedule(promptId: string, schedule: PromptSchedule): void {
    if (!schedule.nextRun && schedule.enabled) {
      schedule.nextRun = this.calculateNextRun(schedule.cronExpression);
    }
    
    this.activeSchedulesSignal.update(schedules => {
      const newSchedules = new Map(schedules);
      newSchedules.set(promptId, schedule);
      return newSchedules;
    });
  }

  /**
   * Unregister a prompt schedule
   */
  unregisterSchedule(promptId: string): void {
    this.activeSchedulesSignal.update(schedules => {
      const newSchedules = new Map(schedules);
      newSchedules.delete(promptId);
      return newSchedules;
    });
  }

  /**
   * Update a schedule
   */
  updateSchedule(promptId: string, schedule: PromptSchedule): void {
    this.activeSchedulesSignal.update(schedules => {
      const newSchedules = new Map(schedules);
      newSchedules.set(promptId, schedule);
      return newSchedules;
    });
  }

  /**
   * Parse cron expression and calculate next run time
   * Simplified cron parser supporting: minute hour day month dayOfWeek
   * Example: "0 9 * * 1-5" = Every weekday at 9:00 AM
   */
  calculateNextRun(cronExpression: string, from: Date = new Date()): Date {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression. Expected format: minute hour day month dayOfWeek');
    }

    const [minutePart, hourPart, dayPart, monthPart, dayOfWeekPart] = parts;
    
    const next = new Date(from);
    next.setSeconds(0);
    next.setMilliseconds(0);
    
    // Start from next minute
    next.setMinutes(next.getMinutes() + 1);
    
    // Find next matching time (max 366 days ahead)
    for (let i = 0; i < 366 * 24 * 60; i++) {
      if (this.matchesCron(next, minutePart, hourPart, dayPart, monthPart, dayOfWeekPart)) {
        return next;
      }
      next.setMinutes(next.getMinutes() + 1);
    }
    
    throw new Error('Could not find next run time within 366 days');
  }

  /**
   * Check if a date matches cron expression parts
   */
  private matchesCron(
    date: Date,
    minutePart: string,
    hourPart: string,
    dayPart: string,
    monthPart: string,
    dayOfWeekPart: string
  ): boolean {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1; // 1-12
    const dayOfWeek = date.getDay(); // 0-6 (Sunday = 0)
    
    return (
      this.matchesPart(minute, minutePart, 0, 59) &&
      this.matchesPart(hour, hourPart, 0, 23) &&
      this.matchesPart(day, dayPart, 1, 31) &&
      this.matchesPart(month, monthPart, 1, 12) &&
      this.matchesPart(dayOfWeek, dayOfWeekPart, 0, 6)
    );
  }

  /**
   * Check if a value matches a cron part
   * Supports: *, numbers, ranges (1-5), lists (1,3,5), steps (* /5)
   */
  private matchesPart(value: number, part: string, min: number, max: number): boolean {
    // Wildcard
    if (part === '*') return true;
    
    // Step values (*/5)
    if (part.includes('*/')) {
      const step = parseInt(part.split('/')[1], 10);
      return value % step === 0;
    }
    
    // Range (1-5)
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n, 10));
      return value >= start && value <= end;
    }
    
    // List (1,3,5)
    if (part.includes(',')) {
      const values = part.split(',').map(n => parseInt(n, 10));
      return values.includes(value);
    }
    
    // Single value
    return value === parseInt(part, 10);
  }

  /**
   * Validate cron expression
   */
  validateCronExpression(expression: string): { valid: boolean; error?: string } {
    try {
      const parts = expression.trim().split(/\s+/);
      
      if (parts.length !== 5) {
        return { valid: false, error: 'Expected 5 parts: minute hour day month dayOfWeek' };
      }
      
      const [minute, hour, day, month, dayOfWeek] = parts;
      
      // Validate ranges
      if (!this.validatePart(minute, 0, 59)) {
        return { valid: false, error: 'Invalid minute (0-59)' };
      }
      if (!this.validatePart(hour, 0, 23)) {
        return { valid: false, error: 'Invalid hour (0-23)' };
      }
      if (!this.validatePart(day, 1, 31)) {
        return { valid: false, error: 'Invalid day (1-31)' };
      }
      if (!this.validatePart(month, 1, 12)) {
        return { valid: false, error: 'Invalid month (1-12)' };
      }
      if (!this.validatePart(dayOfWeek, 0, 6)) {
        return { valid: false, error: 'Invalid day of week (0-6, Sunday=0)' };
      }
      
      // Try to calculate next run
      this.calculateNextRun(expression);
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }

  /**
   * Validate a single cron part
   */
  private validatePart(part: string, min: number, max: number): boolean {
    if (part === '*') return true;
    
    if (part.includes('*/')) {
      const step = parseInt(part.split('/')[1], 10);
      return !isNaN(step) && step > 0 && step <= max;
    }
    
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n, 10));
      return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end;
    }
    
    if (part.includes(',')) {
      const values = part.split(',').map(n => parseInt(n, 10));
      return values.every(v => !isNaN(v) && v >= min && v <= max);
    }
    
    const value = parseInt(part, 10);
    return !isNaN(value) && value >= min && value <= max;
  }

  /**
   * Get human-readable description of cron expression
   */
  describeCronExpression(expression: string): string {
    try {
      const parts = expression.trim().split(/\s+/);
      if (parts.length !== 5) return 'Invalid expression';
      
      const [minute, hour, day, month, dayOfWeek] = parts;
      
      // Common patterns
      if (expression === '0 9 * * 1-5') return 'Every weekday at 9:00 AM';
      if (expression === '0 0 * * *') return 'Every day at midnight';
      if (expression === '0 12 * * *') return 'Every day at noon';
      if (expression === '0 0 * * 0') return 'Every Sunday at midnight';
      if (expression === '0 0 1 * *') return 'First day of every month at midnight';
      if (expression === '*/15 * * * *') return 'Every 15 minutes';
      if (expression === '0 */2 * * *') return 'Every 2 hours';
      
      // Build description
      let desc = 'At ';
      
      // Minute
      if (minute === '*') {
        desc += 'every minute';
      } else if (minute.includes('*/')) {
        desc += `every ${minute.split('/')[1]} minutes`;
      } else {
        desc += `minute ${minute}`;
      }
      
      // Hour
      if (hour !== '*') {
        if (hour.includes('*/')) {
          desc += ` of every ${hour.split('/')[1]} hours`;
        } else {
          desc += ` past hour ${hour}`;
        }
      }
      
      // Day
      if (day !== '*') {
        desc += `, on day ${day}`;
      }
      
      // Month
      if (month !== '*') {
        const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        desc += ` in ${monthNames[parseInt(month, 10)]}`;
      }
      
      // Day of week
      if (dayOfWeek !== '*') {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        if (dayOfWeek.includes('-')) {
          const [start, end] = dayOfWeek.split('-').map(n => parseInt(n, 10));
          desc += `, ${dayNames[start]}-${dayNames[end]}`;
        } else if (dayOfWeek.includes(',')) {
          const days = dayOfWeek.split(',').map(n => dayNames[parseInt(n, 10)]);
          desc += `, ${days.join(', ')}`;
        } else {
          desc += `, on ${dayNames[parseInt(dayOfWeek, 10)]}`;
        }
      }
      
      return desc;
    } catch {
      return 'Invalid expression';
    }
  }

  /**
   * Get time until next run
   */
  getTimeUntilNextRun(nextRun: Date): string {
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }

  /**
   * Common cron presets
   */
  getCronPresets(): Array<{ label: string; expression: string; description: string }> {
    return [
      { label: 'Every 15 minutes', expression: '*/15 * * * *', description: 'Runs 4 times per hour' },
      { label: 'Every hour', expression: '0 * * * *', description: 'Runs at the start of every hour' },
      { label: 'Every day at 9 AM', expression: '0 9 * * *', description: 'Runs once daily at 9:00 AM' },
      { label: 'Every weekday at 9 AM', expression: '0 9 * * 1-5', description: 'Monday through Friday at 9:00 AM' },
      { label: 'Every Monday at 9 AM', expression: '0 9 * * 1', description: 'Once per week on Monday' },
      { label: 'First of month at midnight', expression: '0 0 1 * *', description: 'Once per month' },
      { label: 'Every Sunday at noon', expression: '0 12 * * 0', description: 'Weekly on Sunday' }
    ];
  }
}

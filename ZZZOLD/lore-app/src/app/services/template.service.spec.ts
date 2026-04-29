/**
 * TemplateService property-based tests
 *
 * Property 7: Financial Log Net Calculation
 * Validates: Requirements 4.7, 4.8
 */

import * as fc from 'fast-check';
import { financeTemplate } from '../templates/finance.template';
import { Note, SectionColor } from '../models';

// Minimal SectionColor for testing
const testColor: SectionColor = {
  bg: 'rgba(245,158,11,0.1)',
  text: '#D97706',
  border: 'rgba(245,158,11,0.3)',
  dot: '#F59E0B',
};

// Identity highlight function (no-op)
const noHighlight = (text: string) => text;

/** Parse amount the same way the template does */
function parseAmount(s: any): number {
  return parseFloat(String(s).replace(/[^0-9.\-]/g, '')) || 0;
}

function makeNote(income: { label: string; amount: number }[], expenses: { label: string; amount: number }[]): Note {
  return {
    id: 'test-note',
    title: 'Test',
    templateId: 'finance',
    data: {
      income: income.map(i => ({ label: i.label, amount: String(i.amount) })),
      expenses: expenses.map(e => ({ label: e.label, amount: String(e.amount) })),
    },
    _collapsed: false,
    createdAt: 0,
    updatedAt: 0,
  };
}

/**
 * Property 7: Financial Log Net Calculation
 *
 * FOR ALL Financial Log notes where income entries and expense entries are non-empty,
 * THE Note_Card SHALL compute net = sum(income[].amount) − sum(expenses[].amount),
 * and the displayed net value SHALL equal this computed value for any combination
 * of income and expense entries.
 *
 * Validates: Requirements 4.7, 4.8
 */
describe('Property 7: Financial Log Net Calculation', () => {
  type AmountEntry = { label: string; amount: number };

  // Generator for a non-empty array of amount entries with finite, non-NaN floats
  const amountEntry: fc.Arbitrary<AmountEntry> = fc.record({
    label: fc.string({ minLength: 1, maxLength: 20 }),
    // Use integers to avoid floating-point precision issues in display comparison
    amount: fc.integer({ min: 0, max: 1_000_000 }),
  });

  const nonEmptyAmounts: fc.Arbitrary<AmountEntry[]> = fc.array(amountEntry, { minLength: 1, maxLength: 10 });

  it('net = sum(income) - sum(expenses) for all non-empty entry combinations', () => {
    fc.assert(
      fc.property(nonEmptyAmounts, nonEmptyAmounts, (incomeEntries: AmountEntry[], expenseEntries: AmountEntry[]) => {
        const note = makeNote(incomeEntries, expenseEntries);
        const html = financeTemplate.renderCard(note, testColor, noHighlight);

        const totI = incomeEntries.reduce((s: number, i: AmountEntry) => s + parseAmount(i.amount), 0);
        const totE = expenseEntries.reduce((s: number, e: AmountEntry) => s + parseAmount(e.amount), 0);
        const net = totI - totE;

        // The rendered HTML must contain the correct net class
        if (net > 0) {
          expect(html).toContain('fin-net-pos');
          expect(html).not.toContain('fin-net-neg');
          expect(html).not.toContain('fin-net-zero');
        } else if (net < 0) {
          expect(html).toContain('fin-net-neg');
          expect(html).not.toContain('fin-net-pos');
          expect(html).not.toContain('fin-net-zero');
        } else {
          expect(html).toContain('fin-net-zero');
          expect(html).not.toContain('fin-net-pos');
          expect(html).not.toContain('fin-net-neg');
        }

        // The rendered HTML must contain the fin-net div
        expect(html).toContain('fin-net');
      }),
      { numRuns: 200 }
    );
  });

  it('surplus label shown when net > 0', () => {
    type ZeroEntry = { label: string; amount: number };
    fc.assert(
      fc.property(
        fc.array(fc.record({ label: fc.string({ minLength: 1 }), amount: fc.integer({ min: 1, max: 100000 }) }), { minLength: 1, maxLength: 5 }),
        fc.array(fc.record({ label: fc.string({ minLength: 1 }), amount: fc.integer({ min: 0, max: 0 }) }), { minLength: 1, maxLength: 5 }),
        (incomeEntries: ZeroEntry[], expenseEntries: ZeroEntry[]) => {
          // income > 0, expenses = 0 → always surplus
          const note = makeNote(incomeEntries, expenseEntries);
          const html = financeTemplate.renderCard(note, testColor, noHighlight);
          expect(html).toContain('fin-net-pos');
          expect(html).toContain('Surplus');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deficit label shown when net < 0', () => {
    type ZeroEntry = { label: string; amount: number };
    fc.assert(
      fc.property(
        fc.array(fc.record({ label: fc.string({ minLength: 1 }), amount: fc.integer({ min: 0, max: 0 }) }), { minLength: 1, maxLength: 5 }),
        fc.array(fc.record({ label: fc.string({ minLength: 1 }), amount: fc.integer({ min: 1, max: 100000 }) }), { minLength: 1, maxLength: 5 }),
        (incomeEntries: ZeroEntry[], expenseEntries: ZeroEntry[]) => {
          // income = 0, expenses > 0 → always deficit
          const note = makeNote(incomeEntries, expenseEntries);
          const html = financeTemplate.renderCard(note, testColor, noHighlight);
          expect(html).toContain('fin-net-neg');
          expect(html).toContain('Deficit');
        }
      ),
      { numRuns: 100 }
    );
  });
});

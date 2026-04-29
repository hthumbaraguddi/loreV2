/**
 * Property-Based Test: Unique ID Generation
 *
 * Property 10: Unique ID Generation (Invariant)
 * FOR ALL calls to the uid() function across a session, the DataService SHALL
 * produce values that are unique within the current session's entity collections.
 *
 * Validates: Requirements 2.2, 2.3, 2.4
 */

/**
 * Standalone uid() function — mirrors the implementation that will live in DataService.
 * Combines a base-36 timestamp with a random base-36 suffix for collision resistance.
 */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

describe('uid() — Property 10: Unique ID Generation', () => {

  const SAMPLE_SIZE = 1000;

  it('should produce non-empty strings', () => {
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const id = uid();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it(`should produce ${SAMPLE_SIZE} unique values (no collisions)`, () => {
    const ids: string[] = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      ids.push(uid());
    }
    const unique = new Set(ids);
    expect(unique.size).toBe(SAMPLE_SIZE);
  });

  it('should produce IDs that contain only alphanumeric characters', () => {
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const id = uid();
      expect(id).toMatch(/^[a-z0-9]+$/);
    }
  });

});

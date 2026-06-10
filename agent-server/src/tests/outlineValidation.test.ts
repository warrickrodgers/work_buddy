import { validateOutlinePayload } from '../llm/outlineValidation';

const validPhase = {
  order_index: 0,
  title: 'Foundation',
  purpose: 'Establish the why',
  checklist_items: [{ order_index: 0, description: 'Define goals' }],
  habits: [],
  check_in_prompts: [],
};

const validOutline = {
  title: 'Test Outline',
  why: 'Because purpose matters',
  phases: [validPhase],
};

describe('validateOutlinePayload', () => {
  test('accepts a valid outline', () => {
    const result = validateOutlinePayload(validOutline);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects null outline', () => {
    const result = validateOutlinePayload(null);
    expect(result.valid).toBe(false);
  });

  test('rejects empty phases array', () => {
    const result = validateOutlinePayload({ ...validOutline, phases: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('phases'))).toBe(true);
  });

  test('rejects outline with more than 10 phases', () => {
    const phases = Array.from({ length: 11 }, (_, i) => ({ ...validPhase, order_index: i }));
    const result = validateOutlinePayload({ ...validOutline, phases });
    expect(result.valid).toBe(false);
  });

  test('rejects phase with zero items', () => {
    const emptyPhase = { ...validPhase, checklist_items: [], habits: [], check_in_prompts: [] };
    const result = validateOutlinePayload({ ...validOutline, phases: [emptyPhase] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('no items'))).toBe(true);
  });

  test('rejects phase with more than 15 items', () => {
    const items = Array.from({ length: 16 }, (_, i) => ({ order_index: i, description: `Item ${i}` }));
    const phase = { ...validPhase, checklist_items: items };
    const result = validateOutlinePayload({ ...validOutline, phases: [phase] });
    expect(result.valid).toBe(false);
  });

  test('rejects invalid habit cadence', () => {
    const badHabit = { order_index: 0, description: 'Daily walk', cadence: 'MONTHLY' };
    const phase = { ...validPhase, checklist_items: [], habits: [badHabit] };
    const result = validateOutlinePayload({ ...validOutline, phases: [phase] });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('cadence'))).toBe(true);
  });

  test('rejects missing why', () => {
    const result = validateOutlinePayload({ ...validOutline, why: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('why'))).toBe(true);
  });

  test('rejects missing phase purpose', () => {
    const phase = { ...validPhase, purpose: '   ' };
    const result = validateOutlinePayload({ ...validOutline, phases: [phase] });
    expect(result.valid).toBe(false);
  });

  test('accepts DAILY and WEEKLY cadences', () => {
    const phases = [
      { ...validPhase, checklist_items: [], habits: [{ order_index: 0, description: 'Walk', cadence: 'DAILY' }] },
      { ...validPhase, order_index: 1, checklist_items: [], habits: [{ order_index: 0, description: 'Review', cadence: 'WEEKLY' }] },
    ];
    const result = validateOutlinePayload({ ...validOutline, phases });
    expect(result.valid).toBe(true);
  });
});

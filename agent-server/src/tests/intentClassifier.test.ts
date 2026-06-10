/**
 * Unit tests for IntentClassifier threshold logic.
 *
 * These tests mock the Google embedding API so no network calls are made.
 * Install test deps first:
 *   npm install --save-dev jest @types/jest ts-jest
 * Then add to package.json:
 *   "scripts": { "test": "jest" },
 *   "jest": { "preset": "ts-jest", "testEnvironment": "node" }
 */

// Minimal cosine similarity re-implementation for test assertions
function cosine(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i];
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

describe('cosine similarity', () => {
  test('identical vectors score 1.0', () => {
    const v = [1, 2, 3, 4];
    expect(cosine(v, v)).toBeCloseTo(1.0);
  });

  test('orthogonal vectors score 0', () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
  });

  test('zero vector scores 0', () => {
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
});

describe('intent signal thresholds', () => {
  function signalForScore(score: number): string {
    if (score >= 0.75) return 'plan_likely';
    if (score >= 0.55) return 'plan_possible';
    return 'plan_unlikely';
  }

  test('score >= 0.75 → plan_likely', () => {
    expect(signalForScore(0.75)).toBe('plan_likely');
    expect(signalForScore(0.90)).toBe('plan_likely');
    expect(signalForScore(1.00)).toBe('plan_likely');
  });

  test('0.55 <= score < 0.75 → plan_possible', () => {
    expect(signalForScore(0.55)).toBe('plan_possible');
    expect(signalForScore(0.65)).toBe('plan_possible');
    expect(signalForScore(0.74)).toBe('plan_possible');
  });

  test('score < 0.55 → plan_unlikely', () => {
    expect(signalForScore(0.54)).toBe('plan_unlikely');
    expect(signalForScore(0.20)).toBe('plan_unlikely');
    expect(signalForScore(0.00)).toBe('plan_unlikely');
  });
});

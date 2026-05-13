// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../firestore.js', () => ({
  default: {
    collection: () => ({ add: vi.fn().mockResolvedValue({}) }),
  },
}));

vi.mock('./_auth.mjs', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'user|123' }),
}));

const { default: handler } = await import('./firestore-post-handler.mjs');

function makeRequest(body) {
  return {
    json: () => Promise.resolve(body),
    headers: { get: (name) => (name === 'authorization' ? 'Bearer token' : null) },
  };
}

describe('firestore-post-handler input validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects empty rows array', async () => {
    const res = await handler(makeRequest({ rows: [] }));
    expect(res.status).toBe(400);
  });

  it('rejects row with empty idiom field', async () => {
    const res = await handler(makeRequest({
      rows: [{ idiom: '', translation: 'trans', definition: 'def' }],
    }));
    expect(res.status).toBe(400);
  });

  it('rejects too many rows (>20)', async () => {
    const rows = Array.from({ length: 21 }, (_, i) => ({
      idiom: `idiom${i}`, translation: 'trans', definition: 'def',
    }));
    const res = await handler(makeRequest({ rows }));
    expect(res.status).toBe(400);
  });

  it('accepts valid single row', async () => {
    const res = await handler(makeRequest({
      rows: [{ idiom: 'тест', translation: 'test', definition: 'a test' }],
    }));
    expect(res.status).toBe(201);
  });

  it('accepts row with optional example', async () => {
    const res = await handler(makeRequest({
      rows: [{ idiom: 'тест', translation: 'test', definition: 'a test', example: 'example usage' }],
    }));
    expect(res.status).toBe(201);
  });
});

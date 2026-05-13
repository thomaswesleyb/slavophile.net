// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { verifyToken } from './_auth.mjs';

function makeReq(authHeader) {
  return { headers: { get: () => authHeader } };
}

describe('verifyToken', () => {
  it('throws when no Authorization header', async () => {
    await expect(verifyToken(makeReq(null))).rejects.toThrow('Missing Authorization header');
  });

  it('throws when Authorization header is not Bearer', async () => {
    await expect(verifyToken(makeReq('Basic abc123'))).rejects.toThrow('Missing Authorization header');
  });

  it('throws when token is malformed', async () => {
    await expect(verifyToken(makeReq('Bearer notavalidjwt'))).rejects.toThrow();
  });
});

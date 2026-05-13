import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IdiomFavoriteButton from './IdiomFavoriteButton';

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    getAccessTokenSilently: vi.fn().mockRejectedValue(new Error('Test error message')),
  }),
}));

describe('IdiomFavoriteButton', () => {
  it('renders error as p[role=alert] not script on failure', async () => {
    const user = userEvent.setup();
    render(<IdiomFavoriteButton idiomId="test-id" />);

    await user.click(screen.getByRole('button'));

    const errorEl = await screen.findByRole('alert');
    expect(errorEl.tagName).toBe('P');
    expect(errorEl).toHaveTextContent('Test error message');
  });

  it('renders with accessible aria attributes', () => {
    render(<IdiomFavoriteButton idiomId="test-id" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Add to favorites');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });
});

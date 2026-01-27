import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BottomNav } from './BottomNav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/event/test-event'),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="nav-link">
      {children}
    </a>
  ),
}));

import { usePathname } from 'next/navigation';

describe('BottomNav', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/event/test-event');
  });

  describe('tab rendering', () => {
    it('renders all 5 tabs', () => {
      render(<BottomNav eventId="test-event" />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Games')).toBeInTheDocument();
      expect(screen.getByText('Feed')).toBeInTheDocument();
      expect(screen.getByText('Board')).toBeInTheDocument();
      expect(screen.getByText('Settle')).toBeInTheDocument();
    });

    it('renders correct number of navigation links', () => {
      render(<BottomNav eventId="test-event" />);

      const links = screen.getAllByTestId('nav-link');
      expect(links).toHaveLength(5);
    });
  });

  describe('navigation links', () => {
    it('Home tab links to event base URL', () => {
      render(<BottomNav eventId="test-event" />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('href', '/event/test-event');
    });

    it('Games tab links to games', () => {
      render(<BottomNav eventId="test-event" />);

      const gamesLink = screen.getByText('Games').closest('a');
      expect(gamesLink).toHaveAttribute('href', '/event/test-event/games');
    });

    it('Feed tab links to feed', () => {
      render(<BottomNav eventId="test-event" />);

      const feedLink = screen.getByText('Feed').closest('a');
      expect(feedLink).toHaveAttribute('href', '/event/test-event/feed');
    });

    it('Board tab links to leaderboard', () => {
      render(<BottomNav eventId="test-event" />);

      const boardLink = screen.getByText('Board').closest('a');
      expect(boardLink).toHaveAttribute('href', '/event/test-event/leaderboard');
    });

    it('Settle tab links to settlement', () => {
      render(<BottomNav eventId="test-event" />);

      const settleLink = screen.getByText('Settle').closest('a');
      expect(settleLink).toHaveAttribute('href', '/event/test-event/settlement');
    });
  });

  describe('active state', () => {
    it('highlights Home tab when on event base path', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event');
      render(<BottomNav eventId="test-event" />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass('text-primary');
    });

    it('highlights Games tab when on games path', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event/games');
      render(<BottomNav eventId="test-event" />);

      const gamesLink = screen.getByText('Games').closest('a');
      expect(gamesLink).toHaveClass('text-primary');
    });

    it('highlights Feed tab when on feed path', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event/feed');
      render(<BottomNav eventId="test-event" />);

      const feedLink = screen.getByText('Feed').closest('a');
      expect(feedLink).toHaveClass('text-primary');
    });

    it('highlights Board tab when on leaderboard path', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event/leaderboard');
      render(<BottomNav eventId="test-event" />);

      const boardLink = screen.getByText('Board').closest('a');
      expect(boardLink).toHaveClass('text-primary');
    });

    it('highlights Settle tab when on settlement path', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event/settlement');
      render(<BottomNav eventId="test-event" />);

      const settleLink = screen.getByText('Settle').closest('a');
      expect(settleLink).toHaveClass('text-primary');
    });

    it('inactive tabs have muted color', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event');
      render(<BottomNav eventId="test-event" />);

      const gamesLink = screen.getByText('Games').closest('a');
      expect(gamesLink).toHaveClass('text-muted-foreground');
    });
  });

  describe('styling', () => {
    it('has fixed bottom positioning', () => {
      const { container } = render(<BottomNav eventId="test-event" />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('fixed', 'bottom-0');
    });

    it('has backdrop blur for glassmorphism', () => {
      const { container } = render(<BottomNav eventId="test-event" />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('backdrop-blur-lg');
    });

    it('has safe area padding element', () => {
      const { container } = render(<BottomNav eventId="test-event" />);

      const safeArea = container.querySelector('.h-safe-area-inset-bottom');
      expect(safeArea).toBeInTheDocument();
    });
  });

  describe('with different event IDs', () => {
    it('generates correct URLs for different event IDs', () => {
      render(<BottomNav eventId="another-event" />);

      const homeLink = screen.getByText('Home').closest('a');
      const gamesLink = screen.getByText('Games').closest('a');

      expect(homeLink).toHaveAttribute('href', '/event/another-event');
      expect(gamesLink).toHaveAttribute('href', '/event/another-event/games');
    });
  });
});

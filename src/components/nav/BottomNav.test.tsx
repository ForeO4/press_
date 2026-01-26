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
    it('renders all 4 tabs', () => {
      render(<BottomNav eventId="test-event" />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Scores')).toBeInTheDocument();
      expect(screen.getByText('Games')).toBeInTheDocument();
      expect(screen.getByText('Social')).toBeInTheDocument();
    });

    it('renders correct number of navigation links', () => {
      render(<BottomNav eventId="test-event" />);

      const links = screen.getAllByTestId('nav-link');
      expect(links).toHaveLength(4);
    });
  });

  describe('navigation links', () => {
    it('Home tab links to event base URL', () => {
      render(<BottomNav eventId="test-event" />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('href', '/event/test-event');
    });

    it('Scores tab links to scorecard', () => {
      render(<BottomNav eventId="test-event" />);

      const scoresLink = screen.getByText('Scores').closest('a');
      expect(scoresLink).toHaveAttribute('href', '/event/test-event/scorecard');
    });

    it('Games tab links to games', () => {
      render(<BottomNav eventId="test-event" />);

      const gamesLink = screen.getByText('Games').closest('a');
      expect(gamesLink).toHaveAttribute('href', '/event/test-event/games');
    });

    it('Social tab links to chat', () => {
      render(<BottomNav eventId="test-event" />);

      const socialLink = screen.getByText('Social').closest('a');
      expect(socialLink).toHaveAttribute('href', '/event/test-event/chat');
    });
  });

  describe('active state', () => {
    it('highlights Home tab when on event base path', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event');
      render(<BottomNav eventId="test-event" />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass('text-primary');
    });

    it('highlights Scores tab when on scorecard path', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event/scorecard');
      render(<BottomNav eventId="test-event" />);

      const scoresLink = screen.getByText('Scores').closest('a');
      expect(scoresLink).toHaveClass('text-primary');
    });

    it('highlights Games tab when on games path', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event/games');
      render(<BottomNav eventId="test-event" />);

      const gamesLink = screen.getByText('Games').closest('a');
      expect(gamesLink).toHaveClass('text-primary');
    });

    it('highlights Social tab when on chat path', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event/chat');
      render(<BottomNav eventId="test-event" />);

      const socialLink = screen.getByText('Social').closest('a');
      expect(socialLink).toHaveClass('text-primary');
    });

    it('inactive tabs have muted color', () => {
      vi.mocked(usePathname).mockReturnValue('/event/test-event');
      render(<BottomNav eventId="test-event" />);

      const scoresLink = screen.getByText('Scores').closest('a');
      expect(scoresLink).toHaveClass('text-muted-foreground');
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

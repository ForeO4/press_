import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MatchProgress, MatchProgressCompact, MatchProgressDots } from './MatchProgress';
import type { Game, HoleScore } from '@/types';

const mockGame: Game = {
  id: 'game-1',
  eventId: 'event-1',
  type: 'match_play',
  stakeTeethInt: 10,
  parentGameId: null,
  startHole: 1,
  endHole: 18,
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
};

const mockShortGame: Game = {
  ...mockGame,
  startHole: 10,
  endHole: 18,
};

const createScore = (holeNumber: number, strokes: number): HoleScore => ({
  id: `score-${holeNumber}`,
  roundId: 'round-1',
  holeNumber,
  strokes,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('MatchProgress', () => {
  describe('status text - not started', () => {
    it('shows "Not started" when no scores', () => {
      render(
        <MatchProgress
          game={mockGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={[]}
          playerBScores={[]}
          playerAName="John Doe"
          playerBName="Jane Smith"
        />
      );

      expect(screen.getByText('Not started')).toBeInTheDocument();
    });

    it('applies muted styling for not started', () => {
      render(
        <MatchProgress
          game={mockGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={[]}
          playerBScores={[]}
          playerAName="John Doe"
          playerBName="Jane Smith"
        />
      );

      expect(screen.getByText('Not started')).toHaveClass('text-muted-foreground');
    });
  });

  describe('status text - tied', () => {
    it('shows "All Square" when scores are even', () => {
      const playerAScores = [createScore(1, 4), createScore(2, 4)];
      const playerBScores = [createScore(1, 4), createScore(2, 4)];

      render(
        <MatchProgress
          game={mockGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={playerAScores}
          playerBScores={playerBScores}
          playerAName="John Doe"
          playerBName="Jane Smith"
        />
      );

      expect(screen.getByText('All Square thru 2')).toBeInTheDocument();
    });

    it('applies amber styling for tied', () => {
      const playerAScores = [createScore(1, 4)];
      const playerBScores = [createScore(1, 4)];

      render(
        <MatchProgress
          game={mockGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={playerAScores}
          playerBScores={playerBScores}
          playerAName="John Doe"
          playerBName="Jane Smith"
        />
      );

      expect(screen.getByText('All Square thru 1')).toHaveClass('text-amber-400');
    });
  });

  describe('status text - winning', () => {
    it('shows player A winning when they have lower score', () => {
      const playerAScores = [createScore(1, 3)]; // birdie
      const playerBScores = [createScore(1, 4)]; // par

      render(
        <MatchProgress
          game={mockGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={playerAScores}
          playerBScores={playerBScores}
          playerAName="John Doe"
          playerBName="Jane Smith"
        />
      );

      expect(screen.getByText('John 1 UP thru 1')).toBeInTheDocument();
    });

    it('applies green styling for player A winning', () => {
      const playerAScores = [createScore(1, 3)];
      const playerBScores = [createScore(1, 4)];

      render(
        <MatchProgress
          game={mockGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={playerAScores}
          playerBScores={playerBScores}
          playerAName="John Doe"
          playerBName="Jane Smith"
        />
      );

      expect(screen.getByText('John 1 UP thru 1')).toHaveClass('text-green-400');
    });
  });

  describe('status text - losing', () => {
    it('shows player B winning when they have lower score', () => {
      const playerAScores = [createScore(1, 5)]; // bogey
      const playerBScores = [createScore(1, 4)]; // par

      render(
        <MatchProgress
          game={mockGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={playerAScores}
          playerBScores={playerBScores}
          playerAName="John Doe"
          playerBName="Jane Smith"
        />
      );

      expect(screen.getByText('Jane 1 UP thru 1')).toBeInTheDocument();
    });

    it('applies red styling when player B is winning', () => {
      const playerAScores = [createScore(1, 5)];
      const playerBScores = [createScore(1, 4)];

      render(
        <MatchProgress
          game={mockGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={playerAScores}
          playerBScores={playerBScores}
          playerAName="John Doe"
          playerBName="Jane Smith"
        />
      );

      expect(screen.getByText('Jane 1 UP thru 1')).toHaveClass('text-red-400');
    });
  });

  describe('progress bar', () => {
    it('renders correct number of segments', () => {
      const { container } = render(
        <MatchProgress
          game={mockShortGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={[]}
          playerBScores={[]}
          playerAName="John Doe"
          playerBName="Jane Smith"
          showDots={true}
        />
      );

      // 9 holes (10-18)
      const segments = container.querySelectorAll('[title^="Hole"]');
      expect(segments).toHaveLength(9);
    });

    it('hides progress bar when showDots is false', () => {
      const { container } = render(
        <MatchProgress
          game={mockGame}
          playerAId="player-a"
          playerBId="player-b"
          playerAScores={[]}
          playerBScores={[]}
          playerAName="John Doe"
          playerBName="Jane Smith"
          showDots={false}
        />
      );

      const segments = container.querySelectorAll('[title^="Hole"]');
      expect(segments).toHaveLength(0);
    });
  });
});

describe('MatchProgressCompact', () => {
  it('shows "Not started" when no scores', () => {
    render(
      <MatchProgressCompact
        game={mockGame}
        playerAId="player-a"
        playerBId="player-b"
        playerAScores={[]}
        playerBScores={[]}
        playerAName="John Doe"
        playerBName="Jane Smith"
      />
    );

    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('shows abbreviated "AS" for All Square', () => {
    const playerAScores = [createScore(1, 4)];
    const playerBScores = [createScore(1, 4)];

    render(
      <MatchProgressCompact
        game={mockGame}
        playerAId="player-a"
        playerBId="player-b"
        playerAScores={playerAScores}
        playerBScores={playerBScores}
        playerAName="John Doe"
        playerBName="Jane Smith"
      />
    );

    expect(screen.getByText('AS thru 1')).toBeInTheDocument();
  });

  it('shows winner status', () => {
    const playerAScores = [createScore(1, 3), createScore(2, 3)];
    const playerBScores = [createScore(1, 4), createScore(2, 4)];

    render(
      <MatchProgressCompact
        game={mockGame}
        playerAId="player-a"
        playerBId="player-b"
        playerAScores={playerAScores}
        playerBScores={playerBScores}
        playerAName="John Doe"
        playerBName="Jane Smith"
      />
    );

    expect(screen.getByText('John 2 UP thru 2')).toBeInTheDocument();
  });
});

describe('MatchProgressDots', () => {
  it('renders hole dots for game range', () => {
    const { container } = render(
      <MatchProgressDots
        game={mockShortGame}
        playerAId="player-a"
        playerBId="player-b"
        playerAScores={[]}
        playerBScores={[]}
      />
    );

    // Should have 9 dots for holes 10-18
    const dots = container.querySelectorAll('[title^="Hole"]');
    expect(dots).toHaveLength(9);
  });

  it('displays hole numbers in dots', () => {
    render(
      <MatchProgressDots
        game={mockShortGame}
        playerAId="player-a"
        playerBId="player-b"
        playerAScores={[]}
        playerBScores={[]}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('shows correct title for each hole', () => {
    render(
      <MatchProgressDots
        game={mockShortGame}
        playerAId="player-a"
        playerBId="player-b"
        playerAScores={[]}
        playerBScores={[]}
      />
    );

    expect(screen.getByTitle('Hole 10')).toBeInTheDocument();
    expect(screen.getByTitle('Hole 18')).toBeInTheDocument();
  });
});

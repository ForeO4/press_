import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateGameModal, type CreateGameData } from './CreateGameModal';
import type { MockUser, MembershipRole } from '@/types';

const mockPlayers: MockUser[] = [
  { id: 'player-1', name: 'John Doe', email: 'john@test.com', role: 'PLAYER' as MembershipRole },
  { id: 'player-2', name: 'Jane Smith', email: 'jane@test.com', role: 'PLAYER' as MembershipRole },
  { id: 'player-3', name: 'Bob Wilson', email: 'bob@test.com', role: 'PLAYER' as MembershipRole },
];

describe('CreateGameModal', () => {
  const defaultProps = {
    eventId: 'test-event',
    players: mockPlayers,
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders all form fields', () => {
    it('renders the modal title', () => {
      render(<CreateGameModal {...defaultProps} />);
      expect(screen.getByRole('heading', { name: 'Create Game' })).toBeInTheDocument();
    });

    it('renders game type radio buttons', () => {
      render(<CreateGameModal {...defaultProps} />);
      expect(screen.getByText('Match Play')).toBeInTheDocument();
      expect(screen.getByText('Nassau')).toBeInTheDocument();
      expect(screen.getByText('Skins')).toBeInTheDocument();
    });

    it('renders stake input with alligator icon', () => {
      render(<CreateGameModal {...defaultProps} />);
      expect(screen.getByLabelText('Stake')).toBeInTheDocument();
      // AlligatorIcon is rendered as an SVG
      const stakeSection = screen.getByLabelText('Stake').parentElement;
      expect(stakeSection?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders player selection dropdowns', () => {
      render(<CreateGameModal {...defaultProps} />);
      expect(screen.getByLabelText('Player 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Player 2')).toBeInTheDocument();
    });

    it('renders hole preset buttons', () => {
      render(<CreateGameModal {...defaultProps} />);
      expect(screen.getByText('Front 9')).toBeInTheDocument();
      expect(screen.getByText('Back 9')).toBeInTheDocument();
      expect(screen.getByText('Full 18')).toBeInTheDocument();
    });

    it('renders hole range inputs', () => {
      render(<CreateGameModal {...defaultProps} />);
      expect(screen.getByLabelText('Start')).toBeInTheDocument();
      expect(screen.getByLabelText('End')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<CreateGameModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Game' })).toBeInTheDocument();
    });
  });

  describe('game type selection', () => {
    it('defaults to Match Play selected', () => {
      render(<CreateGameModal {...defaultProps} />);
      // Match Play should show Net/Gross toggle (indicating it's selected)
      const netButton = screen.getByText('Net');
      expect(netButton).toBeInTheDocument();
    });

    it('only allows one game type to be selected (radio behavior)', () => {
      render(<CreateGameModal {...defaultProps} />);
      // Click on Nassau row to select it
      const nassauLabel = screen.getByText('Nassau');
      fireEvent.click(nassauLabel.closest('div[class*="cursor-pointer"]')!);
      // There should only be one Net button (for the selected type)
      const netButtons = screen.queryAllByText('Net');
      expect(netButtons.length).toBe(1);
    });

    it('can toggle scoring basis between net and gross', () => {
      render(<CreateGameModal {...defaultProps} />);
      const netButton = screen.getByText('Net');
      fireEvent.click(netButton);
      // Should now show Gross
      expect(screen.getByText('Gross')).toBeInTheDocument();
    });

    it('changes selected type when clicking another option', () => {
      const onSubmit = vi.fn();
      render(<CreateGameModal {...defaultProps} onSubmit={onSubmit} />);
      // Click on Skins row to select it
      const skinsLabel = screen.getByText('Skins');
      fireEvent.click(skinsLabel.closest('div[class*="cursor-pointer"]')!);
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: 'Create Game' }));
      // Should have skins as the type
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'skins' })
      );
    });
  });

  describe('stake validation', () => {
    it('accepts zero stake', () => {
      const onSubmit = vi.fn();
      render(<CreateGameModal {...defaultProps} onSubmit={onSubmit} />);
      const stakeInput = screen.getByLabelText('Stake');
      fireEvent.change(stakeInput, { target: { value: '0' } });
      fireEvent.click(screen.getByRole('button', { name: 'Create Game' }));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ stake: 0 })
      );
    });

    it('allows deleting all digits', () => {
      render(<CreateGameModal {...defaultProps} />);
      const stakeInput = screen.getByLabelText('Stake') as HTMLInputElement;
      // Clear the input
      fireEvent.change(stakeInput, { target: { value: '' } });
      expect(stakeInput.value).toBe('');
    });

    it('only accepts numeric input', () => {
      render(<CreateGameModal {...defaultProps} />);
      const stakeInput = screen.getByLabelText('Stake') as HTMLInputElement;
      // Try entering non-numeric
      fireEvent.change(stakeInput, { target: { value: 'abc' } });
      // Should keep old value since abc is invalid
      expect(stakeInput.value).toBe('10');
    });
  });

  describe('player validation', () => {
    it('prevents selecting same player via filtering', () => {
      render(<CreateGameModal {...defaultProps} />);
      const playerASelect = screen.getByLabelText('Player 1');
      const playerBSelect = screen.getByLabelText('Player 2') as HTMLSelectElement;

      // Select player 1 in the first dropdown
      fireEvent.change(playerASelect, { target: { value: 'player-1' } });

      // The second dropdown should not contain player-1 as an option
      const options = Array.from(playerBSelect.options).map((opt) => opt.value);
      expect(options).not.toContain('player-1');
    });

    it('requires both players to be selected', () => {
      render(<CreateGameModal {...defaultProps} />);
      const playerASelect = screen.getByLabelText('Player 1');
      const playerBSelect = screen.getByLabelText('Player 2');

      fireEvent.change(playerASelect, { target: { value: '' } });
      fireEvent.change(playerBSelect, { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: 'Create Game' }));

      expect(screen.getByText('Please select both players')).toBeInTheDocument();
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('filters selected player from other dropdown', () => {
      render(<CreateGameModal {...defaultProps} />);
      const playerASelect = screen.getByLabelText('Player 1');
      const playerBSelect = screen.getByLabelText('Player 2') as HTMLSelectElement;

      // Select player 1 in the first dropdown
      fireEvent.change(playerASelect, { target: { value: 'player-1' } });

      // Check that player 1 is not in the second dropdown options
      const options = Array.from(playerBSelect.options).map((opt) => opt.value);
      expect(options).not.toContain('player-1');
      expect(options).toContain('player-2');
      expect(options).toContain('player-3');
    });
  });

  describe('hole validation', () => {
    it('input min attribute prevents value below 1', () => {
      render(<CreateGameModal {...defaultProps} />);
      const startInput = screen.getByLabelText('Start') as HTMLInputElement;
      // The input has min="1" and onChange fallback to 1 for invalid values
      expect(startInput.min).toBe('1');
      expect(startInput.max).toBe('18');
    });

    it('rejects start hole greater than 18', () => {
      render(<CreateGameModal {...defaultProps} />);
      const startInput = screen.getByLabelText('Start');
      fireEvent.change(startInput, { target: { value: '19' } });
      fireEvent.click(screen.getByRole('button', { name: 'Create Game' }));
      expect(screen.getByText('Start hole must be between 1 and 18')).toBeInTheDocument();
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('rejects end hole greater than 18', () => {
      render(<CreateGameModal {...defaultProps} />);
      const endInput = screen.getByLabelText('End');
      fireEvent.change(endInput, { target: { value: '19' } });
      fireEvent.click(screen.getByRole('button', { name: 'Create Game' }));
      expect(screen.getByText('End hole must be between start hole and 18')).toBeInTheDocument();
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('rejects end hole less than start hole', () => {
      render(<CreateGameModal {...defaultProps} />);
      const startInput = screen.getByLabelText('Start');
      const endInput = screen.getByLabelText('End');
      fireEvent.change(startInput, { target: { value: '10' } });
      fireEvent.change(endInput, { target: { value: '5' } });
      fireEvent.click(screen.getByRole('button', { name: 'Create Game' }));
      expect(screen.getByText('End hole must be between start hole and 18')).toBeInTheDocument();
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('hole presets', () => {
    it('Front 9 sets holes 1-9', () => {
      render(<CreateGameModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Front 9'));
      expect((screen.getByLabelText('Start') as HTMLInputElement).value).toBe('1');
      expect((screen.getByLabelText('End') as HTMLInputElement).value).toBe('9');
    });

    it('Back 9 sets holes 10-18', () => {
      render(<CreateGameModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Back 9'));
      expect((screen.getByLabelText('Start') as HTMLInputElement).value).toBe('10');
      expect((screen.getByLabelText('End') as HTMLInputElement).value).toBe('18');
    });

    it('Full 18 sets holes 1-18', () => {
      render(<CreateGameModal {...defaultProps} />);
      // First change to different values
      fireEvent.click(screen.getByText('Back 9'));
      // Then click Full 18
      fireEvent.click(screen.getByText('Full 18'));
      expect((screen.getByLabelText('Start') as HTMLInputElement).value).toBe('1');
      expect((screen.getByLabelText('End') as HTMLInputElement).value).toBe('18');
    });
  });

  describe('submit callback', () => {
    it('calls onSubmit with correct data on valid form', () => {
      const onSubmit = vi.fn();
      render(<CreateGameModal {...defaultProps} onSubmit={onSubmit} />);

      // Fill in form - select Nassau (Match Play is the default)
      const nassauLabel = screen.getByText('Nassau');
      fireEvent.click(nassauLabel.closest('div[class*="cursor-pointer"]')!);
      fireEvent.change(screen.getByLabelText('Stake'), { target: { value: '20' } });
      fireEvent.change(screen.getByLabelText('Player 1'), { target: { value: 'player-1' } });
      fireEvent.change(screen.getByLabelText('Player 2'), { target: { value: 'player-2' } });
      fireEvent.click(screen.getByText('Front 9'));

      fireEvent.click(screen.getByRole('button', { name: 'Create Game' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'nassau', // Selected type
          stake: 20,
          playerAId: 'player-1',
          playerBId: 'player-2',
          startHole: 1,
          endHole: 9,
          scoringBasis: 'net',
        })
      );
    });

    it('calls onSubmit with default values', () => {
      const onSubmit = vi.fn();
      render(<CreateGameModal {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole('button', { name: 'Create Game' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'match_play',
          stake: 10,
          playerAId: 'player-1',
          playerBId: 'player-2',
          startHole: 1,
          endHole: 18,
          scoringBasis: 'net',
        })
      );
    });
  });

  describe('cancel closes modal', () => {
    it('calls onClose when Cancel button is clicked', () => {
      const onClose = vi.fn();
      render(<CreateGameModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<CreateGameModal {...defaultProps} onClose={onClose} />);

      // Click the backdrop (the outer div with the fixed class)
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalled();
    });

    it('does not call onClose when modal card is clicked', () => {
      const onClose = vi.fn();
      render(<CreateGameModal {...defaultProps} onClose={onClose} />);

      // Click on the modal title (inside the card)
      fireEvent.click(screen.getByRole('heading', { name: 'Create Game' }));

      // The backdrop click handler shouldn't fire when clicking inside the modal
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('player avatars', () => {
    it('shows avatar for selected player 1', () => {
      render(<CreateGameModal {...defaultProps} />);
      // Default selects player 1, so we should see JD initials
      const avatars = document.querySelectorAll('[title="John Doe"]');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('shows avatar for selected player 2', () => {
      render(<CreateGameModal {...defaultProps} />);
      // Default selects player 2, so we should see JS initials
      const avatars = document.querySelectorAll('[title="Jane Smith"]');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('add player functionality', () => {
    it('shows add player button for each player selection', () => {
      render(<CreateGameModal {...defaultProps} />);
      // There should be two + buttons (one for each player)
      const addButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('svg.lucide-plus')
      );
      expect(addButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('shows add player form when + button is clicked', () => {
      render(<CreateGameModal {...defaultProps} />);
      const addButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('svg.lucide-plus')
      );
      fireEvent.click(addButtons[0]);
      // AddPlayerModal uses "Full name" placeholder
      expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument();
    });
  });
});

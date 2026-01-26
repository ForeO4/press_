import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlayerAvatar, PlayerAvatarGroup } from './PlayerAvatar';

describe('PlayerAvatar', () => {
  describe('initials extraction', () => {
    it('extracts initials from single name', () => {
      render(<PlayerAvatar name="John" />);
      expect(screen.getByTitle('John')).toHaveTextContent('J');
    });

    it('extracts initials from two-word name', () => {
      render(<PlayerAvatar name="John Doe" />);
      expect(screen.getByTitle('John Doe')).toHaveTextContent('JD');
    });

    it('limits initials to 2 characters for long names', () => {
      render(<PlayerAvatar name="John Michael Doe" />);
      expect(screen.getByTitle('John Michael Doe')).toHaveTextContent('JM');
    });

    it('converts initials to uppercase', () => {
      render(<PlayerAvatar name="john doe" />);
      expect(screen.getByTitle('john doe')).toHaveTextContent('JD');
    });
  });

  describe('size variants', () => {
    it('applies small size classes', () => {
      render(<PlayerAvatar name="John" size="sm" />);
      const avatar = screen.getByTitle('John');
      expect(avatar).toHaveClass('h-6', 'w-6', 'text-[10px]');
    });

    it('applies medium size classes (default)', () => {
      render(<PlayerAvatar name="John" />);
      const avatar = screen.getByTitle('John');
      expect(avatar).toHaveClass('h-8', 'w-8', 'text-xs');
    });

    it('applies large size classes', () => {
      render(<PlayerAvatar name="John" size="lg" />);
      const avatar = screen.getByTitle('John');
      expect(avatar).toHaveClass('h-10', 'w-10', 'text-sm');
    });
  });

  describe('color variants', () => {
    it('applies primary color (default)', () => {
      render(<PlayerAvatar name="John" />);
      const avatar = screen.getByTitle('John');
      expect(avatar).toHaveClass('bg-primary/20', 'text-primary', 'border-primary/30');
    });

    it('applies secondary color', () => {
      render(<PlayerAvatar name="John" color="secondary" />);
      const avatar = screen.getByTitle('John');
      expect(avatar).toHaveClass('bg-blue-500/20', 'text-blue-400', 'border-blue-500/30');
    });

    it('applies accent color', () => {
      render(<PlayerAvatar name="John" color="accent" />);
      const avatar = screen.getByTitle('John');
      expect(avatar).toHaveClass('bg-amber-500/20', 'text-amber-400', 'border-amber-500/30');
    });

    it('applies muted color', () => {
      render(<PlayerAvatar name="John" color="muted" />);
      const avatar = screen.getByTitle('John');
      expect(avatar).toHaveClass('bg-muted/20', 'text-muted-foreground', 'border-muted/30');
    });
  });

  describe('custom className', () => {
    it('applies additional className', () => {
      render(<PlayerAvatar name="John" className="custom-class" />);
      const avatar = screen.getByTitle('John');
      expect(avatar).toHaveClass('custom-class');
    });
  });
});

describe('PlayerAvatarGroup', () => {
  it('renders all names when under max', () => {
    const names = ['John', 'Jane'];
    render(<PlayerAvatarGroup names={names} />);

    expect(screen.getByTitle('John')).toBeInTheDocument();
    expect(screen.getByTitle('Jane')).toBeInTheDocument();
  });

  it('renders max avatars with overflow indicator', () => {
    const names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana'];
    render(<PlayerAvatarGroup names={names} max={4} />);

    expect(screen.getByTitle('John')).toBeInTheDocument();
    expect(screen.getByTitle('Jane')).toBeInTheDocument();
    expect(screen.getByTitle('Bob')).toBeInTheDocument();
    expect(screen.getByTitle('Alice')).toBeInTheDocument();
    expect(screen.queryByTitle('Charlie')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Diana')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('cycles through colors for avatars', () => {
    const names = ['John', 'Jane', 'Bob', 'Alice'];
    render(<PlayerAvatarGroup names={names} />);

    const john = screen.getByTitle('John');
    const jane = screen.getByTitle('Jane');
    const bob = screen.getByTitle('Bob');
    const alice = screen.getByTitle('Alice');

    expect(john).toHaveClass('text-primary');
    expect(jane).toHaveClass('text-blue-400');
    expect(bob).toHaveClass('text-amber-400');
    expect(alice).toHaveClass('text-muted-foreground');
  });

  it('respects size prop', () => {
    render(<PlayerAvatarGroup names={['John', 'Jane']} size="lg" />);

    expect(screen.getByTitle('John')).toHaveClass('h-10', 'w-10');
    expect(screen.getByTitle('Jane')).toHaveClass('h-10', 'w-10');
  });

  it('does not show overflow when exactly at max', () => {
    const names = ['John', 'Jane', 'Bob', 'Alice'];
    render(<PlayerAvatarGroup names={names} max={4} />);

    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
  });
});

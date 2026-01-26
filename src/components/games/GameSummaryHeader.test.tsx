import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameSummaryHeader } from './GameSummaryHeader';

describe('GameSummaryHeader', () => {
  describe('counts display', () => {
    it('displays active count correctly', () => {
      render(
        <GameSummaryHeader activeCount={3} completedCount={2} totalTeeth={50} />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays completed count correctly', () => {
      render(
        <GameSummaryHeader activeCount={3} completedCount={2} totalTeeth={50} />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('displays zero counts', () => {
      render(
        <GameSummaryHeader activeCount={0} completedCount={0} totalTeeth={0} />
      );

      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(3); // active, completed, teeth
    });

    it('displays large counts', () => {
      render(
        <GameSummaryHeader activeCount={99} completedCount={50} totalTeeth={1000} />
      );

      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });
  });

  describe('teeth total display', () => {
    it('displays total teeth with label', () => {
      render(
        <GameSummaryHeader activeCount={1} completedCount={1} totalTeeth={100} />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('At Stake')).toBeInTheDocument();
    });

    it('displays teeth value correctly', () => {
      const { container } = render(
        <GameSummaryHeader activeCount={1} completedCount={1} totalTeeth={50} />
      );

      // Check that the teeth value is present in the document
      expect(container.textContent).toContain('50');
      expect(container.textContent).toContain('At Stake');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <GameSummaryHeader
          activeCount={1}
          completedCount={1}
          totalTeeth={50}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has correct base styling classes', () => {
      const { container } = render(
        <GameSummaryHeader activeCount={1} completedCount={1} totalTeeth={50} />
      );

      expect(container.firstChild).toHaveClass(
        'relative',
        'overflow-hidden',
        'rounded-2xl',
        'border'
      );
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OutlineCard } from '@/components/OutlineCard';

// Mock useNavigate so we can assert navigation without a real router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const fixture = {
  outlineId: 42,
  challengeId: 7,
  title: 'Launch Readiness Plan',
  phaseCount: 3,
  itemCount: 11,
};

function renderCard() {
  return render(
    <MemoryRouter>
      <OutlineCard {...fixture} />
    </MemoryRouter>
  );
}

describe('OutlineCard', () => {
  it('renders the outline title', () => {
    renderCard();
    expect(screen.getByText('Launch Readiness Plan')).toBeInTheDocument();
  });

  it('renders phase count', () => {
    renderCard();
    expect(screen.getByText(/3 phases/i)).toBeInTheDocument();
  });

  it('renders item count', () => {
    renderCard();
    expect(screen.getByText(/11 items/i)).toBeInTheDocument();
  });

  it('renders singular "phase" when phaseCount is 1', () => {
    render(
      <MemoryRouter>
        <OutlineCard {...fixture} phaseCount={1} itemCount={1} />
      </MemoryRouter>
    );
    expect(screen.getByText(/1 phase/i)).toBeInTheDocument();
    expect(screen.getByText(/1 item/i)).toBeInTheDocument();
  });

  it('navigates to the outline detail page when "View Outline" is clicked', async () => {
    renderCard();
    await userEvent.click(screen.getByRole('button', { name: /view outline/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/challenges/7/outlines/42');
  });
});

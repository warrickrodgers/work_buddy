import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OutlineDetail } from '@/pages/dashboard/dashPages/Outlines/OutlineDetail';

// ── Hoist mock fns ────────────────────────────────────────────────────────────
const { mockGet, mockPatch, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  default: { get: mockGet, patch: mockPatch, post: mockPost },
}));

// ── Fixture ───────────────────────────────────────────────────────────────────

const outlineFixture = {
  id: 1, challenge_id: 3,
  title: 'Team Trust Blueprint',
  why: 'Trust is the foundation of every high-performing team.',
  status: 'ACTIVE',
  created_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  updated_at: new Date().toISOString(),
  phases: [
    {
      id: 1, outline_id: 1, order_index: 0,
      title: 'Discovery', timeframe: 'Week 1',
      purpose: 'Understand current team dynamics.',
      checklist_items: [
        { id: 1, phase_id: 1, order_index: 0, description: 'Run team survey', is_complete: false },
      ],
      habits: [], check_in_prompts: [],
    },
    {
      id: 2, outline_id: 1, order_index: 1,
      title: 'Action', timeframe: 'Weeks 2–4',
      purpose: 'Build trust through consistent behaviour.',
      checklist_items: [],
      habits: [{
        id: 1, phase_id: 2, order_index: 0,
        description: 'Weekly 1-on-1 with each team member',
        cadence: 'WEEKLY' as const, logs: [],
      }],
      check_in_prompts: [{
        id: 1, phase_id: 2, order_index: 0,
        question: 'How has the team dynamic shifted this week?',
        response: null, responded_at: null,
      }],
    },
  ],
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/challenges/3/outlines/1']}>
      <Routes>
        <Route path="/dashboard/challenges/:id/outlines/:outlineId" element={<OutlineDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OutlineDetail smoke tests', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({ data: { outline: outlineFixture } });
    mockPatch.mockResolvedValue({ data: {} });
    mockPost.mockResolvedValue({ data: {} });
  });

  it('renders the outline title and purpose', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Team Trust Blueprint')).toBeInTheDocument();
      expect(screen.getByText('Trust is the foundation of every high-performing team.')).toBeInTheDocument();
    });
  });

  it('shows Phase 1 expanded and its checklist visible by default', async () => {
    renderDetail();
    await waitFor(() => screen.getByText('Phase 1: Discovery'));
    expect(screen.getByText('Run team survey')).toBeInTheDocument();
  });

  it('Phase 2 is collapsed by default and expands on click', async () => {
    renderDetail();
    await waitFor(() => screen.getByText('Phase 2: Action'));

    expect(screen.queryByText('Weekly 1-on-1 with each team member')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Phase 2: Action/i }));

    await waitFor(() => {
      expect(screen.getByText('Weekly 1-on-1 with each team member')).toBeInTheDocument();
      expect(screen.getByText('How has the team dynamic shifted this week?')).toBeInTheDocument();
    });
  });

  it('renders the overall progress bar', async () => {
    renderDetail();
    await waitFor(() => screen.getByText('Team Trust Blueprint'));
    expect(screen.getByText('Overall progress')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });

  it('shows timeframe badge on phases that have one', async () => {
    renderDetail();
    await waitFor(() => screen.getByText('Week 1'));
  });
});

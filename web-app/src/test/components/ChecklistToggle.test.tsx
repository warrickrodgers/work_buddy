import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OutlineDetail } from '@/pages/dashboard/dashPages/Outlines/OutlineDetail';

// ── Hoist mock fns before vi.mock factory runs ────────────────────────────────
const { mockGet, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  default: { get: mockGet, patch: mockPatch },
}));

// ── Fixture (safe to define after vi.mock) ─────────────────────────────────

const checklistItem = {
  id: 1, phase_id: 10, order_index: 0,
  description: 'Define success criteria',
  is_complete: false, completed_at: null,
};

const outlineFixture = {
  id: 99, challenge_id: 7,
  title: 'Growth Plan',
  why: 'To build a high-performing team',
  status: 'ACTIVE',
  created_at: new Date(Date.now() - 86_400_000).toISOString(),
  updated_at: new Date().toISOString(),
  phases: [{
    id: 10, outline_id: 99, order_index: 0,
    title: 'Foundation', purpose: 'Establish the groundwork',
    checklist_items: [checklistItem],
    habits: [], check_in_prompts: [],
  }],
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/challenges/7/outlines/99']}>
      <Routes>
        <Route path="/dashboard/challenges/:id/outlines/:outlineId" element={<OutlineDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Checklist toggle optimistic update', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue({ data: { outline: outlineFixture } });
    mockPatch.mockResolvedValue({
      data: { item: { ...checklistItem, is_complete: true, completed_at: new Date().toISOString() } },
    });
  });

  it('item appears unchecked on load', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByText('Define success criteria')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /define success criteria/i })).toBeInTheDocument();
  });

  it('optimistically marks item complete on click and calls PATCH', async () => {
    renderDetail();
    await waitFor(() => screen.getByText('Define success criteria'));

    await userEvent.click(screen.getByRole('button', { name: /define success criteria/i }));

    const text = screen.getByText('Define success criteria');
    expect(text.className).toMatch(/line-through/);
    expect(mockPatch).toHaveBeenCalledWith('/checklist-items/1', { is_complete: true });
  });

  it('reverts if PATCH fails', async () => {
    mockPatch.mockRejectedValueOnce(new Error('Network error'));
    renderDetail();
    await waitFor(() => screen.getByText('Define success criteria'));

    await userEvent.click(screen.getByRole('button', { name: /define success criteria/i }));

    await waitFor(() => {
      const text = screen.getByText('Define success criteria');
      expect(text.className).not.toMatch(/line-through/);
    });
  });
});

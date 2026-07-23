// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IssueManagement from '@/components/board/IssueManagement';
import { CancellationWarningsPanel } from '@/app/editorial/page';
import { editorialApi } from '@/services/editorial-api';
import { mangaApi } from '@/services/manga-api';
import { CancellationRiskLevel, IssueStatus } from '@/types/editorial';

vi.mock('@/services/editorial-api', () => ({
  editorialApi: {
    getIssue: vi.fn(),
    inputReaderVote: vi.fn(),
    calculateRanking: vi.fn(),
    getAllCancellationWarnings: vi.fn(),
  },
}));

vi.mock('@/services/manga-api', () => ({
  mangaApi: {
    getSeries: vi.fn(),
  },
}));

const issue = {
  id: 'issue-1',
  issueNumber: 'ISS-001',
  title: 'Weekly Issue',
  releaseDate: '2026-07-24T00:00:00.000Z',
  status: IssueStatus.Released,
  createdAt: '2026-07-20T00:00:00.000Z',
};

const series = {
  id: 'series-1',
  studioId: 'studio-1',
  title: 'Manga One',
  status: 1,
  createdBy: 'user-1',
  createdAt: '2026-07-01T00:00:00.000Z',
};

function renderIssueManagement(
  canManage = true,
  onRefresh = vi.fn().mockResolvedValue(undefined),
  onRankingCalculated = vi.fn(),
) {
  render(
    <IssueManagement
      issues={[issue]}
      canManage={canManage}
      onCreate={vi.fn().mockResolvedValue(true)}
      onStatusChange={vi.fn().mockResolvedValue(true)}
      onRefresh={onRefresh}
      onRankingCalculated={onRankingCalculated}
    />,
  );
  return { onRefresh, onRankingCalculated };
}

describe('P1 editorial workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mangaApi.getSeries as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: true, data: [series] },
    });
    (editorialApi.inputReaderVote as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: true },
    });
    (editorialApi.calculateRanking as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: true },
    });
  });

  it('submits an integer reader vote for the selected issue and refreshes data', async () => {
    const { onRefresh } = renderIssueManagement();

    fireEvent.click(screen.getByRole('button', { name: /input votes/i }));
    await screen.findByRole('option', { name: 'Manga One' });

    fireEvent.change(screen.getByLabelText(/select series/i), { target: { value: 'series-1' } });
    fireEvent.change(screen.getByLabelText(/vote count/i), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /save vote/i }));

    await waitFor(() => {
      expect(editorialApi.inputReaderVote).toHaveBeenCalledWith('issue-1', {
        seriesId: 'series-1',
        voteCount: 12,
      });
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('rejects fractional reader votes without calling the API', async () => {
    renderIssueManagement();

    fireEvent.click(screen.getByRole('button', { name: /input votes/i }));
    await screen.findByRole('option', { name: 'Manga One' });
    fireEvent.change(screen.getByLabelText(/select series/i), { target: { value: 'series-1' } });
    fireEvent.change(screen.getByLabelText(/vote count/i), { target: { value: '1.5' } });
    fireEvent.click(screen.getByRole('button', { name: /save vote/i }));

    expect(await screen.findByText(/whole number/i)).toBeDefined();
    expect(editorialApi.inputReaderVote).not.toHaveBeenCalled();
  });

  it('hides mutation actions from read-only users', async () => {
    renderIssueManagement(false);
    expect(screen.queryByRole('button', { name: /input votes/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /calc ranking/i })).toBeNull();
  });

  it('shows a series loading error instead of only logging it', async () => {
    (mangaApi.getSeries as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
    renderIssueManagement();
    expect(await screen.findByText(/could not load manga series/i)).toBeDefined();
  });

  it('allows retrying the Manga series request after it fails', async () => {
    (mangaApi.getSeries as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ data: { success: true, data: [series] } });

    renderIssueManagement();
    expect(await screen.findByText(/could not load manga series/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /retry loading manga series/i }));

    await waitFor(() => {
      expect(mangaApi.getSeries).toHaveBeenCalledTimes(2);
      expect(screen.queryByText(/could not load manga series/i)).toBeNull();
    });
  });

  it('keeps a successful reader vote successful when the follow-up refresh reports failure', async () => {
    const onRefresh = vi.fn().mockResolvedValue(false);
    renderIssueManagement(true, onRefresh);

    fireEvent.click(screen.getByRole('button', { name: /input votes/i }));
    await screen.findByRole('option', { name: 'Manga One' });
    fireEvent.change(screen.getByLabelText(/select series/i), { target: { value: 'series-1' } });
    fireEvent.change(screen.getByLabelText(/vote count/i), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /save vote/i }));

    expect(await screen.findByText(/saved 12 reader votes/i)).toBeDefined();
    expect(await screen.findByText(/reader vote was saved, but refreshed data could not be loaded/i)).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /input reader vote/i })).toBeNull();
      expect(screen.queryByText('Failed to save reader vote. Please try again.')).toBeNull();
    });
  });

  it('calculates ranking for the row issue and refreshes data', async () => {
    const rankingItems = [{
      seriesId: 'series-1',
      voteCount: 12,
      rankPosition: 1,
      positiveRate: 100,
      trend: 'Up',
      riskLevel: 'Low',
      score: 12,
    }];
    (editorialApi.calculateRanking as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        success: true,
        data: { id: 'ranking-1', issueId: 'issue-1', items: rankingItems },
      },
    });
    const { onRefresh, onRankingCalculated } = renderIssueManagement();
    fireEvent.click(screen.getByRole('button', { name: /calc ranking/i }));

    await waitFor(() => {
      expect(editorialApi.calculateRanking).toHaveBeenCalledWith('issue-1');
      expect(onRankingCalculated).toHaveBeenCalledWith('issue-1', rankingItems);
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('keeps a successful ranking calculation successful when refresh reports failure', async () => {
    const onRefresh = vi.fn().mockResolvedValue(false);
    renderIssueManagement(true, onRefresh);

    fireEvent.click(screen.getByRole('button', { name: /calc ranking/i }));

    expect(await screen.findByText('Calculated rankings successfully!')).toBeDefined();
    expect(await screen.findByText(/rankings were calculated, but refreshed data could not be loaded/i)).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByText('Error triggering ranking calculation.')).toBeNull();
    });
  });

  it('renders cancellation warning levels and reasons from the all-warnings API', async () => {
    (editorialApi.getAllCancellationWarnings as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: 'w-1', seriesId: 'series-1', riskLevel: CancellationRiskLevel.Medium, reason: 'Down two ranks', createdAt: '2026-07-20T00:00:00Z', isResolved: false },
          { id: 'w-2', seriesId: 'series-2', riskLevel: CancellationRiskLevel.High, reason: 'Low votes', createdAt: '2026-07-21T00:00:00Z', isResolved: false },
          { id: 'w-3', seriesId: 'series-3', riskLevel: CancellationRiskLevel.Critical, reason: 'Critical decline', createdAt: '2026-07-22T00:00:00Z', isResolved: false },
        ],
      },
    });

    render(<CancellationWarningsPanel />);

    expect(await screen.findByText('Down two ranks')).toBeDefined();
    expect(screen.getByText('Low votes')).toBeDefined();
    expect(screen.getByText('Critical decline')).toBeDefined();
    expect(screen.getByText('Medium')).toBeDefined();
    expect(screen.getByText('High')).toBeDefined();
    expect(screen.getByText('Critical')).toBeDefined();
  });

  it('shows permission errors without displaying the healthy empty state', async () => {
    (editorialApi.getAllCancellationWarnings as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 403, data: { message: 'Forbidden' } },
    });

    render(<CancellationWarningsPanel />);

    expect(await screen.findByText(/do not have permission/i)).toBeDefined();
    expect(screen.queryByText(/all series are performing well/i)).toBeNull();
  });
});

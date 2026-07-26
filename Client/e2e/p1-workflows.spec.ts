import { expect, Page, test } from '@playwright/test';

const API_RESPONSE = (data: unknown, message = 'OK') => ({
  success: true,
  data,
  message,
});

async function authenticate(page: Page, roles: string[]) {
  await page.context().addCookies([
    { name: 'auth_token', value: 'e2e-access-token', url: 'http://localhost:3000' },
    { name: 'user_roles', value: JSON.stringify(roles), url: 'http://localhost:3000' },
  ]);
  await page.route('**/identity/auth/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          accessToken: 'e2e-access-token',
          refreshToken: 'e2e-refresh-token',
          user: {
            id: 'e2e-user',
            email: 'e2e@example.com',
            fullName: 'E2E User',
            roles: roles,
          }
        }
      }),
    });
  });
  await page.addInitScript(({ persistedRoles }) => {
    window.localStorage.setItem('manga-auth-storage', JSON.stringify({
      state: {
        accessToken: 'e2e-access-token',
        refreshToken: 'e2e-refresh-token',
        user: {
          id: 'e2e-user',
          email: 'e2e@example.com',
          fullName: 'E2E User',
          roles: persistedRoles,
        },
        isAuthenticated: true,
      },
      version: 0,
    }));
  }, { persistedRoles: roles });
}

test('Editorial Board inputs reader votes and calculates ranking for one issue', async ({ page }) => {
  await authenticate(page, ['EditorialBoard']);
  let votePayload: unknown;
  let rankingRequested = false;

  await page.route('**/manga/series', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(API_RESPONSE([{
      id: 'series-1',
      studioId: 'studio-1',
      title: 'Manga One',
      status: 1,
      createdBy: 'user-1',
      createdAt: '2026-07-01T00:00:00Z',
    }])),
  }));
  await page.route('**/editorial/**', async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const method = request.method();
    let data: unknown = [];

    if (pathname === '/editorial/issues') {
      data = [{
        id: 'issue-1',
        issueNumber: 'ISS-001',
        title: 'Weekly Issue',
        releaseDate: '2026-07-24T00:00:00Z',
        status: 3,
        createdAt: '2026-07-20T00:00:00Z',
      }];
    } else if (pathname.endsWith('/vote-summary')) {
      data = { approveCount: 0, rejectCount: 0, revisionCount: 0, totalVotes: 0 };
    } else if (pathname === '/editorial/issues/issue-1/reader-votes' && method === 'POST') {
      votePayload = request.postDataJSON();
      data = {};
    } else if (pathname === '/editorial/issues/issue-1/calculate-ranking' && method === 'POST') {
      rankingRequested = true;
      data = { id: 'ranking-1', issueId: 'issue-1', items: [] };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_RESPONSE(data)),
    });
  });

  await page.goto('/board');
  await page.getByRole('button', { name: 'Issue Management' }).click();
  await expect(page.getByText('ISS-001 · Weekly Issue')).toBeVisible();

  await page.getByRole('button', { name: 'Input Votes' }).click();
  await page.getByLabel('Select Series').selectOption('series-1');
  await page.getByLabel('Vote Count').fill('12');
  await page.getByRole('button', { name: 'Save Vote' }).click();
  await expect(page.getByText(/Saved 12 reader votes/)).toBeVisible();
  expect(votePayload).toEqual({ seriesId: 'series-1', voteCount: 12 });

  await page.getByRole('button', { name: 'Calc Ranking' }).click();
  await expect(page.getByText('Calculated rankings successfully!')).toBeVisible();
  expect(rankingRequested).toBe(true);
});

test('Editorial page renders cancellation warning risk and reason from Gateway data', async ({ page }) => {
  await authenticate(page, ['EditorialBoard']);

  await page.route('**/editorial/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    const data = pathname === '/editorial/issues/cancellation-warnings'
      ? [{
          id: 'warning-1',
          seriesId: 'series-critical',
          reason: 'Reader votes declined for three consecutive issues',
          riskLevel: 4,
          createdAt: '2026-07-22T00:00:00Z',
          isResolved: false,
        }]
      : [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_RESPONSE(data)),
    });
  });

  await page.goto('/editorial');
  await expect(page.getByText('Cancellation Warnings')).toBeVisible();
  await expect(page.getByText('Critical')).toBeVisible();
  await expect(page.getByText('Reader votes declined for three consecutive issues')).toBeVisible();
  await expect(page.getByText('All series are performing well!')).toHaveCount(0);
});

test('Admin System Health shows unknown services when detailed and service health are unavailable', async ({ page }) => {
  await authenticate(page, ['Admin']);

  await page.route('**/admin/monitoring/overview', route => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'overview unavailable' }),
  }));
  await page.route('**/health/live', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'Healthy' }),
  }));
  await page.route('**/health/services', route => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'services unavailable' }),
  }));

  await page.goto('/admin/system');
  await expect(page.getByText('Monitoring degraded')).toBeVisible();
  await expect(page.getByText('Service status data is unavailable. Gateway health is shown from /health/live.')).toBeVisible();
  await expect(page.getByText('0 / 5')).toBeVisible();
  await expect(page.getByText('Unknown')).toHaveCount(5);
});

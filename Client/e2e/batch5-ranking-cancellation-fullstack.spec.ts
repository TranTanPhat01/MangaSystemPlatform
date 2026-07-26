import { expect, Page, test } from '@playwright/test';
import axios from './support/axios';

const GATEWAY_URL = 'http://localhost:5200';

async function verifyBackendConnection(): Promise<boolean> {
  try {
    const res = await axios.get(`${GATEWAY_URL}/health/live`, { timeout: 2000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function loginUser(email: string, password: string) {
  const response = await axios.post(`${GATEWAY_URL}/identity/auth/login`, { email, password });
  return response.data.data;
}

async function authenticateBrowser(page: Page, authData: any) {
  const { accessToken, refreshToken, user } = authData;

  await page.context().addCookies([
    { name: 'auth_token', value: accessToken, url: 'http://localhost:3000' },
    { name: 'user_roles', value: JSON.stringify(user.roles), url: 'http://localhost:3000' },
  ]);

  await page.addInitScript(({ token, refresh, u }) => {
    window.localStorage.setItem('manga-auth-storage', JSON.stringify({
      state: {
        accessToken: token,
        refreshToken: refresh,
        user: u,
        isAuthenticated: true,
      },
      version: 0,
    }));
  }, { token: accessToken, refresh: refreshToken, u: user });
}

test.describe('Batch 5 Reader Voting, Ranking, and Cancellation Fullstack E2E Workflow', () => {
  let isBackendLive = false;
  let adminAuth: any;
  let mangakaAuth: any;
  let boardMemberAuth: any;
  let timestamp: number;
  let seriesId: string;
  let studioId: string;

  test.beforeAll(async () => {
    isBackendLive = await verifyBackendConnection();
    if (!isBackendLive) {
      console.warn('⚠️ WARNING: Local backend is NOT running.');
      return;
    }

    // Login Admin
    adminAuth = await loginUser('admin@gmail.com', 'Admin@system');
    const authHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };

    timestamp = Date.now();
    const mangakaEmail = `mangaka_e2e_b5_${timestamp}@example.com`;
    const boardEmail = `board_e2e_b5_${timestamp}@example.com`;

    // Create users dynamically
    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: mangakaEmail,
      username: `mangaka_b5_${timestamp}`,
      fullName: 'E2E Mangaka B5',
      password: 'Password@123',
      roles: ['Mangaka'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: boardEmail,
      username: `board_b5_${timestamp}`,
      fullName: 'Board Member B5',
      password: 'Password@123',
      roles: ['EditorialBoard'],
    }, { headers: authHeaders });

    mangakaAuth = await loginUser(mangakaEmail, 'Password@123');
    boardMemberAuth = await loginUser(boardEmail, 'Password@123');

    // Create Studio & Series
    const mangakaHeaders = { Authorization: `Bearer ${mangakaAuth.accessToken}` };
    const studioRes = await axios.post(`${GATEWAY_URL}/manga/studios`, {
      name: `Studio B5 ${timestamp}`,
      description: 'E2E Test Studio Description B5',
    }, { headers: mangakaHeaders });
    studioId = studioRes.data.data.id;

    const seriesRes = await axios.post(`${GATEWAY_URL}/manga/series`, {
      studioId: studioId,
      title: `Series B5 ${timestamp}`,
      description: 'E2E Series Description B5',
      genre: 'Comedy',
    }, { headers: mangakaHeaders });
    seriesId = seriesRes.data.data.id;

    // Submit & Approve proposal to transition series to Approved
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/submit-proposal`, {}, { headers: mangakaHeaders });
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/approve-proposal`, {
      decisionNote: 'Approve for B5 E2E',
    }, { headers: { Authorization: `Bearer ${boardMemberAuth.accessToken}` } });
  });

  test('Issue creation, reader vote submission, ranking calculations, warnings, hiatus, and cancellation locks', async ({ page }) => {
    if (!isBackendLive) {
      test.skip();
      return;
    }

    const currentSeriesTitle = `Series B5 ${timestamp}`;
    const issueCode = `Vol-5-${timestamp}`;

    // Step 1: Admin logs in, creates a new Issue and transitions it to Released
    await authenticateBrowser(page, adminAuth);
    await page.goto('/board?tab=Issue%20Management');
    await page.locator('text=Issue Management').first().waitFor();

    // Fill form and create
    await page.fill('input[aria-label="Issue number"]', issueCode);
    await page.fill('input[aria-label="Issue title"]', `Title-${issueCode}`);
    await page.fill('input[aria-label="Release date"]', new Date().toISOString().split('T')[0]);
    await page.click('button:has-text("Create issue")');

    // Verify Issue is created in Draft status
    await expect(page.locator(`text=${issueCode}`)).toBeVisible();
    
    // Change issue status to Released (Published)
    const selectStatus = page.getByRole('combobox', { name: `Status for ${issueCode}` });
    await selectStatus.selectOption({ label: 'Released' });
    await expect(page.locator('text=Đã cập nhật trạng thái issue.')).toBeVisible();

    // Step 2: Navigate to Rankings, select issue and submit reader vote
    await page.goto('/board?tab=Rankings');
    await page.locator('text=Reader Voting Rankings').waitFor();

    const selectIssue = page.locator('select[aria-label="Publication issue"]');
    await selectIssue.selectOption({ label: `${issueCode} — Title-${issueCode}` });
    await page.waitForTimeout(1000);

    // Select the series in reader vote form
    const selectVoteSeries = page.locator('select[aria-label="Reader vote series"]');
    await selectVoteSeries.selectOption({ label: currentSeriesTitle });
    
    // Enter vote count and save
    await page.fill('input[aria-label="Reader vote count"]', '450');
    await page.click('button:has-text("Save Vote")');
    await expect(page.locator('text=Đã ghi nhận phiếu độc giả.')).toBeVisible();

    // Calculate ranking
    await page.click('button:has-text("Calculate Ranking")');
    await expect(page.locator('text=Đã tính lại bảng xếp hạng.')).toBeVisible();

    // Verify Ranking item displays with correct vote count and position #1
    const rankingRow = page.locator(`tr:has-text("${currentSeriesTitle}")`);
    await expect(rankingRow.locator('td').nth(0)).toContainText('1');

    // Step 3: View warnings and trigger Hiatus
    await page.goto('/board?tab=Cancellation%20Review');
    await page.locator('text=Cancellation Risk Review').waitFor();

    const selectCancellationSeries = page.locator('select[aria-label="Series for cancellation review"]');
    await selectCancellationSeries.selectOption({ label: currentSeriesTitle });
    await page.waitForTimeout(1000);

    // Trigger Hiatus
    await page.click('button:has-text("Set Hiatus")');
    await page.locator('textarea#confirm-reason').fill('Hiatus requested by E2E test');
    await page.click('button:has-text("Xác nhận")');
    await expect(page.locator('text=Series đã chuyển sang hiatus.')).toBeVisible();
    await expect(page.locator('span.bg-amber-105:has-text("Hiatus")')).toBeVisible();

    // Step 4: Trigger Cancel
    await page.click('button:has-text("Cancel Series")');
    await page.locator('textarea#confirm-reason').fill('Cancellation requested by E2E test');
    await page.click('button:has-text("Xác nhận")');
    await expect(page.locator('text=Series đã được hủy.')).toBeVisible();
    await expect(page.locator('span.bg-rose-105:has-text("Cancelled")')).toBeVisible();

    // Verify buttons are now disabled (terminal state)
    const setHiatusBtn = page.locator('button:has-text("Set Hiatus")');
    const cancelBtn = page.locator('button:has-text("Cancel Series")');
    await expect(setHiatusBtn).toBeDisabled();
    await expect(cancelBtn).toBeDisabled();

    // Step 5: Verify creating new chapters is blocked for Cancelled Series
    const mangakaHeaders = { Authorization: `Bearer ${mangakaAuth.accessToken}` };
    try {
      await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/chapters`, {
        chapterNumber: 2,
        title: 'Blocked Chapter',
        progressPercentage: 100,
        deadline: new Date(Date.now() + 86400000).toISOString(),
      }, { headers: mangakaHeaders });
      throw new Error('Chapter creation should have failed for Cancelled series.');
    } catch (err: any) {
      console.log('E2E Blocked Chapter Response Status:', err.response?.status);
      console.log('E2E Blocked Chapter Response Data:', err.response?.data);
      expect(err.response?.status).toBe(400);
      expect(JSON.stringify(err.response?.data)).toContain('Cannot create chapters for a cancelled series.');
    }
  });

  test('Final Reader Vote Integrity Verification', async () => {
    if (!isBackendLive) {
      test.skip();
      return;
    }

    const adminHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };
    const voteTimestamp = Date.now();
    const readerAEmail = `readera_e2e_b5_${voteTimestamp}@example.com`;
    const readerBEmail = `readerb_e2e_b5_${voteTimestamp}@example.com`;

    // 1. Create Reader A and Reader B users
    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: readerAEmail,
      username: `readera_b5_${voteTimestamp}`,
      fullName: 'Reader A',
      password: 'Password@123',
      roles: ['Assistant'],
    }, { headers: adminHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: readerBEmail,
      username: `readerb_b5_${voteTimestamp}`,
      fullName: 'Reader B',
      password: 'Password@123',
      roles: ['Assistant'],
    }, { headers: adminHeaders });

    const readerAAuth = await loginUser(readerAEmail, 'Password@123');
    const readerBAuth = await loginUser(readerBEmail, 'Password@123');

    // Create a new Issue for this test
    const issueCode = `Vol-Vote-Integrity-${voteTimestamp}`;
    await axios.post(`${GATEWAY_URL}/editorial/issues`, {
      issueNumber: issueCode,
      title: `Integrity Issue ${voteTimestamp}`,
      releaseDate: new Date().toISOString(),
    }, { headers: { Authorization: `Bearer ${boardMemberAuth.accessToken}` } });

    // Find the issue ID from issues list
    const issuesRes = await axios.get(`${GATEWAY_URL}/editorial/issues`, { headers: adminHeaders });
    const issue = issuesRes.data.data.find((i: any) => i.issueNumber === issueCode);
    const issueId = issue.id;

    // Release the issue so it can accept votes
    await axios.patch(`${GATEWAY_URL}/editorial/issues/${issueId}/status`, { status: 3 }, { headers: { Authorization: `Bearer ${boardMemberAuth.accessToken}` } });

    // 2. Reader A votes for Series
    await axios.post(`${GATEWAY_URL}/editorial/issues/${issueId}/reader-votes`, {
      seriesId: seriesId,
      voteCount: 1,
    }, { headers: { Authorization: `Bearer ${readerAAuth.accessToken}` } });

    // 3. Reader B votes for Series
    await axios.post(`${GATEWAY_URL}/editorial/issues/${issueId}/reader-votes`, {
      seriesId: seriesId,
      voteCount: 1,
    }, { headers: { Authorization: `Bearer ${readerBAuth.accessToken}` } });

    // 4. Query API and verify we have 2 distinct votes
    let votesRes = await axios.get(`${GATEWAY_URL}/editorial/issues/${issueId}/reader-votes`, { headers: adminHeaders });
    let votes = votesRes.data.data;
    
    expect(votes.length).toBe(2);
    expect(votes.some((v: any) => v.readerId === readerAAuth.user.id)).toBe(true);
    expect(votes.some((v: any) => v.readerId === readerBAuth.user.id)).toBe(true);

    // 5. Reader A changes their vote count to 5
    await axios.post(`${GATEWAY_URL}/editorial/issues/${issueId}/reader-votes`, {
      seriesId: seriesId,
      voteCount: 5,
    }, { headers: { Authorization: `Bearer ${readerAAuth.accessToken}` } });

    // 6. Verify we still have exactly 2 records, and Reader B's vote remains unchanged
    votesRes = await axios.get(`${GATEWAY_URL}/editorial/issues/${issueId}/reader-votes`, { headers: adminHeaders });
    votes = votesRes.data.data;

    expect(votes.length).toBe(2);
    const voteA = votes.find((v: any) => v.readerId === readerAAuth.user.id);
    const voteB = votes.find((v: any) => v.readerId === readerBAuth.user.id);
    expect(voteA.voteCount).toBe(5);
    expect(voteB.voteCount).toBe(1);

    // 7. Calculate ranking and verify aggregate count is distinct reader count (2)
    const rankingRes = await axios.post(`${GATEWAY_URL}/editorial/issues/${issueId}/calculate-ranking`, {}, { headers: { Authorization: `Bearer ${boardMemberAuth.accessToken}` } });
    const items = rankingRes.data.data.items;
    
    const rankingItem = items.find((item: any) => item.seriesId === seriesId);
    expect(rankingItem.voteCount).toBe(2);
  });
});

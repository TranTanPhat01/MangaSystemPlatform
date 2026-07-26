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

test.describe('Batch 4 Board Proposal and Publication Scheduling Fullstack E2E Workflow', () => {
  let isBackendLive = false;
  let adminAuth: any;
  let mangakaAuth: any;
  let boardMember1Auth: any;
  let boardMember2Auth: any;
  let boardMember3Auth: any;
  let assistantAuth: any;
  let editorAuth: any;

  let seriesId: string;
  let chapterId: string;
  let timestamp: number;

  test.beforeAll(async () => {
    isBackendLive = await verifyBackendConnection();
    if (!isBackendLive) {
      console.warn('⚠️ WARNING: Local backend (http://localhost:5200) is NOT running.');
      return;
    }

    // 1. Login as Admin
    adminAuth = await loginUser('admin@gmail.com', 'Admin@system');
    const authHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };

    // 2. Create users dynamically
    timestamp = Date.now();
    const mangakaEmail = `mangaka_e2e_b4_${timestamp}@example.com`;
    const board1Email = `board1_e2e_b4_${timestamp}@example.com`;
    const board2Email = `board2_e2e_b4_${timestamp}@example.com`;
    const board3Email = `board3_e2e_b4_${timestamp}@example.com`;
    const assistantEmail = `assistant_e2e_b4_${timestamp}@example.com`;
    const editorEmail = `editor_e2e_b4_${timestamp}@example.com`;

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: mangakaEmail,
      username: `mangaka_b4_${timestamp}`,
      fullName: 'E2E Mangaka B4',
      password: 'Password@123',
      roles: ['Mangaka'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: board1Email,
      username: `board1_b4_${timestamp}`,
      fullName: 'Board Member 1',
      password: 'Password@123',
      roles: ['EditorialBoard'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: board2Email,
      username: `board2_b4_${timestamp}`,
      fullName: 'Board Member 2',
      password: 'Password@123',
      roles: ['EditorialBoard'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: board3Email,
      username: `board3_b4_${timestamp}`,
      fullName: 'Board Member 3',
      password: 'Password@123',
      roles: ['EditorialBoard'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: assistantEmail,
      username: `assistant_b4_${timestamp}`,
      fullName: 'E2E Assistant B4',
      password: 'Password@123',
      roles: ['Assistant'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: editorEmail,
      username: `editor_b4_${timestamp}`,
      fullName: 'E2E Editor B4',
      password: 'Password@123',
      roles: ['TantouEditor'],
    }, { headers: authHeaders });

    // Login users to get access tokens
    mangakaAuth = await loginUser(mangakaEmail, 'Password@123');
    boardMember1Auth = await loginUser(board1Email, 'Password@123');
    boardMember2Auth = await loginUser(board2Email, 'Password@123');
    boardMember3Auth = await loginUser(board3Email, 'Password@123');
    assistantAuth = await loginUser(assistantEmail, 'Password@123');
    editorAuth = await loginUser(editorEmail, 'Password@123');

    // 3. Create Studio, Series, Chapter, and approve chapter review to satisfy schedule requirements
    const mangakaHeaders = { Authorization: `Bearer ${mangakaAuth.accessToken}` };
    const studioRes = await axios.post(`${GATEWAY_URL}/manga/studios`, {
      name: `E2E Studio B4 ${timestamp}`,
      description: 'E2E Test Studio Description B4',
    }, { headers: mangakaHeaders });
    const studioId = studioRes.data.data.id;

    const seriesRes = await axios.post(`${GATEWAY_URL}/manga/series`, {
      studioId: studioId,
      title: `E2E Series B4 ${timestamp}`,
      description: 'E2E Series Description B4',
      genre: 'Action',
    }, { headers: mangakaHeaders });
    seriesId = seriesRes.data.data.id;

    const chapterRes = await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/chapters`, {
      chapterNumber: 1,
      title: `Chapter 1: E2E Editorial Board`,
      progressPercentage: 100,
    }, { headers: mangakaHeaders });
    chapterId = chapterRes.data.data.id;

    // Transition chapter status to InProduction & submit for review
    await axios.patch(`${GATEWAY_URL}/manga/chapters/${chapterId}/status`, { status: 2 }, { headers: mangakaHeaders });
    
    // Seed approved review for this chapter so it can be scheduled later
    const adminHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };
    const reviewRes = await axios.post(`${GATEWAY_URL}/editorial/reviews`, {
      chapterId: chapterId,
      seriesId: seriesId,
    }, { headers: adminHeaders });
    const reviewId = reviewRes.data.data.id;

    // Start the review (status -> InReview)
    await axios.post(`${GATEWAY_URL}/editorial/reviews/${reviewId}/start`, {}, { headers: adminHeaders });

    // Approve the review (status -> Approved)
    await axios.post(`${GATEWAY_URL}/editorial/reviews/${reviewId}/approve`, {
      decisionNote: 'Seed approval',
    }, { headers: adminHeaders });
  });

  test('Full series proposal voting, tied pending recommendation, vote changes, quorum finalization, scheduling, and publishing validation', async ({ page }) => {
    if (!isBackendLive) {
      test.skip();
      return;
    }

    const currentSeriesTitle = `E2E Series B4 ${timestamp}`;
    const mangakaHeaders = { Authorization: `Bearer ${mangakaAuth.accessToken}` };

    // Step 1: Verify the series is in Draft status and doesn't show in the Board Voting dropdown queue
    await authenticateBrowser(page, boardMember1Auth);
    await page.goto('/board?tab=Board%20Voting');
    await page.waitForSelector('text=Board voting');
    
    const dropdown = page.locator('select[aria-label="Series to vote"]');
    await expect(dropdown).toBeVisible();
    await page.locator('text=Đang tải workspace').waitFor({ state: 'hidden' });
    
    // Try to find dynamically matching option
    const draftOptions = await dropdown.locator('option').allTextContents();
    expect(draftOptions.some(opt => opt.includes(currentSeriesTitle))).toBe(false);

    // Step 2: Mangaka submits the series proposal
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/submit-proposal`, {}, { headers: mangakaHeaders });

    // Step 3: Refresh Board member's page and verify series is now visible in the dropdown queue
    await page.reload();
    await page.waitForSelector('text=Board voting');
    await expect(dropdown).toBeVisible();
    await page.locator('text=Đang tải workspace').waitFor({ state: 'hidden' });

    // Wait for option items to be populated
    await page.waitForFunction((el) => (el as HTMLSelectElement).options.length > 1, (await dropdown.elementHandle()) as any);
    
    // Find options after proposal submission
    const newOptions = await dropdown.locator('option').all();
    let targetValue = '';
    for (const opt of newOptions) {
      const text = await opt.innerText();
      if (text.includes(currentSeriesTitle)) {
        targetValue = await opt.getAttribute('value') || '';
        break;
      }
    }
    expect(targetValue).not.toBe('');
    await dropdown.selectOption(targetValue);

    // Verify detailed info is displayed
    await expect(page.locator('text=Voting On')).toBeVisible();
    await expect(page.getByRole('heading', { name: currentSeriesTitle })).toBeVisible();

    // Step 4: Board Member 1 votes Approve
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.locator('text=Vote recorded successfully.')).toBeVisible();
    await expect(page.locator('text=1 total vote(s)')).toBeVisible();

    // Step 5: Board Member 2 logs in and votes Reject with note
    await authenticateBrowser(page, boardMember2Auth);
    await page.goto(`/board?tab=Board%20Voting&seriesId=${seriesId}`);
    await page.locator('text=Đang tải workspace').waitFor({ state: 'hidden' });
    await page.waitForSelector('text=Voting On');

    const noteInput = page.locator('textarea[aria-label="Vote note"]');
    await noteInput.fill('The drawings look too simplistic.');
    await page.getByRole('button', { name: 'Reject' }).click();
    await expect(page.locator('text=Vote recorded successfully.')).toBeVisible();
    await expect(page.locator('text=2 total vote(s)')).toBeVisible();

    // Step 6: Board Member 3 logs in and votes Revision with note (results in tie)
    await authenticateBrowser(page, boardMember3Auth);
    await page.goto(`/board?tab=Board%20Voting&seriesId=${seriesId}`);
    await page.locator('text=Đang tải workspace').waitFor({ state: 'hidden' });
    await page.waitForSelector('text=Voting On');

    await noteInput.fill('Needs revision on plot draft.');
    await page.getByRole('button', { name: 'Revision' }).click();
    await expect(page.locator('text=Vote recorded successfully.')).toBeVisible();
    await expect(page.locator('text=3 total vote(s)')).toBeVisible();

    // Verify quorum is reached but Recommendation is Pending (due to tie: 1 Approve, 1 Reject, 1 Revision)
    await expect(page.locator('text=Quorum Reached')).toBeVisible();
    
    // Click Finalize Decision to verify it is blocked due to Pending tie
    await page.getByRole('button', { name: 'Finalize Decision' }).click();
    await page.locator('button:has-text("Confirm")').click();
    // Should show error message indicating "has no final recommendation"
    await expect(page.locator('text=Proposal has no final recommendation.')).toBeVisible();

    // Step 7: Board Member 3 changes vote from Revision to Approve
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.locator('text=Vote recorded successfully.')).toBeVisible({ timeout: 15000 });
    
    // Current votes updates to: 2 Approve, 1 Reject, 0 Revision, 0 Abstain
    await expect(page.locator('text=3 total vote(s)')).toBeVisible();

    // Step 8: Finalize the decision
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Finalize Decision' }).click();
    await expect(page.locator('text=Confirm Proposal Finalization')).toBeVisible();
    await page.locator('button:has-text("Confirm")').click();
    await expect(page.locator('text=Đã chốt kết quả biểu quyết.')).toBeVisible();

    // Verify series is no longer in the active voting queue
    await page.reload();
    await page.locator('text=Đang tải workspace').waitFor({ state: 'hidden' });
    await page.waitForSelector('text=Board voting');
    const dropdownAfter = page.locator('select[aria-label="Series to vote"]');
    const optionsAfter = await dropdownAfter.locator('option').allTextContents();
    expect(optionsAfter.some(opt => opt.includes(currentSeriesTitle))).toBe(false);

    // Step 9: Navigates to Publication Schedule tab and schedules the chapter
    await page.goto(`/board?tab=Publication%20Schedule`);
    await page.locator('text=Đang tải workspace').waitFor({ state: 'hidden' });
    await page.waitForSelector('text=Tạo lịch xuất bản');

    const seriesSelect = page.locator('select[aria-label="Series"]');
    const chapterSelect = page.locator('select[aria-label="Chapter"]');
    const dateInput = page.locator('input[aria-label="Scheduled date"]');

    // Fill form
    await seriesSelect.selectOption(targetValue);
    
    // Wait for chapter options to load
    await page.waitForFunction((el) => (el as HTMLSelectElement).options.length > 1, (await chapterSelect.elementHandle()) as any);
    
    // Select chapter
    await chapterSelect.selectOption({ index: 1 }); // Selects the first chapter option

    // Try a past date (should fail on submit)
    await dateInput.fill('2020-01-01T12:00');
    await page.getByRole('button', { name: 'Tạo lịch', exact: true }).click();
    await expect(page.locator('text=Scheduled date cannot be in the past.')).toBeVisible();

    // Fill a future date (e.g. year 2035)
    await dateInput.fill('2035-12-12T12:00');
    await page.getByRole('button', { name: 'Tạo lịch', exact: true }).click();
    await expect(page.locator('text=Đã tạo lịch xuất bản.')).toBeVisible();

    // Verify duplicate active schedule creation is blocked
    await seriesSelect.selectOption(targetValue);
    await chapterSelect.selectOption({ index: 1 });
    await dateInput.fill('2035-12-13T12:00');
    await page.getByRole('button', { name: 'Tạo lịch', exact: true }).click();
    await expect(page.locator('text=An active publication schedule already exists for this series and chapter.')).toBeVisible();

    // Step 10: Publish the schedule (requires confirmation)
    // Setup dialog listener to verify confirmation text
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to publish this schedule?');
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Publish' }).first().click();
    await expect(page.locator('text=Đã xuất bản lịch.')).toBeVisible();

    // Step 11: Admin logs in and verifies detail page displays decision and schedule status
    await authenticateBrowser(page, adminAuth);
    await page.goto(`/series/${seriesId}`);
    await page.waitForSelector('text=Editorial Board Decision Details');

    await expect(page.locator('text=Final Recommendation: Approve')).toBeVisible();
    await expect(page.locator('text=Publication Lịch Trình')).toBeVisible();
    await expect(page.getByText('Published', { exact: true })).toBeVisible();
  });
});

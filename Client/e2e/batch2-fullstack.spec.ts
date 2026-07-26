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
  return response.data.data; // { accessToken, refreshToken, user: { id, email, fullName, roles } }
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

test.describe('Batch 2 Task Revision & Resubmission Fullstack E2E Workflow', () => {
  let isBackendLive = false;
  let adminAuth: any;
  let mangakaAuth: any;
  let assistantAuth: any;
  let taskId: string;

  test.beforeAll(async () => {
    isBackendLive = await verifyBackendConnection();
    if (!isBackendLive) {
      console.warn('⚠️ WARNING: Local backend (http://localhost:5200) is NOT running.');
      console.warn('This fullstack E2E test will be skipped. Start backend using: docker-compose up -d');
      return;
    }

    // 1. Login as Admin
    adminAuth = await loginUser('admin@gmail.com', 'Admin@system');
    const authHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };

    // 2. Create Mangaka & Assistant users
    const timestamp = Date.now();
    const mangakaEmail = `mangaka_e2e_${timestamp}@example.com`;
    const assistantEmail = `assistant_e2e_${timestamp}@example.com`;

    const mangakaRes = await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: mangakaEmail,
      username: `mangaka_${timestamp}`,
      fullName: 'E2E Mangaka',
      password: 'Password@123',
      roles: ['Mangaka'],
    }, { headers: authHeaders });

    const assistantRes = await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: assistantEmail,
      username: `assistant_${timestamp}`,
      fullName: 'E2E Assistant',
      password: 'Password@123',
      roles: ['Assistant'],
    }, { headers: authHeaders });

    // 3. Login as Mangaka and Assistant to get auth data
    mangakaAuth = await loginUser(mangakaEmail, 'Password@123');
    assistantAuth = await loginUser(assistantEmail, 'Password@123');

    // 4. Create Studio, Series, Chapter, Page, Annotation & Task under Mangaka context
    const mangakaHeaders = { Authorization: `Bearer ${mangakaAuth.accessToken}` };

    const studioRes = await axios.post(`${GATEWAY_URL}/manga/studios`, {
      name: `E2E Studio ${timestamp}`,
      description: 'E2E Test Studio Description',
    }, { headers: mangakaHeaders });
    const studioId = studioRes.data.data.id;

    // Add Assistant as Studio member so they can access the tasks/pages
    await axios.post(`${GATEWAY_URL}/manga/studios/${studioId}/members`, {
      userId: assistantAuth.user.id,
      role: 'Assistant',
    }, { headers: mangakaHeaders });

    const seriesRes = await axios.post(`${GATEWAY_URL}/manga/series`, {
      studioId: studioId,
      title: `E2E Series ${timestamp}`,
      description: 'E2E Series Description',
      genre: 'Action',
    }, { headers: mangakaHeaders });
    const seriesId = seriesRes.data.data.id;

    // Submit and Approve Series Proposal so it becomes Active and can host Chapters
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/submit-proposal`, {}, { headers: mangakaHeaders });
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/approve-proposal`, { decisionNote: 'Seed approve' }, { headers: { Authorization: `Bearer ${adminAuth.accessToken}` } });


    const chapterRes = await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/chapters`, {
      chapterNumber: 1,
      title: `Chapter 1: E2E Beginnings`,
      progressPercentage: 0,
    }, { headers: mangakaHeaders });
    const chapterId = chapterRes.data.data.id;

    // Upload a page reference file
    const fileFormData = new FormData();
    // In Node we can append a dummy buffer for reference page upload
    const dummyFile = new Blob(['dummy-reference-img'], { type: 'image/png' });
    fileFormData.append('file', dummyFile, 'reference_page.png');
    fileFormData.append('category', 'Page');

    const fileUploadRes = await axios.post(`${GATEWAY_URL}/files/upload`, fileFormData, {
      headers: {
        Authorization: `Bearer ${mangakaAuth.accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    const pageFileId = fileUploadRes.data.data.fileId;

    const pageRes = await axios.post(`${GATEWAY_URL}/manga/chapters/${chapterId}/pages`, {
      pageNumber: 1,
      fileId: pageFileId,
    }, { headers: mangakaHeaders });
    const pageId = pageRes.data.data.id;

    const annotationRes = await axios.post(`${GATEWAY_URL}/manga/pages/${pageId}/annotations`, {
      type: 4,
      coordinatesJson: JSON.stringify({ x: 10, y: 10, w: 100, h: 100 }),
      description: 'Draw detailed cityscape outlines',
    }, { headers: mangakaHeaders });
    const annotationId = annotationRes.data.data.id;

    const taskRes = await axios.post(`${GATEWAY_URL}/manga/tasks`, {
      annotationId: annotationId,
      pageId: pageId,
      title: 'Ink Character Background',
      description: 'Draw detailed cityscape outlines',
      assignedToUserId: assistantAuth.user.id,
      priority: 1, // Medium
      deadline: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    }, { headers: mangakaHeaders });
    taskId = taskRes.data.data.id;
  });

  test('Full-stack revision, resubmission and approval flow', async ({ page }) => {
    if (!isBackendLive) {
      test.skip(true, 'Skipping fullstack E2E because backend is not running.');
      return;
    }

    // Console logs for E2E visibility
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });
    page.on('requestfailed', request => {
      console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`RESPONSE ERROR: ${response.url()} status ${response.status()}`);
      }
    });

    // -------------------------------------------------------------
    // 1. Assistant logs in, goes to /tasks and starts task
    // -------------------------------------------------------------
    await authenticateBrowser(page, assistantAuth);
    await page.goto(`/tasks?taskId=${taskId}`);

    await expect(page.getByText('Ink Character Background').first()).toBeVisible();
    await page.getByRole('button', { name: 'Start Task' }).click();
    await expect(page.getByText('Task started.')).toBeVisible();

    // -------------------------------------------------------------
    // 2. Assistant uploads File and submits task
    // -------------------------------------------------------------
    await page.getByRole('button', { name: 'Submit Workspace' }).click();

    // Set files directly on the input element
    await page.locator('input[type="file"]').setInputFiles({
      name: 'submission_v1.png',
      mimeType: 'image/png',
      buffer: Buffer.from('drawing_v1_payload'),
    });
    await page.getByPlaceholder('e.g. Inked outlines are finished. Ready for shading review.').fill('First submission draft');
    await page.getByRole('button', { name: 'Submit Output' }).click();

    await expect(page.getByText('Task submission sent.')).toBeVisible();

    // -------------------------------------------------------------
    // 3. Mangaka logs in, goes to tasks list/dashboard, and requests revision
    // -------------------------------------------------------------
    await authenticateBrowser(page, mangakaAuth);
    await page.goto('/dashboard');

    // Click "Tasks" in the sidebar
    await page.locator('aside button:has-text("Tasks")').click();

    // Locate the task in the list and click "Revise"
    await expect(page.getByText('Ink Character Background').first()).toBeVisible();
    await page.getByRole('button', { name: 'Revise' }).click();

    // Enter revision reason
    await page.getByLabel('Revision Reason').fill('The skyline needs to be darker. Add more ink detailing.');
    await page.getByRole('button', { name: 'Send Revision Request' }).click();

    await expect(page.getByText('Revision requested.')).toBeVisible();

    // -------------------------------------------------------------
    // 4. Assistant logs in, goes to Assistant dashboard, views revision request reason
    // -------------------------------------------------------------
    await authenticateBrowser(page, assistantAuth);
    await page.goto('/assistant?tab=Revision%20Requests');

    await expect(page.getByText('The skyline needs to be darker. Add more ink detailing.')).toBeVisible();

    // Click "View Details & Resubmit" to route back to tasks workspace
    await page.getByLabel('View Details & Resubmit for Ch.1 - Page 1').click();

    // Verify taskId is in URL
    await page.waitForURL(url => url.searchParams.get('taskId') === taskId);
    expect(page.url()).toContain(`taskId=${taskId}`);

    // Verify revision reason is visible in task workspace detail panel
    await expect(page.getByText('The skyline needs to be darker. Add more ink detailing.')).toBeVisible();

    // -------------------------------------------------------------
    // 5. Assistant starts revision and uploads new version (File B)
    // -------------------------------------------------------------
    await page.getByRole('button', { name: 'Start Revision' }).click();
    await expect(page.getByText('Task started.')).toBeVisible();

    await page.getByRole('button', { name: 'Submit Workspace' }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'submission_v2.png',
      mimeType: 'image/png',
      buffer: Buffer.from('drawing_v2_darker_payload'),
    });
    await page.getByPlaceholder('e.g. Inked outlines are finished. Ready for shading review.').fill('Second submission draft - darker skyline');
    await page.getByRole('button', { name: 'Submit Output' }).click();

    await expect(page.getByText('Task submission sent.')).toBeVisible();

    // -------------------------------------------------------------
    // 6. Mangaka logs in, reviews history versions, and approves latest
    // -------------------------------------------------------------
    await authenticateBrowser(page, mangakaAuth);
    await page.goto('/dashboard');
    await page.locator('aside button:has-text("Tasks")').click();

    // Verify history displays both Version 1 and Version 2 with Latest badge
    await expect(page.getByText('Version 2', { exact: true })).toBeVisible();
    await expect(page.getByText('Version 1', { exact: true })).toBeVisible();
    await expect(page.locator('span', { hasText: 'Latest' })).toBeVisible();

    // Approve the latest submission
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('Task approved successfully.')).toBeVisible();

    // -------------------------------------------------------------
    // 7. Verify status persistence after reload
    // -------------------------------------------------------------
    await page.reload();
    await page.locator('aside button:has-text("Tasks")').click();
    await expect(page.getByText('Approved')).toBeVisible();
  });
});

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

test.describe('Batch 3 Editorial Review Fullstack E2E Workflow', () => {
  let isBackendLive = false;
  let adminAuth: any;
  let mangakaAuth: any;
  let assistantAuth: any;
  let editorAuth: any;

  let seriesId: string;
  let chapterId: string;
  let pageId: string;
  let taskId: string;

  test.beforeAll(async () => {
    isBackendLive = await verifyBackendConnection();
    if (!isBackendLive) {
      console.warn('⚠️ WARNING: Local backend (http://localhost:5200) is NOT running.');
      return;
    }

    // 1. Login as Admin
    adminAuth = await loginUser('admin@gmail.com', 'Admin@system');
    const authHeaders = { Authorization: `Bearer ${adminAuth.accessToken}` };

    // 2. Create Mangaka, Assistant & TantouEditor users
    const timestamp = Date.now();
    const mangakaEmail = `mangaka_e2e_b3_${timestamp}@example.com`;
    const assistantEmail = `assistant_e2e_b3_${timestamp}@example.com`;
    const editorEmail = `editor_e2e_b3_${timestamp}@example.com`;

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: mangakaEmail,
      username: `mangaka_b3_${timestamp}`,
      fullName: 'E2E Mangaka B3',
      password: 'Password@123',
      roles: ['Mangaka'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: assistantEmail,
      username: `assistant_b3_${timestamp}`,
      fullName: 'E2E Assistant B3',
      password: 'Password@123',
      roles: ['Assistant'],
    }, { headers: authHeaders });

    await axios.post(`${GATEWAY_URL}/identity/admin/users`, {
      email: editorEmail,
      username: `editor_b3_${timestamp}`,
      fullName: 'E2E Editor B3',
      password: 'Password@123',
      roles: ['TantouEditor'],
    }, { headers: authHeaders });

    // 3. Login users to get access tokens
    mangakaAuth = await loginUser(mangakaEmail, 'Password@123');
    assistantAuth = await loginUser(assistantEmail, 'Password@123');
    editorAuth = await loginUser(editorEmail, 'Password@123');

    // 4. Create Studio, Series, Chapter, Page, Annotation & Task under Mangaka
    const mangakaHeaders = { Authorization: `Bearer ${mangakaAuth.accessToken}` };

    const studioRes = await axios.post(`${GATEWAY_URL}/manga/studios`, {
      name: `E2E Studio B3 ${timestamp}`,
      description: 'E2E Test Studio Description',
    }, { headers: mangakaHeaders });
    const studioId = studioRes.data.data.id;

    await axios.post(`${GATEWAY_URL}/manga/studios/${studioId}/members`, {
      userId: assistantAuth.user.id,
      role: 'Assistant',
    }, { headers: mangakaHeaders });

    const seriesRes = await axios.post(`${GATEWAY_URL}/manga/series`, {
      studioId: studioId,
      title: `E2E Series B3 ${timestamp}`,
      description: 'E2E Series Description',
      genre: 'Action',
    }, { headers: mangakaHeaders });
    seriesId = seriesRes.data.data.id;

    // Approve Series Proposal so it is active
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/submit-proposal`, {}, { headers: mangakaHeaders });
    await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/approve-proposal`, { decisionNote: 'Seed approve' }, { headers: authHeaders });

    const chapterRes = await axios.post(`${GATEWAY_URL}/manga/series/${seriesId}/chapters`, {
      chapterNumber: 1,
      title: `Chapter 1: E2E Editorial`,
      progressPercentage: 0,
    }, { headers: mangakaHeaders });
    chapterId = chapterRes.data.data.id;

    // Transition chapter status from Draft to InProduction (status = 2)
    await axios.patch(`${GATEWAY_URL}/manga/chapters/${chapterId}/status`, { status: 2 }, { headers: mangakaHeaders });

    // Upload page reference file
    const fileFormData = new FormData();
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
    pageId = pageRes.data.data.id;

    const annotationRes = await axios.post(`${GATEWAY_URL}/manga/pages/${pageId}/annotations`, {
      type: 4,
      coordinatesJson: JSON.stringify({ x: 10, y: 10, w: 100, h: 100 }),
      description: 'Ink outlines correctly',
    }, { headers: mangakaHeaders });
    const annotationId = annotationRes.data.data.id;

    const taskRes = await axios.post(`${GATEWAY_URL}/manga/tasks`, {
      annotationId: annotationId,
      pageId: pageId,
      title: 'Ink Character Background',
      description: 'Ink outlines',
      assignedToUserId: assistantAuth.user.id,
      priority: 2,
    }, { headers: mangakaHeaders });
    taskId = taskRes.data.data.id;
  });

  test('Full editorial review, revision request, resubmission and approval flow', async ({ page }) => {
    if (!isBackendLive) {
      test.skip();
      return;
    }

    const mangakaHeaders = { Authorization: `Bearer ${mangakaAuth.accessToken}` };
    const assistantHeaders = { Authorization: `Bearer ${assistantAuth.accessToken}` };

    // Step 1: Assistant claims and submits page-level task
    await axios.post(`${GATEWAY_URL}/manga/tasks/${taskId}/start`, {}, { headers: assistantHeaders });

    const submissionFormData = new FormData();
    const submissionBlob = new Blob(['submission-ink-1'], { type: 'image/png' });
    submissionFormData.append('file', submissionBlob, 'submission_v1.png');
    submissionFormData.append('category', 'Submission');

    const subFileUploadRes = await axios.post(`${GATEWAY_URL}/files/upload`, submissionFormData, {
      headers: {
        Authorization: `Bearer ${assistantAuth.accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    const submissionFileId = subFileUploadRes.data.data.fileId;

    await axios.post(`${GATEWAY_URL}/manga/tasks/${taskId}/submit`, {
      fileId: submissionFileId,
      note: 'Finished first draft lines',
    }, { headers: assistantHeaders });

    // Step 2: Mangaka approves page submission to resolve tasks
    await axios.post(`${GATEWAY_URL}/manga/tasks/${taskId}/approve`, {}, { headers: mangakaHeaders });

    // Step 3: Mangaka submits chapter for review
    const submitChapterRes = await axios.post(`${GATEWAY_URL}/manga/chapters/${chapterId}/submit-review`, {}, { headers: mangakaHeaders });
    expect(submitChapterRes.data.success).toBe(true);

    // Wait a brief moment for events to process and create review
    await page.waitForTimeout(2000);

    // Step 4: Editor logs in and opens dashboard
    await authenticateBrowser(page, editorAuth);
    await page.goto('/editorial');

    // Verify review is in queue
    await page.waitForSelector('text=Editorial Operations');
    
    // Find the specific review card for our chapter
    const targetText = `Chapter ${chapterId.slice(0, 8)}`;
    const card = page.locator('.p-5').filter({ hasText: targetText }).first();
    
    // Find the review row and start review
    const startBtn = card.getByRole('button', { name: 'Start Review' });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify it changed to In Review
    await expect(card.getByText('InReview')).toBeVisible();

    // Open Comments toggle to load canvas & comment form
    await card.getByRole('button', { name: 'Comments' }).click();

    // Add a comment
    const commentArea = card.locator('textarea[placeholder="Write a comment..."]');
    await expect(commentArea).toBeVisible();
    await commentArea.fill('Please make the lines darker.');
    await card.getByRole('button', { name: 'Send Comment' }).click();

    // Verify comment is listed
    await expect(card.getByText('Please make the lines darker.')).toBeVisible();
    await page.waitForTimeout(1000);

    // Fill decision note and click "Request Revision"
    const decisionArea = card.getByLabel('Decision note');
    await expect(decisionArea).toBeVisible();
    await decisionArea.fill('Line art is too thin. Needs a revision.');
    await card.getByRole('button', { name: 'Request Revision' }).click();

    // Verify status changes to RevisionRequested
    await expect(card.getByText('RevisionRequested')).toBeVisible();

    // Wait for events to sync chapter status
    await page.waitForTimeout(2000);

    // Check that Chapter is RevisionRequired (ChapterStatus.RevisionRequired = 4 or "RevisionRequired")
    const chapterStatusRes = await axios.get(`${GATEWAY_URL}/manga/series/${seriesId}/chapters`, { headers: mangakaHeaders });
    const currentChapter = chapterStatusRes.data.data.find((c: any) => c.id === chapterId);
    expect(currentChapter.status === 4 || currentChapter.status === 'RevisionRequired').toBe(true);

    // Step 5: Mangaka resubmits chapter
    // Under Option A, this will create a NEXT round review record
    await axios.post(`${GATEWAY_URL}/manga/chapters/${chapterId}/submit-review`, {}, { headers: mangakaHeaders });
    await page.waitForTimeout(2000);

    // Step 6: Editor refreshes and starts the second round review
    await page.getByRole('button', { name: 'Refresh' }).click();

    // The review card should now show Pending (since it's a new round)
    const card2 = page.locator('.p-5').filter({ hasText: targetText }).first();
    await expect(card2.getByText('Pending')).toBeVisible();

    // Start review for Round 2
    await card2.getByRole('button', { name: 'Start Review' }).click();
    await expect(card2.getByText('InReview')).toBeVisible();

    // Open comments
    await card2.getByRole('button', { name: 'Comments' }).click();

    // Check that Previous Review Rounds is displayed (History preserved!)
    await expect(card2.getByText('Previous Review Rounds')).toBeVisible();
    await expect(card2.getByText(/Line art is too thin. Needs a revision./)).toBeVisible();

    // Add final comment and Approve
    await commentArea.fill('Excellent line art now. Approving.');
    await card2.getByRole('button', { name: 'Send Comment' }).click();

    await card2.getByRole('button', { name: 'Approve' }).click();

    // Verify status is Approved
    await expect(card2.getByText('Approved').first()).toBeVisible();

    // Wait for event to sync chapter status
    await page.waitForTimeout(2000);

    // Verify Chapter is Approved (ChapterStatus.Approved = 5 or "Approved") in Manga service
    const finalChapterStatusRes = await axios.get(`${GATEWAY_URL}/manga/series/${seriesId}/chapters`, { headers: mangakaHeaders });
    const finalChapter = finalChapterStatusRes.data.data.find((c: any) => c.id === chapterId);
    expect(finalChapter.status === 5 || finalChapter.status === 'Approved').toBe(true);
  });
});

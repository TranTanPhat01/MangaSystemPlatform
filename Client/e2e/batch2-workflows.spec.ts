import { expect, Page, test } from '@playwright/test';

const API_RESPONSE = (data: unknown, message = 'OK') => ({
  success: true,
  data,
  message,
});

async function authenticate(page: Page, roles: string[], userId: string, fullName: string) {
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
            id: userId,
            email: 'e2e@example.com',
            fullName: fullName,
            roles: roles,
          }
        }
      }),
    });
  });
  await page.addInitScript(({ persistedRoles, persistedUserId, persistedName }) => {
    window.localStorage.setItem('manga-auth-storage', JSON.stringify({
      state: {
        accessToken: 'e2e-access-token',
        refreshToken: 'e2e-refresh-token',
        user: {
          id: persistedUserId,
          email: 'e2e@example.com',
          fullName: persistedName,
          roles: persistedRoles,
        },
        isAuthenticated: true,
      },
      version: 0,
    }));
  }, { persistedRoles: roles, persistedUserId: userId, persistedName: fullName });
}

test.describe('Batch 2 Task Revision & Resubmission E2E Workflow', () => {
  const taskId = '9e0b82f0-1c23-48fa-91b3-4f91e92d8471';
  const assistantId = 'a11d82f0-1c23-48fa-91b3-4f91e92d8472';
  const mangakaId = 'm22d82f0-1c23-48fa-91b3-4f91e92d8473';

  test('End to end revision, resubmission and approval sequence', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`BROWSER CONSOLE ERROR: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      console.log(`BROWSER PAGE ERROR: ${err.message}`);
    });
    page.on('requestfailed', request => {
      console.log(`BROWSER REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    let taskStatus = 1; // 1 = Todo, 2 = InProgress, 3 = Submitted, 4 = RevisionRequired, 5 = Approved
    let submissions: any[] = [];
    let revisions: any[] = [];

    // Corrected route patterns to match the endpoints exactly
    await page.route('**/manga/tasks/my', async route => {
      const list = [{
        id: taskId,
        annotationId: 'ann-1',
        pageId: 'page-1',
        pageNumber: 1,
        pageFileId: 'ref-file-id',
        title: 'Ink Character Background',
        description: 'Draw detailed cityscape lines',
        assignedToUserId: assistantId,
        createdByUserId: mangakaId,
        status: taskStatus,
        priority: 1, // Medium
        deadline: '2026-08-30T00:00:00Z',
        createdAt: '2026-07-24T00:00:00Z',
        updatedAt: '2026-07-24T00:00:00Z',
        latestSubmission: submissions[0] ?? null,
        submissionHistory: submissions,
        revisions: revisions,
      }];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSE(list)),
      });
    });

    await page.route('**/manga/tasks/*/start', async route => {
      taskStatus = 2; // InProgress
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSE({})),
      });
    });

    await page.route('**/files/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSE({
          fileId: 'f91e92d8-4711-48fa-91b3-4f91e92d847' + (submissions.length + 1),
          originalFileName: 'drawing.png',
          storedFileName: 'drawing_stored.png',
          contentType: 'image/png',
          sizeInBytes: 1024,
          fileCategory: 'Submission',
          createdAt: '2026-07-24T12:00:00Z',
        })),
      });
    });

    await page.route('**/manga/tasks/*/submit', async route => {
      const payload = route.request().postDataJSON();
      const newSub = {
        id: 'sub-id-' + (submissions.length + 1),
        taskId: taskId,
        submittedByUserId: assistantId,
        fileId: payload.fileId,
        note: payload.note || 'E2E submission',
        status: 1, // Submitted
        submittedAt: new Date().toISOString(),
      };
      submissions = [newSub, ...submissions];
      taskStatus = 3; // Submitted
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSE(newSub)),
      });
    });

    await page.route('**/manga/tasks/*/request-revision', async route => {
      const payload = route.request().postDataJSON();
      const newRev = {
        id: 'rev-id-' + (revisions.length + 1),
        taskId: taskId,
        requestedByUserId: mangakaId,
        reason: payload.reason,
        createdAt: new Date().toISOString(),
      };
      revisions = [newRev, ...revisions];
      if (submissions[0]) {
        submissions[0].status = 3; // RevisionRequired
      }
      taskStatus = 4; // RevisionRequired
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSE({})),
      });
    });

    await page.route('**/manga/tasks/*/approve', async route => {
      taskStatus = 5; // Approved
      if (submissions[0]) {
        submissions[0].status = 2; // Approved
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(API_RESPONSE({})),
      });
    });

    await page.route('**/files/*/download', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('mock image binary data'),
      });
    });

    // -----------------------------------------------------------------
    // STEPS 1-7: Assistant logs in, starts task and submits first file
    // -----------------------------------------------------------------
    await authenticate(page, ['Assistant'], assistantId, 'Kenji Tanaka');
    await page.goto('/tasks');

    // Select the task and start it
    await expect(page.getByText('Ink Character Background').first()).toBeVisible();
    await page.getByRole('button', { name: 'Start Task' }).click();
    await expect(page.getByText('Task started.')).toBeVisible();

    // Submit workspace (File A)
    await page.getByRole('button', { name: 'Submit Workspace' }).click();
    
    // Set files directly on the input element
    await page.locator('input[type="file"]').setInputFiles({
      name: 'submission_v1.png',
      mimeType: 'image/png',
      buffer: Buffer.from('mock_file_a'),
    });
    await page.getByPlaceholder('e.g. Inked outlines are finished. Ready for shading review.').fill('Version 1 draft');
    await page.getByRole('button', { name: 'Submit Output' }).click();

    // Verify submission success toast
    await expect(page.getByText('Task submission sent.')).toBeVisible();
    expect(submissions).toHaveLength(1);
    expect(submissions[0].note).toBe('Version 1 draft');

    // -----------------------------------------------------------------
    // STEPS 8-10: Mangaka logs in, requests revision
    // -----------------------------------------------------------------
    await authenticate(page, ['Mangaka'], mangakaId, 'Hiroshi Sato');
    
    // In E2E we stub getSeries to mock dashboard lists
    await page.route('**/manga/series', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_RESPONSE([])),
    }));

    await page.route('**/manga/chapters/**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_RESPONSE([])),
    }));
    await page.route('**/manga/pages/**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_RESPONSE([])),
    }));
    await page.route('**/identity/users/assistants', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_RESPONSE([])),
    }));

    await page.goto('/dashboard');
    await page.locator('aside button:has-text("Tasks")').click();
    await expect(page.getByText('Ink Character Background').first()).toBeVisible();
    await page.getByRole('button', { name: 'Revise' }).click();
    await page.getByLabel('Revision Reason').fill('Lines are too thick. Please thin them out.');
    await page.getByRole('button', { name: 'Send Revision Request' }).click();

    await expect(page.getByText('Revision requested.')).toBeVisible();
    expect(revisions).toHaveLength(1);
    expect(revisions[0].reason).toBe('Lines are too thick. Please thin them out.');

    // -----------------------------------------------------------------
    // STEPS 11-19: Assistant logs in, views revision requests, routes and resubmits
    // -----------------------------------------------------------------
    console.log("AUTHENTICATING AS ASSISTANT");
    await authenticate(page, ['Assistant'], assistantId, 'Kenji Tanaka');
    const cookies = await page.context().cookies();
    console.log("COOKIES SET:", JSON.stringify(cookies));
    
    // In the Assistant dashboard revision panel, we mock getRevisions
    await page.route('**/manga/tasks/revisions', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_RESPONSE([{
        taskId: taskId,
        chapterInfo: 'Ch.1',
        pageNumber: 1,
        reason: 'Lines are too thick. Please thin them out.',
        requestedDate: '2026-07-24T12:30:00Z',
      }])),
    }));

    console.log("NAVIGATING TO /assistant?tab=Revision%20Requests");
    await page.goto('/assistant?tab=Revision%20Requests');
    console.log("NAVIGATED. CURRENT URL:", page.url());
    await expect(page.getByText('Lines are too thick. Please thin them out.')).toBeVisible();

    // Click "View Details & Resubmit"
    await page.getByLabel('View Details & Resubmit for Ch.1 - Page 1').click();

    // Verify URL contains taskId
    await page.waitForURL(url => url.searchParams.get('taskId') === taskId);
    expect(page.url()).toContain(`taskId=${taskId}`);

    // Verify correct task, revision reason is visible
    await expect(page.getByText('Ink Character Background').first()).toBeVisible();
    await expect(page.getByText('Lines are too thick. Please thin them out.')).toBeVisible();

    // Start revision and upload File B
    await page.getByRole('button', { name: 'Start Revision' }).click();
    await expect(page.getByText('Task started.')).toBeVisible();

    await page.getByRole('button', { name: 'Submit Workspace' }).click();

    // Set files directly on the input element
    await page.locator('input[type="file"]').setInputFiles({
      name: 'submission_v2.png',
      mimeType: 'image/png',
      buffer: Buffer.from('mock_file_b'),
    });
    await page.getByPlaceholder('e.g. Inked outlines are finished. Ready for shading review.').fill('Version 2 thin lines');
    await page.getByRole('button', { name: 'Submit Output' }).click();

    await expect(page.getByText('Task submission sent.')).toBeVisible();
    expect(submissions).toHaveLength(2);
    expect(submissions[0].note).toBe('Version 2 thin lines');

    // -----------------------------------------------------------------
    // STEPS 20-28: Mangaka logs in, verifies version history and approves
    // -----------------------------------------------------------------
    await authenticate(page, ['Mangaka'], mangakaId, 'Hiroshi Sato');
    await page.goto('/dashboard');
    await page.locator('aside button:has-text("Tasks")').click();

    // Verify version 1 and version 2 are rendered, and version 2 has Latest badge
    await expect(page.getByText('Version 2', { exact: true })).toBeVisible();
    await expect(page.getByText('Version 1', { exact: true })).toBeVisible();
    await expect(page.locator('span', { hasText: 'Latest' })).toBeVisible();

    // Approve the submission
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('Task approved successfully.')).toBeVisible();
    expect(taskStatus).toBe(5); // Approved

    // Reload page and confirm status/history persist
    await page.reload();
    await page.locator('aside button:has-text("Tasks")').click();
    await expect(page.getByText('Approved')).toBeVisible();
    await expect(page.getByText('Version 2', { exact: true })).toBeVisible();
    await expect(page.getByText('Version 1', { exact: true })).toBeVisible();
  });
});

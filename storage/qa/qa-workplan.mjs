// Verify the Workplan "New Activity" modal opens and submits (POST) successfully.
export default async function run(page, ui) {
  const R = { results: {}, errors: [], posts: [] };
  page.on('console', m => { if (m.type() === 'error') R.errors.push(m.text().slice(0, 160)); });
  page.on('request', r => { if (r.method() !== 'GET' && r.url().includes('/api/')) R.posts.push(r.method()); });

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);

  await page.goto('http://localhost:3001/workplan', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);

  const title = 'E2E Activity ' + Date.now();
  R.results.title = title;
  await page.getByRole('button', { name: '+ New Activity' }).click();
  await page.waitForTimeout(1000);

  // the modal renders an "Add New Activity" heading and a title input
  R.results.modalHeading = await page.getByText('Add New Activity').isVisible().catch(() => false);
  const titleInput = page.locator('input[name="title"]').first();
  R.results.titleInputVisible = await titleInput.isVisible().catch(() => false);
  await titleInput.fill(title);
  await page.locator('select[name="priority"]').first().selectOption('high').catch(() => {});
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForTimeout(3500);

  const body = await page.locator('body').innerText();
  R.results.rowAppears = body.includes(title);
  R.results.badTokens = ['undefined', 'NaN', '[object Object]'].filter(t => body.includes(t));

  // persistence
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  R.results.persistsAfterReload = (await page.locator('body').innerText()).includes(title);
  return R;
}

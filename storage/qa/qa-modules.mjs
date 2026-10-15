// Workplan + KPI + Planning year browser flows.
export default async function run(page, ui) {
  const R = { results: {}, errors: [], failed: [] };
  page.on('console', m => { if (m.type() === 'error') R.errors.push(m.text().slice(0, 160)); });
  page.on('response', r => {
    if (r.status() >= 400 && r.url().includes('/api/')) {
      R.failed.push(r.status());
      R.failed.push(r.url());
    }
  });

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);

  // ---- WORKPLAN ----
  await page.goto('http://localhost:3001/workplan', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const wp = await page.locator('body').innerText();
  R.results.workplanHeading = /Annual Work Plan/i.test(wp);
  R.results.workplanBadTokens = ['undefined', 'NaN', '[object Object]'].filter(t => wp.includes(t));
  R.results.workplanNewActivityBtn = await page.getByRole('button', { name: '+ New Activity' }).isVisible().catch(() => false);
  R.results.workplanRowCount = await page.locator('table tbody tr').count();

  // open New Activity modal
  await page.getByRole('button', { name: '+ New Activity' }).click();
  await page.waitForTimeout(800);
  const actModal = page.locator('div.fixed.inset-0').last();
  R.results.activityModalOpened = await actModal.isVisible().catch(() => false);
  R.results.activityModalHasTitle = await actModal.locator('input[name="title"]').isVisible().catch(() => false);
  await actModal.getByRole('button', { name: 'Cancel' }).click().catch(() => {});
  await page.waitForTimeout(400);

  // ---- KPI ----
  await page.goto('http://localhost:3001/kpi', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const kpi = await page.locator('body').innerText();
  R.results.kpiHeading = /KPI/i.test(kpi);
  R.results.kpiBadTokens = ['undefined', 'NaN', '[object Object]'].filter(t => kpi.includes(t));

  // ---- PLANNING YEARS ----
  await page.goto('http://localhost:3001/planning', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const pl = await page.locator('body').innerText();
  R.results.planningHeading = /Planning/i.test(pl);
  R.results.planningBadTokens = ['undefined', 'NaN', '[object Object]'].filter(t => pl.includes(t));
  R.results.planningRows = await page.locator('table tbody tr').count();
  R.results.planningHas2035 = /2035/.test(pl);

  // ---- PROJECTS ----
  await page.goto('http://localhost:3001/projects', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const pj = await page.locator('body').innerText();
  R.results.projectsHeading = /Project/i.test(pj);
  R.results.projectsBadTokens = ['undefined', 'NaN', '[object Object]', '.toFixed'].filter(t => pj.includes(t));

  // ---- RISK ----
  await page.goto('http://localhost:3001/risk-compliance', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const rk = await page.locator('body').innerText();
  R.results.riskHeading = /Risk/i.test(rk);
  R.results.riskBadTokens = ['undefined', 'NaN', '[object Object]'].filter(t => rk.includes(t));

  // ---- COMPLIANCE tab ----
  await page.goto('http://localhost:3001/risk-compliance?tab=compliance', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const cp = await page.locator('body').innerText();
  R.results.complianceRendered = /Compliance/i.test(cp);
  R.results.complianceBadTokens = ['undefined', 'NaN', '[object Object]'].filter(t => cp.includes(t));

  return R;
}

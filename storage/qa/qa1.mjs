// Comprehensive browser QA: login, dashboard cards, organization, employee.
export default async function run(page, ui) {
  const R = { errors: [], results: {} };
  page.on('console', m => { if (m.type() === 'error') R.errors.push(m.text().slice(0, 200)); });

  // ---------- LOGIN: wrong password ----------
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForTimeout(2500);
  R.results.wrongPasswordStayed = !/dashboard/.test(page.url());
  R.results.wrongPasswordErrorShown = await page.locator('text=/invalid|incorrect|unable|failed/i').first().isVisible().catch(() => false);

  // ---------- LOGIN: correct ----------
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20000 }).catch(() => {});
  R.results.loggedInUrl = page.url();
  await page.waitForTimeout(3000);

  // ---------- DASHBOARD ----------
  const bodyText = await page.locator('body').innerText();
  R.results.dashboardBadTokens = ['undefined', 'NaN', '[object Object]'].filter(t => bodyText.includes(t));
  R.results.dashboardHasExecutive = /Executive overview/i.test(bodyText);
  const cardLabels = ['Total Revenue', 'Active Employees', 'High/Critical Risks', 'Projects', 'Budget', 'Compliance', 'KPI'];
  R.results.dashboardCards = {};
  for (const l of cardLabels) R.results.dashboardCards[l] = bodyText.includes(l);

  R.results.dashboardLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => ({ t: (a.innerText || '').trim().slice(0, 40), h: a.getAttribute('href') })).filter(x => x.h));

  // ---------- ORGANIZATION ----------
  await page.goto('http://localhost:3001/organization', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const orgText = await page.locator('body').innerText();
  R.results.orgHeading = /Organization Management/i.test(orgText);
  R.results.orgBadTokens = ['undefined', 'NaN', '[object Object]'].filter(t => orgText.includes(t));
  R.results.orgRowCount = await page.locator('table tbody tr').count();
  R.results.orgStatNumbers = await page.evaluate(() => Array.from(document.querySelectorAll('.text-2xl')).map(e => e.innerText).slice(0, 8));
  R.results.orgApiStatus = await page.evaluate(async () => {
    return await Promise.all([
      fetch('/api/organization/tree').then(x => x.status),
      fetch('/api/organization/employees?includeInactive=1').then(x => x.status),
      fetch('/api/organization/statistics').then(x => x.status),
    ]);
  });

  // ---------- EMPLOYEE TAB ----------
  await page.goto('http://localhost:3001/organization?tab=employees', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  R.results.employeeRows = await page.locator('table tbody tr').count();
  R.results.employeeTabText = (await page.locator('body').innerText()).slice(0, 400);

  return R;
}

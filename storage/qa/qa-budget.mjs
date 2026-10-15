// Budget CRUD + currency default (ETB) + persistence.
export default async function run(page, ui) {
  const R = { results: {}, errors: [] };
  page.on('console', m => { if (m.type() === 'error') R.errors.push(m.text().slice(0, 200)); });

  // login
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // ---------- BUDGET ----------
  await page.goto('http://localhost:3001/budget', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  const txt = await page.locator('body').innerText();
  R.results.budgetHeading = /Budget/i.test(txt);
  R.results.budgetBadTokens = ['undefined', 'NaN', '[object Object]'].filter(t => txt.includes(t));

  // switch to budgets tab
  await page.getByRole('button', { name: 'budgets' }).click().catch(() => {});
  await page.waitForTimeout(1500);

  // open Create Budget modal
  const createBtn = page.getByRole('button', { name: 'Create Budget' });
  R.results.createBudgetBtnVisible = await createBtn.isVisible().catch(() => false);
  await createBtn.click();
  await page.waitForTimeout(800);
  const modal = page.locator('div.fixed.inset-0').last();
  R.results.modalOpened = await modal.isVisible().catch(() => false);

  // currency default must be ETB
  R.results.currencyOptions = await modal.locator('select[name="currencyId"] option').evaluateAll(os => os.map(o => ({ v: o.value, t: o.textContent.trim(), sel: o.selected })));

  const cat = 'E2E Cat ' + Date.now();
  R.results.category = cat;
  await modal.locator('input[name="category"]').fill(cat);
  await modal.locator('input[name="plannedAmount"]').fill('12345.67');
  await modal.getByRole('button', { name: 'Create' }).click();
  await page.waitForTimeout(3500);

  const bodyAfter = await page.locator('body').innerText();
  R.results.successToast = /created successfully/i.test(bodyAfter);
  R.results.rowAppears = bodyAfter.includes(cat);
  R.results.badTokens = ['undefined', 'NaN', '[object Object]'].filter(t => bodyAfter.includes(t));

  // reload then check persistence
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'budgets' }).click().catch(() => {});
  await page.waitForTimeout(1500);
  const bodyReload = await page.locator('body').innerText();
  R.results.persistsAfterReload = bodyReload.includes(cat);

  R.results.apiBudgets = await page.evaluate(async () => {
    const r = await fetch('/api/budget?yearId=10');
    const j = await r.json();
    const list = Array.isArray(j) ? j : (j.data || []);
    return list.slice(-3).map(b => ({ category: b.category, cur: b.currency ? b.currency.code : null, currencyId: b.currencyId }));
  });

  return R;
}

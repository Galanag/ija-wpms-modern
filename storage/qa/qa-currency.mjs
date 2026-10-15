// Currency lifecycle: Settings -> Currencies shows ETB default; create EUR; verify EUR in Budget dropdown; restore ETB.
export default async function run(page, ui) {
  const R = { results: {}, errors: [] };
  page.on('console', m => { if (m.type() === 'error') R.errors.push(m.text().slice(0, 200)); });
  const eurCode = 'EUR';

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);

  // Settings -> Currencies
  await page.goto('http://localhost:3001/settings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Currencies' }).click();
  await page.waitForTimeout(2000);
  let txt = await page.locator('body').innerText();
  R.results.etbListed = /ETB/.test(txt);
  R.results.etbName = /Ethiopian Birr/.test(txt);
  R.results.etbDefaultBadge = /ETB[\s\S]{0,40}Default/.test(txt);
  R.results.usdListed = /USD/.test(txt);
  R.results.eurBefore = new RegExp(eurCode).test(txt);

  // create EUR if not present
  if (!R.results.eurBefore) {
    await page.getByRole('button', { name: 'Add Currency' }).click();
    await page.waitForTimeout(600);
    const form = page.locator('form').last();
    await form.getByPlaceholder('e.g. KES').fill(eurCode);
    await form.getByPlaceholder('e.g. Kenyan Shilling').fill('Euro');
    await form.getByPlaceholder('e.g. Sh, $').fill('€');
    await page.getByRole('button', { name: 'Create Currency' }).click();
    await page.waitForTimeout(2500);
  }
  txt = await page.locator('body').innerText();
  R.results.eurCreated = new RegExp(eurCode).test(txt);
  R.results.eurNotice = /created|updated/i.test(txt);

  // Budget dropdown should now include EUR
  await page.goto('http://localhost:3001/budget', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'budgets' }).click().catch(() => {});
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Create Budget' }).click();
  await page.waitForTimeout(800);
  const modal = page.locator('div.fixed.inset-0').last();
  R.results.budgetCurrencyOptions = await modal.locator('select[name="currencyId"] option').evaluateAll(os => os.map(o => o.textContent.trim()));
  // close modal
  await modal.getByRole('button', { name: 'Cancel' }).click().catch(() => {});

  // restore ETB default via settings
  await page.goto('http://localhost:3001/settings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Currencies' }).click();
  await page.waitForTimeout(1500);
  const etbRow = page.locator('tr', { hasText: 'ETB' }).first();
  const setDefault = etbRow.getByRole('button', { name: 'Set Default' });
  R.results.etbNeedsRestore = await setDefault.isVisible().catch(() => false);

  R.results.defaultViaApi = await page.evaluate(async () => {
    const r = await fetch('/api/currency/default');
    const j = await r.json();
    return j.code;
  });
  return R;
}

const { chromium } = require('@playwright/test');
const BASE = 'https://classspace-uffa.onrender.com';
const screenshots = '/tmp/opencode/audit-shots2';
const issues = [];
const note = (area, msg) => { console.log(`[${area}] ${msg}`); issues.push(`[${area}] ${msg}`); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('dialog', d => d.accept().catch(() => {}));
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  const goto = async (path) => {
    for (let a = 0; a < 3; a++) {
      await page.goto(BASE + path);
      try { await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(1500); return; } catch {}
    }
  };

  // ---- Rep login ----
  await goto('/login');
  await page.locator('input[type="email"]').waitFor({ timeout: 45000 });
  await page.fill('input[type="email"]', 'christian@classspace.app');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*home/, { timeout: 45000 });
  note('login', 'ok, landed on ' + page.url());

  // ---- Space page ----
  await goto('/space/pre220');
  note('space', 'title=' + (await page.locator('h1,h2').first().textContent().catch(() => '?')));
  const tabs = await page.locator('[class*=tab]').allTextContents();
  note('space', 'tabs=' + JSON.stringify(tabs.slice(0, 8)));
  await page.screenshot({ path: screenshots + '/space.png' });

  // Announcement card click -> detail
  const annCard = page.locator('[class*=cursor-pointer]').first();
  if (await annCard.count()) {
    const href = await annCard.getAttribute('class');
    await annCard.click();
    await page.waitForTimeout(2500);
    note('space', 'after card click url=' + page.url());
    await page.screenshot({ path: screenshots + '/ann-detail.png' });
    const header = await page.locator('h1,h2').first().textContent().catch(() => '?');
    note('ann-detail', 'header=' + header.trim());
    // back
    const backBtn = page.locator('button:has-text("←"), a:has-text("←")').first();
    if (await backBtn.count()) { await backBtn.click(); await page.waitForTimeout(1500); note('ann-detail', 'back button clicked, url=' + page.url()); }
    else note('ann-detail', 'NO back button found!');
  } else note('space', 'no clickable card found');

  // ---- Timetable standalone (cancel/restore) ----
  await goto('/timetable');
  await page.waitForTimeout(2000);
  note('timetable', 'url=' + page.url());
  const cancelBtn = page.locator('button:has-text("Cancel class")').first();
  if (await cancelBtn.count()) {
    await cancelBtn.click();
    await page.waitForTimeout(3000);
    const badge = await page.locator('text=❌ Cancelled').count();
    note('timetable', 'after cancel, Cancelled badges=' + badge);
    await page.screenshot({ path: screenshots + '/cancelled.png' });
    const restoreBtn = page.locator('button:has-text("Re-schedule")').first();
    if (await restoreBtn.count()) {
      await restoreBtn.click();
      await page.waitForTimeout(3000);
      note('timetable', 'restore clicked; remaining badges=' + (await page.locator('text=❌ Cancelled').count()));
    } else note('timetable', 'Re-schedule button NOT found after cancel');
  } else note('timetable', 'no Cancel class button on /timetable');

  // ---- Opportunities + detail sheet ----
  await goto('/space/pre220/opportunities');
  await page.waitForTimeout(2000);
  note('opps', 'url=' + page.url() + ' | title=' + (await page.locator('h1,h2').first().textContent().catch(() => '?')));
  const oppCard = page.locator('[class*=cursor-pointer]').first();
  if (await oppCard.count()) {
    await oppCard.click();
    await page.waitForTimeout(2500);
    const sheetTitle = await page.getByText('Opportunity', { exact: true }).count();
    const applyBtn = await page.getByText('Apply Now', { exact: false }).count();
    const descLen = (await page.getByText('Nigeria', { exact: false }).count());
    note('opps', 'sheet open=' + (sheetTitle > 0) + ' | Apply Now=' + applyBtn + ' | desc present=' + (descLen > 0));
    await page.screenshot({ path: screenshots + '/opp-sheet.png' });
  } else note('opps', 'no opportunity card found');

  // ---- Join flow (visitor) ----
  await goto('/logout-nonexistent'); // ensure signed out state by checking
  await goto('/join');
  await page.waitForTimeout(2000);
  const joinInput = page.locator('input').first();
  if (await joinInput.count()) {
    note('join', 'input placeholder=' + (await joinInput.getAttribute('placeholder')));
    await joinInput.fill('pre220');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2500);
    note('join', 'after submit url=' + page.url());
    await page.screenshot({ path: screenshots + '/join-preview.png' });
  } else note('join', 'no input on /join');

  console.log('\n=== PAGE ERRORS ===');
  errs.forEach(e => console.log('ERR:', e.slice(0, 250)));
  if (!errs.length) console.log('none');
  console.log('\n=== FINDINGS (' + issues.length + ') ===');
  issues.forEach(i => console.log(i));
  await browser.close();
})();

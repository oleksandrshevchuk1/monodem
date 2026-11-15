async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = [];
  for (const file of ['index.html', 'admin.html']) {
    await page.goto('http://127.0.0.1:8080/' + file + '?repair=' + Date.now());
    await page.waitForFunction(() => document.querySelector('#screen')?.innerText.trim().length > 20);
    results.push({file, textLength: await page.locator('#screen').innerText().then(t => t.length)});
  }
  if (errors.length) throw new Error(JSON.stringify(errors));
  console.log(JSON.stringify({results, errors}));
}

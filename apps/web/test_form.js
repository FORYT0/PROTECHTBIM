const { chromium } = require('playwright');

(async () => {
    console.log("Launching browser...");
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log("Navigating to Change Orders...");
    await page.goto('http://localhost:8081/change-orders');

    await page.waitForSelector('text=Change Order Management');
    console.log("Page loaded. Clicking 'New Change Order'...");

    await page.waitForSelector('button:has-text("New Change Order")');
    await page.click('button:has-text("New Change Order")');

    console.log("Waiting for modal to appear...");
    await page.waitForSelector('h2:has-text("New Change Order")');

    console.log("Waiting for project loading to clear...");
    await page.waitForTimeout(1000); // Wait for fetch

    console.log("Selecting 'Residential Building'...");
    await page.locator('select').first().selectOption({ label: 'Residential Building' });

    console.log("Waiting for contract to load...");
    await page.waitForTimeout(2000);

    console.log("Taking screenshot...");
    await page.screenshot({ path: 'fixed_form.png' });
    console.log("Done.");

    await browser.close();
})().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});

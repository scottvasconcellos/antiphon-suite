#!/usr/bin/env node
/**
 * Extract conversation from a ChatGPT share URL using Playwright.
 * Usage: node scripts/extract-chatgpt-share.mjs <share-url>
 * Outputs JSON array of { role, text } to stdout.
 */

const shareUrl = process.argv[2] || 'https://chatgpt.com/share/69966e20-27d4-8006-ae3a-8ffa3f7cb826';

async function main() {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(shareUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const messages = await page.evaluate(() => {
      const results = [];
      const byRole = document.querySelectorAll('[data-message-author-role]');
      if (byRole.length) {
        byRole.forEach((el) => {
          const role = el.getAttribute('data-message-author-role') || 'unknown';
          const text = (el.textContent || '').trim();
          if (text) results.push({ role, text });
        });
        return results;
      }
      const fallback = document.querySelectorAll('article, [class*="message"], [class*="Message"]');
      fallback.forEach((el) => {
        const text = (el.textContent || '').trim();
        if (text.length > 20) results.push({ role: 'assistant', text });
      });
      return results;
    });

    if (!messages.length) {
      const bodyText = await page.evaluate(() => document.body?.innerText || '');
      const html = await page.evaluate(() => document.body?.innerHTML?.slice(0, 5000) || '');
      console.error(JSON.stringify({ error: 'no messages found', bodyPreview: bodyText.slice(0, 2000), htmlPreview: html.slice(0, 2000) }));
      process.exit(1);
    }
    console.log(JSON.stringify(messages));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { test, expect } from '@playwright/test';

/**
 * Optional browser smoke checks for the demo (run after `pnpm test:e2e:install`).
 *
 *   PLAYWRIGHT_UI=1 pnpm test:e2e e2e/demo-flow.ui.spec.ts
 *
 * Requires a prior API run or manual setup: set DEMO_E2E_BRIEF_ID, DEMO_E2E_PROPERTY_ID, DEMO_E2E_DEAL_ID.
 */
const hasUi = process.env.PLAYWRIGHT_UI === '1';
const briefId = process.env.DEMO_E2E_BRIEF_ID;
const propertyId = process.env.DEMO_E2E_PROPERTY_ID;
const dealId = process.env.DEMO_E2E_DEAL_ID;

test.describe('Buyer agent demo UI smoke', () => {
  test.skip(!hasUi, 'Set PLAYWRIGHT_UI=1 and run pnpm test:e2e:install');
  test.skip(!briefId || !propertyId || !dealId, 'Set DEMO_E2E_BRIEF_ID, DEMO_E2E_PROPERTY_ID, DEMO_E2E_DEAL_ID');

  test('agent dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /good morning/i })).toBeVisible();
  });

  test('brief matches tab shows lead property', async ({ page }) => {
    await page.goto(`/briefs/${briefId}?tab=matches`);
    await expect(page.getByText(/matches/i).first()).toBeVisible();
    await expect(page.locator(`a[href*="/properties/${propertyId}"]`).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('client portal loads shortlist area', async ({ page }) => {
    await page.goto('/portal');
    await expect(page.getByText(/shortlist|propert/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('deal offer tab', async ({ page }) => {
    await page.goto(`/deals/${dealId}`);
    await page.getByRole('button', { name: /^offer$/i }).click();
    await expect(page.getByText(/offer amount/i)).toBeVisible();
    await expect(page.getByText(/generate offer pdf/i)).toBeVisible();
  });
});

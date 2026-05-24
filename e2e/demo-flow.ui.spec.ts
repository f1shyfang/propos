import { test, expect } from '@playwright/test';
import { resolveDemoIds } from './helpers/demo-ids';

test.describe('Buyer agent demo UI smoke', () => {
  let briefId: string;
  let propertyId: string;
  let dealId: string;

  test.beforeAll(async ({}, testInfo) => {
    const ids = resolveDemoIds();
    if (!ids) {
      testInfo.skip(
        true,
        'Run API demo flow first (pnpm test:e2e) or set DEMO_E2E_BRIEF_ID, DEMO_E2E_PROPERTY_ID, DEMO_E2E_DEAL_ID',
      );
      return;
    }
    briefId = ids.DEMO_E2E_BRIEF_ID;
    propertyId = ids.DEMO_E2E_PROPERTY_ID;
    dealId = ids.DEMO_E2E_DEAL_ID;
  });

  test('agent dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /good morning/i })).toBeVisible();
  });

  test('brief matches tab shows lead property', async ({ page }) => {
    await page.goto(`/briefs/${briefId}?tab=matches`);
    await expect(page.getByText(/review matches/i)).toBeVisible({ timeout: 30_000 });
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
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Offer' }).click();
    await expect(page.getByText(/offer amount/i)).toBeVisible();
    await expect(page.getByText(/generate offer pdf/i)).toBeVisible();
  });
});

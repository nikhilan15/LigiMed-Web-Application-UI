import { test, expect } from '@playwright/test';

test.describe('LigiMed Logistics & Returns E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const mockUser = {
        id: 1,
        name: 'Apollo Pharmacy E2E',
        email: 'apollo@pharmacy.com',
        role: 'pharmacy',
        companyName: 'Apollo Pharmacy Ltd'
      };
      localStorage.setItem('ligimed_user', JSON.stringify(mockUser));
      localStorage.setItem('ligimed_session', JSON.stringify({
        token: 'mock-e2e-jwt-token',
        user: mockUser,
        expiresAt: Date.now() + 86400000
      }));
    });
    await page.reload();
  });

  test('should navigate to Logistics Tracking view', async ({ page }) => {
    await page.getByRole('button', { name: /Logistics/i }).click();

    await expect(page.getByRole('heading', { name: 'Logistics Tracking', exact: true })).toBeVisible();
  });

  test('should navigate to Returns / Reverse Logistics view', async ({ page }) => {
    await page.getByRole('button', { name: /Returns/i }).click();

    await expect(page.getByRole('heading', { name: 'Reverse Logistics', exact: true })).toBeVisible();
  });
});

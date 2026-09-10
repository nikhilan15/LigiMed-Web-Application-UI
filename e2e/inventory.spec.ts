import { test, expect } from '@playwright/test';

test.describe('LigiMed Inventory Management E2E Tests', () => {
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

  test('should navigate to Inventory tab and render inventory management tools', async ({ page }) => {
    await page.getByRole('button', { name: /Inventory/i }).click();

    await expect(page.getByRole('heading', { name: 'Inventory Management', exact: true })).toBeVisible();
  });
});

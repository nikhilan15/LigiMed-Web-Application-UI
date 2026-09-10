import { test, expect } from '@playwright/test';

test.describe('LigiMed Dashboard & Marketplace E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Set authenticated session in localStorage
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

  test('should render pharmacy dashboard overview header and sidebar items', async ({ page }) => {
    await expect(page.getByText('Dashboard').first()).toBeVisible();
    await expect(page.getByText('Apollo Pharmacy Ltd').first()).toBeVisible();

    // Verify sidebar navigation links
    await expect(page.getByRole('button', { name: /Marketplace/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Billing/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Inventory/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Logistics/i })).toBeVisible();
  });

  test('should navigate to Marketplace page and view catalog items', async ({ page }) => {
    await page.getByRole('button', { name: /Marketplace/i }).click();

    // Verify Medicine Marketplace heading with exact match
    await expect(page.getByRole('heading', { name: 'Medicine Marketplace', exact: true })).toBeVisible();
  });

  test('should navigate to Smart Billing and view invoice tools', async ({ page }) => {
    await page.getByRole('button', { name: /Billing/i }).click();

    await expect(page.getByRole('heading', { name: 'Smart Billing', exact: true })).toBeVisible();
    await expect(page.getByText(/Generate invoices and manage customer bills/i)).toBeVisible();
  });
});

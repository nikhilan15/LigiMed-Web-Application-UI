import { test, expect } from '@playwright/test';

test.describe('LigiMed Authentication & Onboarding E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display LigiMed login screen with brand header and tabs', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('LigiMed');
    await expect(page.getByText('AI-Powered B2B Healthcare & Pharmacy Ecosystem')).toBeVisible();

    // Check Role selection tabs
    await expect(page.getByRole('tab', { name: /Pharmacy/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Wholesale/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Pharmacist/i })).toBeVisible();

    // Check Sign In toggle and submit button
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In as Pharmacy' })).toBeVisible();
  });

  test('should show error banner when attempting login with incorrect credentials', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('name@gmail.com').fill('nonexistent@gmail.com');
    await page.getByPlaceholder('Enter password').fill('wrongpassword123');
    await page.getByRole('button', { name: 'Sign In as Pharmacy' }).click();

    // Error message banner should appear
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible({ timeout: 5000 });
  });

  test('should allow switching between Pharmacy and Wholesale Dealer roles', async ({ page }) => {
    await page.goto('/');

    const dealerTab = page.getByRole('tab', { name: /Wholesale/i });
    await dealerTab.click();

    await expect(page.getByText(/Wholesale Dealer - Manage catalog, inventory & bulk pharmacy orders/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In as Dealer' })).toBeVisible();
  });

  test('should register a new pharmacy account and redirect to dashboard', async ({ page }) => {
    await page.goto('/');

    // Switch to Sign Up mode
    await page.getByRole('button', { name: 'Sign Up' }).click();

    const uniqueEmail = `pharmacy_${Date.now()}@gmail.com`;

    // Fill registration fields
    await page.getByPlaceholder('e.g. Apollo Meds Ltd').fill('Test E2E Pharmacy');
    await page.getByPlaceholder('name@gmail.com').fill(uniqueEmail);
    await page.getByPlaceholder('Enter password').fill('Password123!');

    // Click submit button
    await page.getByRole('button', { name: 'Create Pharmacy Account' }).click();

    // Should display success message or navigate to Pharmacy Dashboard
    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
  });
});

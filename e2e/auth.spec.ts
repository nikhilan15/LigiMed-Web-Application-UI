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

  test('should present pharmacist-specific authentication actions', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: /Pharmacist/i }).click();

    await expect(page.getByText(/Licensed Pharmacist - Quality inspection/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In as Pharmacist' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page.getByRole('button', { name: 'Create Pharmacist Account' })).toBeVisible();
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

  test('should complete full KYC onboarding with account credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Register with GST & Drug License/i }).click();

    const uniqueEmail = `kyc_${Date.now()}@gmail.com`;
    const uniquePhone = `9${Date.now().toString().slice(-9)}`;
    await page.getByLabel('Business Name').fill('KYC E2E Pharmacy');
    await page.getByLabel('Owner Name').fill('KYC E2E Owner');
    await page.getByLabel('Phone Number').fill(uniquePhone);
    await page.getByLabel('Email Address').fill(uniqueEmail);
    await page.getByLabel('Business Address').fill('1 Test Street, Chennai');
    await page.getByLabel('Create Password').fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');

    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Submit & Complete' }).click();

    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10000 });
  });
});

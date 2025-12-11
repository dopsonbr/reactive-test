/**
 * Authentication E2E test fixtures for POS
 * @see 045G_POS_E2E_TESTING.md
 */

import type { Page } from '@playwright/test';

/**
 * Test employee credentials
 */
export const TEST_EMPLOYEES = {
  ASSOCIATE: { username: 'testassociate', storeNumber: '100', role: 'Associate', name: 'Test Associate' },
  SUPERVISOR: { username: 'testsupervisor', storeNumber: '100', role: 'Supervisor', name: 'Test Supervisor' },
  MANAGER: { username: 'testmanager', storeNumber: '100', role: 'Manager', name: 'Test Manager' },
  ADMIN: { username: 'testadmin', storeNumber: '100', role: 'Admin', name: 'Test Admin' },
  CONTACT_CENTER: { username: 'testcontact', storeNumber: '100', role: 'Contact Center', name: 'Test Contact' },
  B2B_SALES: { username: 'testb2b', storeNumber: '100', role: 'B2B Sales', name: 'Test B2B' },
} as const;

export type EmployeeType = keyof typeof TEST_EMPLOYEES;

/**
 * Login as a specific employee type
 */
export async function loginAsEmployee(
  page: Page,
  username: string,
  storeNumber: string
): Promise<void> {
  await page.goto('/');

  // Wait for login form to load
  await page.waitForSelector('form', { timeout: 10000 });

  // Fill in credentials
  await page.getByPlaceholder('Enter your username').fill(username);
  await page.getByPlaceholder('1-2000').fill(storeNumber);

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard (root path) - verify by checking for dashboard content
  // The dashboard is at / not /dashboard
  await page.waitForSelector('h1', { timeout: 10000 });
}

/**
 * Login using a predefined employee type
 */
export async function loginAs(page: Page, employeeType: EmployeeType): Promise<void> {
  const employee = TEST_EMPLOYEES[employeeType];
  await loginAsEmployee(page, employee.username, employee.storeNumber);
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.getByTestId('user-menu').click();

  // Click logout
  await page.getByRole('menuitem', { name: /logout|sign out/i }).click();

  // Wait for redirect to login
  await page.waitForURL(/\/(login)?$/, { timeout: 5000 });
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current employee info from the UI
 */
export async function getCurrentEmployee(
  page: Page
): Promise<{ name: string; role: string } | null> {
  const loggedIn = await isLoggedIn(page);
  if (!loggedIn) return null;

  const userMenu = page.getByTestId('user-menu');
  const name = await userMenu.getByTestId('employee-name').textContent();
  const role = await userMenu.getByTestId('employee-role').textContent();

  return { name: name || '', role: role || '' };
}

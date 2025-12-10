/**
 * Authentication E2E test fixtures for POS
 * @see 045G_POS_E2E_TESTING.md
 */

import type { Page } from '@playwright/test';

/**
 * Test employee credentials
 */
export const TEST_EMPLOYEES = {
  ASSOCIATE: { id: 'EMP001', pin: '1234', name: 'Alex Associate' },
  SUPERVISOR: { id: 'EMP002', pin: '5678', name: 'Susan Supervisor' },
  MANAGER: { id: 'EMP003', pin: '9012', name: 'Mike Manager' },
  ADMIN: { id: 'EMP004', pin: '3456', name: 'Amy Admin' },
  CONTACT_CENTER: { id: 'EMP005', pin: '7890', name: 'Carol Contact' },
  B2B_SALES: { id: 'EMP006', pin: '2345', name: 'Bob B2B' },
} as const;

export type EmployeeType = keyof typeof TEST_EMPLOYEES;

/**
 * Login as a specific employee type
 */
export async function loginAsEmployee(
  page: Page,
  employeeId: string,
  pin: string
): Promise<void> {
  await page.goto('/');

  // Wait for login form
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 5000 });

  // Fill in credentials
  await page.getByPlaceholder('Employee ID').fill(employeeId);
  await page.getByPlaceholder('PIN').fill(pin);

  // Submit
  await page.getByRole('button', { name: /login|sign in/i }).click();

  // Wait for redirect to dashboard or transaction page
  await page.waitForURL(/\/(dashboard|transaction)/, { timeout: 5000 });
}

/**
 * Login using a predefined employee type
 */
export async function loginAs(page: Page, employeeType: EmployeeType): Promise<void> {
  const employee = TEST_EMPLOYEES[employeeType];
  await loginAsEmployee(page, employee.id, employee.pin);
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

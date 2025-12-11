/**
 * Mock employee data for POS E2E testing
 * @see 045G_POS_E2E_TESTING.md - Test Data Strategy
 */

import type { EmployeeRole, MarkdownTier } from '../../features/auth/types/roles';

export interface MockEmployee {
  id: string;
  name: string;
  role: EmployeeRole;
  pin: string;
  markdownTier: MarkdownTier;
  storeNumber: number;
  email: string;
  isActive: boolean;
}

export const mockEmployees: MockEmployee[] = [
  {
    id: 'EMP001',
    name: 'Alex Associate',
    role: 'ASSOCIATE',
    pin: '1234',
    markdownTier: 'ASSOCIATE',
    storeNumber: 1234,
    email: 'alex.associate@store.com',
    isActive: true,
  },
  {
    id: 'EMP002',
    name: 'Susan Supervisor',
    role: 'SUPERVISOR',
    pin: '5678',
    markdownTier: 'SUPERVISOR',
    storeNumber: 1234,
    email: 'susan.supervisor@store.com',
    isActive: true,
  },
  {
    id: 'EMP003',
    name: 'Mike Manager',
    role: 'MANAGER',
    pin: '9012',
    markdownTier: 'MANAGER',
    storeNumber: 1234,
    email: 'mike.manager@store.com',
    isActive: true,
  },
  {
    id: 'EMP004',
    name: 'Amy Admin',
    role: 'ADMIN',
    pin: '3456',
    markdownTier: 'ADMIN',
    storeNumber: 1234,
    email: 'amy.admin@store.com',
    isActive: true,
  },
  {
    id: 'EMP005',
    name: 'Carol Contact',
    role: 'CONTACT_CENTER',
    pin: '7890',
    markdownTier: 'SUPERVISOR',
    storeNumber: 9999, // Contact center
    email: 'carol.contact@store.com',
    isActive: true,
  },
  {
    id: 'EMP006',
    name: 'Bob B2B',
    role: 'B2B_SALES',
    pin: '2345',
    markdownTier: 'SUPERVISOR',
    storeNumber: 9999, // B2B sales
    email: 'bob.b2b@store.com',
    isActive: true,
  },
];

export function findEmployeeById(id: string): MockEmployee | undefined {
  return mockEmployees.find((emp) => emp.id === id);
}

export function findEmployeeByIdAndPin(id: string, pin: string): MockEmployee | undefined {
  return mockEmployees.find((emp) => emp.id === id && emp.pin === pin);
}

export function getMarkdownLimit(tier: MarkdownTier): number {
  const limits: Record<MarkdownTier, number> = {
    ASSOCIATE: 15,
    SUPERVISOR: 25,
    MANAGER: 50,
    ADMIN: 100,
  };
  return limits[tier];
}

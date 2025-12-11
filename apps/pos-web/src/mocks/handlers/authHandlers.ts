/**
 * Authentication MSW handlers for POS E2E testing
 */

import { http, HttpResponse, delay } from 'msw';
import { findEmployeeByIdAndPin, findEmployeeById, getMarkdownLimit } from '../data/employees';

export const authHandlers = [
  // Employee login
  http.post('*/api/auth/login', async ({ request }) => {
    await delay(100);

    const body = (await request.json()) as { employeeId: string; pin: string };
    const employee = findEmployeeByIdAndPin(body.employeeId, body.pin);

    if (!employee) {
      return HttpResponse.json(
        { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    if (!employee.isActive) {
      return HttpResponse.json(
        { error: 'Account is inactive', code: 'ACCOUNT_INACTIVE' },
        { status: 403 }
      );
    }

    return HttpResponse.json({
      token: `mock-jwt-${employee.id}`,
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        markdownTier: employee.markdownTier,
        storeNumber: employee.storeNumber,
        email: employee.email,
        permissions: {
          maxMarkdownPercent: getMarkdownLimit(employee.markdownTier),
          canVoidTransaction: ['MANAGER', 'ADMIN'].includes(employee.role),
          canApproveOverride: ['SUPERVISOR', 'MANAGER', 'ADMIN'].includes(employee.role),
          canProcessReturn: true,
          canCreateB2BOrder: ['B2B_SALES', 'MANAGER', 'ADMIN'].includes(employee.role),
        },
      },
    });
  }),

  // Employee logout
  http.post('*/api/auth/logout', async () => {
    await delay(50);
    return HttpResponse.json({ success: true });
  }),

  // Validate manager override
  http.post('*/api/auth/validate-override', async ({ request }) => {
    await delay(150);

    const body = (await request.json()) as {
      managerId: string;
      pin: string;
      requiredPermission: string;
      requestedValue?: number;
    };

    const manager = findEmployeeByIdAndPin(body.managerId, body.pin);

    if (!manager) {
      return HttpResponse.json(
        { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Check if manager can approve overrides
    if (!['SUPERVISOR', 'MANAGER', 'ADMIN'].includes(manager.role)) {
      return HttpResponse.json(
        { error: 'Not authorized to approve overrides', code: 'NOT_AUTHORIZED' },
        { status: 403 }
      );
    }

    // For markdown overrides, check if manager's tier allows the requested value
    if (body.requiredPermission === 'markdown' && body.requestedValue) {
      const managerLimit = getMarkdownLimit(manager.markdownTier);
      if (body.requestedValue > managerLimit) {
        return HttpResponse.json(
          {
            error: `Exceeds authority (max ${managerLimit}%)`,
            code: 'EXCEEDS_AUTHORITY',
            maxAllowed: managerLimit,
          },
          { status: 403 }
        );
      }
    }

    return HttpResponse.json({
      authorized: true,
      authorizedBy: manager.id,
      authorizerName: manager.name,
      authorizerRole: manager.role,
    });
  }),

  // Get current session
  http.get('*/api/auth/session', async ({ request }) => {
    await delay(50);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer mock-jwt-')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = authHeader.replace('Bearer mock-jwt-', '');
    const employee = findEmployeeById(employeeId);

    if (!employee) {
      return HttpResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    return HttpResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        markdownTier: employee.markdownTier,
        storeNumber: employee.storeNumber,
        permissions: {
          maxMarkdownPercent: getMarkdownLimit(employee.markdownTier),
          canVoidTransaction: ['MANAGER', 'ADMIN'].includes(employee.role),
          canApproveOverride: ['SUPERVISOR', 'MANAGER', 'ADMIN'].includes(employee.role),
        },
      },
    });
  }),
];

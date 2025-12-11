import { http, HttpResponse, delay } from 'msw';
import { DEV_TEST_USERS } from '../features/auth/config';

// Helper to create a mock JWT token
function createMockToken(username: string, permissions: string[]): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: username,
    username,
    permissions,
    store_number: 1234,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
  };

  // Create a simple base64-encoded mock JWT (not cryptographically valid, but works for mocking)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const mockSignature = btoa('mock-signature');

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

export const handlers = [
  // Mock authentication endpoint
  http.post('*/token', async ({ request }) => {
    await delay(100); // Simulate network latency

    const body = await request.json() as { username: string; userType: string; storeNumber: number };
    const { username } = body;

    // Find the user in test users
    const testUser = DEV_TEST_USERS.find((u) => u.username === username);

    if (!testUser) {
      return new HttpResponse(
        JSON.stringify({ message: 'Invalid credentials', code: 'AUTH_FAILED' }),
        { status: 401 }
      );
    }

    // Create mock JWT token with user's permissions
    const accessToken = createMockToken(username, testUser.permissions);

    return HttpResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    });
  }),
];

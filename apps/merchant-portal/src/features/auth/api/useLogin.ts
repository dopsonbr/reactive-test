import { useMutation } from '@tanstack/react-query';

interface LoginResponse {
  access_token: string;
}

interface LoginRequest {
  username: string;
  userType?: string;
  storeNumber?: number;
}

export function useLogin(authUrl: string) {
  return useMutation({
    mutationFn: async ({ username, userType = 'EMPLOYEE', storeNumber = 1234 }: LoginRequest): Promise<LoginResponse> => {
      const response = await fetch(`${authUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userType, storeNumber }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      return response.json();
    },
  });
}

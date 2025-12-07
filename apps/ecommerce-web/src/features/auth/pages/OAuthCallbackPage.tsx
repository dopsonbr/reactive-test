import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { logger } from '../../../shared/utils/logger';

/**
 * OAuth callback page that handles the authorization code exchange.
 * This page is loaded after the user completes OAuth authorization.
 */
export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Get query parameters from URL
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');

  useEffect(() => {
    // Check for OAuth error
    if (errorParam) {
      logger.error('OAuth authorization error', { error: errorParam, description: errorDescription });
      setError(errorDescription || errorParam);
      // Redirect to home after delay
      setTimeout(() => navigate({ to: '/' }), 3000);
      return;
    }

    // Validate state parameter (CSRF protection)
    const savedState = sessionStorage.getItem('oauth_state');
    if (state && savedState && state !== savedState) {
      logger.error('OAuth state mismatch - possible CSRF attack');
      setError('Invalid state parameter. Please try logging in again.');
      setTimeout(() => navigate({ to: '/' }), 3000);
      return;
    }

    // Exchange code for token
    if (code) {
      handleOAuthCallback(code)
        .then(() => {
          navigate({ to: '/' });
        })
        .catch((err) => {
          logger.error('OAuth callback failed', err);
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setTimeout(() => navigate({ to: '/' }), 3000);
        });
    } else if (!errorParam) {
      // No code and no error - invalid callback
      setError('Invalid callback - no authorization code received');
      setTimeout(() => navigate({ to: '/' }), 3000);
    }
  }, [code, errorParam, errorDescription, state, handleOAuthCallback, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6">
          <div className="rounded-full bg-destructive/10 p-3 mx-auto w-fit mb-4">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

export { apiClient } from './lib/api-client';
export { ApiError } from './lib/errors';
export {
  graphqlRequest,
  subscribeToCart,
  subscriptionClient,
  getGraphQLHeaders,
} from './lib/graphql-client';

// Generated API client types can be added here after running `pnpm generate:api`
export const API_CLIENT_VERSION = '0.0.1';

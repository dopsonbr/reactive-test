import type { Story } from '@ladle/react';
import { ErrorCard } from '../../src/shared/components/ErrorCard';

export default {
  title: 'Features/Shared/ErrorCard',
};

export const Default: Story = () => (
  <div className="max-w-md">
    <ErrorCard
      error={new Error('Something went wrong')}
      onRetry={() => alert('Retrying...')}
    />
  </div>
);

export const WithoutRetry: Story = () => (
  <div className="max-w-md">
    <ErrorCard error={new Error('Network error: Unable to connect')} />
  </div>
);

export const NullError: Story = () => (
  <div className="max-w-md">
    <ErrorCard error={null} onRetry={() => alert('Retrying...')} />
  </div>
);

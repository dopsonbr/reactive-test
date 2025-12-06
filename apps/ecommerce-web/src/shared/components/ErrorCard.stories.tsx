import type { Story } from '@ladle/react';
import { ErrorCard } from './ErrorCard';

export const Default: Story = () => (
  <div className="max-w-md">
    <ErrorCard error={new Error('Something went wrong while fetching data')} />
  </div>
);

export const WithRetry: Story = () => (
  <div className="max-w-md">
    <ErrorCard
      error={new Error('Network request failed')}
      onRetry={() => console.log('Retry clicked')}
    />
  </div>
);

export const NullError: Story = () => (
  <div className="max-w-md">
    <ErrorCard error={null} />
  </div>
);

export const LongMessage: Story = () => (
  <div className="max-w-md">
    <ErrorCard
      error={new Error('A very long error message that explains in detail what went wrong and provides additional context about the failure that occurred during the operation.')}
      onRetry={() => {}}
    />
  </div>
);

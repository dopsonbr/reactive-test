import type { Story } from '@ladle/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyCart } from './EmptyCart';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

export const Default: Story = () => (
  <Wrapper>
    <div className="container mx-auto py-8">
      <EmptyCart />
    </div>
  </Wrapper>
);

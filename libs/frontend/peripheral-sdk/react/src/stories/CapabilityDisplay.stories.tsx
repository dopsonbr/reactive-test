import type { Story } from '@ladle/react';

function MockProvider({ children }: { children: React.ReactNode }) {
  // In stories, we mock the provider behavior
  return (
    <div style={{ border: '2px dashed #ccc', padding: '1rem', borderRadius: '8px' }}>
      <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
        ⚠️ Mock mode - Start emulator for real connection
      </div>
      {children}
    </div>
  );
}

export const Default: Story = () => (
  <MockProvider>
    <div style={{ fontFamily: 'system-ui', padding: '1rem' }}>
      <h2>Device Capabilities</h2>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Connection:</strong>{' '}
        <span style={{ color: 'orange' }}>○ Mock Mode</span>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>🔍 Scanner</h3>
          <p>Available: ✓</p>
          <p>Symbologies: ean13, upc-a, qr, pdf417</p>
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>💳 Payment</h3>
          <p>Available: ✓</p>
          <p>Methods: chip, contactless, swipe</p>
        </div>
      </div>
    </div>
  </MockProvider>
);
Default.storyName = 'Capability Display';

import type { Story } from '@ladle/react';
import { useState } from 'react';

interface MockScanEvent {
  barcode: string;
  symbology: string;
  timestamp: string;
}

function ScannerDemoInner() {
  const [enabled, setEnabled] = useState(false);
  const [scans, setScans] = useState<MockScanEvent[]>([]);

  const handleTriggerScan = () => {
    if (!enabled) return;
    const event: MockScanEvent = {
      barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
      symbology: 'ean13',
      timestamp: new Date().toISOString(),
    };
    setScans((prev) => [event, ...prev].slice(0, 10));
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '1rem', maxWidth: '500px' }}>
      <h2>🔍 Scanner Demo</h2>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setEnabled(!enabled)}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            background: enabled ? '#ef4444' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {enabled ? 'Disable' : 'Enable'} Scanner
        </button>

        <button
          onClick={handleTriggerScan}
          disabled={!enabled}
          style={{
            padding: '0.5rem 1rem',
            background: enabled ? '#3b82f6' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: enabled ? 'pointer' : 'not-allowed',
          }}
        >
          Simulate Scan
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        Status:{' '}
        <span style={{ color: enabled ? 'green' : 'gray' }}>
          {enabled ? '● Enabled' : '○ Disabled'}
        </span>
      </div>

      <div>
        <h3>Recent Scans</h3>
        {scans.length === 0 ? (
          <p style={{ color: '#666' }}>No scans yet. Enable scanner and click "Simulate Scan".</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {scans.map((scan, i) => (
              <li
                key={i}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}
              >
                {scan.barcode} ({scan.symbology})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const Default: Story = () => <ScannerDemoInner />;
Default.storyName = 'Scanner Demo';

export const WithPreloadedScans: Story = () => {
  const preloadedScans: MockScanEvent[] = [
    { barcode: '0012345678905', symbology: 'ean13', timestamp: new Date().toISOString() },
    { barcode: '5901234123457', symbology: 'ean13', timestamp: new Date().toISOString() },
  ];

  return (
    <div style={{ fontFamily: 'system-ui', padding: '1rem', maxWidth: '500px' }}>
      <h2>🔍 Scanner Demo (Preloaded)</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {preloadedScans.map((scan, i) => (
          <li
            key={i}
            style={{
              padding: '0.5rem',
              marginBottom: '0.5rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          >
            {scan.barcode} ({scan.symbology})
          </li>
        ))}
      </ul>
    </div>
  );
};

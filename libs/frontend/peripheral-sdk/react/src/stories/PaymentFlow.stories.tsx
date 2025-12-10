import type { Story } from '@ladle/react';
import { useState } from 'react';

type PaymentState =
  | 'idle'
  | 'card_presented'
  | 'reading_card'
  | 'pin_required'
  | 'pin_entry'
  | 'authorizing'
  | 'approved'
  | 'declined';

const stateLabels: Record<PaymentState, string> = {
  idle: 'Ready for payment',
  card_presented: 'Card detected...',
  reading_card: 'Reading card...',
  pin_required: 'Enter PIN on terminal',
  pin_entry: 'PIN being entered...',
  authorizing: 'Authorizing payment...',
  approved: '✓ Payment Approved!',
  declined: '✗ Payment Declined',
};

const stateColors: Record<PaymentState, string> = {
  idle: '#666',
  card_presented: '#3b82f6',
  reading_card: '#3b82f6',
  pin_required: '#f59e0b',
  pin_entry: '#f59e0b',
  authorizing: '#8b5cf6',
  approved: '#10b981',
  declined: '#ef4444',
};

function PaymentFlowInner() {
  const [state, setState] = useState<PaymentState>('idle');
  const [amount] = useState(4750);

  const simulatePayment = async () => {
    const states: PaymentState[] = [
      'card_presented',
      'reading_card',
      'pin_required',
      'pin_entry',
      'authorizing',
      'approved',
    ];

    for (const s of states) {
      setState(s);
      await new Promise((r) => setTimeout(r, 1000));
    }

    setTimeout(() => setState('idle'), 3000);
  };

  const simulateDecline = async () => {
    const states: PaymentState[] = [
      'card_presented',
      'reading_card',
      'authorizing',
      'declined',
    ];

    for (const s of states) {
      setState(s);
      await new Promise((r) => setTimeout(r, 800));
    }

    setTimeout(() => setState('idle'), 3000);
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '1rem', maxWidth: '400px' }}>
      <h2>💳 Payment Flow Demo</h2>

      <div
        style={{
          padding: '2rem',
          background: '#f5f5f5',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          ${(amount / 100).toFixed(2)}
        </div>
        <div
          style={{
            color: stateColors[state],
            fontSize: '1.25rem',
            fontWeight: 500,
          }}
        >
          {stateLabels[state]}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={simulatePayment}
          disabled={state !== 'idle'}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: state === 'idle' ? '#10b981' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state === 'idle' ? 'pointer' : 'not-allowed',
          }}
        >
          Simulate Approval
        </button>
        <button
          onClick={simulateDecline}
          disabled={state !== 'idle'}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: state === 'idle' ? '#ef4444' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state === 'idle' ? 'pointer' : 'not-allowed',
          }}
        >
          Simulate Decline
        </button>
      </div>
    </div>
  );
}

export const Default: Story = () => <PaymentFlowInner />;
Default.storyName = 'Payment Flow';

export const AllStates: Story = () => {
  const states: PaymentState[] = [
    'idle',
    'card_presented',
    'reading_card',
    'pin_required',
    'pin_entry',
    'authorizing',
    'approved',
    'declined',
  ];

  return (
    <div style={{ fontFamily: 'system-ui', padding: '1rem' }}>
      <h2>Payment States Reference</h2>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {states.map((state) => (
          <div
            key={state}
            style={{
              padding: '1rem',
              background: '#f5f5f5',
              borderRadius: '8px',
              borderLeft: `4px solid ${stateColors[state]}`,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{state}</div>
            <div style={{ color: stateColors[state] }}>{stateLabels[state]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
AllStates.storyName = 'All Payment States';

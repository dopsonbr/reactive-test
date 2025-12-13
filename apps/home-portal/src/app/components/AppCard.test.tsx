import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppCard } from './AppCard';
import { Application } from '../types';

const activeApp: Application = {
  id: 'test-app',
  title: 'Test Application',
  description: 'A test application description',
  url: 'http://localhost:3000',
  status: 'active',
  icon: '🧪',
};

const comingSoonApp: Application = {
  id: 'coming-soon-app',
  title: 'Coming Soon App',
  description: 'This app is coming soon',
  url: '#',
  status: 'coming-soon',
  icon: '🔜',
};

describe('AppCard', () => {
  it('renders active application correctly', () => {
    const onNavigate = vi.fn();
    render(<AppCard application={activeApp} onNavigate={onNavigate} />);

    expect(screen.getByText('Test Application')).toBeInTheDocument();
    expect(screen.getByText('A test application description')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('🧪')).toBeInTheDocument();
  });

  it('renders coming soon application correctly', () => {
    const onNavigate = vi.fn();
    render(<AppCard application={comingSoonApp} onNavigate={onNavigate} />);

    expect(screen.getByText('Coming Soon App')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('calls onNavigate when clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<AppCard application={activeApp} onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button'));

    expect(onNavigate).toHaveBeenCalledWith(activeApp);
  });

  it('has correct aria-label for active app', () => {
    const onNavigate = vi.fn();
    render(<AppCard application={activeApp} onNavigate={onNavigate} />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Test Application - Click to open'
    );
  });

  it('has correct aria-label for coming soon app', () => {
    const onNavigate = vi.fn();
    render(<AppCard application={comingSoonApp} onNavigate={onNavigate} />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Coming Soon App - Coming soon'
    );
  });
});

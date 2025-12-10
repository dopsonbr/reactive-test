import { Outlet } from '@tanstack/react-router';
import { useKioskSession } from '../../features/session';
import { TimeoutWarningDialog } from '../../features/session';
import { KioskHeader } from './KioskHeader';
import { KioskFooter } from './KioskFooter';

export function KioskLayout() {
  const { updateActivity } = useKioskSession();

  // Track user activity on any interaction
  const handleActivity = () => {
    updateActivity();
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      onClick={handleActivity}
      onTouchStart={handleActivity}
      onKeyDown={handleActivity}
    >
      <KioskHeader />

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <KioskFooter />

      {/* Global timeout warning dialog */}
      <TimeoutWarningDialog />
    </div>
  );
}

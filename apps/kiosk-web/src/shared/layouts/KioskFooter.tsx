import { HelpCircle } from 'lucide-react';
import { Button } from '@reactive-platform/shared-ui/ui-components';

export function KioskFooter() {
  const handleHelp = () => {
    // TODO: Implement help modal or call assistance
    alert('An associate has been notified and will assist you shortly.');
  };

  return (
    <footer className="bg-muted border-t border-border">
      <div className="h-16 px-6 flex items-center justify-between">
        <div className="text-kiosk-sm text-muted-foreground">
          Need help? Touch the Help button
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={handleHelp}
          className="h-12 gap-2"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-kiosk-base">Help</span>
        </Button>
      </div>
    </footer>
  );
}

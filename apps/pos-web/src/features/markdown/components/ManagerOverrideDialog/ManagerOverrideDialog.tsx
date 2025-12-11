import { useState, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useMarkdownPermissions } from '../../context/MarkdownPermissionContext';
import type { MarkdownRequest } from '../../types/markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
  cn,
} from '@reactive-platform/shared-ui-components';

interface ManagerOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: MarkdownRequest | null;
  onAuthorized: () => void;
}

export function ManagerOverrideDialog({
  open,
  onOpenChange,
  request,
  onAuthorized,
}: ManagerOverrideDialogProps) {
  const { authorizeOverride } = useMarkdownPermissions();

  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = useCallback(async () => {
    if (!userId.trim() || !pin.trim()) {
      setError('Please enter both User ID and PIN');
      return;
    }

    setIsAuthorizing(true);
    setError(null);

    try {
      const result = await authorizeOverride({ userId, pin });

      if (result.authorized) {
        onAuthorized();
        onOpenChange(false);
        // Reset form
        setUserId('');
        setPin('');
      } else {
        setError(result.message || 'Authorization failed');
      }
    } catch {
      setError('Authorization failed. Please try again.');
    } finally {
      setIsAuthorizing(false);
    }
  }, [userId, pin, authorizeOverride, onAuthorized, onOpenChange]);

  const handleClose = useCallback(() => {
    setUserId('');
    setPin('');
    setError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            Manager Override Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Override Request Info */}
          {request && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Override Request</p>
                <p className="text-sm text-muted-foreground">
                  {request.type === 'PERCENTAGE' && `${request.value}% discount`}
                  {request.type === 'FIXED_AMOUNT' && `${formatCurrency(request.value)} off`}
                  {request.type === 'OVERRIDE_PRICE' && `Override to ${formatCurrency(request.value)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reason: {request.reason}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Manager Credentials */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manager-id">Manager User ID</Label>
              <Input
                id="manager-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter manager ID"
                autoComplete="off"
                disabled={isAuthorizing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-pin">Manager PIN</Label>
              <Input
                id="manager-pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                autoComplete="off"
                disabled={isAuthorizing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAuthorize();
                  }
                }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            A manager or supervisor must authorize this markdown. Their credentials will be logged for audit purposes.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isAuthorizing}>
            Cancel
          </Button>
          <Button
            onClick={handleAuthorize}
            disabled={isAuthorizing || !userId.trim() || !pin.trim()}
            className={cn(isAuthorizing && 'opacity-70')}
          >
            {isAuthorizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authorizing...
              </>
            ) : (
              'Authorize'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

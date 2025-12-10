import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Alert,
} from '@reactive-platform/shared-ui/ui-components';
import { logger } from '../../../shared/utils/logger';

export interface ReceiptOptionsProps {
  orderId: string;
}

type ReceiptOption = 'print' | 'email' | 'none';

export function ReceiptOptions({ orderId }: ReceiptOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<ReceiptOption | null>(null);
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePrint = () => {
    logger.info('Printing receipt', { orderId });
    setIsProcessing(true);

    // Simulate print delay
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      logger.info('Receipt printed', { orderId });
    }, 1500);
  };

  const handleEmail = () => {
    if (!email || !email.includes('@')) {
      return;
    }

    logger.info('Sending receipt via email', { orderId, email });
    setIsProcessing(true);

    // Simulate email send delay
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      setSelectedOption(null);
      setEmail('');
      logger.info('Receipt emailed', { orderId, email });
    }, 1500);
  };

  const handleNoReceipt = () => {
    logger.info('No receipt requested', { orderId });
    setSuccess(true);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Receipt Options</h3>

      {success && (
        <Alert variant="success" title="Receipt Sent">
          {selectedOption === 'print' && 'Your receipt has been printed.'}
          {selectedOption === 'email' && 'Your receipt has been sent to your email.'}
          {selectedOption === 'none' && 'No receipt will be provided.'}
        </Alert>
      )}

      <div className="grid gap-3">
        {/* Print Receipt */}
        <Button
          onClick={handlePrint}
          disabled={isProcessing || success}
          size="lg"
          variant="outline"
          className="h-auto justify-start p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖨️</span>
            <div>
              <p className="font-semibold">Print Receipt</p>
              <p className="text-sm text-muted-foreground">
                Get a printed copy now
              </p>
            </div>
          </div>
        </Button>

        {/* Email Receipt */}
        <Button
          onClick={() => setSelectedOption('email')}
          disabled={isProcessing || success}
          size="lg"
          variant="outline"
          className="h-auto justify-start p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div>
              <p className="font-semibold">Email Receipt</p>
              <p className="text-sm text-muted-foreground">
                Send to your email address
              </p>
            </div>
          </div>
        </Button>

        {/* No Receipt */}
        <Button
          onClick={handleNoReceipt}
          disabled={isProcessing || success}
          size="lg"
          variant="outline"
          className="h-auto justify-start p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <p className="font-semibold">No Receipt</p>
              <p className="text-sm text-muted-foreground">
                Continue without receipt
              </p>
            </div>
          </div>
        </Button>
      </div>

      {/* Email Dialog */}
      <Dialog open={selectedOption === 'email'} onOpenChange={(open) => !open && setSelectedOption(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Receipt</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedOption(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmail}
              disabled={!email || !email.includes('@') || isProcessing}
            >
              {isProcessing ? 'Sending...' : 'Send Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

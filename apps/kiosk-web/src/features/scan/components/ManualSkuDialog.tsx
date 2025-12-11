import { useState } from 'react';
import {
  Button,
  NumericKeypad,
} from '@reactive-platform/shared-ui/ui-components';

export interface ManualSkuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sku: string) => void;
}

/**
 * Full-screen dialog for manual SKU entry
 *
 * Features:
 * - Large numeric keypad for easy touch input
 * - SKU display field at top
 * - Submit and Cancel buttons
 */
export function ManualSkuDialog({
  isOpen,
  onClose,
  onSubmit,
}: ManualSkuDialogProps) {
  const [sku, setSku] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleKeypadInput = (value: string) => {
    setSku(value);
  };

  const handleSubmit = () => {
    if (sku.trim().length > 0) {
      onSubmit(sku.trim());
      setSku('');
      onClose();
    }
  };

  const handleCancel = () => {
    setSku('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-background w-full h-full max-w-4xl max-h-screen p-8 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-foreground mb-2">
            Enter SKU Manually
          </h2>
          <p className="text-secondary text-xl">
            Use the keypad below to enter the product SKU
          </p>
        </div>

        {/* SKU Display */}
        <div className="mb-8 p-6 bg-background-secondary rounded-lg">
          <label className="text-secondary text-lg block mb-2">SKU:</label>
          <div className="text-5xl font-mono font-bold text-foreground min-h-[4rem] flex items-center">
            {sku || <span className="text-secondary">-</span>}
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <NumericKeypad
            value={sku}
            onChange={handleKeypadInput}
            maxLength={20}
            allowLetters
            size="lg"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="kiosk"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="kiosk"
            onClick={handleSubmit}
            disabled={sku.trim().length === 0}
            className="flex-1"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

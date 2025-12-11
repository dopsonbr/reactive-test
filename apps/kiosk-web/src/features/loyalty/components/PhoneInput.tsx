import { useMemo } from 'react';
import { NumericKeypad } from '@reactive-platform/shared-ui/ui-components';

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * PhoneInput component for kiosk loyalty lookup
 * - Displays formatted phone: (555) 123-4567
 * - Uses NumericKeypad from ui-components
 * - Auto-formats as user types
 * - Validates 10-digit US phone
 */
export function PhoneInput({ value, onChange }: PhoneInputProps) {
  // Format phone number for display: (555) 123-4567
  const formattedPhone = useMemo(() => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }, [value]);

  // Handle numeric input - strip formatting, store digits only
  const handleChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (digits.length <= 10) {
      onChange(digits);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <div className="text-6xl font-bold tracking-wider min-h-[80px] flex items-center justify-center text-primary">
          {formattedPhone || 'Enter Phone Number'}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {value.length}/10 digits
        </p>
      </div>

      <NumericKeypad
        value={value}
        onChange={handleChange}
        maxLength={10}
        showDecimal={false}
      />
    </div>
  );
}

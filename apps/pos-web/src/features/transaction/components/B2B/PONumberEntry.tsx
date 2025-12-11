import { useState, useEffect } from 'react';
import { FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  Input,
  Label,
  cn,
} from '@reactive-platform/shared-ui-components';

interface PONumberEntryProps {
  value: string;
  onChange: (poNumber: string) => void;
  isRequired: boolean;
  onValidate?: (poNumber: string) => Promise<boolean>;
}

export function PONumberEntry({
  value,
  onChange,
  isRequired,
  onValidate,
}: PONumberEntryProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      setValidationResult(null);
      setError(null);
      return;
    }

    if (!onValidate) {
      setValidationResult('valid');
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const isValid = await onValidate(value);
        setValidationResult(isValid ? 'valid' : 'invalid');
        setError(isValid ? null : 'PO number not recognized');
      } catch {
        setValidationResult('invalid');
        setError('Failed to validate PO number');
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, onValidate]);

  const getIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (validationResult === 'valid') {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (validationResult === 'invalid') {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="poNumber">
        Purchase Order #
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          id="poNumber"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter PO number"
          className={cn(
            'pr-10',
            validationResult === 'invalid' && 'border-destructive'
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getIcon()}
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {!error && isRequired && !value && (
        <p className="text-xs text-muted-foreground">
          Required for Enterprise accounts
        </p>
      )}
    </div>
  );
}

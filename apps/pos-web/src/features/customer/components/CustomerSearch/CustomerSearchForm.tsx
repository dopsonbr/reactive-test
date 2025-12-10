import { Search, X } from 'lucide-react';
import {
  Input,
  Button,
} from '@reactive-platform/shared-ui-components';

interface CustomerSearchFormProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CustomerSearchForm({
  value,
  onChange,
  placeholder = 'Search by name, email, phone, or company...',
  autoFocus = false,
}: CustomerSearchFormProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
        autoFocus={autoFocus}
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}

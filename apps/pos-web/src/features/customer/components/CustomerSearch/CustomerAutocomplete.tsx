import { useState, useRef, useEffect } from 'react';
import { Search, User, Building2, Loader2 } from 'lucide-react';
import { useCustomerAutocomplete } from '../../hooks/useCustomerAutocomplete';
import type { CustomerSuggestion } from '../../types/customer';
import {
  Input,
  Badge,
  cn,
} from '@reactive-platform/shared-ui-components';

interface CustomerAutocompleteProps {
  onSelect: (customer: CustomerSuggestion) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function CustomerAutocomplete({
  onSelect,
  placeholder = 'Search customers...',
  autoFocus = false,
  className,
}: CustomerAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { query, setQuery, suggestions, isLoading, clear } = useCustomerAutocomplete();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions]);

  const handleSelect = (suggestion: CustomerSuggestion) => {
    onSelect(suggestion);
    clear();
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const getTierBadge = (suggestion: CustomerSuggestion) => {
    if (suggestion.type === 'CONSUMER' && suggestion.loyaltyTier) {
      const tierColors: Record<string, string> = {
        BRONZE: 'bg-amber-100 text-amber-800',
        SILVER: 'bg-gray-100 text-gray-800',
        GOLD: 'bg-yellow-100 text-yellow-800',
        PLATINUM: 'bg-violet-100 text-violet-800',
      };
      return (
        <Badge variant="secondary" className={cn('text-xs', tierColors[suggestion.loyaltyTier])}>
          {suggestion.loyaltyTier}
        </Badge>
      );
    }
    if (suggestion.type === 'BUSINESS' && suggestion.accountTier) {
      const tierColors: Record<string, string> = {
        STANDARD: 'bg-slate-100 text-slate-800',
        PREFERRED: 'bg-blue-100 text-blue-800',
        PREMIER: 'bg-indigo-100 text-indigo-800',
        ENTERPRISE: 'bg-purple-100 text-purple-800',
      };
      return (
        <Badge variant="secondary" className={cn('text-xs', tierColors[suggestion.accountTier])}>
          {suggestion.accountTier}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
          autoFocus={autoFocus}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.customerId}
                className={cn(
                  'px-3 py-2 cursor-pointer',
                  index === highlightedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                )}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex items-center gap-3">
                  {suggestion.type === 'BUSINESS' ? (
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{suggestion.name}</span>
                      {getTierBadge(suggestion)}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {suggestion.email}
                      {suggestion.phone && ` • ${suggestion.phone}`}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && !isLoading && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            No customers found
          </div>
        </div>
      )}
    </div>
  );
}

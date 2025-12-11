import { useState } from 'react';
import { Button, Input } from '@reactive-platform/shared-ui/ui-components';

export interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
}

const KEYBOARD_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const COMMON_DOMAINS = ['@gmail.com', '@yahoo.com', '@outlook.com', '@icloud.com'];

/**
 * EmailInput component for kiosk loyalty lookup
 * - On-screen keyboard for email entry
 * - Common domain suggestions (@gmail.com, @yahoo.com, @outlook.com)
 * - Basic email validation
 */
export function EmailInput({ value, onChange }: EmailInputProps) {
  const [showDomains, setShowDomains] = useState(false);

  const handleKeyPress = (char: string) => {
    onChange(value + char);
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const handleDomainSelect = (domain: string) => {
    // Remove existing domain if present
    const atIndex = value.indexOf('@');
    const baseEmail = atIndex >= 0 ? value.substring(0, atIndex) : value;
    onChange(baseEmail + domain);
    setShowDomains(false);
  };

  const handleAtSymbol = () => {
    if (!value.includes('@')) {
      onChange(value + '@');
      setShowDomains(true);
    }
  };

  const handleDot = () => {
    onChange(value + '.');
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
      {/* Email Display */}
      <div className="w-full">
        <Input
          type="email"
          value={value}
          readOnly
          className="text-3xl h-20 text-center font-mono"
          placeholder="Enter email address"
        />
        <div className="flex justify-between items-center mt-2 px-2">
          <p className="text-sm text-muted-foreground">
            {value.length > 0 && (isValidEmail(value) ? '✓ Valid email' : '⚠ Invalid email format')}
          </p>
        </div>
      </div>

      {/* Common Domain Suggestions */}
      {showDomains && (
        <div className="grid grid-cols-2 gap-3 w-full">
          {COMMON_DOMAINS.map((domain) => (
            <Button
              key={domain}
              variant="outline"
              size="lg"
              onClick={() => handleDomainSelect(domain)}
              className="text-xl h-16"
            >
              {domain}
            </Button>
          ))}
        </div>
      )}

      {/* On-Screen Keyboard */}
      <div className="flex flex-col gap-2 w-full">
        {/* Number row */}
        <div className="flex gap-2 justify-center">
          {KEYBOARD_LAYOUT[0].map((char) => (
            <Button
              key={char}
              variant="outline"
              size="lg"
              onClick={() => handleKeyPress(char)}
              className="min-w-[60px] min-h-[60px] text-xl font-semibold"
            >
              {char}
            </Button>
          ))}
        </div>

        {/* Top letter row */}
        <div className="flex gap-2 justify-center">
          {KEYBOARD_LAYOUT[1].map((char) => (
            <Button
              key={char}
              variant="outline"
              size="lg"
              onClick={() => handleKeyPress(char)}
              className="min-w-[60px] min-h-[60px] text-xl font-semibold"
            >
              {char.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Middle letter row */}
        <div className="flex gap-2 justify-center">
          {KEYBOARD_LAYOUT[2].map((char) => (
            <Button
              key={char}
              variant="outline"
              size="lg"
              onClick={() => handleKeyPress(char)}
              className="min-w-[60px] min-h-[60px] text-xl font-semibold"
            >
              {char.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Bottom letter row */}
        <div className="flex gap-2 justify-center">
          {KEYBOARD_LAYOUT[3].map((char) => (
            <Button
              key={char}
              variant="outline"
              size="lg"
              onClick={() => handleKeyPress(char)}
              className="min-w-[60px] min-h-[60px] text-xl font-semibold"
            >
              {char.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Special characters and controls */}
        <div className="flex gap-2 justify-center mt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleAtSymbol}
            disabled={value.includes('@')}
            className="min-w-[80px] min-h-[60px] text-xl font-semibold"
          >
            @
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleDot}
            className="min-w-[80px] min-h-[60px] text-xl font-semibold"
          >
            .
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleBackspace}
            disabled={value.length === 0}
            className="min-w-[120px] min-h-[60px] text-xl font-semibold"
          >
            ⌫
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleClear}
            disabled={value.length === 0}
            className="min-w-[120px] min-h-[60px] text-xl font-semibold"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

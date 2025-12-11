import * as React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

export interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  showDecimal?: boolean;
  onSubmit?: () => void;
}

const NumericKeypad = React.forwardRef<HTMLDivElement, NumericKeypadProps>(
  ({ value, onChange, maxLength = 10, showDecimal = true, onSubmit }, ref) => {
    const handleNumberClick = (digit: string) => {
      if (value.length >= maxLength) return;
      onChange(value + digit);
    };

    const handleDecimalClick = () => {
      if (!showDecimal) return;
      if (value.includes(".")) return;
      if (value === "") {
        onChange("0.");
      } else {
        onChange(value + ".");
      }
    };

    const handleBackspace = () => {
      onChange(value.slice(0, -1));
    };

    const handleClear = () => {
      onChange("");
    };

    return (
      <div ref={ref} className="grid grid-cols-3 gap-2" role="group" aria-label="Numeric keypad">
        {/* Row 1: 7, 8, 9 */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("7")}
          aria-label="7"
        >
          7
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("8")}
          aria-label="8"
        >
          8
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("9")}
          aria-label="9"
        >
          9
        </Button>

        {/* Row 2: 4, 5, 6 */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("4")}
          aria-label="4"
        >
          4
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("5")}
          aria-label="5"
        >
          5
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("6")}
          aria-label="6"
        >
          6
        </Button>

        {/* Row 3: 1, 2, 3 */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("1")}
          aria-label="1"
        >
          1
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("2")}
          aria-label="2"
        >
          2
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("3")}
          aria-label="3"
        >
          3
        </Button>

        {/* Row 4: decimal/clear, 0, backspace */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={cn(
            "min-h-[64px] min-w-[64px] text-xl font-semibold",
            !showDecimal && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleDecimalClick}
          disabled={!showDecimal}
          aria-label="Decimal point"
        >
          .
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={() => handleNumberClick("0")}
          aria-label="0"
        >
          0
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-[64px] min-w-[64px] text-xl font-semibold"
          onClick={handleBackspace}
          aria-label="Backspace"
          disabled={value === ""}
        >
          ⌫
        </Button>

        {/* Optional: Enter/Submit button */}
        {onSubmit && (
          <Button
            type="button"
            variant="default"
            size="lg"
            className="col-span-3 min-h-[64px] text-xl font-semibold mt-2"
            onClick={onSubmit}
            aria-label="Submit"
          >
            Enter
          </Button>
        )}
      </div>
    );
  }
);
NumericKeypad.displayName = "NumericKeypad";

export { NumericKeypad };

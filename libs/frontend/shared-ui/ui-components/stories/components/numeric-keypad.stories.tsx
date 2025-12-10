import type { Story } from "@ladle/react";
import { useState } from "react";
import { NumericKeypad } from "../../src/components/ui/numeric-keypad";

export default {
  title: "Components/NumericKeypad",
};

export const Default: Story = () => {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="text-2xl font-mono border rounded-md p-4 min-h-[60px] bg-muted">
        {value || "0"}
      </div>
      <NumericKeypad value={value} onChange={setValue} />
    </div>
  );
};

export const WithDecimal: Story = () => {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="text-2xl font-mono border rounded-md p-4 min-h-[60px] bg-muted">
        {value || "0.00"}
      </div>
      <NumericKeypad value={value} onChange={setValue} showDecimal={true} />
    </div>
  );
};
WithDecimal.meta = { name: "With Decimal" };

export const NoDecimal: Story = () => {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="text-2xl font-mono border rounded-md p-4 min-h-[60px] bg-muted">
        {value || "0"}
      </div>
      <NumericKeypad value={value} onChange={setValue} showDecimal={false} />
    </div>
  );
};
NoDecimal.meta = { name: "Without Decimal" };

export const WithMaxLength: Story = () => {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="text-sm text-muted-foreground mb-2">Max length: 5 characters</div>
      <div className="text-2xl font-mono border rounded-md p-4 min-h-[60px] bg-muted">
        {value || "0"}
      </div>
      <NumericKeypad value={value} onChange={setValue} maxLength={5} />
    </div>
  );
};
WithMaxLength.meta = { name: "With Max Length (5)" };

export const WithSubmit: Story = () => {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState("");

  const handleSubmit = () => {
    setSubmitted(value);
    setValue("");
  };

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="text-2xl font-mono border rounded-md p-4 min-h-[60px] bg-muted">
        {value || "0"}
      </div>
      <NumericKeypad value={value} onChange={setValue} onSubmit={handleSubmit} />
      {submitted && (
        <div className="p-4 border border-green-500 rounded-md bg-green-50 text-green-800">
          Submitted: {submitted}
        </div>
      )}
    </div>
  );
};
WithSubmit.meta = { name: "With Submit Button" };

export const PriceEntry: Story = () => {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <div className="text-sm text-muted-foreground mb-2">Enter price</div>
      <div className="text-3xl font-mono border rounded-md p-4 min-h-[70px] bg-muted flex items-center">
        <span className="mr-1">$</span>
        {value || "0.00"}
      </div>
      <NumericKeypad value={value} onChange={setValue} showDecimal={true} maxLength={8} />
    </div>
  );
};
PriceEntry.meta = { name: "Price Entry Example" };

import type { Story } from "@ladle/react";
import { useState } from "react";
import { QuantitySelector } from "../../src/components/ui/quantity-selector";

export default {
  title: "Components/QuantitySelector",
};

export const Default: Story = () => {
  const [value, setValue] = useState(1);
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">Selected quantity: {value}</div>
      <QuantitySelector value={value} onChange={setValue} />
    </div>
  );
};

export const Sizes: Story = () => {
  const [valueSm, setValueSm] = useState(1);
  const [valueMd, setValueMd] = useState(2);
  const [valueLg, setValueLg] = useState(3);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Small</div>
        <QuantitySelector value={valueSm} onChange={setValueSm} size="sm" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Medium (Default)</div>
        <QuantitySelector value={valueMd} onChange={setValueMd} size="md" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Large</div>
        <QuantitySelector value={valueLg} onChange={setValueLg} size="lg" />
      </div>
    </div>
  );
};
Sizes.meta = { name: "All Sizes" };

export const WithMinMax: Story = () => {
  const [value, setValue] = useState(5);
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        Quantity: {value} (min: 1, max: 10)
      </div>
      <QuantitySelector value={value} onChange={setValue} min={1} max={10} />
    </div>
  );
};
WithMinMax.meta = { name: "With Min/Max Limits" };

export const AtMinimum: Story = () => {
  const [value, setValue] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        Quantity: {value} (at minimum, decrement disabled)
      </div>
      <QuantitySelector value={value} onChange={setValue} min={0} max={10} />
    </div>
  );
};
AtMinimum.meta = { name: "At Minimum Value" };

export const AtMaximum: Story = () => {
  const [value, setValue] = useState(10);
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        Quantity: {value} (at maximum, increment disabled)
      </div>
      <QuantitySelector value={value} onChange={setValue} min={0} max={10} />
    </div>
  );
};
AtMaximum.meta = { name: "At Maximum Value" };

export const Disabled: Story = () => {
  const [value, setValue] = useState(5);
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">Disabled state</div>
      <QuantitySelector value={value} onChange={setValue} disabled />
    </div>
  );
};

export const InShoppingCart: Story = () => {
  const [items, setItems] = useState([
    { id: 1, name: "Wireless Mouse", price: 29.99, quantity: 2 },
    { id: 2, name: "Mechanical Keyboard", price: 89.99, quantity: 1 },
    { id: 3, name: "USB-C Cable", price: 12.99, quantity: 3 },
  ]);

  const updateQuantity = (id: number, quantity: number) => {
    setItems(items.map(item => item.id === id ? { ...item, quantity } : item));
  };

  return (
    <div className="max-w-md space-y-4">
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground">${item.price.toFixed(2)}</div>
          </div>
          <QuantitySelector
            value={item.quantity}
            onChange={(qty) => updateQuantity(item.id, qty)}
            min={1}
            max={99}
          />
        </div>
      ))}
      <div className="border-t pt-4 text-right">
        <div className="text-lg font-semibold">
          Total: $
          {items
            .reduce((sum, item) => sum + item.price * item.quantity, 0)
            .toFixed(2)}
        </div>
      </div>
    </div>
  );
};
InShoppingCart.meta = { name: "Shopping Cart Example" };

# Component Patterns Standard

## Intent

Establish consistent component design patterns for reusability and maintainability.

## Outcomes

- Compound components for complex UI
- Headless hooks for logic extraction
- Clear smart/presentational separation

## Patterns

### Compound Components

For complex, multi-part UI that shares implicit state:

```tsx
// Usage
<Modal>
  <Modal.Trigger>Open</Modal.Trigger>
  <Modal.Content>
    <Modal.Header>Title</Modal.Header>
    <Modal.Body>Content goes here</Modal.Body>
    <Modal.Footer>
      <Modal.Close>Cancel</Modal.Close>
    </Modal.Footer>
  </Modal.Content>
</Modal>
```

Implementation pattern:

```tsx
const ModalContext = createContext<ModalState | null>(null);

function Modal({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

Modal.Trigger = function Trigger({ children }) {
  const { setOpen } = useContext(ModalContext);
  return <button onClick={() => setOpen(true)}>{children}</button>;
};
```

### Headless Hooks

Extract reusable logic without UI:

```typescript
function useAccordion(initialIndex = 0) {
  const [expandedIndex, setExpandedIndex] = useState(initialIndex);

  return {
    expandedIndex,
    isExpanded: (index: number) => expandedIndex === index,
    toggle: (index: number) =>
      setExpandedIndex(expandedIndex === index ? -1 : index),
    expand: (index: number) => setExpandedIndex(index),
    collapse: () => setExpandedIndex(-1),
  };
}

// Usage - any UI can use the logic
function CustomAccordion() {
  const accordion = useAccordion();
  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>
          <button onClick={() => accordion.toggle(i)}>
            {accordion.isExpanded(i) ? '−' : '+'}
          </button>
          {accordion.isExpanded(i) && <div>{item.content}</div>}
        </div>
      ))}
    </div>
  );
}
```

### Smart vs Presentational

```tsx
// Presentational (libs/shared-ui) - Props only, no data fetching
interface ProductCardProps {
  name: string;
  price: number;
  imageUrl: string;
  onAddToCart: () => void;
}

function ProductCard({ name, price, imageUrl, onAddToCart }: ProductCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <img src={imageUrl} alt={name} />
      <h3>{name}</h3>
      <p>${price}</p>
      <Button onClick={onAddToCart}>Add to Cart</Button>
    </div>
  );
}

// Smart (apps/*/features) - Owns data fetching
function ProductDetailContainer({ productId }: { productId: string }) {
  const { data, isLoading } = useProduct(productId);
  const addToCart = useAddToCart();

  if (isLoading) return <ProductCardSkeleton />;

  return (
    <ProductCard
      {...data}
      onAddToCart={() => addToCart.mutate(productId)}
    />
  );
}
```

### Render Props (When Needed)

For maximum flexibility in child rendering:

```tsx
<DataTable
  data={products}
  renderRow={(product) => (
    <tr key={product.id}>
      <td>{product.name}</td>
      <td>${product.price}</td>
    </tr>
  )}
/>
```

### Slot Pattern with Children

```tsx
interface CardProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

function Card({ header, footer, children }: CardProps) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
```

## Anti-patterns

- **Prop drilling >2 levels** - Use composition or context
- **Business logic in presentational components** - Keep UI pure
- **Context overuse** - Prefer composition; context is for truly global state
- **Giant components** - Split when >200 lines or multiple responsibilities

## Reference

- ADR-008: Component Library Design System
- `libs/shared-ui/` for component implementations

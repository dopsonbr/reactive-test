import { useParams } from '@tanstack/react-router';
import { ProductDetail } from '../components/ProductDetail';

export function ProductDetailPage() {
  const { sku } = useParams({ from: '/products/$sku' });

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetail sku={sku} />
    </div>
  );
}

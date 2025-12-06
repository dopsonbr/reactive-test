import { useSearch } from '@tanstack/react-router';
import { ProductList } from '../components/ProductList';
import { ProductFilters } from '../components/ProductFilters';

export function ProductListPage() {
  const search = useSearch({ strict: false });
  const category = search?.category;
  const query = search?.q;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full md:w-64 shrink-0">
          <ProductFilters />
        </aside>
        <main className="flex-1">
          <ProductList category={category} query={query} />
        </main>
      </div>
    </div>
  );
}

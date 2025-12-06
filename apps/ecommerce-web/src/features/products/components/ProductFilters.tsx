import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Button, Input, Label } from '@reactive-platform/shared-ui-components';
import { Search } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Home', label: 'Home & Garden' },
  { value: 'Sports', label: 'Sports' },
];

export function ProductFilters() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const [query, setQuery] = useState(search?.q || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: '/',
      search: (prev) => ({ ...prev, q: query || undefined }),
    });
  };

  const handleCategoryChange = (category: string) => {
    navigate({
      to: '/',
      search: (prev) => ({
        ...prev,
        category: category || undefined,
      }),
    });
  };

  return (
    <aside className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" size="icon" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <Label>Category</Label>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={search?.category === cat.value || (!search?.category && !cat.value) ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}

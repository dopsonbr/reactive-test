export interface Application {
  id: string;
  title: string;
  description: string;
  url: string;
  status: 'active' | 'coming-soon';
  icon: string;
}

export const applications: Application[] = [
  {
    id: 'ecommerce-web',
    title: 'E-commerce Web',
    description: 'Online shopping experience',
    url: 'http://localhost:3001',
    status: 'active',
    icon: '🛒',
  },
  {
    id: 'self-checkout-kiosk',
    title: 'Self-Checkout Kiosk',
    description: 'In-store self-service checkout',
    url: 'http://localhost:3002',
    status: 'active',
    icon: '🏪',
  },
  {
    id: 'pos-system',
    title: 'POS System',
    description: 'Full-featured point of sale',
    url: 'http://localhost:3004',
    status: 'active',
    icon: '💳',
  },
  {
    id: 'offline-pos',
    title: 'Offline POS',
    description: 'Works without internet connection',
    url: 'http://localhost:3005',
    status: 'active',
    icon: '📴',
  },
  {
    id: 'merchant-portal',
    title: 'Merchant Portal',
    description: 'Manage your store and inventory',
    url: 'http://localhost:3010',
    status: 'active',
    icon: '📊',
  },
  {
    id: 'delivery-portal',
    title: 'Delivery Portal',
    description: 'Track and manage deliveries',
    url: '#',
    status: 'coming-soon',
    icon: '🚚',
  },
  {
    id: 'admin-portal',
    title: 'Admin Portal',
    description: 'Platform administration',
    url: '#',
    status: 'coming-soon',
    icon: '⚙️',
  },
  {
    id: 'mobile-ecommerce',
    title: 'Mobile E-commerce',
    description: 'Shop on the go',
    url: '#',
    status: 'coming-soon',
    icon: '📱',
  },
  {
    id: 'mobile-pos',
    title: 'Mobile POS',
    description: 'Portable point of sale',
    url: '#',
    status: 'coming-soon',
    icon: '📲',
  },
];

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  loyaltyPoints?: number;
}

export interface LoyaltyInfo {
  tier: string;
  points: number;
  discountPercent: number;
}

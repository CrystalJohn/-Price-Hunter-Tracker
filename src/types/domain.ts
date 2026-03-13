export type Product = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  createdAt: string;
};

export type Store = {
  id: string;
  name: string;
  logoUrl: string;
};

export type ProductPrice = {
  id: string;
  productId: string;
  storeId: string;
  storeName?: string;
  price: number;
  updatedAt: string;
};

export type PriceHistory = {
  id: string;
  productId: string;
  price: number;
  recordedAt: string;
};

export type Favorite = {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
};

export type DealAnalysis = {
  dealScore: number;
  verdict: "Good" | "Average" | "Overpriced";
  explanation: string;
  recommendedStore?: string;
  recommendationReason?: string;
  storeComparisons?: { store: string; pros: string; cons: string }[];
};

export type UserProfile = {
  id: string;
  avatar_url: string | null;
  updated_at: string;
};

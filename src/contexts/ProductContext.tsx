import { createContext, useContext, ReactNode } from 'react';

// GROUPHOME STANDALONE: Only one product type now
export type ProductType = 'grouphome';

interface ProductContextType {
  currentProduct: ProductType;
  productConfig: Record<ProductType, ProductConfig>;
}

interface ProductConfig {
  id: ProductType;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  available: boolean;
  route: string;
}

const productConfig: Record<ProductType, ProductConfig> = {
  'grouphome': {
    id: 'grouphome',
    name: 'Grouphome Accelerator',
    shortName: 'Grouphome',
    description: 'Launch your business',
    icon: 'Home',
    color: 'text-primary',
    bgGradient: 'from-primary/10 to-primary/5',
    borderColor: 'border-primary/30',
    available: true,
    route: '/dashboard',
  },
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  // GROUPHOME STANDALONE: Always 'grouphome' product
  const currentProduct: ProductType = 'grouphome';

  return (
    <ProductContext.Provider value={{ currentProduct, productConfig }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

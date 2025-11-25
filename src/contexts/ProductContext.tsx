import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type ProductType = 'grouphome' | 'mind-insurance' | 'me-wealth';

interface ProductContextType {
  currentProduct: ProductType;
  setCurrentProduct: (product: ProductType) => void;
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
  'mind-insurance': {
    id: 'mind-insurance',
    name: 'Mind Insurance',
    shortName: 'Mind Insurance',
    description: 'Protect your mindset',
    icon: 'Shield',
    color: 'text-purple-600',
    bgGradient: 'from-purple-600/10 to-purple-600/5',
    borderColor: 'border-purple-600/30',
    available: true,
    route: '/mind-insurance',
  },
  'me-wealth': {
    id: 'me-wealth',
    name: 'ME Wealth Builder',
    shortName: 'ME Wealth',
    description: 'Build your empire',
    icon: 'DollarSign',
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/10 to-amber-500/5',
    borderColor: 'border-amber-500/30',
    available: false,
    route: '/wealth',
  },
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [currentProduct, setCurrentProductState] = useState<ProductType>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('currentProduct');
    if (saved && (saved === 'grouphome' || saved === 'mind-insurance' || saved === 'me-wealth')) {
      return saved as ProductType;
    }
    return 'grouphome';
  });

  const setCurrentProduct = (product: ProductType) => {
    setCurrentProductState(product);
    localStorage.setItem('currentProduct', product);
  };

  // Update product based on current route - watches for navigation changes
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/protect') || path.includes('/mind-insurance')) {
      setCurrentProductState('mind-insurance');
      localStorage.setItem('currentProduct', 'mind-insurance');
    } else if (path.includes('/wealth') || path.includes('/me-')) {
      setCurrentProductState('me-wealth');
      localStorage.setItem('currentProduct', 'me-wealth');
    } else if (path.includes('/dashboard') || path.includes('/roadmap') || path.includes('/model-week') || path.includes('/chat')) {
      setCurrentProductState('grouphome');
      localStorage.setItem('currentProduct', 'grouphome');
    }
  }, [location.pathname]);

  return (
    <ProductContext.Provider value={{ currentProduct, setCurrentProduct, productConfig }}>
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

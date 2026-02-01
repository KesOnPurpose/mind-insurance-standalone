import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type ProductType = 'grouphome' | 'mind-insurance' | 'me-wealth' | 'relationship-kpis';

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
    available: false,
    route: '/mind-insurance',
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
  'relationship-kpis': {
    id: 'relationship-kpis',
    name: 'Relationship KPIs',
    shortName: 'Relationship',
    description: 'Strengthen your bond',
    icon: 'Heart',
    color: 'text-rose-500',
    bgGradient: 'from-rose-500/10 to-rose-500/5',
    borderColor: 'border-rose-500/30',
    available: true,
    route: '/relationship-kpis',
  },
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [currentProduct, setCurrentProductState] = useState<ProductType>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('currentProduct');
    if (saved && (saved === 'grouphome' || saved === 'mind-insurance' || saved === 'me-wealth' || saved === 'relationship-kpis')) {
      return saved as ProductType;
    }
    return 'grouphome';
  });

  const setCurrentProduct = (product: ProductType) => {
    setCurrentProductState(product);
    localStorage.setItem('currentProduct', product);
  };

  // Update product based on current route - watches for navigation changes
  // IMPORTANT: Order matters - check specific product routes BEFORE generic /chat route
  useEffect(() => {
    const path = location.pathname;

    // Relationship KPIs routes
    if (path.startsWith('/relationship-kpis')) {
      setCurrentProductState('relationship-kpis');
      localStorage.setItem('currentProduct', 'relationship-kpis');
    }
    // Mind Insurance routes (check first - includes /mind-insurance/chat)
    else if (path.includes('/protect') || path.startsWith('/mind-insurance')) {
      setCurrentProductState('mind-insurance');
      localStorage.setItem('currentProduct', 'mind-insurance');
    }
    // ME Wealth routes (includes /wealth/chat)
    else if (path.startsWith('/wealth') || path.includes('/me-')) {
      setCurrentProductState('me-wealth');
      localStorage.setItem('currentProduct', 'me-wealth');
    }
    // Grouphome routes (generic /chat goes here)
    else if (path.includes('/dashboard') || path.includes('/roadmap') || path.includes('/model-week') || path === '/chat') {
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

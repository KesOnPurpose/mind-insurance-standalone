import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Shield, DollarSign, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProduct, ProductType } from '@/contexts/ProductContext';
import { cn } from '@/lib/utils';

const iconMap = {
  Home: Home,
  Shield: Shield,
  DollarSign: DollarSign,
};

export function AppLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { currentProduct, setCurrentProduct, productConfig } = useProduct();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductSwitch = (productId: ProductType) => {
    const config = productConfig[productId];
    if (!config.available) return;

    setCurrentProduct(productId);
    setIsOpen(false);
    navigate(config.route);
  };

  const currentConfig = productConfig[currentProduct];
  const CurrentIcon = iconMap[currentConfig.icon as keyof typeof iconMap] || Home;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Launcher Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-gray-100"
      >
        <Grid3X3 className="h-5 w-5 text-gray-600" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-12 left-0 bg-white rounded-xl shadow-2xl border p-6 z-50 w-80 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Purpose Waze Suite
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {Object.values(productConfig).map((product) => {
              const Icon = iconMap[product.icon as keyof typeof iconMap] || Home;
              const isActive = currentProduct === product.id;
              const isDisabled = !product.available;

              return (
                <button
                  key={product.id}
                  onClick={() => handleProductSwitch(product.id)}
                  disabled={isDisabled}
                  className={cn(
                    'relative p-4 rounded-xl text-left transition-all duration-200',
                    `bg-gradient-to-br ${product.bgGradient}`,
                    `border-2 ${product.borderColor}`,
                    isActive && 'ring-2 ring-offset-2',
                    isActive && product.id === 'grouphome' && 'ring-primary',
                    isActive && product.id === 'mind-insurance' && 'ring-purple-600',
                    isActive && product.id === 'me-wealth' && 'ring-amber-500',
                    !isDisabled && 'hover:scale-105 hover:shadow-lg cursor-pointer',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {/* Coming Soon Badge */}
                  {isDisabled && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] px-2"
                    >
                      SOON
                    </Badge>
                  )}

                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                      product.id === 'grouphome' && 'bg-primary',
                      product.id === 'mind-insurance' && 'bg-purple-600',
                      product.id === 'me-wealth' && 'bg-amber-500/50'
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm">{product.shortName}</h4>
                  <p className="text-xs text-gray-600 mt-1">{product.description}</p>

                  {isActive && (
                    <div className="absolute bottom-2 right-2">
                      <span className="text-xs font-medium text-primary">Active</span>
                    </div>
                  )}
                </button>
              );
            })}

            {/* Placeholder for future products */}
            <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-400">More coming...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CurrentProductBadge() {
  const { currentProduct, productConfig } = useProduct();
  const config = productConfig[currentProduct];

  const colorMap = {
    'grouphome': 'bg-primary',
    'mind-insurance': 'bg-purple-600',
    'me-wealth': 'bg-amber-500',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-3 h-3 rounded-full', colorMap[currentProduct])} />
      <span className="font-semibold text-gray-800 hidden sm:inline">{config.name}</span>
      <span className="font-semibold text-gray-800 sm:hidden">{config.shortName}</span>
    </div>
  );
}

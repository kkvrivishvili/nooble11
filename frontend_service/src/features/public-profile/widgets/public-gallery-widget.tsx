import React, { useState } from 'react';
import { IconPhoto, IconExternalLink, IconShoppingBag, IconTag } from '@tabler/icons-react';
import { PublicWidgetProps } from './types';

interface PublicGalleryWidgetProps extends PublicWidgetProps {
  data: {
    title?: string;
    products: string[]; // Product IDs from database
    showPrice: boolean;
    showDescription: boolean;
    columns: number;
  };
  // Products data would come from profile.products or a separate query
  productsData?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency: string;
    link?: string;
    images: string[];
    isService: boolean;
    category?: string;
  }>;
}

export function PublicGalleryWidget({ data, productsData = [], theme, className }: PublicGalleryWidgetProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Filter products based on configured IDs
  const products = productsData.filter(product => data.products.includes(product.id));
  
  const formatPrice = (price?: number, currency: string = 'USD') => {
    if (!price) return 'Consultar precio';
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleProductClick = (product: typeof products[0]) => {
    if (product.link) {
      window.open(product.link, '_blank', 'noopener,noreferrer');
    } else if (product.images.length > 0) {
      setSelectedImage(product.images[0]);
    }
  };

  const getColumnClass = () => {
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };
    return columnClasses[data.columns as keyof typeof columnClasses];
  };

  if (products.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <IconPhoto size={48} className="mx-auto mb-3 opacity-30" />
        <p className="opacity-60">No hay productos para mostrar</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Title */}
      {data.title && (
        <h3 
          className="font-semibold mb-4 text-lg"
          style={{ color: theme?.primaryColor }}
        >
          {data.title}
        </h3>
      )}

      {/* Products grid */}
      <div className={`grid gap-4 ${getColumnClass()}`}>
        {products.map(product => (
          <div
            key={product.id}
            className={`group cursor-pointer ${product.link ? 'hover:scale-105' : ''} transition-transform`}
            onClick={() => handleProductClick(product)}
          >
            {/* Product image */}
            <div 
              className="aspect-square overflow-hidden bg-gray-100 relative"
              style={{
                borderRadius: theme?.borderRadius === 'sm' ? '6px' : 
                             theme?.borderRadius === 'md' ? '8px' :
                             theme?.borderRadius === 'lg' ? '12px' : '16px'
              }}
            >
              {product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IconPhoto size={48} className="opacity-30" />
                </div>
              )}
              
              {/* Service/Product badge */}
              {product.isService && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                  Servicio
                </div>
              )}
              
              {/* Link indicator */}
              {product.link && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconExternalLink size={20} style={{ color: theme?.primaryColor }} />
                  </div>
                </div>
              )}
            </div>
            
            {/* Product info */}
            <div className="mt-3 space-y-1">
              <div className="flex items-start justify-between">
                <h4 
                  className="font-medium text-sm line-clamp-2 flex-1"
                  style={{ color: theme?.primaryColor }}
                >
                  {product.name}
                </h4>
                {product.isService ? (
                  <IconTag size={16} className="ml-2 flex-shrink-0 opacity-60" />
                ) : (
                  <IconShoppingBag size={16} className="ml-2 flex-shrink-0 opacity-60" />
                )}
              </div>
              
              {/* Description */}
              {data.showDescription && product.description && (
                <p className="text-xs opacity-70 line-clamp-2">
                  {product.description}
                </p>
              )}
              
              {/* Price */}
              {data.showPrice && (
                <div className="flex items-center justify-between">
                  <p 
                    className="font-semibold text-sm"
                    style={{ color: theme?.primaryColor }}
                  >
                    {formatPrice(product.price, product.currency)}
                  </p>
                  {product.category && (
                    <span className="text-xs opacity-50 bg-gray-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox for images */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full"
            >
              <IconExternalLink size={20} className="text-white rotate-45" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
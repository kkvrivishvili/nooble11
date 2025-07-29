-- Nooble8 Products Schema
-- Version: 4.0 - camelCase
-- Description: Products and services management with camelCase convention

-- Step 1: Create products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" uuid NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(10, 2),
  currency text DEFAULT 'USD',
  link text, -- External link for the product
  images jsonb DEFAULT '[]'::jsonb, -- Array of image URLs
  category text,
  "stockQuantity" integer, -- NULL for services
  "isService" boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now(),
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_stock CHECK ("stockQuantity" >= 0 OR "stockQuantity" IS NULL)
);

-- Step 2: Create indexes
CREATE INDEX idx_products_tenant ON public.products("tenantId");
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_service ON public.products("isService");
CREATE INDEX idx_products_is_active ON public.products("isActive") WHERE "isActive" = true;

-- Step 3: Create gallery view for widgets
CREATE OR REPLACE VIEW products_gallery AS
SELECT 
  p.id,
  p."tenantId",
  p.name,
  p.description,
  p.price,
  p.currency,
  p.link,
  p.images,
  p.category,
  p."isService",
  CASE 
    WHEN p."stockQuantity" > 0 THEN 'inStock'
    WHEN p."stockQuantity" = 0 THEN 'outOfStock'
    WHEN p."isService" THEN 'available'
    ELSE 'unavailable'
  END as availability
FROM products p
WHERE p."isActive" = true;

-- Step 4: Add trigger
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
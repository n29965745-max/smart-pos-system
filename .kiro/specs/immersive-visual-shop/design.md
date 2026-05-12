# Design Document: Immersive Visual Shop

## Overview

This design transforms the existing e-commerce shop into an immersive, visual-first shopping experience that replicates the feeling of browsing in a physical store. The enhancement focuses on rich visual interactions, multi-angle product views, intelligent recommendations, and warm brand atmosphere while maintaining the existing multi-tenant architecture and inventory integration.

### Design Goals

- **Visual Richness**: Enable customers to inspect products from multiple angles with zoom, 360° views, and video demonstrations
- **Seamless Interactions**: Provide instant feedback and smooth transitions without page reloads
- **Personalization**: Deliver intelligent product recommendations based on browsing behavior and purchase patterns
- **Brand Expression**: Allow each tenant to express their unique brand personality through customizable visual design
- **Performance**: Maintain fast load times and smooth interactions on mobile and desktop devices
- **Backward Compatibility**: Extend existing schema and components without breaking current functionality

### Key Constraints

- Must maintain multi-tenant isolation with tenant_id on all new tables
- Must integrate with existing inventory system (products table, stock_quantity)
- Must preserve existing ecommerce.service.ts patterns for consistency
- Must support mobile-first responsive design (320px to 2560px)
- Must achieve Lighthouse performance score ≥85 on mobile
- Must maintain WCAG AA accessibility standards

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Shop Frontend Layer                      │
├─────────────────────────────────────────────────────────────┤
│  pages/shop/[slug]/index.tsx (Enhanced Homepage)            │
│  pages/shop/[slug]/product/[id].tsx (Enhanced Product Page) │
│  components/ProductGallery.tsx (NEW)                        │
│  components/RecommendationEngine.tsx (NEW)                  │
│  components/LiveSupport.tsx (NEW)                           │
│  components/ProductFilters.tsx (NEW)                        │
│  hooks/useProductGallery.ts (NEW)                           │
│  hooks/useRecommendations.ts (NEW)                          │
│  hooks/useRecentlyViewed.ts (NEW)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  /api/ecommerce/products/[id]/gallery (NEW)                 │
│  /api/ecommerce/products/[id]/videos (NEW)                  │
│  /api/ecommerce/recommendations (NEW)                       │
│  /api/ecommerce/recently-viewed (NEW)                       │
│  /api/ecommerce/products/search (ENHANCED)                  │
│  /api/ecommerce/reviews (NEW)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  services/ecommerce.service.ts (ENHANCED)                   │
│  services/recommendation.service.ts (NEW)                   │
│  services/media.service.ts (NEW)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (Supabase)                 │
├─────────────────────────────────────────────────────────────┤
│  products (EXISTING)                                         │
│  product_images (NEW)                                        │
│  product_videos (NEW)                                        │
│  product_reviews (EXISTING - from ecommerce-schema.sql)     │
│  browsing_history (NEW - localStorage)                      │
│  product_recommendations_cache (NEW)                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Product Gallery Loading:**
1. Customer navigates to product detail page
2. Frontend fetches product data + gallery images via `/api/ecommerce/products/[id]/gallery`
3. API queries product_images table ordered by display_order
4. Frontend renders ProductGallery component with lazy-loaded images
5. Customer interactions (zoom, rotate) handled client-side

**Recommendation Generation:**
1. Customer views product (triggers browsing history update in localStorage)
2. Frontend requests recommendations via `/api/ecommerce/recommendations`
3. API checks cache, if stale, generates fresh recommendations
4. Recommendation engine considers: same category, co-purchased items, browsing history
5. Results filtered by stock availability and tenant_id
6. Frontend renders recommendation carousel

**Real-time Stock Updates:**
1. Product page polls `/api/ecommerce/products/[id]` every 5 seconds
2. API returns current stock_quantity from products table
3. Frontend updates UI badges (Low Stock, Out of Stock)
4. Concurrent viewer count calculated from active sessions (Redis or in-memory)

## Components and Interfaces

### ProductGallery Component

**Purpose**: Display product images with zoom, 360° rotation, and video playback capabilities.

**Props Interface:**
```typescript
interface ProductGalleryProps {
  productId: string;
  tenantSlug: string;
  images: ProductImage[];
  videos?: ProductVideo[];
  primaryImage: string;
  onImageChange?: (imageUrl: string) => void;
}

interface ProductImage {
  id: string;
  image_url: string;
  image_type: 'primary' | 'angle' | 'lifestyle' | 'size_reference' | 'detail';
  display_order: number;
  alt_text?: string;
}

interface ProductVideo {
  id: string;
  video_url: string;
  video_type: 'mp4' | 'webm' | 'youtube' | 'vimeo';
  thumbnail_url: string;
  duration_seconds: number;
}
```

**Key Features:**
- Thumbnail strip with 4+ image slots
- Main image viewer with hover zoom lens
- Click to expand fullscreen mode
- Swipe/drag for 360° rotation (when available)
- Video player with inline playback
- Lazy loading for below-the-fold images
- Responsive layout (stacked on mobile, side-by-side on desktop)

**State Management:**
```typescript
const [activeIndex, setActiveIndex] = useState(0);
const [isZoomed, setIsZoomed] = useState(false);
const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
const [isFullscreen, setIsFullscreen] = useState(false);
const [isVideoPlaying, setIsVideoPlaying] = useState(false);
```

### RecommendationEngine Component

**Purpose**: Display personalized product recommendations based on context and browsing behavior.

**Props Interface:**
```typescript
interface RecommendationEngineProps {
  tenantSlug: string;
  context: 'product-detail' | 'homepage' | 'cart';
  currentProductId?: string;
  limit?: number;
}

interface Recommendation {
  product: Product;
  reason: 'same-category' | 'co-purchased' | 'trending' | 'browsing-history';
  score: number;
}
```

**Recommendation Strategies:**
1. **Same Category**: Products from the same category as current product
2. **Co-Purchased**: Items frequently bought together (from online_order_items)
3. **Trending**: Highest sales in last 7 days
4. **Browsing History**: Products similar to recently viewed items

**Algorithm:**
```typescript
function generateRecommendations(
  currentProduct: Product,
  browsingHistory: string[],
  orderHistory: Order[]
): Recommendation[] {
  const candidates = [];
  
  // Same category (weight: 0.4)
  candidates.push(...getSameCategoryProducts(currentProduct.category, 0.4));
  
  // Co-purchased (weight: 0.3)
  candidates.push(...getCoPurchasedProducts(currentProduct.id, 0.3));
  
  // Browsing history (weight: 0.2)
  candidates.push(...getSimilarToViewed(browsingHistory, 0.2));
  
  // Trending (weight: 0.1)
  candidates.push(...getTrendingProducts(0.1));
  
  // Deduplicate, sort by score, filter out-of-stock
  return deduplicateAndRank(candidates)
    .filter(c => c.product.stock_quantity > 0)
    .slice(0, 6);
}
```

### LiveSupport Component

**Purpose**: Provide real-time customer assistance through chat interface.

**Props Interface:**
```typescript
interface LiveSupportProps {
  tenantSlug: string;
  tenantId: string;
  customerName?: string;
  customerEmail?: string;
}

interface ChatMessage {
  id: string;
  sender: 'customer' | 'staff' | 'ai';
  message: string;
  timestamp: Date;
  attachments?: string[];
}
```

**Features:**
- Floating chat widget (bottom-right corner)
- Online/offline status indicator
- Message history for current session
- Image attachment support
- AI assistant fallback when staff offline
- Typing indicators
- Unread message badge

**Integration Points:**
- WebSocket connection for real-time messaging (or polling fallback)
- AI assistant powered by OpenAI API (optional, tenant-configurable)
- Staff dashboard for responding to chats (future enhancement)

### ProductFilters Component

**Purpose**: Enable advanced filtering and search with instant results.

**Props Interface:**
```typescript
interface ProductFiltersProps {
  tenantSlug: string;
  categories: string[];
  priceRange: { min: number; max: number };
  onFilterChange: (filters: FilterState) => void;
  activeFilters: FilterState;
}

interface FilterState {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  search?: string;
}
```

**Features:**
- Category dropdown with result counts
- Price range slider
- Color swatches (if products have color variants)
- Size checkboxes (if products have size variants)
- In-stock toggle
- Active filter badges with remove buttons
- Clear all filters button
- URL persistence for shareable filtered views

## Data Models

### Database Schema Extensions

#### product_images Table

```sql
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Image details
  image_url TEXT NOT NULL,
  image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('primary', 'angle', 'lifestyle', 'size_reference', 'detail')),
  display_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  
  -- Metadata
  width INTEGER,
  height INTEGER,
  file_size_kb INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure ordering is unique per product
  UNIQUE(tenant_id, product_id, display_order)
);

-- Indexes
CREATE INDEX idx_product_images_tenant ON product_images(tenant_id);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_product_order ON product_images(product_id, display_order);

-- RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images FORCE ROW LEVEL SECURITY;

CREATE POLICY product_images_tenant_isolation ON product_images
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON product_images TO authenticated;
```

#### product_videos Table

```sql
CREATE TABLE IF NOT EXISTS product_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Video details
  video_url TEXT NOT NULL,
  video_type VARCHAR(20) NOT NULL CHECK (video_type IN ('mp4', 'webm', 'youtube', 'vimeo')),
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  
  -- Display
  display_order INTEGER NOT NULL DEFAULT 0,
  title VARCHAR(255),
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_product_videos_tenant ON product_videos(tenant_id);
CREATE INDEX idx_product_videos_product ON product_videos(product_id);
CREATE INDEX idx_product_videos_product_order ON product_videos(product_id, display_order);

-- RLS
ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_videos FORCE ROW LEVEL SECURITY;

CREATE POLICY product_videos_tenant_isolation ON product_videos
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON product_videos TO authenticated;
```

#### product_recommendations_cache Table

```sql
CREATE TABLE IF NOT EXISTS product_recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Cached recommendations (array of product IDs)
  recommended_product_ids UUID[] NOT NULL,
  
  -- Cache metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  UNIQUE(tenant_id, product_id)
);

-- Indexes
CREATE INDEX idx_recommendations_cache_tenant ON product_recommendations_cache(tenant_id);
CREATE INDEX idx_recommendations_cache_product ON product_recommendations_cache(product_id);
CREATE INDEX idx_recommendations_cache_expires ON product_recommendations_cache(expires_at);

-- RLS
ALTER TABLE product_recommendations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations_cache FORCE ROW LEVEL SECURITY;

CREATE POLICY recommendations_cache_tenant_isolation ON product_recommendations_cache
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

GRANT SELECT, INSERT, UPDATE, DELETE ON product_recommendations_cache TO authenticated;
```

### Client-Side Data Models (localStorage)

#### Browsing History

```typescript
interface BrowsingHistoryEntry {
  productId: string;
  productName: string;
  category: string;
  viewedAt: number; // timestamp
  imageUrl?: string;
}

// Stored as: localStorage.getItem(`browsing_history_${tenantSlug}`)
// Max 50 entries, 30-day retention
```

#### Recently Viewed Products

```typescript
interface RecentlyViewedProduct {
  id: string;
  name: string;
  retail_price: number;
  image_url?: string;
  viewedAt: number;
}

// Stored as: localStorage.getItem(`recently_viewed_${tenantSlug}`)
// Max 12 entries, 30-day retention
```

### API Response Formats

#### GET /api/ecommerce/products/[id]/gallery

```typescript
{
  success: true,
  data: {
    product: {
      id: string;
      name: string;
      description: string;
      retail_price: number;
      stock_quantity: number;
      category: string;
    },
    images: ProductImage[],
    videos: ProductVideo[],
    primaryImage: string
  }
}
```

#### GET /api/ecommerce/recommendations

```typescript
{
  success: true,
  data: {
    recommendations: Array<{
      product: Product;
      reason: string;
      score: number;
    }>,
    context: string,
    generatedAt: string
  }
}
```

## Error Handling

### Client-Side Error Handling

**Image Loading Failures:**
- Display placeholder image (📦 emoji or generic product icon)
- Log error to console for debugging
- Retry loading after 2 seconds (max 3 attempts)
- Show "Image unavailable" message if all retries fail

**API Request Failures:**
- Display user-friendly error message ("Unable to load products. Please try again.")
- Provide retry button
- Log detailed error to console
- Fallback to cached data if available (for recommendations)

**Video Playback Failures:**
- Display thumbnail with "Video unavailable" overlay
- Provide link to external video if hosted on YouTube/Vimeo
- Log error details for tenant support

### Server-Side Error Handling

**Database Query Failures:**
- Return 500 status with generic error message to client
- Log detailed error with tenant_id and query details
- Implement circuit breaker for repeated failures
- Send alert to monitoring system (e.g., Sentry)

**Tenant Not Found:**
- Return 404 status with "Shop not found" message
- Log attempted slug for investigation
- Suggest checking URL spelling

**Insufficient Stock:**
- Return 400 status with specific error message
- Include available quantity in response
- Update UI to disable purchase buttons

**Rate Limiting:**
- Implement rate limiting on recommendation API (10 requests/minute per IP)
- Return 429 status with retry-after header
- Display "Too many requests" message to user

## Testing Strategy

### Unit Testing

**Component Tests (Jest + React Testing Library):**
- ProductGallery: image switching, zoom functionality, video playback
- RecommendationEngine: rendering recommendations, handling empty states
- ProductFilters: filter application, URL persistence, clear filters
- LiveSupport: message sending, online/offline status

**Service Tests:**
- recommendation.service.ts: algorithm correctness, deduplication, scoring
- media.service.ts: image URL validation, video type detection
- ecommerce.service.ts: gallery data fetching, error handling

**Hook Tests:**
- useProductGallery: state management, image preloading
- useRecommendations: caching, fallback to trending
- useRecentlyViewed: localStorage operations, expiration

### Property-Based Testing

Property-based tests will be written after completing the Correctness Properties section. Each property will run with minimum 100 iterations and be tagged with the feature name and property number.

### Integration Testing

**API Endpoint Tests:**
- Test tenant isolation (ensure tenant A cannot access tenant B's data)
- Test pagination and filtering
- Test error responses for invalid inputs
- Test rate limiting behavior

**Database Tests:**
- Test RLS policies enforce tenant isolation
- Test cascade deletes (product deletion removes images/videos)
- Test unique constraints (display_order per product)
- Test index performance with 1000+ products

### End-to-End Testing (Playwright)

**Critical User Flows:**
1. Browse products → View product detail → Add to cart → Checkout
2. Search products → Apply filters → View filtered results
3. View product → See recommendations → Click recommendation → View new product
4. Zoom product image → Switch angles → Watch video
5. Mobile: Swipe gallery → Pinch zoom → Add to cart

**Performance Tests:**
- Measure page load time on 3G connection
- Verify Lighthouse score ≥85 on mobile
- Test image lazy loading effectiveness
- Measure time to interactive (TTI)

### Accessibility Testing

**Manual Testing:**
- Keyboard navigation through gallery and filters
- Screen reader compatibility (NVDA, JAWS)
- Color contrast verification (WCAG AA)
- Focus indicators on interactive elements

**Automated Testing (axe-core):**
- Run accessibility audits on all shop pages
- Verify ARIA labels on custom components
- Check heading hierarchy
- Validate form labels and error messages


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all 119 acceptance criteria, I identified several opportunities to consolidate redundant properties:

**Consolidations Made:**
- **Gallery Image Rendering**: Combined 1.1, 1.5, 4.1, 4.3 into a single comprehensive property about rendering all available images
- **Hover Interactions**: Combined 3.1, 3.2, 3.3 into one property about hover state changes
- **Variant Switching**: Combined 6.2, 6.3 into one property about variant updates without reload
- **Filter Application**: Combined 8.2, 8.3, 8.4 into one property about filter behavior
- **Recently Viewed Operations**: Combined 9.1, 9.3, 9.5 into one property about history management
- **Tenant Branding**: Combined 10.1, 10.2, 10.5 into one property about applying tenant settings
- **Review Display**: Combined 14.1, 14.2, 14.3, 14.5 into one property about review rendering
- **Performance Timing**: Combined multiple timing requirements (1.4, 2.4, 3.4, 3.5, 6.2, 8.3, 12.2, 15.5) into specific properties per context

This reflection reduced 119 criteria to approximately 70 unique, non-redundant properties.

### Property 1: Gallery Image Completeness

*For any* product with N images (where N ≥ 1), the Product_Gallery SHALL render all N images in the gallery interface with at least 4 image slots available, displaying images according to their display_order and image_type hierarchy (primary first, then angles, then lifestyle, then size_reference, then detail).

**Validates: Requirements 1.1, 1.5, 4.1, 4.3, 4.4**

### Property 2: Image Aspect Ratio Preservation

*For any* image with aspect ratio R, when displayed in the Product_Gallery, the rendered image SHALL maintain aspect ratio R within 1% tolerance, preventing distortion.

**Validates: Requirements 1.7**

### Property 3: Zoom Lens Activation

*For any* product image in the gallery, when a hover event occurs over the image for more than 100ms, the Product_Gallery SHALL display a zoom lens showing a magnified view of the hovered region.

**Validates: Requirements 1.2**

### Property 4: 360-Degree Rotation Enablement

*For any* product with 360-degree imagery metadata, the Product_Gallery SHALL enable interactive rotation controls (drag/swipe), and for any product without 360-degree imagery, rotation controls SHALL NOT be displayed.

**Validates: Requirements 1.3**

### Property 5: Thumbnail Click Response Time

*For any* thumbnail click event in the Product_Gallery, the main image SHALL switch to the selected image within 100ms.

**Validates: Requirements 1.4**

### Property 6: Mobile Pinch-to-Zoom Support

*For any* product image viewed on a touch device, the Product_Gallery SHALL respond to pinch gestures by zooming the image proportionally to the pinch distance.

**Validates: Requirements 1.6**

### Property 7: Video Player Conditional Rendering

*For any* product with an associated video_url, the Product_Gallery SHALL display a video player component, and for any product without a video_url, no video player SHALL be displayed.

**Validates: Requirements 2.1**

### Property 8: Video Format Support

*For any* video with video_type in ['mp4', 'webm', 'youtube', 'vimeo'], the Product_Gallery SHALL render the video using the appropriate player for that format.

**Validates: Requirements 2.3**

### Property 9: Video Inline Playback

*For any* video thumbnail click event, the Product_Gallery SHALL begin video playback inline (same page) without triggering navigation to a new page or URL change.

**Validates: Requirements 2.4**

### Property 10: Video Control Presence

*For any* video in playing state, the Product_Gallery SHALL display functional pause, volume, and fullscreen controls.

**Validates: Requirements 2.6**

### Property 11: Product Card Hover State Transition

*For any* product card, when a hover event persists for more than 300ms, the Visual_Interaction SHALL display: (1) an alternate image if available, (2) a quick-add-to-cart button, and (3) key product attributes (size options, color variants, stock status), with the transition completing within 200ms.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 12: Hover State Restoration

*For any* product card in hover state, when the cursor moves away, the Visual_Interaction SHALL restore the original view within 150ms.

**Validates: Requirements 3.5**

### Property 13: Touch Device Hover Disablement

*For any* product card viewed on a touch device (detected via touch event support), hover effects SHALL NOT trigger, preventing conflicts with tap interactions.

**Validates: Requirements 3.6**

### Property 14: Image Type Labeling

*For any* product image with image_type = 'size_reference', the Product_Gallery SHALL display a label containing either "Size Reference" or "Worn by [height]" text.

**Validates: Requirements 4.2**

### Property 15: Gallery View Mode Filtering

*For any* product with mixed image types, when the gallery view mode is set to "Product Only", only images with image_type in ['primary', 'angle', 'detail'] SHALL be displayed, and when set to "All Images", all image types SHALL be displayed.

**Validates: Requirements 4.5**

### Property 16: Stock Quantity Display Accuracy

*For any* product page load, the displayed stock quantity SHALL match the current value of products.stock_quantity in the database within 1 second of page load.

**Validates: Requirements 5.1**

### Property 17: Low Stock Warning Display

*For any* product with stock_quantity < 10 AND stock_quantity > 0, the Shop_System SHALL display a "Low Stock" warning badge.

**Validates: Requirements 5.2**

### Property 18: Out of Stock State

*For any* product with stock_quantity = 0, the Shop_System SHALL: (1) disable all purchase buttons, (2) display "Out of Stock" status text, and (3) prevent add-to-cart actions.

**Validates: Requirements 5.3**

### Property 19: Concurrent Viewer Display

*For any* product with >= 3 concurrent viewers (active sessions viewing the product), the Shop_System SHALL display a message "X people are viewing this right now" where X is the current viewer count.

**Validates: Requirements 5.5**

### Property 20: Cart Addition Stock Reflection

*For any* add-to-cart action, the displayed stock quantity SHALL decrease by the added quantity within 500ms of the action completing.

**Validates: Requirements 5.6**

### Property 21: Color Variant Swatch Display

*For any* product with color variant data, the Shop_System SHALL display color swatches with visual previews for each available color.

**Validates: Requirements 6.1**

### Property 22: Variant Selection Updates

*For any* variant selection (color or size), the Shop_System SHALL update the product image, price, and stock status within 200ms without triggering a page reload.

**Validates: Requirements 6.2, 6.3**

### Property 23: Variant URL Persistence

*For any* variant selection, the Shop_System SHALL update the browser URL to include variant parameters (e.g., ?color=red&size=M) while maintaining single-page application behavior (no full page reload).

**Validates: Requirements 6.4**

### Property 24: Out-of-Stock Variant Visual State

*For any* variant option with stock_quantity = 0, the Shop_System SHALL apply a visual disabled state (strikethrough or opacity < 0.5) to that variant option.

**Validates: Requirements 6.5**

### Property 25: Variant Selection Persistence

*For any* variant selection followed by navigation to cart and back, the Shop_System SHALL preserve the selected variant state upon return to the product page.

**Validates: Requirements 6.6**

### Property 26: Same-Category Recommendations

*For any* product with a defined category, the Recommendation_Engine SHALL display at least 6 related products from the same category (or fewer if fewer than 6 exist in that category with stock > 0).

**Validates: Requirements 7.1**

### Property 27: Co-Purchase Recommendations

*For any* product that appears in at least one completed order, the Recommendation_Engine SHALL display "Customers who bought this also bought" suggestions based on products that appear in the same orders.

**Validates: Requirements 7.2**

### Property 28: Browsing History Personalization

*For any* customer with >= 3 products in browsing history, the Recommendation_Engine SHALL personalize homepage recommendations by prioritizing products from categories present in the browsing history.

**Validates: Requirements 7.3**

### Property 29: Browsing History Persistence

*For any* product view, the Shop_System SHALL store the product_id and timestamp in localStorage under key `browsing_history_${tenantSlug}`, and SHALL remove entries older than 30 days.

**Validates: Requirements 7.4**

### Property 30: Trending Product Fallback

*For any* customer with empty browsing history (no entries in localStorage), the Recommendation_Engine SHALL display trending products (products with highest sales count in the last 7 days).

**Validates: Requirements 7.5**

### Property 31: In-Stock Recommendation Filtering

*For any* recommendation set generated by the Recommendation_Engine, all recommended products SHALL have stock_quantity > 0.

**Validates: Requirements 7.6**

### Property 32: Recommendation Cache Expiration

*For any* cached recommendation set in product_recommendations_cache, if the generated_at timestamp is more than 24 hours old, the Recommendation_Engine SHALL regenerate fresh recommendations rather than using the cached set.

**Validates: Requirements 7.7**

### Property 33: Search Autocomplete Activation

*For any* search input with character count >= 2, the Shop_System SHALL display autocomplete suggestions within 300ms of the last keystroke.

**Validates: Requirements 8.1**

### Property 34: Filter Application Behavior

*For any* combination of filters (category, price range, color, size, availability), when applied, the Shop_System SHALL: (1) update the product grid within 300ms, (2) update the URL with filter parameters, (3) display active filter badges, (4) show result counts for each filter option, and (5) perform all updates without page reload.

**Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.7**

### Property 35: Empty Filter Results Handling

*For any* filter combination that yields zero matching products, the Shop_System SHALL display a "No results" message and a "Clear filters" button.

**Validates: Requirements 8.6**

### Property 36: Recently Viewed History Management

*For any* product detail page view, the Shop_System SHALL: (1) add the product to recently viewed history in localStorage, (2) store a timestamp with the entry, (3) if the product already exists in history, update its timestamp without creating a duplicate, and (4) maintain a maximum of 12 entries.

**Validates: Requirements 9.1, 9.3, 9.5**

### Property 37: Recently Viewed Display

*For any* homepage load, if recently viewed history exists in localStorage, the Shop_System SHALL display a "Recently Viewed" section showing up to 12 products in reverse chronological order (most recent first).

**Validates: Requirements 9.2, 9.6**

### Property 38: Recently Viewed Expiration

*For any* entry in recently viewed history, if the timestamp is more than 30 days old, the Shop_System SHALL exclude it from display and remove it from localStorage.

**Validates: Requirements 9.4**

### Property 39: Recently Viewed Clear Functionality

*For any* "Recently Viewed" section, a "Clear History" button SHALL be present, and clicking it SHALL remove all entries from localStorage and update the display immediately.

**Validates: Requirements 9.7**

### Property 40: Tenant Branding Application

*For any* tenant with defined shop_settings (primary_color, logo_url, business_tagline), the Shop_System SHALL: (1) apply primary_color to all interactive elements (buttons, links, badges), (2) display logo_url in the header, and (3) display business_tagline in the hero section.

**Validates: Requirements 10.1, 10.2, 10.5**

### Property 41: Custom Background Support

*For any* tenant with custom background_image_url or background_video_url defined in shop_settings, the Shop_System SHALL display the custom background in the hero section.

**Validates: Requirements 10.3**

### Property 42: Accessibility Contrast Compliance

*For any* text element displayed on a colored background, the color contrast ratio SHALL meet or exceed WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 10.7**

### Property 43: Chat Widget Presence

*For any* shop page (homepage, product detail, cart), the Shop_System SHALL display a floating chat widget in the bottom-right corner.

**Validates: Requirements 12.1**

### Property 44: Chat Interface Opening Time

*For any* chat widget click event, the Live_Support SHALL open the chat interface within 500ms.

**Validates: Requirements 12.2**

### Property 45: Staff Online Status Display

*For any* chat widget state, the Live_Support SHALL display an indicator showing whether staff are currently online or offline.

**Validates: Requirements 12.3**

### Property 46: Staff Profile Display

*For any* staff member participating in a chat, if name and profile_photo_url are available, the Live_Support SHALL display both in the chat interface.

**Validates: Requirements 12.5**

### Property 47: Chat Message Type Support

*For any* message sent through Live_Support, the system SHALL support both text messages and image attachments, rendering each appropriately in the chat interface.

**Validates: Requirements 12.6**

### Property 48: Chat Session History Persistence

*For any* chat session, all messages SHALL be preserved in the interface until the session ends (page close or explicit session termination).

**Validates: Requirements 12.7**

### Property 49: AI Assistant Option Display

*For any* tenant with ai_assistant_enabled = true in shop_settings, the Shop_System SHALL display an "AI Assistant" option in the chat widget.

**Validates: Requirements 13.1**

### Property 50: AI Product Recommendation Response

*For any* customer question containing product-related keywords (e.g., "recommend", "looking for", "need"), the Live_Support AI SHALL provide at least one relevant product recommendation in the response.

**Validates: Requirements 13.2**

### Property 51: AI Policy-Based Responses

*For any* common question about shipping, returns, or sizing, the Live_Support AI SHALL generate a response that includes information from the tenant's shop_settings policies.

**Validates: Requirements 13.3**

### Property 52: AI Escalation Offer

*For any* question that the AI assistant cannot answer with confidence (confidence score < 0.7), the Live_Support SHALL offer to connect the customer with human support.

**Validates: Requirements 13.4**

### Property 53: AI Uncertainty Indication

*For any* question where the AI lacks sufficient information to provide an accurate answer, the Live_Support SHALL explicitly indicate uncertainty (e.g., "I'm not sure about that") rather than generating fabricated information.

**Validates: Requirements 13.7**

### Property 54: Review Display Completeness

*For any* product with N reviews (where N > 0), the Shop_System SHALL: (1) display average rating and review count on product cards, (2) display all N individual reviews on the product detail page with ratings, text, dates, (3) display verified purchase badges for reviews where is_verified_purchase = true, and (4) display review photos when present.

**Validates: Requirements 14.1, 14.2, 14.3, 14.5**

### Property 55: Review Sorting Functionality

*For any* product detail page with reviews, the Shop_System SHALL provide sorting options (most recent, highest rated, most helpful), and applying any sort option SHALL reorder the displayed reviews accordingly.

**Validates: Requirements 14.4**

### Property 56: Recent Purchase Count Display

*For any* product with >= 1 purchase in the last 24 hours, the Shop_System SHALL display "X customers bought this in the last 24 hours" where X is the accurate count of purchases.

**Validates: Requirements 14.7**

### Property 57: Client-Side Navigation with Transitions

*For any* navigation between shop pages (homepage ↔ product detail ↔ cart), the Shop_System SHALL use client-side routing (no full page reload) with a fade transition effect.

**Validates: Requirements 15.1**

### Property 58: Loading State Skeleton Display

*For any* page load or data fetch operation, while loading is in progress, the Shop_System SHALL display skeleton screens that match the layout of the final content.

**Validates: Requirements 15.2**

### Property 59: Image Preloading on Hover

*For any* product card hover event, the Shop_System SHALL preload the product detail page's primary image, enabling instant display when the product is clicked.

**Validates: Requirements 15.3**

### Property 60: Progressive Image Loading

*For any* image loading operation, the Shop_System SHALL display a blur-up effect (low-resolution placeholder that progressively sharpens as the full image loads).

**Validates: Requirements 15.4**

### Property 61: Network Error Handling

*For any* failed network request (HTTP status >= 400 or network timeout), the Shop_System SHALL: (1) display a user-friendly error message, (2) provide a "Retry" button, and (3) log the error details to the console.

**Validates: Requirements 15.6**

### Property 62: Scroll Position Preservation

*For any* navigation from product detail page to cart and back, the Shop_System SHALL restore the scroll position to the same location as before navigation.

**Validates: Requirements 15.7**

### Property 63: Tenant Isolation for Product Media

*For any* query to product_images or product_videos tables, the RLS policy SHALL enforce that only rows with tenant_id matching the current session's tenant_id are accessible.

**Validates: Requirements 16.4**

### Property 64: High Image Count Performance

*For any* product with up to 20 images, gallery loading and rendering operations SHALL complete within 2 seconds on a standard connection.

**Validates: Requirements 16.6**

### Property 65: Cascade Delete Integrity

*For any* product deletion, all associated rows in product_images and product_videos tables SHALL be automatically deleted via CASCADE constraint.

**Validates: Requirements 16.7**

### Property 66: Mobile Performance Score

*For any* shop page (homepage or product detail), when measured with Lighthouse on a mobile device profile, the performance score SHALL be >= 85.

**Validates: Requirements 17.1**

### Property 67: 3G Load Time

*For any* shop homepage, when loaded on a simulated 3G connection, the initial product grid SHALL be visible and interactive within 2 seconds.

**Validates: Requirements 17.2**

### Property 68: Lazy Loading Implementation

*For any* product image positioned below the initial viewport (below the fold), the image SHALL be loaded only when it comes within 200px of the viewport edge.

**Validates: Requirements 17.3**

### Property 69: Responsive Image Serving

*For any* image request, the Shop_System SHALL serve an image size optimized for the requesting device's screen width (e.g., 320w, 640w, 1024w, 1920w variants).

**Validates: Requirements 17.4**

### Property 70: Touch Gesture Support

*For any* interactive element (gallery, filters, product cards) on a touch device, the element SHALL respond appropriately to touch gestures (swipe, pinch-zoom, tap).

**Validates: Requirements 17.5**

### Property 71: Mobile Tap Target Size

*For any* interactive element (button, link, input) on a mobile device (screen width < 768px), the tap target SHALL be at least 44x44 pixels.

**Validates: Requirements 17.6**

### Property 72: Responsive Layout Adaptation

*For any* screen width W where 320px <= W <= 2560px, the Shop_System SHALL adapt the layout to fit the screen width without horizontal scrolling.

**Validates: Requirements 17.7**


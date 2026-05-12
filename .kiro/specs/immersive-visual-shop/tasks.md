# Implementation Plan: Immersive Visual Shop

## Overview

This implementation plan transforms the existing e-commerce shop into an immersive, visual-first shopping experience. The approach follows a layered architecture: database schema extensions → backend services → API endpoints → frontend components → integration → testing. Each task builds incrementally on previous work, with checkpoints to validate progress.

**Technology Stack:** TypeScript, React, Next.js, Supabase (PostgreSQL), Tailwind CSS

**Key Integration Points:**
- Extends existing `products` table and `ecommerce.service.ts`
- Maintains multi-tenant isolation with `tenant_id` on all new tables
- Integrates with existing inventory system for real-time stock updates
- Preserves existing shop pages structure (`pages/shop/[slug]/`)

## Tasks

- [ ] 1. Database Schema Extensions
  - [ ] 1.1 Create product_images table with RLS policies
    - Create table with columns: id, tenant_id, product_id, image_url, image_type, display_order, alt_text, width, height, file_size_kb
    - Add CHECK constraint for image_type enum ('primary', 'angle', 'lifestyle', 'size_reference', 'detail')
    - Add UNIQUE constraint on (tenant_id, product_id, display_order)
    - Create indexes on tenant_id, product_id, and (product_id, display_order)
    - Enable RLS and create tenant isolation policy
    - Grant SELECT, INSERT, UPDATE, DELETE to authenticated role
    - _Requirements: 16.1, 16.4, 16.5_
  
  - [ ]* 1.2 Write property test for product_images tenant isolation
    - **Property 63: Tenant Isolation for Product Media**
    - **Validates: Requirements 16.4**
  
  - [ ] 1.3 Create product_videos table with RLS policies
    - Create table with columns: id, tenant_id, product_id, video_url, video_type, thumbnail_url, duration_seconds, display_order, title, description
    - Add CHECK constraint for video_type enum ('mp4', 'webm', 'youtube', 'vimeo')
    - Create indexes on tenant_id, product_id, and (product_id, display_order)
    - Enable RLS and create tenant isolation policy
    - Grant SELECT, INSERT, UPDATE, DELETE to authenticated role
    - _Requirements: 16.1, 16.4_
  
  - [ ] 1.4 Create product_recommendations_cache table with RLS policies
    - Create table with columns: id, tenant_id, product_id, recommended_product_ids (UUID[]), generated_at, expires_at
    - Add UNIQUE constraint on (tenant_id, product_id)
    - Create indexes on tenant_id, product_id, and expires_at
    - Enable RLS and create tenant isolation policy
    - Set default expires_at to NOW() + INTERVAL '24 hours'
    - _Requirements: 7.7_
  
  - [ ]* 1.5 Write property test for cascade delete integrity
    - **Property 65: Cascade Delete Integrity**
    - **Validates: Requirements 16.7**
  
  - [ ] 1.6 Add shop_settings columns for visual customization
    - Add columns: background_image_url TEXT, background_video_url TEXT, ai_assistant_enabled BOOLEAN DEFAULT false
    - Update existing shop_settings records to set ai_assistant_enabled = false
    - _Requirements: 10.3, 13.1_

- [ ] 2. Backend Services Layer
  - [ ] 2.1 Create services/media.service.ts for image and video operations
    - Implement getProductImages(tenantId, productId) function
    - Implement getProductVideos(tenantId, productId) function
    - Implement addProductImage(tenantId, productId, imageData) function
    - Implement deleteProductImage(tenantId, imageId) function
    - Implement reorderProductImages(tenantId, productId, imageIds) function
    - Include error handling for database failures and invalid inputs
    - _Requirements: 1.1, 2.1_
  
  - [ ]* 2.2 Write unit tests for media.service.ts
    - Test image retrieval with multiple images
    - Test video retrieval with different video types
    - Test image reordering logic
    - Test error handling for missing products
    - _Requirements: 1.1, 2.1_
  
  - [ ] 2.3 Create services/recommendation.service.ts for product recommendations
    - Implement generateRecommendations(tenantId, productId, browsingHistory) function
    - Implement getSameCategoryProducts(tenantId, category, limit) helper
    - Implement getCoPurchasedProducts(tenantId, productId, limit) helper using online_order_items
    - Implement getTrendingProducts(tenantId, limit) helper (highest sales in last 7 days)
    - Implement deduplicateAndRank(candidates) helper to merge and sort by score
    - Implement caching logic: check product_recommendations_cache, regenerate if expired
    - Filter all recommendations to exclude out-of-stock products (stock_quantity > 0)
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_
  
  - [ ]* 2.4 Write property test for recommendation filtering
    - **Property 31: In-Stock Recommendation Filtering**
    - **Validates: Requirements 7.6**
  
  - [ ]* 2.5 Write property test for recommendation cache expiration
    - **Property 32: Recommendation Cache Expiration**
    - **Validates: Requirements 7.7**
  
  - [ ] 2.6 Enhance services/ecommerce.service.ts with gallery support
    - Add getProductWithGallery(tenantId, productId) function that joins products, product_images, product_videos
    - Add getProductsWithPrimaryImages(tenantId, filters) function for homepage grid
    - Maintain existing function signatures for backward compatibility
    - _Requirements: 1.1, 2.1_

- [ ] 3. API Endpoints
  - [ ] 3.1 Create /api/ecommerce/products/[id]/gallery.ts endpoint
    - Accept GET requests with tenantSlug query parameter
    - Fetch product data, images (ordered by display_order), and videos
    - Return JSON: { success, data: { product, images, videos, primaryImage } }
    - Handle errors: product not found (404), tenant not found (404), server errors (500)
    - _Requirements: 1.1, 2.1_
  
  - [ ] 3.2 Create /api/ecommerce/products/[id]/videos.ts endpoint
    - Accept GET requests with tenantSlug query parameter
    - Fetch product videos ordered by display_order
    - Return JSON: { success, data: { videos } }
    - _Requirements: 2.1, 2.3_
  
  - [ ] 3.3 Create /api/ecommerce/recommendations.ts endpoint
    - Accept GET requests with tenantSlug, productId (optional), context query parameters
    - Parse browsingHistory from request body or query parameter
    - Call recommendation.service.ts to generate recommendations
    - Return JSON: { success, data: { recommendations, context, generatedAt } }
    - Implement rate limiting: 10 requests/minute per IP
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  
  - [ ]* 3.4 Write integration test for recommendations API
    - Test same-category recommendations
    - Test co-purchased recommendations
    - Test trending fallback
    - Test rate limiting behavior
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [ ] 3.5 Create /api/ecommerce/recently-viewed.ts endpoint
    - Accept POST requests to add product to recently viewed
    - Accept GET requests to retrieve recently viewed products
    - Store data in response (client manages localStorage)
    - Return JSON: { success, data: { products } }
    - _Requirements: 9.1, 9.2_
  
  - [ ] 3.6 Enhance /api/ecommerce/products/index.ts for advanced search
    - Add autocomplete support: return suggestions after 2 characters
    - Add filter support: category, minPrice, maxPrice, colors, sizes, inStock
    - Add result count per filter option in response
    - Update URL with filter parameters
    - Return within 300ms for typical queries
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 3.7 Create /api/ecommerce/reviews.ts endpoint
    - Accept GET requests to fetch reviews for a product
    - Support sorting: most_recent, highest_rated, most_helpful
    - Filter to only approved reviews (is_approved = true)
    - Return JSON: { success, data: { reviews, averageRating, totalCount } }
    - _Requirements: 14.1, 14.2, 14.4_

- [ ] 4. Checkpoint - Validate Backend Layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Frontend Components - Product Gallery
  - [ ] 5.1 Create components/ProductGallery.tsx component
    - Accept props: productId, tenantSlug, images, videos, primaryImage, onImageChange
    - Render thumbnail strip with 4+ image slots
    - Render main image viewer with current selected image
    - Implement state management: activeIndex, isZoomed, zoomPosition, isFullscreen, isVideoPlaying
    - _Requirements: 1.1, 1.5_
  
  - [ ]* 5.2 Write property test for gallery image completeness
    - **Property 1: Gallery Image Completeness**
    - **Validates: Requirements 1.1, 1.5, 4.1, 4.3, 4.4**
  
  - [ ] 5.3 Implement zoom lens functionality in ProductGallery
    - Add hover event listener on main image
    - Display magnified view in zoom lens after 100ms hover
    - Calculate zoom position based on cursor coordinates
    - Apply CSS transform to show magnified region
    - _Requirements: 1.2_
  
  - [ ]* 5.4 Write property test for zoom lens activation
    - **Property 3: Zoom Lens Activation**
    - **Validates: Requirements 1.2**
  
  - [ ] 5.5 Implement thumbnail click and image switching
    - Add click handlers to thumbnail elements
    - Update activeIndex state on click
    - Switch main image within 100ms
    - Highlight active thumbnail with border
    - _Requirements: 1.4_
  
  - [ ]* 5.6 Write property test for thumbnail click response time
    - **Property 5: Thumbnail Click Response Time**
    - **Validates: Requirements 1.4**
  
  - [ ] 5.7 Implement mobile pinch-to-zoom support
    - Detect touch device using touch event support
    - Add pinch gesture listeners (touchstart, touchmove, touchend)
    - Calculate pinch distance and apply zoom proportionally
    - Prevent default browser zoom behavior
    - _Requirements: 1.6_
  
  - [ ] 5.8 Implement 360-degree rotation controls
    - Check for 360-degree imagery metadata in images array
    - Render rotation controls (drag/swipe) if metadata present
    - Update activeIndex based on drag distance
    - Hide rotation controls if no 360-degree imagery
    - _Requirements: 1.3_
  
  - [ ] 5.9 Implement video player in ProductGallery
    - Render video player component when videos array is not empty
    - Support video formats: mp4, webm, youtube, vimeo
    - Display play icon overlay on video thumbnail
    - Implement inline playback without navigation
    - Add pause, volume, and fullscreen controls
    - _Requirements: 2.1, 2.3, 2.4, 2.6_
  
  - [ ]* 5.10 Write property test for video player conditional rendering
    - **Property 7: Video Player Conditional Rendering**
    - **Validates: Requirements 2.1**
  
  - [ ] 5.11 Implement image type labeling and filtering
    - Display "Size Reference" label for image_type = 'size_reference'
    - Add view mode toggle: "Product Only" vs "All Images"
    - Filter displayed images based on view mode
    - Maintain visual hierarchy (primary first)
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [ ] 5.12 Implement aspect ratio preservation
    - Apply CSS object-fit: contain to all images
    - Validate aspect ratio within 1% tolerance
    - Prevent image distortion
    - _Requirements: 1.7_

- [ ] 6. Frontend Components - Recommendations and Interactions
  - [ ] 6.1 Create components/RecommendationEngine.tsx component
    - Accept props: tenantSlug, context, currentProductId, limit
    - Fetch recommendations from /api/ecommerce/recommendations
    - Render product carousel with 6 recommended products
    - Display reason badges (same-category, co-purchased, trending)
    - Handle loading and error states
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  
  - [ ]* 6.2 Write property test for same-category recommendations
    - **Property 26: Same-Category Recommendations**
    - **Validates: Requirements 7.1**
  
  - [ ] 6.3 Implement hover preview interactions for product cards
    - Add hover event listener with 300ms delay
    - Display alternate image if available
    - Show quick-add-to-cart button
    - Display key attributes (size, color, stock)
    - Animate transition over 200ms
    - Restore original view on mouse leave within 150ms
    - Disable hover effects on touch devices
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 6.4 Write property test for hover state transition
    - **Property 11: Product Card Hover State Transition**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [ ] 6.5 Create components/ProductFilters.tsx component
    - Accept props: tenantSlug, categories, priceRange, onFilterChange, activeFilters
    - Render category dropdown with result counts
    - Render price range slider
    - Render color swatches and size checkboxes (if applicable)
    - Render in-stock toggle
    - Display active filter badges with remove buttons
    - Provide "Clear all filters" button
    - Update URL with filter parameters
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.7_
  
  - [ ]* 6.6 Write property test for filter application behavior
    - **Property 34: Filter Application Behavior**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.7**
  
  - [ ] 6.7 Create components/LiveSupport.tsx component
    - Accept props: tenantSlug, tenantId, customerName, customerEmail
    - Render floating chat widget in bottom-right corner
    - Display online/offline status indicator
    - Implement chat interface with message history
    - Support text messages and image attachments
    - Display staff names and profile photos when available
    - Open chat interface within 500ms of click
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6, 12.7_
  
  - [ ]* 6.8 Write property test for chat interface opening time
    - **Property 44: Chat Interface Opening Time**
    - **Validates: Requirements 12.2**

- [ ] 7. Frontend Hooks and Utilities
  - [ ] 7.1 Create hooks/useProductGallery.ts custom hook
    - Manage gallery state: activeIndex, isZoomed, zoomPosition, isFullscreen
    - Implement image preloading logic
    - Provide functions: selectImage, toggleZoom, toggleFullscreen, nextImage, prevImage
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 7.2 Create hooks/useRecommendations.ts custom hook
    - Fetch recommendations from API
    - Implement caching logic (check localStorage)
    - Provide fallback to trending products
    - Return: recommendations, loading, error, refetch
    - _Requirements: 7.1, 7.2, 7.3, 7.5_
  
  - [ ] 7.3 Create hooks/useRecentlyViewed.ts custom hook
    - Manage recently viewed history in localStorage
    - Add product to history with timestamp
    - Remove entries older than 30 days
    - Prevent duplicates (update timestamp instead)
    - Provide functions: addToHistory, getHistory, clearHistory
    - _Requirements: 9.1, 9.3, 9.4, 9.5_
  
  - [ ]* 7.4 Write property test for recently viewed history management
    - **Property 36: Recently Viewed History Management**
    - **Validates: Requirements 9.1, 9.3, 9.5**
  
  - [ ] 7.5 Create hooks/useBrowsingHistory.ts custom hook
    - Store browsing history in localStorage with key `browsing_history_${tenantSlug}`
    - Add product view with productId, productName, category, viewedAt timestamp
    - Limit to 50 entries, remove oldest when exceeded
    - Remove entries older than 30 days
    - _Requirements: 7.4_

- [ ] 8. Enhanced Shop Pages
  - [ ] 8.1 Enhance pages/shop/[slug]/index.tsx (Homepage)
    - Integrate ProductFilters component for category and price filtering
    - Add search autocomplete (display suggestions after 2 characters)
    - Implement filter application within 300ms without page reload
    - Display active filter badges
    - Add "Recently Viewed" section showing last 12 products
    - Integrate RecommendationEngine for personalized homepage recommendations
    - Add LiveSupport floating chat widget
    - Implement hover preview interactions on product cards
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.2, 9.6, 12.1, 3.1, 3.2, 3.3_
  
  - [ ]* 8.2 Write property test for search autocomplete activation
    - **Property 33: Search Autocomplete Activation**
    - **Validates: Requirements 8.1**
  
  - [ ] 8.3 Enhance pages/shop/[slug]/product/[id].tsx (Product Detail)
    - Replace simple image display with ProductGallery component
    - Integrate RecommendationEngine for "You may also like" section
    - Add real-time stock updates (poll every 5 seconds)
    - Display low stock warning when stock_quantity < 10
    - Display "Out of Stock" and disable purchase buttons when stock_quantity = 0
    - Display concurrent viewer count when >= 3 viewers
    - Implement variant switching (color, size) without page reload
    - Update URL with variant parameters
    - Add recently viewed tracking (call useRecentlyViewed hook)
    - Display product reviews with sorting options
    - Add LiveSupport floating chat widget
    - _Requirements: 1.1, 2.1, 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3, 7.1, 9.1, 14.1, 14.2, 14.4, 12.1_
  
  - [ ]* 8.4 Write property test for stock quantity display accuracy
    - **Property 16: Stock Quantity Display Accuracy**
    - **Validates: Requirements 5.1**
  
  - [ ]* 8.5 Write property test for low stock warning display
    - **Property 17: Low Stock Warning Display**
    - **Validates: Requirements 5.2**
  
  - [ ]* 8.6 Write property test for variant selection updates
    - **Property 22: Variant Selection Updates**
    - **Validates: Requirements 6.2, 6.3**
  
  - [ ] 8.7 Implement brand atmosphere and visual design
    - Apply tenant primary_color to all interactive elements (buttons, links, badges)
    - Display tenant logo_url in header
    - Display business_tagline in hero section
    - Support custom background_image_url or background_video_url in hero
    - Use conversational UI copy ("Let's find your perfect item", "Great choice! Added to your cart")
    - Add emojis sparingly for warmth
    - Ensure WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 11.1, 11.2, 11.3, 11.7, 10.7_
  
  - [ ]* 8.8 Write property test for tenant branding application
    - **Property 40: Tenant Branding Application**
    - **Validates: Requirements 10.1, 10.2, 10.5**

- [ ] 9. Checkpoint - Validate Frontend Integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Performance Optimizations
  - [ ] 10.1 Implement lazy loading for product images
    - Use Intersection Observer API to detect images near viewport
    - Load images when within 200px of viewport edge
    - Apply blur-up effect (low-res placeholder → full image)
    - _Requirements: 17.3, 15.4_
  
  - [ ]* 10.2 Write property test for lazy loading implementation
    - **Property 68: Lazy Loading Implementation**
    - **Validates: Requirements 17.3**
  
  - [ ] 10.3 Implement responsive image serving
    - Generate image variants: 320w, 640w, 1024w, 1920w
    - Use Next.js Image component with srcset
    - Serve optimized image size based on device screen width
    - _Requirements: 17.4_
  
  - [ ] 10.4 Implement image preloading on hover
    - Add hover event listener to product cards
    - Preload product detail page's primary image
    - Use <link rel="preload"> or Image.prefetch()
    - _Requirements: 15.3_
  
  - [ ] 10.5 Implement client-side routing with transitions
    - Use Next.js router for navigation between shop pages
    - Add fade transition effect (CSS transition or Framer Motion)
    - Complete transitions within 300ms
    - Maintain scroll position when navigating back
    - _Requirements: 15.1, 15.5, 15.7_
  
  - [ ]* 10.6 Write property test for client-side navigation with transitions
    - **Property 57: Client-Side Navigation with Transitions**
    - **Validates: Requirements 15.1**
  
  - [ ] 10.7 Implement skeleton loading states
    - Create skeleton components matching final layout
    - Display skeletons during data fetch operations
    - Replace skeletons with actual content when loaded
    - _Requirements: 15.2_
  
  - [ ] 10.8 Optimize database queries for high image counts
    - Add database indexes on (product_id, display_order)
    - Test query performance with 20 images per product
    - Ensure gallery loading completes within 2 seconds
    - _Requirements: 16.6_

- [ ] 11. Mobile Responsiveness and Touch Support
  - [ ] 11.1 Implement touch gesture support
    - Add touch event listeners for swipe, pinch-zoom, tap
    - Test on ProductGallery, ProductFilters, product cards
    - Prevent conflicts between hover and tap interactions
    - _Requirements: 17.5, 3.6_
  
  - [ ] 11.2 Ensure mobile tap target sizes
    - Audit all interactive elements (buttons, links, inputs)
    - Ensure minimum 44x44 pixel tap targets on mobile (screen width < 768px)
    - Add padding where necessary
    - _Requirements: 17.6_
  
  - [ ]* 11.3 Write property test for mobile tap target size
    - **Property 71: Mobile Tap Target Size**
    - **Validates: Requirements 17.6**
  
  - [ ] 11.4 Implement responsive layout adaptation
    - Test layouts at screen widths: 320px, 375px, 768px, 1024px, 1920px, 2560px
    - Ensure no horizontal scrolling at any width
    - Adjust grid columns, font sizes, spacing for each breakpoint
    - _Requirements: 17.7_
  
  - [ ]* 11.5 Write property test for responsive layout adaptation
    - **Property 72: Responsive Layout Adaptation**
    - **Validates: Requirements 17.7**

- [ ] 12. AI Assistant Integration (Optional)
  - [ ] 12.1 Implement AI assistant option in LiveSupport
    - Check tenant shop_settings for ai_assistant_enabled flag
    - Display "AI Assistant" option in chat widget if enabled
    - Integrate with OpenAI API or similar service
    - _Requirements: 13.1_
  
  - [ ] 12.2 Implement AI product recommendation responses
    - Parse customer questions for product-related keywords
    - Query recommendation.service.ts for relevant products
    - Format response with product suggestions
    - _Requirements: 13.2_
  
  - [ ] 12.3 Implement AI policy-based responses
    - Store tenant policies in shop_settings (shipping_policy, return_policy, sizing_guide)
    - Parse common questions (shipping, returns, sizing)
    - Generate responses using policy data
    - _Requirements: 13.3_
  
  - [ ] 12.4 Implement AI escalation and uncertainty handling
    - Calculate confidence score for each AI response
    - Offer human support connection if confidence < 0.7
    - Explicitly indicate uncertainty when lacking information
    - Never fabricate information
    - _Requirements: 13.4, 13.7_

- [ ] 13. Testing and Quality Assurance
  - [ ]* 13.1 Write integration tests for API endpoints
    - Test /api/ecommerce/products/[id]/gallery endpoint
    - Test /api/ecommerce/recommendations endpoint with rate limiting
    - Test /api/ecommerce/products/index.ts with filters
    - Test tenant isolation across all endpoints
    - _Requirements: 16.4_
  
  - [ ]* 13.2 Write E2E tests for critical user flows
    - Test: Browse products → View product detail → Add to cart → Checkout
    - Test: Search products → Apply filters → View filtered results
    - Test: View product → See recommendations → Click recommendation
    - Test: Zoom product image → Switch angles → Watch video
    - Test: Mobile - Swipe gallery → Pinch zoom → Add to cart
    - _Requirements: 1.1, 1.2, 1.3, 2.4, 8.2, 8.3_
  
  - [ ]* 13.3 Run Lighthouse performance audit
    - Test shop homepage on mobile device profile
    - Test product detail page on mobile device profile
    - Verify performance score >= 85
    - Verify 3G load time <= 2 seconds for initial product grid
    - _Requirements: 17.1, 17.2_
  
  - [ ]* 13.4 Run accessibility audit
    - Use axe-core to audit all shop pages
    - Verify WCAG AA compliance
    - Test keyboard navigation through gallery and filters
    - Test screen reader compatibility
    - Verify color contrast ratios
    - _Requirements: 10.7_

- [ ] 14. Final Checkpoint - Complete System Validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and early error detection
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests ensure tenant isolation and API correctness
- E2E tests validate critical user flows across the entire system
- Performance optimizations are implemented after core functionality to avoid premature optimization
- AI assistant integration is optional and can be deferred to a later phase

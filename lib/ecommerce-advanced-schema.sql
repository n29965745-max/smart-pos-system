-- ============================================================
-- ADVANCED E-COMMERCE FEATURES
-- AliExpress-Inspired Enhancements
-- Gamification, Flash Deals, AI Recommendations, Trust Systems
-- ============================================================

-- ============================================================
-- 1. GAMIFICATION: USER COINS & REWARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Coin balance
  total_coins INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, customer_id)
);

-- ============================================================
-- 2. COIN TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'spent', 'expired'
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- Source
  source VARCHAR(100) NOT NULL, -- 'daily_checkin', 'purchase', 'review', 'referral', 'mission', 'spin_wheel'
  source_id VARCHAR(255), -- Order ID, review ID, etc.
  description TEXT,
  
  -- Expiry
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. DAILY MISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Mission details
  mission_type VARCHAR(50) NOT NULL, -- 'view_products', 'add_to_cart', 'share', 'review'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Requirements
  target_count INTEGER DEFAULT 1,
  
  -- Rewards
  coin_reward INTEGER NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. USER MISSION PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES daily_missions(id) ON DELETE CASCADE,
  
  -- Progress
  current_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Date tracking (missions reset daily)
  mission_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, customer_id, mission_id, mission_date)
);

-- ============================================================
-- 5. FLASH DEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS flash_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Deal details
  title VARCHAR(255) NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  flash_price DECIMAL(10, 2) NOT NULL,
  discount_percentage INTEGER NOT NULL,
  
  -- Inventory
  total_quantity INTEGER NOT NULL,
  sold_quantity INTEGER DEFAULT 0,
  remaining_quantity INTEGER NOT NULL,
  
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'active', 'ended', 'sold_out'
  
  -- Display
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. PRODUCT VIEWS TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  
  -- View details
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  view_duration INTEGER, -- seconds
  
  -- Context
  referrer VARCHAR(500),
  device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. RECENTLY VIEWED PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, customer_id, product_id)
);

-- ============================================================
-- 8. PRODUCT RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Recommendation details
  recommendation_type VARCHAR(50) NOT NULL, -- 'similar', 'frequently_bought_together', 'you_may_like'
  score DECIMAL(5, 4) DEFAULT 0, -- 0-1 confidence score
  
  -- Performance tracking
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, source_product_id, recommended_product_id, recommendation_type)
);

-- ============================================================
-- 9. BUNDLE DEALS
-- ============================================================
CREATE TABLE IF NOT EXISTS bundle_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Bundle details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  bundle_price DECIMAL(10, 2) NOT NULL,
  original_total DECIMAL(10, 2) NOT NULL,
  savings_amount DECIMAL(10, 2) NOT NULL,
  savings_percentage INTEGER NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  
  -- Timing
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. BUNDLE DEAL PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS bundle_deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES bundle_deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  quantity INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. SOCIAL PROOF TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS social_proof_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL, -- 'viewing', 'purchased', 'added_to_cart'
  customer_location VARCHAR(100), -- City/Country
  
  -- Timing
  event_time TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. PRICE ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Alert details
  target_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, customer_id, product_id)
);

-- ============================================================
-- 13. SELLER RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS seller_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Rating metrics
  total_orders INTEGER DEFAULT 0,
  positive_ratings INTEGER DEFAULT 0,
  neutral_ratings INTEGER DEFAULT 0,
  negative_ratings INTEGER DEFAULT 0,
  
  -- Calculated scores
  overall_rating DECIMAL(3, 2) DEFAULT 5.0,
  item_as_described DECIMAL(3, 2) DEFAULT 5.0,
  communication DECIMAL(3, 2) DEFAULT 5.0,
  shipping_speed DECIMAL(3, 2) DEFAULT 5.0,
  
  -- Performance
  response_time_hours DECIMAL(5, 2), -- Average response time
  ship_on_time_percentage DECIMAL(5, 2),
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id)
);

-- ============================================================
-- 14. LIVE ACTIVITY FEED
-- ============================================================
CREATE TABLE IF NOT EXISTS live_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL, -- 'purchase', 'review', 'signup'
  message TEXT NOT NULL,
  
  -- Related entities
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_location VARCHAR(100),
  
  -- Display
  is_visible BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Gamification
CREATE INDEX IF NOT EXISTS idx_user_coins_tenant_customer ON user_coins(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_customer ON coin_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_customer ON user_mission_progress(customer_id, mission_date);

-- Flash deals
CREATE INDEX IF NOT EXISTS idx_flash_deals_tenant ON flash_deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_status ON flash_deals(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_flash_deals_active ON flash_deals(tenant_id, status) WHERE status = 'active';

-- Product views
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_customer ON product_views(customer_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_customer ON recently_viewed(customer_id, viewed_at DESC);

-- Recommendations
CREATE INDEX IF NOT EXISTS idx_product_recommendations_source ON product_recommendations(source_product_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_type ON product_recommendations(recommendation_type, score DESC);

-- Bundles
CREATE INDEX IF NOT EXISTS idx_bundle_deals_active ON bundle_deals(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bundle_deal_products_bundle ON bundle_deal_products(bundle_id);

-- Social proof
CREATE INDEX IF NOT EXISTS idx_social_proof_product ON social_proof_events(product_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_social_proof_recent ON social_proof_events(tenant_id, event_time DESC);

-- Price alerts
CREATE INDEX IF NOT EXISTS idx_price_alerts_customer ON price_alerts(customer_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id, is_active);

-- Live activity
CREATE INDEX IF NOT EXISTS idx_live_activity_tenant ON live_activity_feed(tenant_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_deal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proof_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_activity_feed ENABLE ROW LEVEL SECURITY;

-- Force RLS
ALTER TABLE user_coins FORCE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE daily_missions FORCE ROW LEVEL SECURITY;
ALTER TABLE user_mission_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE flash_deals FORCE ROW LEVEL SECURITY;
ALTER TABLE product_views FORCE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed FORCE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations FORCE ROW LEVEL SECURITY;
ALTER TABLE bundle_deals FORCE ROW LEVEL SECURITY;
ALTER TABLE bundle_deal_products FORCE ROW LEVEL SECURITY;
ALTER TABLE social_proof_events FORCE ROW LEVEL SECURITY;
ALTER TABLE price_alerts FORCE ROW LEVEL SECURITY;
ALTER TABLE seller_ratings FORCE ROW LEVEL SECURITY;
ALTER TABLE live_activity_feed FORCE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY user_coins_tenant_isolation ON user_coins
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY coin_transactions_tenant_isolation ON coin_transactions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY daily_missions_tenant_isolation ON daily_missions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY user_mission_progress_tenant_isolation ON user_mission_progress
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY flash_deals_tenant_isolation ON flash_deals
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY product_views_tenant_isolation ON product_views
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY recently_viewed_tenant_isolation ON recently_viewed
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY product_recommendations_tenant_isolation ON product_recommendations
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY bundle_deals_tenant_isolation ON bundle_deals
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY bundle_deal_products_tenant_isolation ON bundle_deal_products
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY social_proof_events_tenant_isolation ON social_proof_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY price_alerts_tenant_isolation ON price_alerts
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY seller_ratings_tenant_isolation ON seller_ratings
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY live_activity_feed_tenant_isolation ON live_activity_feed
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON user_coins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON coin_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_missions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_mission_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON flash_deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_views TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recently_viewed TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bundle_deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bundle_deal_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON social_proof_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON price_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON seller_ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON live_activity_feed TO authenticated;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Award coins to user
CREATE OR REPLACE FUNCTION award_coins(
  p_tenant_id UUID,
  p_customer_id UUID,
  p_amount INTEGER,
  p_source VARCHAR(100),
  p_source_id VARCHAR(255) DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update or create user coins record
  INSERT INTO user_coins (tenant_id, customer_id, total_coins, lifetime_earned)
  VALUES (p_tenant_id, p_customer_id, p_amount, p_amount)
  ON CONFLICT (tenant_id, customer_id)
  DO UPDATE SET
    total_coins = user_coins.total_coins + p_amount,
    lifetime_earned = user_coins.lifetime_earned + p_amount,
    updated_at = NOW()
  RETURNING total_coins INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO coin_transactions (
    tenant_id, customer_id, transaction_type, amount, balance_after,
    source, source_id, description
  ) VALUES (
    p_tenant_id, p_customer_id, 'earned', p_amount, v_new_balance,
    p_source, p_source_id, p_description
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Get current viewers count for product
CREATE OR REPLACE FUNCTION get_current_viewers(p_product_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT COALESCE(customer_id::TEXT, session_id))
    FROM product_views
    WHERE product_id = p_product_id
    AND viewed_at > NOW() - INTERVAL '5 minutes'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DONE
-- ============================================================

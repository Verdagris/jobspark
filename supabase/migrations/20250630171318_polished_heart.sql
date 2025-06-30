/*
  # Create credit system and payment tracking tables

  1. New Tables
    - `user_credits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `credits_balance` (integer)
      - `total_credits_purchased` (integer)
      - `total_credits_used` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `credit_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `transaction_type` (text: 'purchase', 'usage', 'bonus', 'refund')
      - `credits_amount` (integer)
      - `description` (text)
      - `reference_id` (text) - for linking to payments or sessions
      - `created_at` (timestamp)
    
    - `credit_purchases`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `credits_amount` (integer)
      - `amount_paid` (integer) - in cents
      - `currency` (text)
      - `payfast_payment_id` (text)
      - `payfast_token` (text)
      - `status` (text: 'pending', 'completed', 'failed', 'cancelled')
      - `created_at` (timestamp)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- User Credits Table
CREATE TABLE IF NOT EXISTS user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits_balance integer DEFAULT 300, -- Start with 300 free credits
  total_credits_purchased integer DEFAULT 0,
  total_credits_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON user_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON user_credits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Credit Transactions Table (for audit trail)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'bonus', 'refund')),
  credits_amount integer NOT NULL,
  description text NOT NULL,
  reference_id text, -- Link to payment ID or session ID
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Credit Purchases Table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_amount integer NOT NULL,
  amount_paid integer NOT NULL, -- in cents (R10 = 1000 cents)
  currency text DEFAULT 'ZAR',
  payfast_payment_id text,
  payfast_token text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON credit_purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_payfast_id ON credit_purchases(payfast_payment_id);

-- Function to create default credits for new users
CREATE OR REPLACE FUNCTION create_default_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits_balance)
  VALUES (NEW.id, 300)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add welcome bonus transaction
  INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
  VALUES (NEW.id, 'bonus', 300, 'Welcome bonus - 300 free credits');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default credits for new users
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_credits();

-- Function to deduct credits for interview sessions
CREATE OR REPLACE FUNCTION deduct_interview_credits()
RETURNS TRIGGER AS $$
DECLARE
  credits_cost integer := 30; -- Cost per interview session
  current_balance integer;
BEGIN
  -- Get current balance
  SELECT credits_balance INTO current_balance
  FROM user_credits
  WHERE user_id = NEW.user_id;
  
  -- Check if user has enough credits
  IF current_balance < credits_cost THEN
    RAISE EXCEPTION 'Insufficient credits. You need % credits but only have %.', credits_cost, current_balance;
  END IF;
  
  -- Deduct credits
  UPDATE user_credits
  SET 
    credits_balance = credits_balance - credits_cost,
    total_credits_used = total_credits_used + credits_cost,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Add transaction record
  INSERT INTO credit_transactions (
    user_id, 
    transaction_type, 
    credits_amount, 
    description, 
    reference_id
  ) VALUES (
    NEW.user_id,
    'usage',
    -credits_cost,
    'Interview practice session - ' || NEW.role,
    NEW.id::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to deduct credits after interview session
DROP TRIGGER IF EXISTS deduct_credits_after_interview ON interview_sessions;
CREATE TRIGGER deduct_credits_after_interview
  BEFORE INSERT ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION deduct_interview_credits();

-- Function to add purchased credits
CREATE OR REPLACE FUNCTION add_purchased_credits(
  p_user_id uuid,
  p_credits_amount integer,
  p_purchase_id uuid
)
RETURNS void AS $$
BEGIN
  -- Add credits to user balance
  UPDATE user_credits
  SET 
    credits_balance = credits_balance + p_credits_amount,
    total_credits_purchased = total_credits_purchased + p_credits_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Add transaction record
  INSERT INTO credit_transactions (
    user_id, 
    transaction_type, 
    credits_amount, 
    description, 
    reference_id
  ) VALUES (
    p_user_id,
    'purchase',
    p_credits_amount,
    'Credit purchase - ' || p_credits_amount || ' credits',
    p_purchase_id::text
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has enough credits
CREATE OR REPLACE FUNCTION user_has_credits(
  p_user_id uuid,
  p_required_credits integer
)
RETURNS boolean AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT credits_balance INTO current_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(current_balance, 0) >= p_required_credits;
END;
$$ LANGUAGE plpgsql;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT credits_balance INTO current_balance
  FROM user_credits
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(current_balance, 0);
END;
$$ LANGUAGE plpgsql;
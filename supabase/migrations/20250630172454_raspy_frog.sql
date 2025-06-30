/*
  # Update Credits System

  1. Changes
    - Update default credits to 220 (from 300)
    - Update interview cost function to use 30 credits per session
    - Update welcome bonus to 220 credits

  2. Functions
    - Update deduct_interview_credits function
    - Update create_default_credits function
*/

-- Update the default credits for new users function
CREATE OR REPLACE FUNCTION create_default_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits_balance)
  VALUES (NEW.id, 220) -- Updated to 220 free credits
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add welcome bonus transaction
  INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
  VALUES (NEW.id, 'bonus', 220, 'Welcome bonus - 220 free credits'); -- Updated to 220
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the interview credits deduction function to use 30 credits
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

-- Function to deduct credits for CV generation
CREATE OR REPLACE FUNCTION deduct_cv_credits()
RETURNS TRIGGER AS $$
DECLARE
  credits_cost integer := 15; -- Cost per CV generation
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
    'CV generation - ' || NEW.title,
    NEW.id::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to deduct credits for CV generation
DROP TRIGGER IF EXISTS deduct_credits_after_cv_generation ON generated_cvs;
CREATE TRIGGER deduct_credits_after_cv_generation
  BEFORE INSERT ON generated_cvs
  FOR EACH ROW
  EXECUTE FUNCTION deduct_cv_credits();

-- Update existing users who have the old 300 credit balance to 220
-- This is optional - you can remove this if you want existing users to keep their 300 credits
UPDATE user_credits 
SET credits_balance = 220 
WHERE credits_balance = 300 AND total_credits_purchased = 0;
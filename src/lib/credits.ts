import { supabase } from './supabase';

export interface UserCredits {
  id: string;
  user_id: string;
  credits_balance: number;
  total_credits_purchased: number;
  total_credits_used: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'usage' | 'bonus' | 'refund';
  credits_amount: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  credits_amount: number;
  amount_paid: number; // in cents
  currency: string;
  payfast_payment_id: string | null;
  payfast_token: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
}

// Credit costs - Updated per requirements
export const CREDIT_COSTS = {
  INTERVIEW_SESSION: 30, // 30 credits per interview
  CV_GENERATION: 15, // 15 credits per CV generation
} as const;

// Credit packages - Updated with new pricing
export const CREDIT_PACKAGES = [
  {
    id: 'package_150',
    credits: 150,
    price: 1500, // R15.00 in cents
    popular: false,
    description: 'Perfect for occasional practice'
  },
  {
    id: 'package_500',
    credits: 500,
    price: 5000, // R50.00 in cents
    popular: true,
    description: 'Great value for regular users'
  },
  {
    id: 'package_1000',
    credits: 1000,
    price: 10000, // R100.00 in cents
    popular: false,
    description: 'Best value for power users'
  }
] as const;

// Get user's current credit balance
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user credits:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    return null;
  }
}

// Get user's credit transaction history
export async function getCreditTransactions(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching credit transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCreditTransactions:', error);
    return [];
  }
}

// Check if user has enough credits for an action
export async function checkUserCredits(userId: string, requiredCredits: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('user_has_credits', {
        p_user_id: userId,
        p_required_credits: requiredCredits
      });

    if (error) {
      console.error('Error checking user credits:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in checkUserCredits:', error);
    return false;
  }
}

// Get user's credit balance (simple number)
export async function getUserCreditBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_credit_balance', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error getting credit balance:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in getUserCreditBalance:', error);
    return 0;
  }
}

// Create a credit purchase record
export async function createCreditPurchase(
  userId: string,
  creditsAmount: number,
  amountPaid: number
): Promise<CreditPurchase | null> {
  try {
    const { data, error } = await supabase
      .from('credit_purchases')
      .insert([{
        user_id: userId,
        credits_amount: creditsAmount,
        amount_paid: amountPaid,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating credit purchase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createCreditPurchase:', error);
    return null;
  }
}

// Update credit purchase with PayFast details
export async function updateCreditPurchase(
  purchaseId: string,
  updates: Partial<CreditPurchase>
): Promise<CreditPurchase | null> {
  try {
    const { data, error } = await supabase
      .from('credit_purchases')
      .update(updates)
      .eq('id', purchaseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating credit purchase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateCreditPurchase:', error);
    return null;
  }
}

// Complete a credit purchase (add credits to user account)
export async function completeCreditPurchase(
  userId: string,
  creditsAmount: number,
  purchaseId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .rpc('add_purchased_credits', {
        p_user_id: userId,
        p_credits_amount: creditsAmount,
        p_purchase_id: purchaseId
      });

    if (error) {
      console.error('Error completing credit purchase:', error);
      return false;
    }

    // Update purchase status
    await updateCreditPurchase(purchaseId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error in completeCreditPurchase:', error);
    return false;
  }
}

// Get credit purchase by ID
export async function getCreditPurchase(purchaseId: string): Promise<CreditPurchase | null> {
  try {
    const { data, error } = await supabase
      .from('credit_purchases')
      .select('*')
      .eq('id', purchaseId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching credit purchase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCreditPurchase:', error);
    return null;
  }
}

// Format credits for display - Fixed the undefined error
export function formatCredits(credits: number | null | undefined): string {
  if (credits === null || credits === undefined) {
    return '0';
  }
  return credits.toLocaleString();
}

// Format price for display
export function formatPrice(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

// Calculate credits per rand
export function getCreditsPerRand(credits: number, cents: number): number {
  return credits / (cents / 100);
}
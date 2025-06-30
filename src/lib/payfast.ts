import crypto from 'crypto';

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  url: string;
  saltPassphrase: string;
}

export interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
}

export interface PayFastNotification {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: 'COMPLETE' | 'FAILED' | 'CANCELLED';
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
}

class PayFastClient {
  private config: PayFastConfig;

  constructor(config: PayFastConfig) {
    this.config = config;
  }

  // Generate signature for PayFast
  private generateSignature(data: Record<string, string>): string {
    // Remove signature if present
    const { signature, ...dataToSign } = data;
    
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(dataToSign).sort();
    
    // Create parameter string
    const paramString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(dataToSign[key])}`)
      .join('&');
    
    // Add passphrase if provided
    const stringToSign = this.config.saltPassphrase 
      ? `${paramString}&passphrase=${encodeURIComponent(this.config.saltPassphrase)}`
      : paramString;
    
    console.log('🔐 String to sign:', stringToSign);
    
    // Generate MD5 hash
    const signature = crypto.createHash('md5').update(stringToSign).digest('hex');
    console.log('🔑 Generated signature:', signature);
    
    return signature;
  }

  // Create payment form data
  createPaymentData(
    purchaseId: string,
    userEmail: string,
    userName: string,
    creditsAmount: number,
    amountCents: number
  ): PayFastPaymentData & { signature: string } {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://jobspark.co.za' 
      : 'http://localhost:3000';

    console.log('🌐 Base URL:', baseUrl);

    const paymentData: PayFastPaymentData = {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: `${baseUrl}/credits/success`,
      cancel_url: `${baseUrl}/credits/cancelled`,
      notify_url: `${baseUrl}/api/payfast/notify`,
      name_first: userName.split(' ')[0] || 'User',
      name_last: userName.split(' ').slice(1).join(' ') || 'Name',
      email_address: userEmail,
      m_payment_id: purchaseId,
      amount: (amountCents / 100).toFixed(2),
      item_name: `${creditsAmount} JobSpark Credits`,
      item_description: `Purchase ${creditsAmount} credits for interview practice and CV generation`,
      custom_str1: purchaseId, // Store purchase ID for reference
      custom_str2: creditsAmount.toString(), // Store credits amount
    };

    console.log('💳 Payment data before signature:', paymentData);

    const signature = this.generateSignature(paymentData as Record<string, string>);

    return {
      ...paymentData,
      signature
    };
  }

  // Verify PayFast notification signature
  verifyNotification(notification: PayFastNotification): boolean {
    const expectedSignature = this.generateSignature(notification as Record<string, string>);
    return expectedSignature === notification.signature;
  }

  // Get PayFast payment URL
  getPaymentUrl(): string {
    return this.config.url;
  }

  // Create HTML form for payment redirect
  createPaymentForm(paymentData: PayFastPaymentData & { signature: string }): string {
    const formFields = Object.entries(paymentData)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
      .join('\n');

    return `
      <form id="payfast-form" action="${this.getPaymentUrl()}" method="post">
        ${formFields}
      </form>
      <script>
        document.getElementById('payfast-form').submit();
      </script>
    `;
  }
}

// Create PayFast client instance
export function createPayFastClient(): PayFastClient {
  const config: PayFastConfig = {
    merchantId: process.env.PF_MERCHANT_ID!,
    merchantKey: process.env.PF_MERCHANT_KEY!,
    url: process.env.PF_URL || 'https://sandbox.payfast.co.za/eng/process', // Default to sandbox
    saltPassphrase: process.env.PF_SALT_PASSPHRASE!,
  };

  console.log('⚙️ PayFast config:', {
    merchantId: config.merchantId ? '✅ Set' : '❌ Missing',
    merchantKey: config.merchantKey ? '✅ Set' : '❌ Missing',
    url: config.url,
    saltPassphrase: config.saltPassphrase ? '✅ Set' : '❌ Missing'
  });

  if (!config.merchantId || !config.merchantKey) {
    throw new Error('PayFast configuration is incomplete. Please check PF_MERCHANT_ID and PF_MERCHANT_KEY environment variables.');
  }

  return new PayFastClient(config);
}

// Validate PayFast configuration
export function validatePayFastConfig(): boolean {
  const isValid = !!(
    process.env.PF_MERCHANT_ID &&
    process.env.PF_MERCHANT_KEY &&
    process.env.PF_SALT_PASSPHRASE
  );
  
  console.log('🔍 PayFast config validation:', isValid ? '✅ Valid' : '❌ Invalid');
  
  return isValid;
}
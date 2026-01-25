
import { UserTier, PaymentGateway } from '../types';
import { PERMANENT_KEYS } from '../appConfig';

/**
 * PRODUCTION PAYMENT SERVICE
 * Interacts with the hardened Node.js backend to provision secure checkout sessions.
 */

export const initiateTierPayment = async (
  email: string, 
  amount: number, 
  tier: UserTier, 
  userId: string,
  gateway: PaymentGateway,
  name: string = "Nexus Trader"
): Promise<{ success: boolean; checkoutUrl?: string; reference?: string; error?: string }> => {
  
  const endpoint = gateway === 'PAYSTACK' 
    ? `${PERMANENT_KEYS.API.BASE_URL}/api/paystack/initialize` 
    : `${PERMANENT_KEYS.API.BASE_URL}/api/flutterwave/initialize`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount, tier, userId, name })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Gateway Handshake Timeout' };
    }

    return { 
      success: true, 
      checkoutUrl: data.checkoutUrl,
      reference: data.reference
    };
  } catch (e) {
    console.error('[HANDSHAKE_ERROR]', e);
    return { success: false, error: 'Failed to establish link to Liquidity Gateway' };
  }
};

/**
 * Checks the status of a specific transaction reference
 */
export const checkTransactionStatus = async (reference: string): Promise<any> => {
  try {
    const res = await fetch(`${PERMANENT_KEYS.API.BASE_URL}/api/payments/verify/${reference}`);
    return await res.json();
  } catch (e) { 
    return { success: false, error: 'Verification Node Offline' }; 
  }
};

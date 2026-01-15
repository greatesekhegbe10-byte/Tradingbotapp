
import { UserTier, PaymentGateway } from '../types';
import { PERMANENT_KEYS } from '../appConfig';

/**
 * PRODUCTION PAYMENT SERVICE
 * Interacts with the Node.js backend to provision secure checkout sessions.
 */

export const initiateTierPayment = async (
  email: string, 
  amount: number, 
  tier: UserTier, 
  userId: string,
  gateway: PaymentGateway,
  name: string = "Nexus Trader"
): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> => {
  
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
      return { success: false, error: data.error || 'Gateway Cluster Timeout' };
    }

    return { 
      success: true, 
      checkoutUrl: data.checkoutUrl 
    };
  } catch (e) {
    console.error('[HANDSHAKE_ERROR]', e);
    return { success: false, error: 'Connection to Liquidity Gateway Failed' };
  }
};

export const pollPaymentStatus = async (userId: string) => {
  try {
    const res = await fetch(`${PERMANENT_KEYS.API.BASE_URL}/api/payments/status/${userId}`);
    return await res.json();
  } catch (e) { 
    return { success: false }; 
  }
};

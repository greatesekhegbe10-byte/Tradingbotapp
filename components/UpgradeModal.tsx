
import React, { useState } from 'react';
import { X, Loader2, CreditCard, Smartphone, ChevronRight, Globe, ExternalLink, CheckCircle, AlertTriangle, ShieldCheck, Lock, Activity, Crown } from 'lucide-react';
import { UserTier, PaymentGateway } from '../types';
import { initiateTierPayment } from '../services/paymentService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: UserTier, gateway: PaymentGateway) => void;
  userEmail?: string;
  userName?: string;
  userId?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, onClose, userEmail = "trader@nexus.ai", userName = "Trader", userId = "USER-1" 
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'GATEWAY_SELECT' | 'HANDSHAKE' | 'READY'>('GATEWAY_SELECT');
  const [pendingTier, setPendingTier] = useState<UserTier>('BASIC');
  const [authUrl, setAuthUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tiers = [
    { id: 'BASIC' as UserTier, name: 'BASIC', price: '$0', numericPrice: 0, features: ['Core Neural RSI', 'Signal Journal'] },
    { id: 'PRO' as UserTier, name: 'PRO', price: '$60', numericPrice: 60, features: ['Institutional Ticker', 'Auto-Execution Support', 'Live Node Access'] },
    { id: 'VIP' as UserTier, name: 'VIP', price: '$300', numericPrice: 300, features: ['Advanced SMC Logic', 'Priority HFT Bridge', 'Global Cluster License'] }
  ];

  const startPayment = async (gateway: PaymentGateway) => {
    setError(null);
    setPaymentStep('HANDSHAKE');
    
    const tierData = tiers.find(t => t.id === pendingTier);
    const res = await initiateTierPayment(userEmail, tierData?.numericPrice || 0, pendingTier, userId!, gateway, userName);
    
    if (res.success && res.checkoutUrl) {
      setAuthUrl(res.checkoutUrl);
      setPaymentStep('READY');
    } else {
      setError(res.error || "Handshake Failed");
      setPaymentStep('GATEWAY_SELECT');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-fade-in">
      <div className="w-full max-w-6xl relative">
        <button onClick={onClose} className="absolute -top-12 right-0 text-gray-500 hover:text-white p-2">
            <X className="w-8 h-8" />
        </button>

        {!showPayment ? (
          <div className="space-y-12">
            <div className="text-center">
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">License Hub</h1>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mt-2">Provision Institutional Access Nodes</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier) => (
                    <div key={tier.id} className={`p-10 rounded-[3rem] border-2 bg-[#0a101f]/40 flex flex-col transition-all hover:scale-105 ${pendingTier === tier.id ? 'border-primary' : 'border-gray-800'}`}>
                        <div className="flex justify-between items-start mb-4">
                           <h3 className="text-xl font-black text-white uppercase tracking-tight">{tier.name} GRADE</h3>
                           {tier.id === 'VIP' && <Crown className="w-5 h-5 text-amber-500" />}
                        </div>
                        <span className="text-4xl font-black text-white mb-8 italic">{tier.price}</span>
                        <ul className="space-y-4 mb-10 flex-1">
                            {tier.features.map(f => <li key={f} className="text-xs text-gray-400 font-bold uppercase flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full"/> {f}</li>)}
                        </ul>
                        {tier.numericPrice > 0 ? (
                           <button onClick={() => { setPendingTier(tier.id); setShowPayment(true); }} className="w-full py-5 bg-primary text-white font-black uppercase text-[10px] rounded-2xl tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all">Select Node</button>
                        ) : <div className="text-center text-gray-600 text-[10px] font-black uppercase py-5 border border-dashed border-gray-800 rounded-2xl">Core Integrated</div>}
                    </div>
                ))}
            </div>
            
            <div className="max-w-4xl mx-auto flex gap-6 items-start bg-gray-900/40 p-8 rounded-[2.5rem] border border-gray-800">
               <ShieldCheck className="w-10 h-10 text-primary shrink-0" />
               <div className="space-y-3">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Safety Disclaimer</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed tracking-wider">
                    Tier upgrades strictly unlock logic strategies and infrastructure features. Payments are handled via encrypted third-party gateways and do not grant access to liquidity unless a broker is manually connected and authorized by an admin.
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-[#0a101f] border border-gray-800 rounded-[3.5rem] p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse"></div>
              
              {paymentStep === 'GATEWAY_SELECT' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="mb-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-xl">
                            <CreditCard className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Settlement</h2>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2">Select Provisioning Protocol</p>
                    </div>

                    {error && (
                      <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3 text-danger text-[9px] font-black uppercase">
                        <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                      </div>
                    )}

                    <div className="space-y-3">
                        <button onClick={() => startPayment('PAYSTACK')} className="w-full p-6 bg-gray-900 border border-gray-800 rounded-[2rem] flex items-center justify-between hover:border-primary transition-all group">
                            <div className="flex items-center gap-4">
                                <Smartphone className="text-blue-400 group-hover:scale-110 transition-transform w-5 h-5" /> 
                                <span className="text-[11px] font-black text-white uppercase tracking-widest">Paystack Hub</span>
                            </div>
                            <ChevronRight className="text-gray-700 group-hover:text-primary w-4 h-4" />
                        </button>
                        <button onClick={() => startPayment('FLUTTERWAVE')} className="w-full p-6 bg-gray-900 border border-gray-800 rounded-[2rem] flex items-center justify-between hover:border-success transition-all group">
                            <div className="flex items-center gap-4">
                                <Globe className="text-success group-hover:scale-110 transition-transform w-5 h-5" /> 
                                <span className="text-[11px] font-black text-white uppercase tracking-widest">Flutterwave Hub</span>
                            </div>
                            <ChevronRight className="text-gray-700 group-hover:text-success w-4 h-4" />
                        </button>
                    </div>

                    <button onClick={() => setShowPayment(false)} className="text-[9px] text-gray-700 font-black uppercase hover:text-white transition-all tracking-widest mt-4">
                        Cancel Handshake
                    </button>
                </div>
              )}

              {paymentStep === 'HANDSHAKE' && (
                <div className="py-12 flex flex-col items-center animate-fade-in">
                    <div className="relative mb-8">
                       <Loader2 className="w-20 h-20 text-primary animate-spin" />
                       <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary/40" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase mb-4 tracking-tighter">Syncing Nodes</h2>
                    <p className="text-[10px] font-mono text-primary uppercase tracking-widest animate-pulse italic">Establishing Secure Checkout Tunnel...</p>
                </div>
              )}

              {paymentStep === 'READY' && (
                <div className="py-10 flex flex-col items-center animate-fade-in">
                    <div className="w-20 h-20 bg-success/10 rounded-[2rem] border border-success/30 flex items-center justify-center mb-8 shadow-2xl shadow-success/10">
                       <CheckCircle className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase mb-4 tracking-tighter italic">Handshake Ready</h2>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-10 px-4 leading-relaxed">
                        The secure settlement tunnel has been provisioned. Click below to complete the transaction via the encrypted gateway.
                    </p>
                    <a 
                      href={authUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-5 bg-success text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-success/20 hover:scale-105 transition-all"
                    >
                        PROCEED TO GATEWAY <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { X, Check, Crown, Loader2, Zap, CreditCard, Landmark, Smartphone, ChevronRight, ArrowRight } from 'lucide-react';
import { UserTier, PaymentGateway } from '../types';
import { initiateTierPayment, verifyTierPayment } from '../services/paymentService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: UserTier, gateway: PaymentGateway) => void;
  userEmail?: string;
  userId?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, userEmail = "trader@nexus.ai", userId = "USER-1" }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'GATEWAY_SELECT' | 'BANK_TRANSFER' | 'PROCESSING'>('GATEWAY_SELECT');
  const [pendingTier, setPendingTier] = useState<UserTier>('BASIC');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('PAYSTACK');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  if (!isOpen) return null;

  const tiers = [
    { id: 'BASIC' as UserTier, name: 'BASIC', price: '$0', numericPrice: 0, features: ['5 Major Assets', 'Basic AI Signals'], color: 'gray' },
    { id: 'PRO' as UserTier, name: 'PRO', price: '$60', numericPrice: 60, features: ['50+ Assets', 'Sentinel AI Backtest', 'Auto-Sync MT5'], color: 'yellow', popular: true },
    { id: 'VIP' as UserTier, name: 'VIP', price: '$300', numericPrice: 300, features: ['All 200+ Assets', 'HFT Sniper Logic', 'Priority Global Nodes'], color: 'purple' }
  ];

  const handleInitiate = async (tier: UserTier, amount: number) => {
    setPendingTier(tier);
    setShowPayment(true);
    setPaymentStep('GATEWAY_SELECT');
  };

  const startPayment = async (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setIsProcessing(true);
    try {
      const amount = tiers.find(t => t.id === pendingTier)?.numericPrice || 0;
      const res = await initiateTierPayment(userEmail, amount, pendingTier, userId);
      if (res.status) {
        setPaymentRef(res.data.reference);
        setPaymentStep('BANK_TRANSFER');
      }
    } catch (e) {
      alert("Payment initiation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeUpgrade = async () => {
    setPaymentStep('PROCESSING');
    setIsProcessing(true);
    const res = await verifyTierPayment(paymentRef);
    setTimeout(() => {
        if (res.success) {
            onUpgrade(pendingTier, selectedGateway);
            onClose();
            setShowPayment(false);
          }
          setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-fade-in">
      <div className="w-full max-w-6xl relative">
        <button onClick={onClose} className="absolute -top-12 right-0 text-gray-500 hover:text-white p-2 bg-white/5 rounded-full">
            <X className="w-8 h-8" />
        </button>

        {!showPayment ? (
          <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter">License Hub</h1>
                <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px] mt-3">Select your institutional grade protocol.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier) => (
                    <div key={tier.id} className={`p-10 rounded-[3.5rem] border-2 flex flex-col relative group transition-all ${
                        tier.id === 'VIP' ? 'bg-purple-500/5 border-purple-500/30 shadow-2xl shadow-purple-900/10' : 
                        tier.id === 'PRO' ? 'bg-yellow-500/5 border-yellow-500/30 shadow-2xl shadow-yellow-900/10' : 'bg-gray-800/20 border-gray-800'
                    }`}>
                        {tier.popular && <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Most Requested</span>}
                        <h3 className={`text-2xl font-black uppercase tracking-widest mb-6 ${tier.id === 'VIP' ? 'text-purple-400' : tier.id === 'PRO' ? 'text-yellow-400' : 'text-gray-400'}`}>{tier.name}</h3>
                        <div className="flex items-baseline gap-2 mb-10">
                            <span className="text-6xl font-black text-white tracking-tighter">{tier.price}</span>
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">/ Node</span>
                        </div>
                        <ul className="space-y-5 mb-12 flex-1">
                            {tier.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-4 text-xs font-bold text-gray-300 uppercase tracking-tight">
                                    <div className="w-2 h-2 rounded-full bg-primary/40"></div> {f}
                                </li>
                            ))}
                        </ul>
                        {tier.numericPrice > 0 ? (
                           <button 
                            disabled={isProcessing}
                            onClick={() => handleInitiate(tier.id, tier.numericPrice)}
                            className={`w-full py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95 ${
                                tier.id === 'VIP' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-900/20'
                            }`}
                           >
                               Authorize Billing <ArrowRight className="w-4 h-4 ml-2 inline" />
                           </button>
                        ) : (
                           <div className="w-full py-5 text-center border border-gray-700 rounded-[2rem] text-[10px] text-gray-500 font-black uppercase tracking-widest">Active Standard ID</div>
                        )}
                    </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-[#0a101f] border border-gray-800 rounded-[3.5rem] p-12 text-center animate-scale-up shadow-2xl shadow-black/80">
              {paymentStep === 'PROCESSING' ? (
                <div className="py-20 flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Settlement Node</h2>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-3">Syncing with {selectedGateway} Gateway</p>
                </div>
              ) : paymentStep === 'GATEWAY_SELECT' ? (
                <div className="animate-fade-in">
                    <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-primary/20">
                        <CreditCard className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-3">Billing Method</h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-10">Select your preferred Nigerian gateway.</p>
                    
                    <div className="space-y-4 mb-10">
                        <button onClick={() => startPayment('PAYSTACK')} className="w-full p-6 bg-gray-900 border border-gray-800 rounded-[2rem] flex items-center justify-between group hover:border-primary transition-all">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-primary/10 rounded-2xl"><Smartphone className="w-6 h-6 text-primary" /></div>
                                <div className="text-left">
                                    <p className="text-xs text-white font-black uppercase tracking-widest">Paystack</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase">Card / Transfer / USSD</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-primary" />
                        </button>
                        <button onClick={() => startPayment('FLUTTERWAVE')} className="w-full p-6 bg-gray-900 border border-gray-800 rounded-[2rem] flex items-center justify-between group hover:border-success transition-all">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-success/10 rounded-2xl"><Landmark className="w-6 h-6 text-success" /></div>
                                <div className="text-left">
                                    <p className="text-xs text-white font-black uppercase tracking-widest">Flutterwave</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase">Multi-Currency / Barter</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-success" />
                        </button>
                    </div>

                    <button onClick={() => setShowPayment(false)} className="text-[10px] text-gray-600 font-black uppercase hover:text-white transition-colors tracking-widest">Return to Node</button>
                </div>
              ) : (
                <div className="animate-fade-in text-left">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                        <Landmark className="w-6 h-6 text-primary" /> Verify Transfer
                    </h2>
                    <div className="bg-black/60 p-8 rounded-[2.5rem] border border-gray-800 mb-10 space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Gateway</span>
                            <span className="text-xs text-primary font-black uppercase">{selectedGateway}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Bank</span>
                            <span className="text-xs text-white font-black uppercase tracking-tighter">Kuda Bank (Nexus AI)</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Account</span>
                            <span className="text-sm font-mono font-black text-primary">2076557312</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Final Price</span>
                            <span className="text-lg font-mono font-black text-success">#{tiers.find(t=>t.id===pendingTier)?.numericPrice! * 1650}</span>
                        </div>
                    </div>
                    <button 
                        onClick={finalizeUpgrade}
                        className="w-full py-5 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-[2rem] shadow-2xl shadow-primary/20 mb-6"
                    >
                        Sync Transaction Data
                    </button>
                    <button onClick={() => setPaymentStep('GATEWAY_SELECT')} className="w-full text-[10px] text-gray-600 font-black uppercase text-center hover:text-white tracking-widest">Back to Protocols</button>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

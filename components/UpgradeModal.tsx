
import React, { useState } from 'react';
import { X, Check, Globe, Crown, Copy, Loader2, Star, Zap, Activity, Cpu, ChevronRight } from 'lucide-react';
import { UserTier } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: UserTier) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'foreign'>('local');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingTier, setPendingTier] = useState<UserTier>('BASIC');

  if (!isOpen) return null;

  const tiers = [
    {
      id: 'BASIC' as UserTier,
      name: 'BASIC',
      price: '$0',
      period: 'LIFETIME',
      color: 'gray',
      features: [
        '5 Major Assets Only', 
        'Basic Neural Analysis', 
        'Manual Signal Copying',
        'Basic Risk Management',
        'Standard Execution'
      ],
      popular: false
    },
    {
      id: 'PRO' as UserTier,
      name: 'PRO',
      price: '$60',
      period: 'ANNUAL LICENSE',
      color: 'yellow',
      features: [
        '50+ Global Assets & Forex', 
        'Sentinel Backtesting Suite',
        'Unlimited Neural Signals',
        'Multi-Broker Sync',
        'Advanced Staking'
      ],
      popular: true
    },
    {
      id: 'VIP' as UserTier,
      name: 'VIP',
      price: '$300',
      period: 'MASTER LICENSE',
      color: 'purple',
      features: [
        '200+ Assets, Stocks & Crypto', 
        'HFT Sniper logic (ms speed)', 
        'Auto Delta-Void Recovery',
        'Direct Developer Pipeline',
        'Ultra-Low Latency Node'
      ],
      popular: false
    }
  ];

  const handlePaymentConfirm = () => {
    if (!transactionRef.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
        onUpgrade(pendingTier);
        setIsSubmitting(false);
        onClose();
        setShowPayment(false);
    }, 2000);
  };

  const startPayment = (tier: UserTier) => {
    setPendingTier(tier);
    setShowPayment(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-4 md:p-6 animate-fade-in">
      <div className="w-full max-w-6xl relative h-full flex flex-col justify-center">
        <button onClick={onClose} className="absolute -top-10 right-0 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full p-2 z-[110]">
            <X className="w-6 h-6" />
        </button>

        {!showPayment ? (
          <div className="space-y-6 md:space-y-12 animate-fade-in overflow-y-auto scrollbar-hide py-10">
            <div className="text-center space-y-2 md:space-y-4">
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">License Deployment</h1>
                <p className="text-gray-500 font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-sm">Elevate your institutional execution capabilities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {tiers.map((tier) => (
                    <div 
                        key={tier.name}
                        className={`relative p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border-2 transition-all flex flex-col group ${
                            tier.name === 'VIP' ? 'bg-purple-500/5 border-purple-500/30 shadow-xl' : 
                            tier.name === 'PRO' ? 'bg-yellow-500/5 border-yellow-500/30 shadow-xl' : 
                            'bg-gray-800/20 border-gray-800'
                        }`}
                    >
                        {tier.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-6 py-1.5 rounded-full text-[9px] md:text-[11px] font-black uppercase shadow-2xl z-10">
                                Recommended
                            </div>
                        )}
                        <h3 className={`text-xl md:text-2xl font-black mb-1 uppercase tracking-tighter ${tier.color === 'purple' ? 'text-purple-400' : tier.color === 'yellow' ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {tier.name}
                        </h3>
                        <div className="flex items-baseline gap-2 mb-6 md:mb-8">
                             <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">{tier.price}</p>
                             <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">/ {tier.period}</span>
                        </div>
                        
                        <ul className="space-y-4 md:space-y-6 mb-8 md:mb-12 flex-1">
                            {tier.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-[10px] md:text-xs font-black uppercase text-gray-300 leading-tight">
                                    <Check className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 ${tier.color === 'purple' ? 'text-purple-500' : tier.color === 'yellow' ? 'text-yellow-500' : 'text-gray-500'}`} />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        {tier.id !== 'BASIC' ? (
                            <button 
                                onClick={() => startPayment(tier.id)}
                                className={`w-full py-5 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-2xl ${
                                    tier.color === 'purple' ? 'bg-purple-600 hover:bg-purple-500 text-white' : 
                                    'bg-yellow-500 hover:bg-yellow-400 text-black'
                                }`}
                            >
                                Deploy License
                            </button>
                        ) : (
                            <div className="w-full py-5 rounded-2xl bg-gray-800/50 border border-gray-700 text-gray-500 text-center text-[10px] font-black uppercase tracking-widest">Tier Active</div>
                        )}
                    </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#0f172a] border border-gray-700 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scale-up h-auto md:h-[700px] max-h-full">
             <div className="md:w-1/2 bg-black/40 p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-800">
                <div>
                   <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-6 md:mb-8">Bridge Verification</h2>
                   <div className="flex gap-2 p-1 bg-gray-900 rounded-2xl mb-8 md:mb-12 border border-gray-800">
                       <button onClick={() => setActiveTab('local')} className={`flex-1 py-3 text-[10px] font-black rounded-xl uppercase transition-all ${activeTab === 'local' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Local</button>
                       <button onClick={() => setActiveTab('foreign')} className={`flex-1 py-3 text-[10px] font-black rounded-xl uppercase transition-all ${activeTab === 'foreign' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Global</button>
                   </div>
                   <div className="bg-primary/5 border border-primary/20 p-6 md:p-10 rounded-3xl md:rounded-[3rem] space-y-4 md:space-y-6">
                      <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">Recipient Address</p>
                      <div className="flex justify-between items-center gap-2">
                         <span className="text-xl md:text-3xl font-mono text-white font-black tracking-widest break-all">{activeTab === 'local' ? '2076557312' : '215413095005'}</span>
                         <button onClick={() => navigator.clipboard.writeText(activeTab === 'local' ? '2076557312' : '215413095005')} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-gray-400 shrink-0">
                            <Copy className="w-5 h-5" />
                         </button>
                      </div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest italic opacity-60">
                        {activeTab === 'local' ? 'Kuda Institutional Node' : 'Global Grey Bridge'}
                      </p>
                   </div>
                </div>
                <button onClick={() => setShowPayment(false)} className="mt-8 text-[10px] font-black text-gray-500 uppercase hover:text-white transition-colors tracking-widest flex items-center gap-2">← Back to Plans</button>
             </div>
             <div className="md:w-1/2 p-8 md:p-16 space-y-6 md:space-y-10 bg-[#070b14]">
                <div className="space-y-4">
                   <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter mb-4">Validation Protocol</h3>
                   <div className="space-y-3">
                       <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Transaction Reference</p>
                       <input 
                          type="text" 
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value.toUpperCase())}
                          placeholder="TRX-NODE-XXXXXX"
                          className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-5 md:py-8 px-6 md:px-10 text-white font-mono uppercase tracking-[0.2em] md:tracking-[0.3em] text-base md:text-lg focus:border-primary outline-none"
                       />
                   </div>
                </div>
                <button 
                   onClick={handlePaymentConfirm}
                   disabled={!transactionRef || isSubmitting}
                   className="w-full py-6 md:py-8 bg-primary text-white font-black uppercase tracking-widest text-[10px] md:text-sm rounded-2xl md:rounded-3xl shadow-2xl disabled:opacity-50 transition-all"
                >
                   {isSubmitting ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin mx-auto" /> : `Authorize License`}
                </button>
                <div className="flex items-start gap-4 bg-gray-900/60 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-800">
                    <Activity className="w-8 h-8 text-success flex-shrink-0" />
                    <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase leading-relaxed opacity-60">Authentication active. Global node cross-referencing in progress. Dispatch triggers on suspicious activity.</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

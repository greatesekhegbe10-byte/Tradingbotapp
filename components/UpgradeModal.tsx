
import React, { useState } from 'react';
import { X, Check, CreditCard, Globe, Crown, ShieldCheck, Copy, MapPin, ReceiptText, Loader2, Key } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (details: { ref: string; apiKey?: string; method: 'local' | 'foreign' }) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'foreign'>('local');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePaymentConfirm = () => {
    if (!transactionRef.trim()) return;
    
    setIsSubmitting(true);
    // Simulate brief processing before passing to parent
    setTimeout(() => {
        onUpgrade({ 
            ref: transactionRef, 
            apiKey: apiKey.trim(),
            method: activeTab
        });
        setIsSubmitting(false);
        setTransactionRef(''); 
        setApiKey('');
        onClose();
    }, 1500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-surface border border-yellow-600/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative max-h-[90vh]">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 bg-black/40 rounded-full p-1.5 transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        {/* Left Side: Benefits */}
        <div className="bg-gradient-to-br from-yellow-900/40 to-black p-6 md:p-8 md:w-2/5 flex flex-col justify-between border-r border-yellow-600/20 overflow-y-auto">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold mb-6">
                    <Crown className="w-3 h-3 fill-current" /> PREMIUM ACCESS
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
                <p className="text-gray-400 text-sm mb-6">Unlock the full potential of NexusTrade AI with institutional-grade features.</p>
                
                <ul className="space-y-4">
                    {[
                        "High-Frequency Signals",
                        "High Risk/Reward Strategies",
                        "Unlimited Daily Trades",
                        "Access to Gold (XAU) & Exotic Pairs",
                        "Priority Execution Speed"
                    ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                            <Check className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-800 md:border-t-0 md:pt-0">
                <p className="text-2xl font-bold text-white">$499 <span className="text-sm font-normal text-gray-500">/ lifetime</span></p>
            </div>
        </div>

        {/* Right Side: Payment */}
        <div className="p-6 md:p-8 md:w-3/5 bg-surface overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-6">Select Payment Method</h3>
            
            <div className="flex gap-2 mb-6 p-1 bg-gray-900 rounded-lg overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('local')}
                    className={`flex-1 min-w-[90px] py-2 text-xs md:text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'local' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <CreditCard className="w-3 h-3 md:w-4 md:h-4" /> Local
                </button>
                <button 
                    onClick={() => setActiveTab('foreign')}
                    className={`flex-1 min-w-[90px] py-2 text-xs md:text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'foreign' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <Globe className="w-3 h-3 md:w-4 md:h-4" /> Grey
                </button>
            </div>

            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 mb-6">
                {activeTab === 'local' ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-blue-500/10 rounded-lg">
                                <CreditCard className="w-5 h-5 text-blue-400" />
                           </div>
                           <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bank Name</p>
                                <p className="text-white font-medium">Kuda Bank</p>
                           </div>
                        </div>
                        <div className="h-px bg-gray-800"></div>
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-blue-500/10 rounded-lg">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                           </div>
                           <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Number</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-white font-mono text-lg tracking-wider">2076557312</p>
                                    <button 
                                      onClick={() => copyToClipboard('2076557312', 'kuda-acc')} 
                                      className={`text-gray-500 hover:text-white transition-colors ${copiedId === 'kuda-acc' ? 'text-green-500' : ''}`}
                                    >
                                        {copiedId === 'kuda-acc' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                           </div>
                        </div>
                         <div className="flex items-start gap-3">
                           <div className="p-2 opacity-0"></div>
                           <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Name</p>
                                <p className="text-white font-medium">Aduyemi, Gabriel</p>
                           </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-start gap-3">
                           <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Globe className="w-5 h-5 text-purple-400" />
                           </div>
                           <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bank Name</p>
                                <p className="text-white font-medium">Lead Bank</p>
                           </div>
                        </div>

                        <div className="flex items-start gap-3">
                           <div className="p-2 opacity-0"></div>
                           <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Name</p>
                                <p className="text-white font-medium leading-tight text-sm">chioma chinenye alex-esekhegbe</p>
                           </div>
                        </div>

                        <div className="h-px bg-gray-800"></div>
                        
                         <div className="flex items-start gap-3">
                           <div className="p-2 bg-purple-500/10 rounded-lg">
                                <ShieldCheck className="w-5 h-5 text-purple-400" />
                           </div>
                           <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Number</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-white font-mono text-lg tracking-wider">215413095005</p>
                                    <button 
                                      onClick={() => copyToClipboard('215413095005', 'lead-acc')} 
                                      className={`text-gray-500 hover:text-white transition-colors ${copiedId === 'lead-acc' ? 'text-green-500' : ''}`}
                                    >
                                        {copiedId === 'lead-acc' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                           </div>
                        </div>
                        
                         <div className="flex items-start gap-3">
                           <div className="p-2 opacity-0"></div>
                           <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Routing (ACH/Wire)</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-mono text-sm">101019644</p>
                                        <button 
                                          onClick={() => copyToClipboard('101019644', 'lead-routing')} 
                                          className={`text-gray-500 hover:text-white transition-colors ${copiedId === 'lead-routing' ? 'text-green-500' : ''}`}
                                        >
                                           {copiedId === 'lead-routing' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                     <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Type</p>
                                     <p className="text-white font-medium text-sm">Checking</p>
                                </div>
                           </div>
                        </div>
                        
                         <div className="flex items-start gap-3">
                           <div className="p-2 opacity-0"></div>
                           <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bank Address</p>
                                <div className="flex items-start gap-1 text-gray-400">
                                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <p className="text-white text-xs leading-tight">1801 Main St., Kansas City, MO 64108</p>
                                </div>
                           </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Proof of Payment Section */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Proof of Payment</label>
                
                <div className="space-y-3">
                    <div className="relative">
                        <ReceiptText className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                        <input 
                            type="text" 
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="Enter Transaction Reference / Sender Name"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                        />
                    </div>
                    
                    {/* API Key Input for Instant Linking */}
                    <div className="relative">
                        <Key className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Bank API Key (Instant Verification)"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <p className="text-[10px] text-gray-500 mt-2">
                    * Linking your Bank API Key allows for instant payment confirmation via open protocols.
                </p>
            </div>

            <button 
                onClick={handlePaymentConfirm}
                disabled={!transactionRef.trim() || isSubmitting}
                className={`w-full py-3 font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                    !transactionRef.trim() 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-yellow-900/20 active:scale-95'
                }`}
            >
                {isSubmitting ? (
                    <>
                       <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                ) : (
                    <>
                       <Check className="w-4 h-4" /> Link & Verify Payment
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

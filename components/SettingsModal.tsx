
import React, { useState } from 'react';
import { X, Check, CreditCard, Globe, Crown, ShieldCheck, Copy, MapPin, ReceiptText, Loader2, Key, User, Settings as SettingsIcon, LayoutGrid, Wallet, Coins } from 'lucide-react';
import { BotConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onUpgrade: (details: { ref: string; apiKey?: string; method: 'local' | 'foreign' | 'crypto' }) => void;
  balances: { DEMO: number; LIVE: number };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onUpgrade, balances }) => {
  const [activeSection, setActiveSection] = useState<'plan' | 'payment' | 'wallet'>('plan');
  const [paymentTab, setPaymentTab] = useState<'local' | 'foreign' | 'crypto'>('local');
  
  // Payment Form State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePaymentConfirm = () => {
    if (!transactionRef.trim()) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
        onUpgrade({ 
            ref: transactionRef, 
            apiKey: apiKey.trim(),
            method: paymentTab
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
      <div className="bg-surface border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-900/50 border-r border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-gray-400" /> Settings
            </h2>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveSection('plan')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeSection === 'plan' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> My Plan
            </button>
            <button 
              onClick={() => setActiveSection('wallet')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeSection === 'wallet' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <Wallet className="w-4 h-4" /> Wallets
            </button>
            <button 
              onClick={() => setActiveSection('payment')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeSection === 'payment' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Payment & Billing
            </button>
          </nav>
          <div className="p-4 border-t border-gray-700">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white">Trader ID</p>
                    <p className="text-xs text-gray-500 font-mono">#8X92-L4</p>
                </div>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-surface flex flex-col relative overflow-hidden">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 bg-black/20 rounded-full p-2 hover:bg-black/40 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* PLAN SECTION */}
          {activeSection === 'plan' && (
            <div className="flex-1 p-8 overflow-y-auto">
              <h1 className="text-2xl font-bold text-white mb-2">Subscription Plan</h1>
              <p className="text-gray-400 mb-8">Manage your NexusTrade tier and features.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Tier */}
                <div className={`p-6 rounded-2xl border ${!config.isPro ? 'bg-gray-800 border-primary shadow-lg shadow-primary/10' : 'bg-gray-900/30 border-gray-700 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">Starter</h3>
                        <p className="text-sm text-gray-400">Essential tools for beginners.</p>
                    </div>
                    {!config.isPro && <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">CURRENT</span>}
                  </div>
                  <div className="text-3xl font-bold text-white mb-6">$0 <span className="text-sm font-normal text-gray-500">/ mo</span></div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-gray-300"><Check className="w-4 h-4 text-gray-500" /> Basic Market Analysis</li>
                    <li className="flex items-center gap-2 text-sm text-gray-300"><Check className="w-4 h-4 text-gray-500" /> Low & Medium Risk Modes</li>
                    <li className="flex items-center gap-2 text-sm text-gray-300"><Check className="w-4 h-4 text-gray-500" /> 3 Auto-Trades / Day</li>
                    <li className="flex items-center gap-2 text-sm text-gray-500"><X className="w-4 h-4" /> No Forex Majors/Exotics</li>
                  </ul>
                </div>

                {/* Pro Tier */}
                <div className={`p-6 rounded-2xl border relative overflow-hidden ${config.isPro ? 'bg-gradient-to-br from-yellow-900/20 to-black border-yellow-500 shadow-xl shadow-yellow-900/20' : 'bg-gray-800 border-gray-700'}`}>
                  {config.isPro && <div className="absolute top-0 right-0 px-4 py-1 bg-yellow-500 text-black text-xs font-bold rounded-bl-xl">ACTIVE</div>}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">Professional <Crown className="w-4 h-4 text-yellow-500 fill-current" /></h3>
                        <p className="text-sm text-gray-400">Institutional power unlocked.</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-6">$499 <span className="text-sm font-normal text-gray-500">/ lifetime</span></div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-white"><Check className="w-4 h-4 text-yellow-500" /> AI Sniper Mode (80%+ WR)</li>
                    <li className="flex items-center gap-2 text-sm text-white"><Check className="w-4 h-4 text-yellow-500" /> High Risk / High Reward</li>
                    <li className="flex items-center gap-2 text-sm text-white"><Check className="w-4 h-4 text-yellow-500" /> Unlimited Trades</li>
                    <li className="flex items-center gap-2 text-sm text-white"><Check className="w-4 h-4 text-yellow-500" /> All 50+ Pairs (Gold, Oil)</li>
                  </ul>
                  
                  {!config.isPro ? (
                      <button 
                        onClick={() => setActiveSection('payment')}
                        className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded-xl shadow-lg shadow-yellow-900/20 transition-all"
                      >
                        Upgrade Now
                      </button>
                  ) : (
                      <div className="w-full py-3 bg-gray-800 text-gray-400 font-bold rounded-xl border border-gray-700 text-center text-sm cursor-default">
                        Lifetime License Active
                      </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* WALLET SECTION */}
          {activeSection === 'wallet' && (
              <div className="flex-1 p-8 overflow-y-auto">
                  <h1 className="text-2xl font-bold text-white mb-2">Account Wallets</h1>
                  <p className="text-gray-400 mb-8">Monitor your available capital across accounts.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* DEMO WALLET */}
                      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex flex-col justify-between h-48 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 bg-gray-600/20 rounded-bl-xl text-gray-400 text-xs font-bold">DEMO</div>
                          <div>
                              <div className="flex items-center gap-2 mb-2">
                                  <div className="p-2 bg-gray-700 rounded-lg">
                                      <Globe className="w-5 h-5 text-gray-300" />
                                  </div>
                                  <h3 className="font-bold text-gray-300">Practice Account</h3>
                              </div>
                              <p className="text-3xl font-mono font-bold text-white mt-4">
                                  ${balances.DEMO.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                          </div>
                          <button className="w-full py-2 mt-4 bg-gray-700 text-gray-300 font-medium rounded-lg text-sm hover:bg-gray-600 transition-colors">
                              Reset Balance
                          </button>
                      </div>

                      {/* LIVE WALLET */}
                      <div className="bg-gradient-to-br from-green-900/20 to-black p-6 rounded-2xl border border-green-500/30 flex flex-col justify-between h-48 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 bg-green-500/20 rounded-bl-xl text-green-400 text-xs font-bold">LIVE</div>
                           <div>
                              <div className="flex items-center gap-2 mb-2">
                                  <div className="p-2 bg-green-500/10 rounded-lg">
                                      <Wallet className="w-5 h-5 text-green-400" />
                                  </div>
                                  <h3 className="font-bold text-white">Live Trading</h3>
                              </div>
                              <p className="text-3xl font-mono font-bold text-white mt-4">
                                  ${balances.LIVE.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                          </div>
                          <div className="flex gap-2 mt-4">
                              <button className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm shadow-lg shadow-green-900/20 transition-all">
                                  Deposit
                              </button>
                              <button className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg text-sm transition-colors">
                                  Withdraw
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* PAYMENT SECTION */}
          {activeSection === 'payment' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="p-6 md:p-8 flex-shrink-0 border-b border-gray-800">
                    <h1 className="text-2xl font-bold text-white mb-1">Make Payment</h1>
                    <p className="text-gray-400 text-sm">Select a method to complete your Pro upgrade.</p>
                </div>
                
                {config.paymentStatus === 'VERIFIED' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <ShieldCheck className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Pro Plan Active</h2>
                        <p className="text-gray-400 max-w-sm">
                            Your payment has been verified. You have full access to all institutional features.
                        </p>
                    </div>
                ) : config.paymentStatus === 'PENDING' ? (
                     <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
                            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Verification in Progress</h2>
                        <p className="text-gray-400 max-w-sm mb-4">
                            We are currently verifying your transaction with the bank API. This usually takes 1-5 minutes.
                        </p>
                         <p className="text-xs text-gray-500">Please do not close the application.</p>
                    </div>
                ) : (
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {/* Payment Tabs */}
                    <div className="flex gap-2 mb-6 p-1 bg-gray-900 rounded-xl w-full max-w-md overflow-x-auto">
                        {['local', 'foreign', 'crypto'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setPaymentTab(tab as any)}
                                className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg transition-all capitalize whitespace-nowrap flex items-center justify-center gap-2 ${
                                    paymentTab === tab ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {tab === 'local' && <CreditCard className="w-3 h-3" />}
                                {tab === 'foreign' && <Globe className="w-3 h-3" />}
                                {tab === 'crypto' && <Coins className="w-3 h-3" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Payment Details Content */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-8">
                         {paymentTab === 'local' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                                    <span className="text-gray-400 text-sm">Bank Name</span>
                                    <span className="text-white font-medium">Kuda Bank</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                                    <span className="text-gray-400 text-sm">Account Name</span>
                                    <span className="text-white font-medium">Aduyemi, Gabriel</span>
                                </div>
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-blue-400 font-bold uppercase mb-1">Account Number</p>
                                        <p className="text-xl font-mono text-white tracking-wider">2076557312</p>
                                    </div>
                                    <button onClick={() => copyToClipboard('2076557312', 'kuda')} className="text-blue-400 hover:text-white">
                                        {copiedId === 'kuda' ? <Check /> : <Copy />}
                                    </button>
                                </div>
                            </div>
                         )}

                         {paymentTab === 'foreign' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                                    <span className="text-gray-400 text-sm">Bank Name</span>
                                    <span className="text-white font-medium">Lead Bank</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                                    <span className="text-gray-400 text-sm">Account Name</span>
                                    <span className="text-white font-medium text-right text-xs sm:text-sm">chioma chinenye alex-esekhegbe</span>
                                </div>
                                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-purple-400 font-bold uppercase mb-1">Account Number</p>
                                        <p className="text-xl font-mono text-white tracking-wider">215413095005</p>
                                    </div>
                                    <button onClick={() => copyToClipboard('215413095005', 'lead')} className="text-purple-400 hover:text-white">
                                        {copiedId === 'lead' ? <Check /> : <Copy />}
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500 text-center mt-2">
                                    Routing: <span className="text-gray-300 font-mono">101019644</span> • Address: 1801 Main St, Kansas City
                                </div>
                            </div>
                         )}

                         {paymentTab === 'crypto' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                                    <span className="text-gray-400 text-sm">Network</span>
                                    <span className="text-white font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">TRC20</span>
                                </div>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs text-orange-400 font-bold uppercase">USDT Address (TRC20)</p>
                                        <button onClick={() => copyToClipboard('TV9k2n7j23...x8Jk', 'crypto')} className="text-orange-400 hover:text-white">
                                            {copiedId === 'crypto' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-sm font-mono text-white break-all">TV9k2n7j237d82hd283d73hd2823x8Jk</p>
                                </div>
                                <div className="text-xs text-gray-500 text-center">
                                    * Only send USDT via TRON (TRC20) network.
                                </div>
                            </div>
                         )}
                    </div>

                    {/* Verification Form */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-300">Confirm Payment</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                placeholder="Transaction Ref / ID" 
                                className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                            />
                            <input 
                                type="password" 
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Bank API Key (Instant)" 
                                className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-primary outline-none"
                            />
                        </div>
                        
                        <button 
                            onClick={handlePaymentConfirm}
                            disabled={!transactionRef || isSubmitting}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                !transactionRef || isSubmitting 
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                : 'bg-success hover:bg-green-600 text-white shadow-lg shadow-green-900/20'
                            }`}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            {isSubmitting ? 'Verifying...' : 'Verify & Unlock Pro'}
                        </button>
                    </div>

                </div>
                )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

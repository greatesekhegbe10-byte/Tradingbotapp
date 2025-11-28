
import React, { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, Globe, Lock, Copy, Check, Loader2, AlertCircle, Wifi } from 'lucide-react';

interface SubscriptionGateProps {
  onVerify: () => void;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ onVerify }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'foreign'>('local');
  const [ref, setRef] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = () => {
    if (!ref.trim()) return;
    setError(null);

    // 1. Strict validation simulation
    if (ref.length < 5) {
        setError("Invalid Transaction Reference. ID is too short.");
        return;
    }

    setIsVerifying(true);
    setVerificationStatus('Initializing Secure Handshake...');

    // 2. Simulate Realistic Banking API Delays & Steps
    const bankName = activeTab === 'local' ? 'Kuda Bank' : 'Lead Bank';

    setTimeout(() => {
        setVerificationStatus(`Connecting to ${bankName} Gateway...`);
    }, 1500);

    setTimeout(() => {
        setVerificationStatus(`Querying Transaction Ledger for ID: ${ref}...`);
    }, 3500);

    setTimeout(() => {
        setVerificationStatus('Verifying Amount ($20.00) & Timestamp...');
    }, 6000);

    setTimeout(() => {
        setVerificationStatus('Payment Confirmed. Generating Access Token...');
        
        setTimeout(() => {
            setIsVerifying(false);
            onVerify();
        }, 1500);
    }, 8000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] bg-accent/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-4xl bg-surface/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl relative z-10 flex flex-col md:flex-row overflow-hidden animate-fade-in">
        
        {/* Left Panel: Value Prop */}
        <div className="md:w-2/5 bg-gray-900/50 p-8 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Activate License</h1>
            <p className="text-gray-400 text-sm mb-6">
              Institutional Terminal Access requires a verified active subscription.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-500" />
                </div>
                Real-time Bank Verification
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-500" />
                </div>
                Secure SSL Gateway
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-500" />
                </div>
                Lifetime Platform Access
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Subscription Fee</p>
                    <p className="text-4xl font-mono font-bold text-white">$20.00</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-[10px] text-green-400 font-medium mb-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        Gateway Live
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Payment Form */}
        <div className="flex-1 p-8 overflow-y-auto max-h-[600px]">
          <div className="flex gap-2 mb-6 p-1 bg-gray-900 rounded-lg">
            <button 
                onClick={() => setActiveTab('local')}
                disabled={isVerifying}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'local' ? 'bg-gray-800 text-white shadow border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <CreditCard className="w-4 h-4" /> Local Bank
            </button>
            <button 
                onClick={() => setActiveTab('foreign')}
                disabled={isVerifying}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'foreign' ? 'bg-gray-800 text-white shadow border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <Globe className="w-4 h-4" /> Foreign (Grey)
            </button>
          </div>

          <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-5 mb-6">
            {activeTab === 'local' ? (
              <div className="space-y-4 animate-fade-in">
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Bank Name</span>
                    <span className="text-white font-medium">Kuda Bank</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Account Name</span>
                    <span className="text-white font-medium">Aduyemi, Gabriel</span>
                 </div>
                 <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase mb-0.5">Account Number</p>
                        <p className="text-lg font-mono text-white tracking-wider">2076557312</p>
                    </div>
                    <button onClick={() => copyToClipboard('2076557312', 'kuda')} className="text-blue-400 hover:text-white transition-colors">
                        {copiedId === 'kuda' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Bank Name</span>
                    <span className="text-white font-medium">Lead Bank (Grey)</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Account Name</span>
                    <span className="text-white font-medium text-xs">chioma chinenye alex-esekhegbe</span>
                 </div>
                 <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-purple-400 font-bold uppercase mb-0.5">Account Number</p>
                        <p className="text-lg font-mono text-white tracking-wider">215413095005</p>
                    </div>
                    <button onClick={() => copyToClipboard('215413095005', 'lead')} className="text-purple-400 hover:text-white transition-colors">
                        {copiedId === 'lead' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Proof of Payment</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={ref}
                        onChange={(e) => setRef(e.target.value)}
                        placeholder="Enter Transaction Reference / Sender Name"
                        disabled={isVerifying}
                        className={`w-full bg-gray-900 border rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:ring-1 focus:ring-primary outline-none transition-all ${error ? 'border-danger focus:border-danger' : 'border-gray-600'}`}
                    />
                </div>
                {error && (
                    <div className="flex items-center gap-2 mt-2 text-danger text-xs animate-pulse">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                    </div>
                )}
            </div>
            
            <button 
                onClick={handleSubmit}
                disabled={!ref.trim() || isVerifying}
                className={`w-full py-3.5 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                    !ref.trim() || isVerifying
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-primary hover:bg-blue-600 shadow-blue-900/20'
                }`}
            >
                {isVerifying ? (
                    <>
                       <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                    </>
                ) : (
                    <>
                       <ShieldCheck className="w-5 h-5" /> Verify & Access Terminal
                    </>
                )}
            </button>
            
            {/* Status updates during verification */}
            {isVerifying && (
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700 animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative">
                            <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
                        </div>
                        <span className="text-xs font-mono text-gray-300">{verificationStatus}</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 animate-progress"></div>
                    </div>
                </div>
            )}

            {!isVerifying && (
                <p className="text-[10px] text-center text-gray-500 mt-2">
                    * Access is granted only upon successful bank confirmation.
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

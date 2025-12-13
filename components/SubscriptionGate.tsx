
import React, { useState, useRef } from 'react';
import { ShieldCheck, CreditCard, Globe, Lock, Copy, Check, Loader2, AlertCircle, Wifi, Upload, FileText, Mail, ArrowRight, Smartphone, FileCheck } from 'lucide-react';

interface SubscriptionGateProps {
  onVerify: () => void;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ onVerify }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'foreign'>('local');
  
  // Form State
  const [ref, setRef] = useState('');
  const [email, setEmail] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  
  // Process State
  const [step, setStep] = useState<'FORM' | 'VERIFYING' | 'OTP'>('FORM');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
      setError(null);
    }
  };

  const validateForm = () => {
    // Strict Validation Rules
    if (!email.includes('@') || !email.includes('.')) return "Please enter a valid email address for receipt.";
    if (ref.length < 8) return "Transaction Reference is too short (Min 8 chars).";
    if (!/^[a-zA-Z0-9]+$/.test(ref)) return "Reference must be alphanumeric (No spaces/symbols).";
    if (!receipt) return "Proof of payment (Receipt) upload is required.";
    if (!agreed) return "You must certify that this transaction is authentic.";
    return null;
  };

  const initiateVerification = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStep('VERIFYING');
    setVerificationStatus('Initiating SSL Handshake...');

    // Simulate Bank Verification Process
    const bankName = activeTab === 'local' ? 'Kuda Bank' : 'Lead Bank';

    setTimeout(() => setVerificationStatus(`Connecting to ${bankName} Secure Gateway...`), 1500);
    setTimeout(() => setVerificationStatus(`Locating Transaction Ref: ${ref.toUpperCase()}...`), 3000);
    setTimeout(() => setVerificationStatus('Validating Amount ($20.00) & Timestamp...'), 5000);
    
    setTimeout(() => {
      // Generate OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setVerificationStatus('Payment Verified. Sending 2FA Code...');
      
      setTimeout(() => {
        setStep('OTP');
        // Simulate Email Arrival
        setShowToast(true);
        // Hide toast after 8 seconds
        setTimeout(() => setShowToast(false), 8000);
      }, 2000);
    }, 7000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === generatedOtp) {
        setIsVerifying(true); // Re-use visual for final unlock
        setTimeout(() => {
            onVerify();
        }, 1000);
    } else {
        setError("Invalid OTP Code. Access Denied.");
        setOtpInput('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Simulated Email Notification Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[100] animate-fade-in w-80 bg-white text-gray-900 rounded-lg shadow-2xl border-l-4 border-red-500 p-4">
            <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-full">
                    <Mail className="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <h4 className="font-bold text-sm">Gmail: New Message</h4>
                    <p className="text-xs text-gray-600 mt-1">NexusTrade Security: Your verification code is <span className="font-mono font-bold text-lg text-black bg-yellow-100 px-1">{generatedOtp}</span></p>
                    <p className="text-[10px] text-gray-400 mt-1">Just now</p>
                </div>
            </div>
        </div>
      )}

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
            <h1 className="text-2xl font-bold text-white mb-2">Secure Gateway</h1>
            <p className="text-gray-400 text-sm mb-6">
              Institutional Access requires strict KYC & Payment Verification.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 text-green-500" />
                </div>
                Bank-Grade Validation
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Smartphone className="w-3 h-3 text-green-500" />
                </div>
                2FA OTP Required
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-green-500" />
                </div>
                Receipt Audit
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Total Due</p>
                    <p className="text-4xl font-mono font-bold text-white">$20.00</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-[10px] text-green-400 font-medium mb-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        SSL 256-bit
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Verification Flow */}
        <div className="flex-1 p-8 overflow-y-auto max-h-[600px] bg-surface relative">
          
          {step === 'FORM' && (
             <div className="animate-fade-in space-y-5">
                <div className="flex gap-2 p-1 bg-gray-900 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('local')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'local' ? 'bg-gray-800 text-white shadow border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <CreditCard className="w-4 h-4" /> Local Bank
                    </button>
                    <button 
                        onClick={() => setActiveTab('foreign')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'foreign' ? 'bg-gray-800 text-white shadow border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Globe className="w-4 h-4" /> Foreign
                    </button>
                </div>

                <div className="bg-gray-900/30 border border-gray-700 rounded-xl p-5">
                    {activeTab === 'local' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Bank</span>
                            <span className="text-white font-medium">Kuda Bank</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-blue-400 font-bold uppercase mb-0.5">Account Number</p>
                                <p className="text-lg font-mono text-white tracking-wider">2076557312</p>
                            </div>
                            <button onClick={() => copyToClipboard('2076557312', 'kuda')} className="text-blue-400 hover:text-white">
                                {copiedId === 'kuda' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                         <div className="text-right text-xs text-gray-500">Name: Aduyemi, Gabriel</div>
                    </div>
                    ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Bank</span>
                            <span className="text-white font-medium">Lead Bank (Grey)</span>
                        </div>
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-purple-400 font-bold uppercase mb-0.5">Account Number</p>
                                <p className="text-lg font-mono text-white tracking-wider">215413095005</p>
                            </div>
                            <button onClick={() => copyToClipboard('215413095005', 'lead')} className="text-purple-400 hover:text-white">
                                {copiedId === 'lead' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="relative">
                         <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                         <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address (For OTP)"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 pl-9 pr-4 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                         />
                    </div>

                    <div className="relative">
                         <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                         <input 
                            type="text" 
                            value={ref}
                            onChange={(e) => setRef(e.target.value.toUpperCase())}
                            placeholder="Transaction Reference (e.g. TRX829...)"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 pl-9 pr-4 text-white text-sm focus:ring-1 focus:ring-primary outline-none font-mono uppercase"
                         />
                    </div>

                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-700 hover:border-primary rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors"
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-400">
                            {receipt ? <span className="text-green-400 font-bold">{receipt.name}</span> : "Upload Payment Receipt"}
                        </span>
                    </div>

                    {/* Strict Agreement Checkbox */}
                    <div className="flex items-start gap-3 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                        <div 
                            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${agreed ? 'bg-primary border-primary' : 'border-gray-500'}`}
                            onClick={() => setAgreed(!agreed)}
                        >
                            {agreed && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight cursor-pointer select-none" onClick={() => setAgreed(!agreed)}>
                            I certify that I have transferred <span className="text-white font-bold">$20.00</span> to the details above and attached genuine proof. Falsifying payment data triggers an immediate IP ban.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-danger text-xs animate-pulse bg-red-900/10 p-2 rounded">
                            <AlertCircle className="w-3 h-3" /> {error}
                        </div>
                    )}

                    <button 
                        onClick={initiateVerification}
                        className="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        Verify Payment <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
             </div>
          )}

          {step === 'VERIFYING' && (
              <div className="h-full flex flex-col items-center justify-center animate-fade-in text-center space-y-6">
                 <div className="relative">
                     <div className="w-20 h-20 border-4 border-gray-700 rounded-full"></div>
                     <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                     <Wifi className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500 w-8 h-8 animate-pulse" />
                 </div>
                 <div>
                     <h3 className="text-lg font-bold text-white mb-2">Verifying Transaction</h3>
                     <p className="text-sm text-gray-400 font-mono">{verificationStatus}</p>
                 </div>
                 <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden max-w-xs">
                     <div className="h-full bg-green-500 animate-progress"></div>
                 </div>
              </div>
          )}

          {step === 'OTP' && (
              <div className="h-full flex flex-col justify-center animate-fade-in space-y-6">
                  <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Lock className="w-8 h-8 text-yellow-500" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Security Verification</h3>
                      <p className="text-sm text-gray-400 max-w-xs mx-auto">
                          We've sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>.
                      </p>
                  </div>

                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Enter Code</label>
                          <input 
                             type="text" 
                             value={otpInput}
                             onChange={(e) => setOtpInput(e.target.value)}
                             placeholder="000000"
                             className="w-full bg-black border border-gray-600 rounded-xl py-4 text-center text-2xl tracking-[0.5em] text-white font-mono focus:border-yellow-500 outline-none transition-all"
                             maxLength={6}
                          />
                      </div>

                      {error && (
                        <div className="flex items-center justify-center gap-2 text-danger text-xs animate-pulse">
                            <AlertCircle className="w-3 h-3" /> {error}
                        </div>
                      )}

                      <button 
                        type="submit"
                        disabled={otpInput.length !== 6 || isVerifying}
                        className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
                            otpInput.length !== 6 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-900/20'
                        }`}
                      >
                         {isVerifying ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Authenticate & Login"}
                      </button>
                  </form>
                  
                  <div className="text-center">
                      <button onClick={() => {
                          setStep('FORM');
                          setError(null);
                      }} className="text-xs text-gray-500 hover:text-white underline">
                          Wrong email? Go back
                      </button>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

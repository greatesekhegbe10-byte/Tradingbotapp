
import React, { useState, useRef } from 'react';
import { UserProfile, UserTier, GatewayConfig } from '../types';
import { PaymentLog } from '../App';
// Added ShieldCheck to the imports to resolve the reference error in the GATEWAYS section.
import { Users, ShieldAlert, ShieldCheck, Star, Ban, CheckCircle, TrendingUp, DollarSign, UserPlus, CreditCard, Landmark, CheckCircle2, Clock, Settings, Key, Globe, Search, Filter, Smartphone, Zap, Save, AlertTriangle, Eye, EyeOff, Trash2, Lock, Upload, Image as ImageIcon } from 'lucide-react';
import { NEXUS_LOGO } from '../assets';

interface AdminTabProps {
  users: UserProfile[];
  payments: PaymentLog[];
  gateways: GatewayConfig[];
  stats: {
    activeNodes: number;
    verifiedPayments: number;
    totalRevenue: number;
    pendingPayments: number;
  };
  onUpdateGateways: (configs: GatewayConfig[]) => void;
  onUpdateUser: (userId: string, updates: Partial<UserProfile>) => void;
  onDeleteUser: (userId: string) => void;
  onVerifyPayment: (paymentId: string) => void;
  onUpdateLogo: (newLogo: string) => void;
  currentLogo: string;
}

export const AdminTab: React.FC<AdminTabProps> = ({ users, payments, gateways, stats, onUpdateGateways, onUpdateUser, onDeleteUser, onVerifyPayment, onUpdateLogo, currentLogo }) => {
  const [activeSubTab, setActiveSubTab] = useState<'USERS' | 'PAYMENTS' | 'GATEWAYS' | 'SYSTEM'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [editedGateways, setEditedGateways] = useState<GatewayConfig[]>([...gateways]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [paymentsUnlocked, setPaymentsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const ROOT_PASSCODE = '08126972446';

  const handleGatewayChange = (index: number, field: keyof GatewayConfig, value: string | boolean) => {
    const updated = [...editedGateways];
    updated[index] = { ...updated[index], [field]: value } as any;
    setEditedGateways(updated);
  };

  const toggleKeyVisibility = (gatewayName: string) => {
    setShowKeys(prev => ({ ...prev, [gatewayName]: !prev[gatewayName] }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveGateways = () => {
    onUpdateGateways(editedGateways);
    alert("SYSTEM: Payment Infrastructure Re-Synced to Production.");
  };

  const unlockPayments = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === ROOT_PASSCODE) {
      setPaymentsUnlocked(true);
      setPasscodeInput('');
    } else {
      alert("UNAUTHORIZED: Invalid Root Credentials.");
      setPasscodeInput('');
    }
  };

  const filteredPayments = payments.filter(p => 
    p.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-accent/10 rounded-[2rem] border border-accent/20 shadow-xl">
            <img src={currentLogo} alt="Nexus" className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic">Alex Root Node</h1>
            <p className="text-accent/60 font-black uppercase tracking-[0.4em] text-[10px] flex items-center gap-2 mt-1">
              Cluster Maintenance Hub v4.5
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
           <div className="bg-surface border border-gray-800 px-6 py-5 rounded-[2rem] flex flex-col items-center shadow-2xl">
              <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Live Nodes</span>
              <span className="text-2xl font-mono font-black text-white">{stats.activeNodes}</span>
           </div>
           <div className="bg-surface border border-gray-800 px-6 py-5 rounded-[2rem] flex flex-col items-center shadow-2xl">
              <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Verified Settlements</span>
              <span className="text-2xl font-mono font-black text-success animate-pulse">{stats.verifiedPayments}</span>
           </div>
           <div className="bg-surface border border-gray-800 px-6 py-5 rounded-[2rem] flex flex-col items-center shadow-2xl">
              <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Treasury Rev</span>
              <span className="text-2xl font-mono font-black text-primary">${stats.totalRevenue.toLocaleString()}</span>
           </div>
           <div className="bg-surface border border-gray-800 px-6 py-5 rounded-[2rem] flex flex-col items-center shadow-2xl">
              <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Awaiting Flag</span>
              <span className="text-2xl font-mono font-black text-amber-500">{stats.pendingPayments}</span>
           </div>
        </div>
      </header>

      <div className="flex gap-4 mb-10 bg-gray-900/50 p-2 rounded-[2.5rem] border border-gray-800 w-fit backdrop-blur-3xl">
          {[
              { id: 'USERS', label: 'Nodes', icon: Users },
              { id: 'PAYMENTS', label: 'Settlements', icon: CreditCard },
              { id: 'GATEWAYS', label: 'Keys', icon: Settings },
              { id: 'SYSTEM', label: 'Identity', icon: ImageIcon }
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeSubTab === tab.id ? 'bg-accent text-white shadow-2xl shadow-accent/40' : 'text-gray-500 hover:text-white'
                }`}
              >
                  <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
          ))}
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 space-y-10">
          
          {activeSubTab === 'USERS' && (
            <section className="bg-surface rounded-[4rem] border border-gray-800 p-10 shadow-2xl animate-fade-in">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4 mb-12">
                    <Users className="w-7 h-7 text-accent" /> Node Provisioning Registry
                </h2>
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-[10px] text-gray-500 font-black uppercase tracking-widest border-b border-gray-800">
                        <th className="px-8 py-6">Node Holder</th>
                        <th className="px-8 py-6">License Grade</th>
                        <th className="px-8 py-6">Node Status</th>
                        <th className="px-8 py-6 text-right">Liquidity</th>
                        <th className="px-8 py-6 text-center">Root Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                    {users.map(u => (
                        <tr key={u.id} className="group hover:bg-accent/5 transition-all">
                        <td className="px-8 py-8">
                            <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[1.5rem] bg-gray-900 flex items-center justify-center text-accent font-black text-lg border border-gray-800 shadow-xl overflow-hidden">
                                {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-base font-black text-white uppercase tracking-tighter">{u.name}</p>
                                <p className="text-[10px] text-gray-500 font-mono tracking-wider">{u.email}</p>
                            </div>
                            </div>
                        </td>
                        <td className="px-8 py-8">
                            <select 
                            value={u.tier}
                            onChange={(e) => onUpdateUser(u.id, { tier: e.target.value as UserTier })}
                            className={`bg-black/60 border border-gray-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-accent ${
                                u.tier === 'VIP' ? 'text-purple-400 font-black' : u.tier === 'PRO' ? 'text-yellow-400 font-black' : 'text-gray-400'
                            }`}
                            >
                            <option value="BASIC">BASIC</option>
                            <option value="PRO">PRO (UNLOCKED)</option>
                            <option value="VIP">VIP (UNLOCKED)</option>
                            </select>
                        </td>
                        <td className="px-8 py-8">
                            <button 
                            onClick={() => onUpdateUser(u.id, { status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 border transition-all ${
                                u.status === 'ACTIVE' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'
                            }`}
                            >
                            <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
                            {u.status}
                            </button>
                        </td>
                        <td className="px-8 py-8 text-right font-mono font-black text-white text-base">
                            ${u.balance.toLocaleString()}
                        </td>
                        <td className="px-8 py-8 text-center">
                            <button 
                                onClick={() => { if(confirm(`Confirm permanent removal of node ${u.id}?`)) onDeleteUser(u.id); }}
                                className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </section>
          )}

          {activeSubTab === 'SYSTEM' && (
             <section className="bg-surface rounded-[4rem] border border-gray-800 p-12 shadow-2xl animate-fade-in text-center">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4 mb-12 justify-center">
                    <ImageIcon className="w-7 h-7 text-accent" /> Identity Management
                </h2>
                <div className="flex flex-col items-center gap-8">
                   <div className="w-48 h-48 bg-gray-900 rounded-[3rem] flex items-center justify-center border-4 border-accent/20 shadow-2xl relative group overflow-hidden">
                      <img src={currentLogo} alt="Current Logo" className="w-32 h-32 object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                         <Upload className="w-10 h-10 text-white animate-bounce" />
                      </div>
                   </div>
                   <div className="space-y-4 max-w-sm w-full">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                        accept="image/*" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-5 bg-accent text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-accent/80 transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/20"
                      >
                         <Upload className="w-4 h-4" /> Upload New Protocol Logo
                      </button>
                      <button 
                        onClick={() => onUpdateLogo(NEXUS_LOGO)}
                        className="w-full py-3 text-gray-500 font-black uppercase tracking-widest text-[9px] hover:text-white transition-all"
                      >
                         Reset to Factory Assets
                      </button>
                   </div>
                </div>
             </section>
          )}

          {activeSubTab === 'PAYMENTS' && (
            <section className="bg-surface rounded-[4rem] border border-gray-800 p-10 shadow-2xl animate-fade-in min-h-[500px] flex flex-col">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4 mb-12">
                    <CreditCard className="w-7 h-7 text-primary" /> Settlement Clearing House
                </h2>

                {!paymentsUnlocked ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in">
                        <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center border border-amber-500/30">
                            <Lock className="w-10 h-10 text-amber-500" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Gateway Lock</h3>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mt-2">Input Alex Root Passcode to Unlock Settlements</p>
                        </div>
                        <form onSubmit={unlockPayments} className="w-full max-w-sm space-y-4">
                            <input 
                                type="password" 
                                value={passcodeInput}
                                onChange={(e) => setPasscodeInput(e.target.value)}
                                placeholder="Root Passcode"
                                className="w-full bg-black border border-gray-800 rounded-2xl py-5 px-6 text-center text-xl font-mono tracking-[0.6em] text-amber-500 focus:border-amber-500 outline-none"
                            />
                            <button type="submit" className="w-full py-5 bg-amber-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-amber-400 transition-all">Unlock Ledger</button>
                        </form>
                    </div>
                ) : (
                    <div className="overflow-x-auto animate-fade-in">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="text-[10px] text-gray-500 font-black uppercase tracking-widest border-b border-gray-800">
                            <th className="px-8 py-6">Settlement Ref</th>
                            <th className="px-8 py-6">License Holder</th>
                            <th className="px-8 py-6">Gateway Node</th>
                            <th className="px-8 py-6 text-right">Clearance</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                        {filteredPayments.map(p => (
                            <tr key={p.id} className="text-xs group hover:bg-white/5 transition-all">
                                <td className="px-8 py-6 font-mono text-gray-400 font-bold">{p.id}</td>
                                <td className="px-8 py-6 font-black text-white uppercase tracking-tight">{p.userName}</td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black border uppercase ${p.gateway === 'PAYSTACK' ? 'text-blue-400 border-blue-500/30 bg-blue-500/5' : 'text-success border-success/30 bg-success/5'}`}>
                                        {p.gateway}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                {p.status === 'VERIFIED' ? (
                                    <div className="flex items-center justify-end gap-3 text-success font-black text-[10px] uppercase tracking-widest">
                                        <CheckCircle2 className="w-4 h-4" /> Settlement Verified
                                    </div>
                                ) : (
                                    <button 
                                    onClick={() => onVerifyPayment(p.id)}
                                    className="px-6 py-3 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-900/30"
                                    >
                                        Approve Settlement
                                    </button>
                                )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </section>
          )}

          {activeSubTab === 'GATEWAYS' && (
              <section className="bg-surface rounded-[4rem] border border-gray-800 p-12 shadow-2xl animate-fade-in relative">
                  <div className="absolute top-10 right-10">
                      <button 
                        onClick={saveGateways}
                        className="px-10 py-5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-[2rem] flex items-center gap-4 shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
                      >
                          <Save className="w-4 h-4" /> Save Cloud Keys
                      </button>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4 mb-16">
                      <Settings className="w-7 h-7 text-primary" /> Infrastructure Maintenance
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {editedGateways.map((gw, idx) => (
                        <div key={gw.name} className="bg-gray-900/40 p-10 rounded-[3rem] border border-gray-800 space-y-10 relative group">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-5">
                                 <div className={`p-4 rounded-3xl ${gw.name === 'PAYSTACK' ? 'bg-blue-500/20' : 'bg-success/20'}`}>
                                    <Globe className={`w-7 h-7 ${gw.name === 'PAYSTACK' ? 'text-blue-400' : 'text-success'}`} />
                                 </div>
                                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{gw.name} GATE</h3>
                              </div>
                              <div className="flex items-center gap-3">
                                <input type="checkbox" checked={gw.isActive} onChange={(e) => handleGatewayChange(idx, 'isActive', e.target.checked)} className="accent-primary w-5 h-5 cursor-pointer" />
                              </div>
                           </div>
                           
                           <div className="space-y-8">
                               <div className="space-y-3">
                                   <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Public Key (Live)</label>
                                   <div className="relative">
                                       <Globe className="absolute left-5 top-5 w-4 h-4 text-gray-700" />
                                       <input 
                                          type="text" 
                                          value={gw.publicKey} 
                                          onChange={(e) => handleGatewayChange(idx, 'publicKey', e.target.value)}
                                          className="w-full bg-black border border-gray-800 rounded-3xl py-5 pl-14 pr-6 text-xs text-white font-mono outline-none focus:border-primary transition-all" 
                                       />
                                   </div>
                               </div>
                               <div className="space-y-3">
                                   <div className="flex justify-between items-center px-1">
                                       <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Secret Key (Encrypted)</label>
                                       <button onClick={() => toggleKeyVisibility(gw.name)} className="text-gray-500 hover:text-white">
                                           {showKeys[gw.name] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                       </button>
                                   </div>
                                   <div className="relative">
                                       <Key className="absolute left-5 top-5 w-4 h-4 text-gray-700" />
                                       <input 
                                          type={showKeys[gw.name] ? "text" : "password"}
                                          value={gw.secretKey} 
                                          onChange={(e) => handleGatewayChange(idx, 'secretKey', e.target.value)}
                                          className="w-full bg-black border border-gray-800 rounded-3xl py-5 pl-14 pr-6 text-xs text-white font-mono outline-none focus:border-primary transition-all" 
                                       />
                                   </div>
                               </div>
                               {gw.name === 'FLUTTERWAVE' && (
                                 <div className="space-y-3">
                                   <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Webhook Secret Hash</label>
                                   <div className="relative">
                                       <ShieldCheck className="absolute left-5 top-5 w-4 h-4 text-gray-700" />
                                       <input 
                                          type="text" 
                                          value={gw.secretHash || ''} 
                                          onChange={(e) => handleGatewayChange(idx, 'secretHash', e.target.value)}
                                          className="w-full bg-black border border-gray-800 rounded-3xl py-5 pl-14 pr-6 text-xs text-white font-mono outline-none focus:border-primary transition-all" 
                                          placeholder="Enter verification hash..."
                                       />
                                   </div>
                                 </div>
                               )}
                               <div className="space-y-3">
                                   <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Webhook Endpoint URL</label>
                                   <div className="relative">
                                       <Smartphone className="absolute left-5 top-5 w-4 h-4 text-gray-700" />
                                       <input 
                                          type="text" 
                                          value={gw.webhookUrl} 
                                          onChange={(e) => handleGatewayChange(idx, 'webhookUrl', e.target.value)}
                                          className="w-full bg-black border border-gray-800 rounded-3xl py-5 pl-14 pr-6 text-xs text-white font-mono outline-none focus:border-primary transition-all" 
                                       />
                                   </div>
                               </div>
                           </div>
                        </div>
                      ))}
                  </div>
              </section>
          )}

        </div>
      </div>
    </div>
  );
};

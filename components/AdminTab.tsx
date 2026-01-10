
import React from 'react';
import { UserProfile, UserTier } from '../types';
import { PaymentLog } from '../App';
import { Users, ShieldAlert, Star, Ban, CheckCircle, TrendingUp, DollarSign, UserPlus, CreditCard, Landmark, CheckCircle2, Clock } from 'lucide-react';

interface AdminTabProps {
  users: UserProfile[];
  payments: PaymentLog[];
  onUpdateUser: (userId: string, updates: Partial<UserProfile>) => void;
  onVerifyPayment: (paymentId: string) => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({ users, payments, onUpdateUser, onVerifyPayment }) => {
  const tierCounts = users.reduce((acc, user) => {
    acc[user.tier] = (acc[user.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalRevenue = payments.reduce((sum, p) => p.status === 'VERIFIED' ? sum + p.amount : sum, 0);

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-accent" />
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter">Command Center</h1>
          </div>
          <p className="text-accent/60 font-black uppercase tracking-[0.4em] text-[10px] flex items-center gap-2">
            Institutional User & Financial Node
          </p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-accent/10 border border-accent/20 px-6 py-3 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] text-accent font-black uppercase">Nodes Active</span>
              <span className="text-xl font-mono font-black text-white">{users.length}</span>
           </div>
           <div className="bg-success/10 border border-success/20 px-6 py-3 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] text-success font-black uppercase">Verified Revenue</span>
              <span className="text-xl font-mono font-black text-white">${totalRevenue.toLocaleString()}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 space-y-8">
          <section className="bg-surface rounded-[2.5rem] border border-accent/20 p-8 shadow-2xl overflow-hidden group">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-accent" /> User Provisioning
              </h2>
              <button className="px-6 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Add User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-gray-500 font-black uppercase tracking-widest border-b border-gray-800">
                    <th className="px-6 py-4">Identity</th>
                    <th className="px-6 py-4">Tier</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {users.map(u => (
                    <tr key={u.id} className="group hover:bg-accent/5 transition-all">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-accent font-black text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase">{u.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <select 
                          value={u.tier}
                          onChange={(e) => onUpdateUser(u.id, { tier: e.target.value as UserTier })}
                          className={`bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:border-accent ${
                            u.tier === 'VIP' ? 'text-purple-400' : u.tier === 'PRO' ? 'text-yellow-400' : 'text-gray-400'
                          }`}
                        >
                          <option value="BASIC">BASIC</option>
                          <option value="PRO">PRO</option>
                          <option value="VIP">VIP</option>
                        </select>
                      </td>
                      <td className="px-6 py-6">
                        <button 
                          onClick={() => onUpdateUser(u.id, { status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                            u.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                          {u.status}
                        </button>
                      </td>
                      <td className="px-6 py-6 text-right">
                         <button onClick={() => onUpdateUser(u.id, { balance: u.balance + 1000 })} className="p-2 hover:bg-success/20 rounded text-success transition-all">
                            <DollarSign className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3 mb-8">
              <CreditCard className="w-5 h-5 text-primary" /> Payment Ledger (Audit Required)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-gray-500 font-black uppercase tracking-widest border-b border-gray-800">
                    <th className="px-6 py-4">Ref ID</th>
                    <th className="px-6 py-4">Trader</th>
                    <th className="px-6 py-4">Bank</th>
                    <th className="px-6 py-4">Tier</th>
                    <th className="px-6 py-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                   {payments.map(p => (
                     <tr key={p.id} className="text-xs group">
                        <td className="px-6 py-4 font-mono text-gray-400">{p.id}</td>
                        <td className="px-6 py-4 font-black text-white">{p.userName}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded flex items-center gap-2 w-fit text-[9px] font-black ${p.bank === 'KUDA' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                              <Landmark className="w-3 h-3" /> {p.bank}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-black uppercase text-gray-500">{p.tier}</td>
                        <td className="px-6 py-4 text-right">
                           {p.status === 'VERIFIED' ? (
                             <div className="flex items-center justify-end gap-2 text-success font-black text-[9px] uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                             </div>
                           ) : (
                             <button 
                               onClick={() => onVerifyPayment(p.id)}
                               className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2 ml-auto"
                             >
                                <Clock className="w-3 h-3" /> Confirm Payment
                             </button>
                           )}
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-8">
           <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                 <Star className="w-5 h-5 text-accent" /> License Statistics
              </h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-purple-400 font-black uppercase">VIP Subscribers</span>
                    <span className="text-xl font-mono font-black text-white">{tierCounts['VIP'] || 0}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-yellow-400 font-black uppercase">PRO Subscribers</span>
                    <span className="text-xl font-mono font-black text-white">{tierCounts['PRO'] || 0}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 font-black uppercase">BASIC Users</span>
                    <span className="text-xl font-mono font-black text-white">{tierCounts['BASIC'] || 0}</span>
                 </div>
              </div>
           </section>

           <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                 <ShieldAlert className="w-5 h-5 text-danger" /> System Overrides
              </h3>
              <div className="space-y-4">
                 <div className="p-5 bg-gray-900/50 rounded-2xl border border-gray-800 flex justify-between items-center">
                    <div>
                       <p className="text-[10px] text-gray-400 font-black uppercase">HFT Pulse</p>
                       <p className="text-xs text-gray-500 font-bold">Latency override</p>
                    </div>
                    <span className="text-xl font-mono font-black text-success">5.0s</span>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

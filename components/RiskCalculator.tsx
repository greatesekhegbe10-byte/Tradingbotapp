
import React, { useState, useEffect } from 'react';
import { Calculator, ShieldCheck, Target, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

interface RiskCalculatorProps {
  balance: number;
}

export const RiskCalculator: React.FC<RiskCalculatorProps> = ({ balance }) => {
  const [riskPercent, setRiskPercent] = useState(2);
  const [slPips, setSlPips] = useState(20);
  const [lotSize, setLotSize] = useState(0);
  const [riskAmount, setRiskAmount] = useState(0);

  useEffect(() => {
    const amount = balance * (riskPercent / 100);
    setRiskAmount(amount);
    // Standard Forex calculation (per 10 pips $100 on 1 lot)
    const lots = amount / (slPips * 10);
    setLotSize(parseFloat(lots.toFixed(2)));
  }, [balance, riskPercent, slPips]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
      <div className="bg-[#0a101f] p-10 rounded-[4rem] border border-gray-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Calculator className="w-48 h-48" />
        </div>

        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30">
            <Calculator className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Risk Provisioning</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">Institutional Position Sizing Terminal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
           <div className="space-y-8">
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Account Balance</label>
                    <span className="text-xl font-mono font-black text-white italic">${balance.toLocaleString()}</span>
                 </div>
                 <div className="bg-black/40 border border-gray-800 p-6 rounded-[2rem] text-center">
                    <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Auto-Synced to Vault</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Risk Percentage (%)</label>
                    <span className="text-lg font-mono font-black text-primary">{riskPercent}%</span>
                 </div>
                 <input 
                    type="range" min="0.5" max="10" step="0.5" 
                    value={riskPercent} 
                    onChange={e => setRiskPercent(parseFloat(e.target.value))}
                    className="w-full accent-primary bg-gray-800 h-2 rounded-full cursor-pointer" 
                 />
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Stop Loss (Pips)</label>
                    <span className="text-lg font-mono font-black text-danger">{slPips} PIPS</span>
                 </div>
                 <input 
                    type="range" min="5" max="200" step="5" 
                    value={slPips} 
                    onChange={e => setSlPips(parseInt(e.target.value))}
                    className="w-full accent-danger bg-gray-800 h-2 rounded-full cursor-pointer" 
                 />
              </div>
           </div>

           <div className="space-y-8">
              <div className="bg-primary/5 border border-primary/20 rounded-[3rem] p-10 text-center flex flex-col justify-center items-center shadow-2xl">
                 <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-4">Suggested Position Size</span>
                 <h1 className="text-7xl font-black text-white tracking-tighter italic mb-4">{lotSize}</h1>
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Institutional Standard Lots</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 text-center">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Risk Amount</p>
                    <p className="text-xl font-mono font-black text-danger">-${riskAmount.toFixed(2)}</p>
                 </div>
                 <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 text-center">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Risk Status</p>
                    <p className={`text-[10px] font-black uppercase ${riskPercent <= 3 ? 'text-success' : 'text-amber-500'}`}>
                        {riskPercent <= 3 ? 'CONSERVATIVE' : 'AGGRESSIVE'}
                    </p>
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-12 pt-10 border-t border-gray-800 flex items-start gap-4 bg-gray-900/40 p-6 rounded-3xl">
           <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
           <p className="text-[9px] text-gray-600 font-bold uppercase leading-relaxed italic tracking-wide">
              Position sizing logic is calculated based on standard 100,000 unit lots. Ensure your broker leverage and contract sizes match these institutional parameters before executing live orders.
           </p>
        </div>
      </div>
    </div>
  );
};

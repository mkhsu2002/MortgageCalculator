/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Home, 
  TrendingUp, 
  MapPin, 
  Info, 
  ChevronRight, 
  DollarSign,
  Percent,
  Clock,
  Building2,
  FileText
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

// Types
interface MortgageState {
  price: number;
  downPayment: number;
  isDownPaymentPercent: boolean;
  interestRate: number;
  amortization: number;
  strata: number;
  propertyTax: number;
}

// Constants
const COLORS = ['#4F46E5', '#3498db', '#e74c3c', '#f1c40f'];

export default function App() {
  const [state, setState] = useState<MortgageState>({
    price: 1200000,
    downPayment: 240000,
    isDownPaymentPercent: false,
    interestRate: 4.8,
    amortization: 25,
    strata: 450,
    propertyTax: 3200,
  });

  const [activeTab, setActiveTab] = useState<'input' | 'breakdown'>('input');

  // Calculations
  const calculations = useMemo(() => {
    const { price, downPayment, isDownPaymentPercent, interestRate, amortization, strata, propertyTax } = state;
    
    // Down payment calculations
    let downAmount = isDownPaymentPercent ? (price * (downPayment / 100)) : downPayment;
    let downPercent = isDownPaymentPercent ? downPayment : (downPayment / price) * 100;

    // Minimum down payment rules in Canada
    let minDown = 0;
    if (price <= 500000) {
      minDown = price * 0.05;
    } else if (price <= 1000000) {
      minDown = (500000 * 0.05) + ((price - 500000) * 0.10);
    } else {
      minDown = price * 0.20;
    }

    // CMHC Insurance
    let cmhcPremium = 0;
    const loanToValue = ((price - downAmount) / price) * 100;
    if (price < 1000000 && downPercent < 20) {
      if (downPercent >= 15) cmhcPremium = (price - downAmount) * 0.028;
      else if (downPercent >= 10) cmhcPremium = (price - downAmount) * 0.031;
      else if (downPercent >= 5) cmhcPremium = (price - downAmount) * 0.040;
    }

    const principal = price - downAmount + cmhcPremium;
    
    // Canadian Mortgage Rate (Compounded semi-annually)
    const annualRate = interestRate / 100;
    const monthlyRate = Math.pow(Math.pow(1 + annualRate / 2, 2), 1/12) - 1;
    const numberOfPayments = amortization * 12;
    
    const monthlyMortgage = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    const monthlyPropTax = propertyTax / 12;
    const totalMonthly = monthlyMortgage + strata + monthlyPropTax;

    // BC Property Transfer Tax (PTT)
    let ptt = 0;
    if (price <= 200000) {
      ptt = price * 0.01;
    } else if (price <= 2000000) {
      ptt = 2000 + (price - 200000) * 0.02;
    } else if (price <= 3000000) {
      ptt = 2000 + 36000 + (price - 2000000) * 0.03;
    } else {
      ptt = 2000 + 36000 + 30000 + (price - 3000000) * 0.05;
    }

    return {
      downAmount,
      downPercent,
      minDown,
      cmhcPremium,
      principal,
      monthlyMortgage,
      monthlyPropTax,
      totalMonthly,
      ptt,
      isValid: downAmount >= minDown
    };
  }, [state]);

  const chartData = [
    { name: '房貸供款', value: calculations.monthlyMortgage },
    { name: '物業管理費', value: state.strata },
    { name: '估計地稅', value: calculations.monthlyPropTax },
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  const handleInputChange = (field: keyof MortgageState, value: number | boolean) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-50 relative overflow-hidden">
      {/* Background Decorative Image */}
      <div className="absolute top-0 right-0 w-full h-96 opacity-10 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1559511260-66a654ae982a?q=80&w=2000&auto=format&fit=crop" 
          alt="Vancouver Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50"></div>
      </div>

      {/* Header */}
      <header className="w-full bg-transparent py-10 px-6 md:px-15 flex flex-col md:flex-row justify-between items-center relative z-10">
        <div className="flex flex-col mb-4 md:mb-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-primary-indigo text-white p-1.5 rounded-lg">
              <Building2 size={24} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              溫哥華房屋貸款估算器 <span className="text-primary-indigo font-normal">VanMortgage</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500 font-medium">
              Vancouver Mortgage Payment Estimator
            </p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded uppercase tracking-tighter">v0.1</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs ring-4 ring-orange-50">
              FP
            </div>
            <span className="text-xs font-bold text-slate-700 tracking-tight">FlyPig</span>
          </div>
          <div className="bg-[#EEF2FF] text-primary-indigo px-4 py-2 rounded-full text-sm font-semibold">
            卑詩省 · 2026 最新利率
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:px-15 md:pb-15">
        {/* Left Column: Inputs */}
        <section className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-8 flex items-center gap-2">
              <Building2 size={16} />
              輸入參數
            </h2>
            
            <div className="space-y-8">
              {/* Home Price */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-500">房屋總價 (CAD)</label>
                  <span className="text-base font-bold text-slate-900">{formatCurrency(state.price)}</span>
                </div>
                <input 
                  type="range" 
                  min="500000" 
                  max="5000000" 
                  step="5000"
                  value={state.price}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Down Payment */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-500">首付款</label>
                    <button 
                      onClick={() => setState(s => ({...s, isDownPaymentPercent: !s.isDownPaymentPercent}))}
                      className="text-[10px] font-bold text-primary-indigo uppercase hover:underline py-0.5 px-1.5 bg-indigo-50 rounded"
                    >
                      {state.isDownPaymentPercent ? '%' : '$'}
                    </button>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {state.isDownPaymentPercent ? `${state.downPayment}%` : formatCurrency(calculations.downAmount)}
                  </span>
                </div>
                <input 
                  type="range" 
                  min={state.isDownPaymentPercent ? 5 : 25000} 
                  max={state.isDownPaymentPercent ? 100 : state.price} 
                  step={state.isDownPaymentPercent ? 0.5 : 1000}
                  value={state.downPayment}
                  onChange={(e) => handleInputChange('downPayment', Number(e.target.value))}
                  className="w-full"
                />
                {!calculations.isValid && (
                  <p className="text-[10px] text-red-500 font-bold uppercase">
                    低於最低首期: {formatCurrency(calculations.minDown)}
                  </p>
                )}
              </div>

              {/* Interest Rate */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-500">貸款利率 (%)</label>
                  <span className="text-base font-bold text-slate-900">{state.interestRate.toFixed(2)}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="0.05"
                  value={state.interestRate}
                  onChange={(e) => handleInputChange('interestRate', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Amortization & Others */}
              <div className="grid grid-cols-1 gap-6 pt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">還款年期 (年)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 20, 25, 30].map(yr => (
                      <button
                        key={yr}
                        onClick={() => handleInputChange('amortization', yr)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${state.amortization === yr ? 'bg-primary-indigo text-white shadow-lg shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">月管理費</label>
                    <input 
                      type="number" 
                      value={state.strata}
                      onChange={(e) => handleInputChange('strata', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">年地稅</label>
                    <input 
                      type="number" 
                      value={state.propertyTax}
                      onChange={(e) => handleInputChange('propertyTax', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[24px] p-6 text-white/70 text-[11px] leading-relaxed">
             <span className="text-white font-bold block mb-1">提示：</span>
             卑詩省對房產交易徵收物業轉移稅 (PTT)。
             本工具已自動計算標准住宅稅率。
          </div>
        </section>

        {/* Right Column: Results */}
        <section className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
          {/* Main Hero Result */}
          <div className="bg-primary-indigo rounded-[24px] p-10 pt-12 text-white shadow-[0_20px_40px_rgba(79,70,229,0.15)] relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <span className="text-sm font-medium opacity-80 block mb-2 cursor-default">預估每月還款額</span>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-extrabold tracking-tighter">
                  {formatCurrency(calculations.totalMonthly).replace('$', '')}
                </span>
                <span className="text-2xl font-light opacity-80">CAD</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-[20px] p-6 border border-slate-200">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-2">總貸款金額</span>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(calculations.principal)}</div>
            </div>
            <div className="bg-white rounded-[20px] p-6 border border-slate-200">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-2">物業轉移稅 (PTT)</span>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(calculations.ptt)}</div>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex-1 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h4 className="text-base font-bold text-slate-800">月開支分配</h4>
                <p className="text-[11px] text-slate-500 font-medium">房貸 vs 管理費 vs 地稅</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">總利息估計</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(calculations.monthlyMortgage * state.amortization * 12 - calculations.principal)}
                </p>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-8">
              {chartData.map((item, i) => (
                <div key={item.name} className="flex flex-col items-center gap-1">
                  <div className="w-full h-1 rounded-full mb-1" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase text-center">{item.name}</span>
                  <span className="text-xs font-bold text-slate-800">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-slate-50">
               <p className="text-[11px] text-slate-400 leading-relaxed italic">
                * 免責聲明：此工具僅供參考，不代表任何金融機構之貸款承諾。
                實際月付額受卑詩省物業轉讓稅 (PTT) 等因素影響。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

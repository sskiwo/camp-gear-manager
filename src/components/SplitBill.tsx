'use client';

import { useState, useMemo } from 'react';

type Participant = {
  name: string;
  weight: number; // 割り勘の重み（例: 大人2, 子供1など）
};

type Expense = {
  description: string;
  amount: number;
  paidBy: string; // 支払った人の名前
};

export default function SplitBill() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('1');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  // 1. 参加者追加
  const addParticipant = () => {
    if (newName && !participants.some((p) => p.name === newName)) {
      setParticipants([...participants, { name: newName, weight: Number(newWeight) || 1 }]);
      setNewName('');
      setNewWeight('1');
      if (participants.length === 0) setPaidBy(newName);
    }
  };

  // 2. 出費追加
  const addExpense = () => {
    const amount = Number(newAmount);
    if (newDesc && amount > 0 && paidBy) {
      setExpenses([...expenses, { description: newDesc, amount, paidBy }]);
      setNewDesc('');
      setNewAmount('');
    }
  };

  // 3. 割り勘計算
  const settlement = useMemo(() => {
    if (participants.length < 2 || expenses.length === 0) return null;

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalWeight = participants.reduce((sum, p) => sum + p.weight, 0);
    const weightUnit = totalAmount / totalWeight;

    const balances: { [key: string]: number } = {};
    participants.forEach((p) => {
      balances[p.name] = -(p.weight * weightUnit);
    });
    expenses.forEach((e) => {
      if (balances[e.paidBy] !== undefined) {
        balances[e.paidBy] += e.amount;
      }
    });

    const debtors: { name: string; amount: number }[] = [];
    const creditors: { name: string; amount: number }[] = [];
    participants.forEach((p) => {
      const bal = balances[p.name];
      if (bal < -0.1) {
        debtors.push({ name: p.name, amount: -bal });
      } else if (bal > 0.1) {
        creditors.push({ name: p.name, amount: bal });
      }
    });

    const transactions: { from: string; to: string; amount: number }[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const transferAmount = Math.min(debtor.amount, creditor.amount);

      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(transferAmount),
      });

      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;

      if (debtor.amount < 0.1) dIdx++;
      if (creditor.amount < 0.1) cIdx++;
    }

    return { totalAmount, weightUnit, transactions, balances };
  }, [participants, expenses]);

  return (
    <section className="bg-white p-8 rounded-3xl shadow-xl border border-[#E0DED3]/50 space-y-8 transition-all duration-300">
      <header className="flex items-center gap-3 border-b border-[#E0DED3]/50 pb-5">
        <h2 className="text-xl font-bold text-[#384F41] flex items-center gap-3 tracking-wide">
          💰 スマート割り勘 (重み付け対応)
        </h2>
        <span className="text-xs bg-[#F6F5EF] text-[#666666] px-4 py-1.5 rounded-full font-medium border border-[#E0DED3]/50 shadow-inner">
          例: 大人1, 子供0.5
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 左側: 入力フォーム */}
        <div className="space-y-7">
          {/* 参加者登録 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#888888] uppercase tracking-wider pl-1">👥 1. 参加者を追加</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="名前 (例: タナカ)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-5 py-3 border rounded-xl text-sm bg-white focus:ring-1 focus:ring-[#384F41] outline-none transition"
              />
              <input
                type="number"
                placeholder="重み"
                value={newWeight}
                step="0.1"
                min="0.1"
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-16 px-3 py-3 border rounded-xl text-sm bg-white text-center focus:ring-1 focus:ring-[#384F41] outline-none transition"
              />
              <button
                onClick={addParticipant}
                className="bg-gradient-to-r from-[#384F41] to-[#6B8272] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
              >
                追加
              </button>
            </div>
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1.5 pl-1">
                {participants.map((p) => (
                  <span
                    key={p.name}
                    className="text-xs bg-[#384F41]/08 text-[#384F41] px-3 py-1.5 rounded-full font-bold border border-[#384F41]/10 shadow-inner"
                  >
                    {p.name} <span className="font-medium text-[#666666]">({p.weight})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 出費登録 */}
          <div className="space-y-4 pt-4 border-t border-[#E0DED3]/50">
            <h3 className="text-sm font-bold text-[#888888] uppercase tracking-wider pl-1">💴 2. 出費を入力</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="内容 (例: 食材費)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="px-5 py-3 border rounded-xl text-sm focus:ring-1 focus:ring-[#384F41] outline-none transition"
              />
              <input
                type="number"
                placeholder="金額 (円)"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="px-5 py-3 border rounded-xl text-sm focus:ring-1 focus:ring-[#384F41] outline-none transition"
              />
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="px-5 py-3 border rounded-xl text-sm bg-white font-medium focus:ring-1 focus:ring-[#384F41] text-[#384F41] outline-none transition"
              >
                <option value="">支払者を選択...</option>
                {participants.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={addExpense}
                className="bg-gradient-to-r from-[#BFA58A] to-[#D6A97A] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
              >
                出費を追加
              </button>
            </div>
          </div>
        </div>

        {/* 右側: 登録内容と計算結果 */}
        <div className="space-y-7">
          {/* 出費一覧 */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider pl-1">📋 3. 登録された出費</h3>
            <div className="bg-[#F6F5EF] border border-[#E0DED3]/50 rounded-3xl p-4 max-h-48 overflow-y-auto space-y-2 shadow-inner">
              {expenses.length === 0 ? (
                <p className="text-xs text-center text-[#AAAAAA] py-6 font-medium">出費がまだ登録されていません。</p>
              ) : (
                expenses.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-[#E0DED3]/50 shadow">
                    <span className="font-medium text-[#333333] flex-1 tracking-tight">{e.description}</span>
                    <span className="font-extrabold text-[#A88869] w-28 text-right text-sm">¥{e.amount.toLocaleString()}</span>
                    <span className="text-[#666666] font-bold w-20 text-right bg-[#E0DED3]/90 px-2.5 py-0.5 rounded ml-3">{e.paidBy}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 計算結果 */}
          <div className="space-y-4 pt-4 border-t border-[#E0DED3]/50">
            <h3 className="text-sm font-bold text-[#888888] uppercase tracking-wider pl-1">🎯 4. 清算方法</h3>
            {settlement ? (
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="bg-[#384F41]/08 p-4 rounded-xl border border-[#384F41]/10 flex-1 text-center shadow">
                    <p className="text-xs text-[#384F41] font-bold">総額</p>
                    <p className="text-2xl font-bold text-[#384F41] mt-2">¥{settlement.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#F6F5EF] p-4 rounded-xl border border-[#E0DED3]/50 flex-1 text-center shadow">
                    <p className="text-xs text-[#666666] font-bold">基本単位 (1あたり)</p>
                    <p className="text-xl font-bold text-[#666666] mt-2">¥{Math.round(settlement.weightUnit).toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#BFA58A]/08 to-[#D6A97A]/08 p-5 rounded-3xl border border-[#BFA58A]/10 space-y-3.5 shadow-md">
                  <p className="text-sm font-bold text-[#A88869] border-b border-[#A88869]/20 pb-2 flex items-center gap-1.5 tracking-tight">
                    👉 送金リスト
                  </p>
                  {settlement.transactions.length === 0 ? (
                    <p className="text-sm text-center text-[#384F41] font-bold py-3">🎉 清算は不要です！</p>
                  ) : (
                    settlement.transactions.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-white px-4 py-2.5 rounded-lg border border-[#D6A97A]/10 shadow">
                        <div className="flex items-center gap-2 font-bold tracking-tight">
                          <span className="text-xs bg-[#AF8074]/08 text-[#AF8074] px-3 py-1 rounded border border-[#AF8074]/20">{t.from}</span>
                          <span className="text-[#CCCCCC]">➔</span>
                          <span className="text-xs bg-[#384F41]/08 text-[#384F41] px-3 py-1 rounded border border-[#384F41]/20">{t.to}</span>
                        </div>
                        <span className="font-extrabold text-[#A88869] text-base">¥{t.amount.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-center text-[#AAAAAA] py-8 font-medium bg-[#F6F5EF] rounded-2xl border border-[#E0DED3]/50 shadow-inner">
                参加者2名以上、出費1件以上で計算します。
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
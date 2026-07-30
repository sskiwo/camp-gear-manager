'use client';

import { useState } from 'react';

type Payer = {
  id: string;
  name: string;
  amount: number;
};

type Transfer = {
  from: string;
  to: string;
  amount: number;
};

export default function SplitBill() {
  const [payers, setPayers] = useState<Payer[]>([
    { id: '1', name: 'Aさん', amount: 12000 },
    { id: '2', name: 'Bさん', amount: 3000 },
  ]);
  const [memberCount, setMemberCount] = useState<number>(4);
  const [drinkerCount, setDrinkerCount] = useState<number>(2);

  // 支払者の追加
  const addPayer = () => {
    const newId = String(Date.now());
    setPayers([...payers, { id: newId, name: `参加者${payers.length + 1}`, amount: 0 }]);
  };

  // 支払者の更新
  const updatePayer = (id: string, key: 'name' | 'amount', value: any) => {
    setPayers(
      payers.map((p) => (p.id === id ? { ...p, [key]: key === 'amount' ? Number(value) || 0 : value } : p))
    );
  };

  // 支払者の削除
  const removePayer = (id: string) => {
    if (payers.length <= 1) return;
    setPayers(payers.filter((p) => p.id !== id));
  };

  // 1. 総支払額
  const totalAmount = payers.reduce((sum, p) => sum + p.amount, 0);

  // 2. 飲酒傾斜（お酒飲む人 1.5倍）計算
  const nonDrinkerCount = Math.max(0, memberCount - drinkerCount);
  const totalUnits = drinkerCount * 1.5 + nonDrinkerCount;

  const baseShare = totalUnits > 0 ? totalAmount / totalUnits : 0;
  const drinkerShare = Math.round(baseShare * 1.5);
  const nonDrinkerShare = Math.round(baseShare);

  // 3. 送金ルートの最小化計算
  const calculateTransfers = (): Transfer[] => {
    if (memberCount <= 0 || totalAmount <= 0) return [];

    // 各人の精算（支払った額 - 払うべき額）
    // 簡略化のため、登録された支払者単位で計算
    const balances = payers.map((p, idx) => {
      const isDrinker = idx < drinkerCount;
      const expected = isDrinker ? drinkerShare : nonDrinkerShare;
      return { name: p.name, balance: p.amount - expected };
    });

    const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ ...b, balance: -b.balance }));
    const creditors = balances.filter((b) => b.balance > 0);

    const transfers: Transfer[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debt = debtors[i].balance;
      const credit = creditors[j].balance;

      const amount = Math.min(debt, credit);
      if (amount > 0) {
        transfers.push({
          from: debtors[i].name,
          to: creditors[j].name,
          amount: Math.round(amount),
        });
      }

      debtors[i].balance -= amount;
      creditors[j].balance -= amount;

      if (debtors[i].balance === 0) i++;
      if (creditors[j].balance === 0) j++;
    }

    return transfers;
  };

  const transfers = calculateTransfers();

  return (
    <div className="bg-[#18181B] p-5 md:p-8 rounded-2xl border border-zinc-800 space-y-6 text-zinc-100 shadow-xl">
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          💰 スマート割り勘計算機
        </h2>
        <p className="text-xs text-zinc-400 mt-1">お酒などの傾斜配分に対応・送金ルートを最小化</p>
      </div>

      {/* 1. 支払者の登録 */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-[#FF5500]">1. 支払者と支払金額</h3>
        <div className="space-y-2">
          {payers.map((payer) => (
            <div key={payer.id} className="flex items-center gap-2 bg-[#27272A] p-2.5 rounded-xl border border-zinc-700/80">
              <input
                type="text"
                value={payer.name}
                onChange={(e) => updatePayer(payer.id, 'name', e.target.value)}
                className="flex-1 bg-[#18181B] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                placeholder="名前"
              />
              <div className="flex items-center gap-1 bg-[#18181B] border border-zinc-700 rounded-lg px-3 py-1.5">
                <input
                  type="number"
                  value={payer.amount || ''}
                  onChange={(e) => updatePayer(payer.id, 'amount', e.target.value)}
                  className="w-20 bg-transparent text-xs text-right font-bold text-white focus:outline-none"
                  placeholder="0"
                />
                <span className="text-xs text-zinc-400">円</span>
              </div>
              {payers.length > 1 && (
                <button
                  onClick={() => removePayer(payer.id)}
                  className="text-zinc-500 hover:text-[#FF5500] px-2 text-sm font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addPayer}
          className="w-full py-2 bg-[#27272A] hover:bg-zinc-700 text-[#FF5500] border border-[#FF5500]/40 rounded-xl text-xs font-bold transition"
        >
          ＋ 支払者を追加する
        </button>
      </div>

      {/* 2. 参加者・条件設定 */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-extrabold text-[#FFB800]">2. 参加人数と飲酒条件</h3>
        <div className="grid grid-cols-2 gap-3 bg-[#27272A] p-4 rounded-xl border border-zinc-700/80">
          <div>
            <label className="text-[11px] font-bold text-zinc-400 block mb-1">全参加人数</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={memberCount}
                onChange={(e) => setMemberCount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-zinc-400 font-bold">人</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#00E676] block mb-1">お酒を飲む人 (1.5倍)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={memberCount}
                value={drinkerCount}
                onChange={(e) => setDrinkerCount(Math.min(memberCount, Math.max(0, Number(e.target.value))))}
                className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
              />
              <span className="text-xs text-zinc-400 font-bold">人</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 清算結果サマリー */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-extrabold text-white">📊 清算結果サマリー</h3>
        <div className="bg-[#27272A] p-4 rounded-xl border border-zinc-700/80 space-y-3">
          <div className="flex justify-between items-baseline border-b border-zinc-700/60 pb-2">
            <span className="text-xs text-zinc-400">総支払額</span>
            <span className="text-lg font-black text-white">¥{totalAmount.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#18181B] p-2.5 rounded-lg border border-[#00E676]/30">
              <span className="text-[10px] text-[#00E676] font-bold block">🍺 飲酒者 (1人あたり)</span>
              <span className="text-sm font-black text-white mt-0.5 block">
                ¥{drinkerShare.toLocaleString()}
              </span>
            </div>

            <div className="bg-[#18181B] p-2.5 rounded-lg border border-zinc-700">
              <span className="text-[10px] text-zinc-400 font-bold block">🥤 非飲酒者 (1人あたり)</span>
              <span className="text-sm font-black text-white mt-0.5 block">
                ¥{nonDrinkerShare.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 送金ルートの最小化 (修正完了部分！) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-extrabold text-[#00E5FF]">💸 送金ルート（誰が誰にいくら払うか）</h3>
        {transfers.length === 0 ? (
          <p className="text-xs text-zinc-500 bg-[#27272A] p-3.5 rounded-xl text-center border border-zinc-800">
            精算の必要はありません（貸し借りなし）
          </p>
        ) : (
          <div className="space-y-2">
            {transfers.map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-[#27272A] p-3 rounded-xl border border-[#00E5FF]/40 text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white">{t.from}</span>
                  <span className="text-[#FF5500]">➔</span>
                  <span className="text-white">{t.to}</span>
                </div>
                <span className="text-[#00E5FF] font-black text-sm">
                  ¥{t.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
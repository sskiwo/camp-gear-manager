"use client";

import { useState } from "react";

type Member = {
  id: string;
  name: string;
  paidAmount: number; // 立て替えた金額
};

type Transfer = {
  from: string;
  to: string;
  amount: number;
};

export default function SplitBill() {
  const [members, setMembers] = useState<Member[]>([
    { id: "1", name: "自分 (A君)", paidAmount: 12000 },
    { id: "2", name: "B君", paidAmount: 4000 },
    { id: "3", name: "C君", paidAmount: 0 },
  ]);

  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  // メンバー追加
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setMembers([
      ...members,
      {
        id: Date.now().toString(),
        name: newName,
        paidAmount: Number(newAmount) || 0,
      },
    ]);

    setNewName("");
    setNewAmount("");
  };

  // メンバー削除
  const handleDeleteMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  // 1人あたりの合計・平均計算
  const totalPaid = members.reduce((sum, m) => sum + m.paidAmount, 0);
  const perPerson = members.length > 0 ? Math.round(totalPaid / members.length) : 0;

  // 🔄 最少送金アルゴリズムの計算
  const calculateTransfers = (): Transfer[] => {
    if (members.length === 0 || totalPaid === 0) return [];

    // 各メンバーの損益（＋なら貰う人、ーなら払う人）
    const balances = members.map((m) => ({
      name: m.name,
      amount: m.paidAmount - perPerson,
    }));

    const debtors = balances.filter((b) => b.amount < 0).sort((a, b) => a.amount - b.amount); // 払う人（マイナスが大きい順）
    const creditors = balances.filter((b) => b.amount > 0).sort((a, b) => b.amount - a.amount); // 貰う人（プラスが大きい順）

    const transfers: Transfer[] = [];

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // 相殺できる金額
      const amount = Math.min(-debtor.amount, creditor.amount);

      if (amount > 0) {
        transfers.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount),
        });
      }

      debtor.amount += amount;
      creditor.amount -= amount;

      if (Math.abs(debtor.amount) < 1) i++;
      if (Math.abs(creditor.amount) < 1) j++;
    }

    return transfers;
  };

  const transfers = calculateTransfers();

  return (
    <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700 mb-8">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
        <span>💰</span> グループスマート割り勘 (最少送金ルート)
      </h2>
      <p className="text-slate-400 text-xs mb-6">
        誰がいくら立て替えたか入力するだけで、最も少ない送金回数で清算できます！
      </p>

      {/* メンバー＆立て替え額の入力フォーム */}
      <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="メンバー名 (例: D君)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 flex-1"
        />
        <input
          type="number"
          placeholder="立て替え支払額 (円)"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 flex-1"
        />
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 font-bold px-5 py-2 rounded-xl text-sm transition"
        >
          メンバー追加
        </button>
      </form>

      {/* メンバー一覧 */}
      <div className="space-y-2 mb-6">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex justify-between items-center bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm"
          >
            <span className="font-semibold text-slate-200">{m.name}</span>
            <div className="flex items-center gap-4">
              <span className="text-slate-400">
                立て替え: <span className="font-bold text-amber-400">¥{m.paidAmount.toLocaleString()}</span>
              </span>
              <button
                onClick={() => handleDeleteMember(m.id)}
                className="text-slate-500 hover:text-red-400 text-xs"
              >
                ✕ 削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* サマリー（総額＆1人あたり） */}
      <div className="grid grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl text-center mb-6">
        <div>
          <p className="text-xs text-slate-400 mb-1">キャンプ合計費用</p>
          <p className="text-xl font-bold text-slate-100">¥{totalPaid.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">1人あたりの支払額</p>
          <p className="text-xl font-bold text-emerald-400">¥{perPerson.toLocaleString()}</p>
        </div>
      </div>

      {/* 最少送金ルートの表示 */}
      <div className="border-t border-slate-700 pt-5">
        <h3 className="font-bold text-sm text-slate-300 mb-3 flex items-center gap-1.5">
          <span>🚀</span> 送金おすすめルート (これだけで精算完了！)
        </h3>

        {transfers.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-2">
            全員の支払いが均等、またはメンバーがいません。
          </p>
        ) : (
          <div className="space-y-2">
            {transfers.map((t, idx) => (
              <div
                key={idx}
                className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{t.from}</span>
                  <span className="text-emerald-400 text-xs">➔</span>
                  <span className="font-bold text-slate-200">{t.to}</span>
                </div>
                <div className="font-extrabold text-emerald-300 text-base">
                  ¥{t.amount.toLocaleString()} 送金
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
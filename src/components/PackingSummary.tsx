'use client';

import React from 'react';

type PackingSummaryProps = {
  targetWeightKg: number;
  onTargetWeightChange: (val: number) => void;
  totalWeightGrams: number; // 行き (全総重量)
  afterConsumptionWeightGrams: number; // 帰り (消費後)
  totalPrice: number;
  onJumpToCategory?: (categoryName: string) => void;
};

export default function PackingSummary({
  targetWeightKg,
  onTargetWeightChange,
  totalWeightGrams,
  afterConsumptionWeightGrams,
  totalPrice,
  onJumpToCategory,
}: PackingSummaryProps) {
  // 重量計算 (g -> kg)
  const currentWeightKg = totalWeightGrams / 1000;
  const returnWeightKg = afterConsumptionWeightGrams / 1000;
  const consumableWeightKg = Math.max(0, currentWeightKg - returnWeightKg);

  // 目標達成率計算
  const progressPercent = targetWeightKg > 0 ? Math.min(100, (currentWeightKg / targetWeightKg) * 100) : 0;
  const remainingKg = targetWeightKg - currentWeightKg;

  const categories = [
    { name: 'ベースギア', label: '⛺ ベース', id: 'cat-base' },
    { name: '調理ギア', label: '🍳 調理', id: 'cat-cook' },
    { name: '衣類', label: '👕 衣類', id: 'cat-wear' },
    { name: 'その他・日用品', label: '📦 日用品', id: 'cat-other' },
    { name: '食料・消耗品', label: '🍱 食料', id: 'cat-food' },
  ];

  return (
    <div className="bg-[#1A231E] text-white p-4 rounded-2xl shadow-md border border-[#384F41] space-y-3">
      {/* 1段目: ヘッダー & 目標重量設定 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#384F41] pb-2">
        <h2 className="text-sm font-bold flex items-center gap-1.5 text-gray-200">
          📊 PASSENGER & WEIGHT SUMMARY
        </h2>
        <div className="flex items-center gap-1.5 text-xs bg-[#24332A] px-2.5 py-1 rounded-lg border border-[#384F41]">
          <span className="text-gray-300">🎯 目標:</span>
          <input
            type="number"
            step="0.5"
            min="0"
            value={targetWeightKg}
            onChange={(e) => onTargetWeightChange(Number(e.target.value))}
            className="w-14 bg-[#1A231E] border border-[#384F41] rounded px-1 text-center text-white font-bold text-xs focus:outline-none focus:border-[#BFA58A]"
          />
          <span className="text-gray-300">kg</span>
        </div>
      </div>

      {/* 2段目: プログレスバー & 残量表示 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-300 font-medium">
          <span>達成率: {progressPercent.toFixed(1)}%</span>
          <span>
            {remainingKg >= 0 ? (
              <span className="text-[#BFA58A] font-bold">あと {remainingKg.toFixed(2)} kg</span>
            ) : (
              <span className="text-red-400 font-bold">{(Math.abs(remainingKg)).toFixed(2)} kg オーバー</span>
            )}
          </span>
        </div>
        <div className="w-full h-2.5 bg-[#24332A] rounded-full overflow-hidden border border-[#384F41]">
          <div
            className={`h-full transition-all duration-300 ${
              remainingKg < 0 ? 'bg-red-500' : 'bg-[#BFA58A]'
            }`}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* 3段目: 重量・金額 2段カードレイアウト */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* 行き (全総重量) ＆ 合計金額 */}
        <div className="bg-[#24332A] p-2.5 rounded-xl border border-[#384F41] space-y-1">
          <div className="text-gray-400 font-medium">🚀 行き (全総重量)</div>
          <div className="text-base font-bold text-white">
            {currentWeightKg.toFixed(2)} <span className="text-xs font-normal">kg</span>
          </div>
          <div className="text-gray-400 pt-1 border-t border-[#384F41]/50 flex justify-between items-center">
            <span>💰 合計金額:</span>
            <span className="font-semibold text-gray-200">¥{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* 帰り (消費後重量) ＆ 消費物重量 */}
        <div className="bg-[#24332A] p-2.5 rounded-xl border border-[#384F41] space-y-1">
          <div className="text-gray-400 font-medium">🏠 帰り (消費後)</div>
          <div className="text-base font-bold text-[#BFA58A]">
            {returnWeightKg.toFixed(2)} <span className="text-xs font-normal">kg</span>
          </div>
          <div className="text-gray-400 pt-1 border-t border-[#384F41]/50 flex justify-between items-center">
            <span>🍱 消費物:</span>
            <span className="font-semibold text-gray-200">{consumableWeightKg.toFixed(2)} kg</span>
          </div>
        </div>
      </div>

      {/* 4段目: カテゴリージャンプボタン */}
      <div className="pt-1">
        <div className="text-[10px] text-gray-400 mb-1">🎨 カテゴリージャンプ</div>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onJumpToCategory && onJumpToCategory(cat.name)}
              className="px-2 py-1 bg-[#24332A] hover:bg-[#384F41] border border-[#384F41] text-gray-200 rounded-lg text-[11px] font-medium shrink-0 transition"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
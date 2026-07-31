'use client';

import React from 'react';

type GearItem = {
  id: string;
  name: string;
  weight: number;
  price: number;
  quantity: number;
  category: string;
  is_packed: boolean;
  is_consumable: boolean;
};

type Props = {
  gears: GearItem[];
  targetWeightKg: number;
  onTargetWeightChange: (weight: number) => void;
  onCategoryClick?: (categoryId: string) => void;
};

const CATEGORIES = [
  { id: 'base', name: 'ベースギア', icon: '⛺', color: '#FF5500' },
  { id: 'cook', name: '調理ギア・燃料', icon: '🍳', color: '#FFB800' },
  { id: 'wear', name: '衣類・防寒着', icon: '👕', color: '#00E5FF' },
  { id: 'other', name: 'その他・日用品', icon: '📦', color: '#E040FB' },
  { id: 'food', name: '食料・飲料', icon: '🍱', color: '#00E676' },
];

export default function WeightsSummary({
  gears,
  targetWeightKg,
  onTargetWeightChange,
  onCategoryClick,
}: Props) {
  const packedGears = gears.filter((g) => g.is_packed);

  const totalWeightG = packedGears.reduce(
    (sum, g) => sum + g.weight * g.quantity,
    0
  );
  const totalWeightKg = totalWeightG / 1000;

  const returnWeightG = packedGears
    .filter((g) => !g.is_consumable)
    .reduce((sum, g) => sum + g.weight * g.quantity, 0);
  const returnWeightKg = returnWeightG / 1000;

  const savedWeightG = totalWeightG - returnWeightG;
  const savedWeightKg = savedWeightG / 1000;

  const totalPrice = packedGears.reduce(
    (sum, g) => sum + g.price * g.quantity,
    0
  );

  const categoryStats = CATEGORIES.map((cat) => {
    const catGears = packedGears.filter((g) => g.category === cat.id);
    const weightG = catGears.reduce(
      (sum, g) => sum + g.weight * g.quantity,
      0
    );
    const price = catGears.reduce(
      (sum, g) => sum + g.price * g.quantity,
      0
    );
    return {
      ...cat,
      weightKg: weightG / 1000,
      price,
      count: catGears.length,
    };
  });

  const targetWeightG = targetWeightKg * 1000;
  const isOver = totalWeightG > targetWeightG;
  const diffKg = Math.abs(totalWeightG - targetWeightG) / 1000;

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-[#FF5500] flex items-center gap-2">
            📊 パッキング重量＆金額サマリー
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            消費物（🔥）にチェックを入れた品は帰りの重量から自動除外されます
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#27272A] px-3 py-1.5 rounded-lg border border-zinc-700 self-start sm:self-auto">
          <span className="text-xs text-zinc-300 font-medium flex items-center gap-1">
            🎯 目標重量:
          </span>
          <input
            type="number"
            step="0.5"
            min="1"
            max="100"
            value={targetWeightKg}
            onChange={(e) =>
              onTargetWeightChange(parseFloat(e.target.value) || 0)
            }
            className="w-16 bg-[#18181B] text-white text-sm font-bold text-center rounded border border-zinc-600 focus:outline-none focus:border-[#FF5500] py-0.5"
          />
          <span className="text-xs text-zinc-400">kg</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-[#27272A] p-3.5 rounded-xl border border-zinc-700/60 flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">🚚 行きの総重量</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white">
              {totalWeightKg.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-400">kg ({totalWeightG.toLocaleString()}g)</span>
          </div>
          <div className="mt-2 text-xs font-semibold">
            {isOver ? (
              <span className="text-[#FF5500] bg-[#FF5500]/10 px-2 py-0.5 rounded border border-[#FF5500]/20 inline-block">
                ⚠️ 目標を {diffKg.toFixed(2)}kg オーバー
              </span>
            ) : (
              <span className="text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/20 inline-block">
                🎯 あと {diffKg.toFixed(2)}kg 余裕あり
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#27272A] p-3.5 rounded-xl border border-zinc-700/60 flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">🏠 帰りの重量 (消費後)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-[#FFB800]">
              {returnWeightKg.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-400">kg ({returnWeightG.toLocaleString()}g)</span>
          </div>
          <div className="mt-2 text-xs text-[#00E676] font-medium">
            🔥 消費物で -{savedWeightKg.toFixed(2)}kg (-{savedWeightG.toLocaleString()}g) 軽量化
          </div>
        </div>

        <div className="bg-[#27272A] p-3.5 rounded-xl border border-zinc-700/60 flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium">💰 パッキング合計金額</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-[#00E676]">
              ¥{totalPrice.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            全 {packedGears.length} 点の合計金額
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
          📦 カテゴリー別内訳 (タップで該当リストへジャンプ)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {categoryStats.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryClick && onCategoryClick(cat.id)}
              className="bg-[#27272A] hover:bg-zinc-700/80 p-2.5 rounded-xl border border-zinc-700/70 text-left transition-all duration-150 active:scale-95 group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-[10px] text-zinc-400 group-hover:text-white">
                  {cat.count}件
                </span>
              </div>
              <div
                className="text-xs font-bold truncate mb-1"
                style={{ color: cat.color }}
              >
                {cat.name}
              </div>
              <div className="text-xs font-mono font-bold text-white">
                {cat.weightKg.toFixed(2)} <span className="text-[10px] font-normal text-zinc-400">kg</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                ¥{cat.price.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
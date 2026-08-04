'use client';

import { useState } from 'react';

type GearItem = {
  id: string;
  name: string;
  weight: number;
  price: number;
  quantity?: number;
  is_packed: boolean;
  is_selected?: boolean;
  is_consumable: boolean;
  category?: string;
};

type Props = {
  gears: GearItem[];
  onCategoryClick?: (catName: string) => void;
};

// 短縮カテゴリー定義
const CATEGORIES = ['ベース', '調理', '衣類', 'その他', '消耗品'];

const CATEGORY_COLORS: Record<string, string> = {
  ベース: '#FF5500',
  調理: '#FFB800',
  衣類: '#00E5FF',
  その他: '#E040FB',
  消耗品: '#00E676',
};

const CATEGORY_ICONS: Record<string, string> = {
  ベース: '⛺',
  調理: '🍳',
  衣類: '👕',
  その他: '📦',
  消耗品: '🍱',
};

// 旧名互換判定関数
const matchesCategory = (gearCategory: string | undefined, catName: string) => {
  const cat = gearCategory || 'ベース';
  if (catName === 'ベース') return cat === 'ベース' || cat === 'ベースギア';
  if (catName === '調理') return cat === '調理' || cat === '調理ギア';
  if (catName === '衣類') return cat === '衣類';
  if (catName === 'その他') return cat === 'その他' || cat === 'その他・日用品';
  if (catName === '消耗品') return cat === '消耗品' || cat === '食料・消耗品';
  return cat === catName;
};

// 重量フォーマット表示関数 (1,000g未満: g整数 / 1,000g以上: 小数点第2位kg)
const formatWeightDisplay = (grams: number) => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)}kg`;
  }
  return `${Math.round(grams)}g`;
};

export default function WeightsSummary({ gears, onCategoryClick }: Props) {
  // 目標重量ステート (デフォルト: 15.0 kg)
  const [targetWeightKg, setTargetWeightKg] = useState<number>(15.0);
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);

  const selectedGears = gears.filter((g) => g.is_selected !== false);

  // 各カテゴリーごとの合計重量算出
  const categoryWeights = CATEGORIES.reduce((acc, catName) => {
    acc[catName] = selectedGears
      .filter((g) => matchesCategory(g.category, catName))
      .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);
    return acc;
  }, {} as Record<string, number>);

  // 帰りの重量 (消耗品以外)
  const baseWeight = selectedGears
    .filter((g) => !g.is_consumable && !matchesCategory(g.category, '消耗品'))
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 行きの重量 (総重量)
  const totalWeight = selectedGears.reduce(
    (sum, g) => sum + (g.weight || 0) * (g.quantity || 1),
    0
  );

  // 総額
  const totalPrice = selectedGears.reduce(
    (sum, g) => sum + (g.price || 0) * (g.quantity || 1),
    0
  );

  // 目標重量との比較計算
  const targetWeightGrams = targetWeightKg * 1000;
  const targetPercent = targetWeightGrams > 0 ? (totalWeight / targetWeightGrams) * 100 : 0;
  const isOverTarget = targetWeightGrams > 0 && totalWeight > targetWeightGrams;
  const diffGrams = Math.abs(targetWeightGrams - totalWeight);

  return (
    <section className="bg-[#18181B] border border-zinc-800 p-4 md:p-5 rounded-2xl shadow-xl space-y-3.5">
      {/* 📊 タイトル ＆ 持参件数 */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
          📊 パッキングサマリー
        </h2>
        <span className="text-[11px] font-bold text-zinc-400 font-mono">
          (持参対象: {selectedGears.length} / 全{gears.length}点)
        </span>
      </div>

      {/* 🎯 最上段：目標重量 ＆ 達成率 */}
      <div className="bg-[#27272A]/50 p-3 rounded-xl border border-zinc-700/60 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 font-bold text-amber-400">
              <span>🎯 目標:</span>
              {isEditingTarget ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                    className="w-16 bg-[#18181B] border border-amber-500 rounded px-1.5 py-0.5 text-xs font-mono text-white focus:outline-none"
                  />
                  <span className="text-xs text-zinc-300">kg</span>
                  <button
                    onClick={() => setIsEditingTarget(false)}
                    className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-bold cursor-pointer hover:bg-amber-400"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <span
                  onClick={() => setIsEditingTarget(true)}
                  className="font-mono text-sm font-black text-amber-300 cursor-pointer hover:underline flex items-center gap-1"
                  title="タップして目標重量を変更"
                >
                  {targetWeightKg.toFixed(2)} kg
                  <span className="text-[10px] text-zinc-400 font-normal">✏️</span>
                </span>
              )}
            </div>

            {targetWeightGrams > 0 && (
              <span
                className={`text-[11px] font-bold ${
                  isOverTarget ? 'text-red-400 font-black animate-pulse' : 'text-emerald-400'
                }`}
              >
                {isOverTarget
                  ? `(⚠️ 目標を ${(diffGrams / 1000).toFixed(2)}kg オーバー！)`
                  : `(あと ${(diffGrams / 1000).toFixed(2)}kg 持てる！)`}
              </span>
            )}
          </div>

          <span
            className={`font-mono text-xs font-black shrink-0 ${
              isOverTarget ? 'text-red-400' : 'text-amber-400'
            }`}
          >
            {Math.round(targetPercent)}%
          </span>
        </div>

        {/* 達成率プログレスバー */}
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isOverTarget ? 'bg-red-500' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, targetPercent))}%` }}
          />
        </div>
      </div>

      {/* 🚀 主要数値の横1行集約 (行き / 帰り / 合計金額) */}
      <div className="bg-[#27272A]/50 p-2.5 rounded-xl border border-zinc-700/60 flex flex-wrap items-center justify-between gap-2 text-xs font-bold divide-y sm:divide-y-0 sm:divide-x divide-zinc-700/60">
        <div className="flex items-center gap-1.5 flex-1 min-w-[110px] justify-center pt-1 sm:pt-0">
          <span className="text-zinc-400">🚀 行き:</span>
          <span className="font-mono text-sm font-black text-white">
            {(totalWeight / 1000).toFixed(2)} kg
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-[110px] justify-center pt-1 sm:pt-0">
          <span className="text-zinc-400">🏠 帰り:</span>
          <span className="font-mono text-sm font-black text-[#FF5500]">
            {(baseWeight / 1000).toFixed(2)} kg
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-[130px] justify-center pt-1 sm:pt-0">
          <span className="text-zinc-400">💰 合計:</span>
          <span className="font-mono text-sm font-black text-amber-400">
            ¥{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 🎨 スリム帯バー (高さ12pxのマルチカラー積層バー) ＆ 5カテゴリー内訳 */}
      <div className="bg-[#27272A]/50 p-3 rounded-xl border border-zinc-700/60 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
          <span>🎨 積載バランス</span>
          <span className="text-[10px] text-zinc-500 font-normal">※タップで該当カテゴリーへ移動</span>
        </div>

        {/* 高さ12px相当（h-3）の細いマルチカラー帯バー */}
        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700 flex shadow-inner">
          {CATEGORIES.map((cat) => {
            const weight = categoryWeights[cat] || 0;
            if (weight === 0 || totalWeight === 0) return null;
            const percent = (weight / totalWeight) * 100;
            const color = CATEGORY_COLORS[cat] || '#FF5500';

            return (
              <div
                key={cat}
                style={{ width: `${percent}%`, backgroundColor: color }}
                className="h-3 transition-all duration-300 cursor-pointer hover:opacity-80"
                onClick={() => onCategoryClick && onCategoryClick(cat)}
                title={`${cat}: ${formatWeightDisplay(weight)} (${percent.toFixed(1)}%)`}
              />
            );
          })}
          {totalWeight === 0 && (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
              ギア未選択
            </div>
          )}
        </div>

        {/* 5カテゴリー内訳（タップでスムーズスクロール移動） */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
          {CATEGORIES.map((cat) => {
            const weight = categoryWeights[cat] || 0;
            const color = CATEGORY_COLORS[cat] || '#FF5500';
            const icon = CATEGORY_ICONS[cat] || '📦';

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryClick && onCategoryClick(cat)}
                className="bg-[#18181B]/80 hover:bg-[#18181B] p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 transition flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold group-hover:scale-105 transition-transform" style={{ color }}>
                  <span>{icon}</span>
                  <span>{cat}</span>
                </div>
                <span className="text-xs font-mono tabular-nums font-extrabold text-zinc-200 mt-0.5">
                  {formatWeightDisplay(weight)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
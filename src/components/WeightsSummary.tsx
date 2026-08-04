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

  // ベース重量 (消耗品以外 = 帰りの重量)
  const baseWeight = selectedGears
    .filter((g) => !g.is_consumable && !matchesCategory(g.category, '消耗品'))
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 消耗品重量
  const consumableWeight = selectedGears
    .filter((g) => g.is_consumable || matchesCategory(g.category, '消耗品'))
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 総重量 (行きの重量)
  const totalWeight = selectedGears.reduce(
    (sum, g) => sum + (g.weight || 0) * (g.quantity || 1),
    0
  );

  // 総額
  const totalPrice = selectedGears.reduce(
    (sum, g) => sum + (g.price || 0) * (g.quantity || 1),
    0
  );

  const formatKg = (g: number) => (g / 1000).toFixed(2);

  // 目標計算
  const targetWeightGrams = targetWeightKg * 1000;
  const targetPercent = targetWeightGrams > 0 ? (totalWeight / targetWeightGrams) * 100 : 0;
  const isOverTarget = targetWeightGrams > 0 && totalWeight > targetWeightGrams;
  const diffGrams = Math.abs(targetWeightGrams - totalWeight);

  // 行きバーでの各割合
  const basePercent = totalWeight > 0 ? (baseWeight / totalWeight) * 100 : 0;
  const consumablePercent = totalWeight > 0 ? (consumableWeight / totalWeight) * 100 : 0;

  return (
    <section className="bg-[#18181B] border border-zinc-800 p-4 md:p-5 rounded-2xl shadow-xl space-y-3.5">
      {/* 📊 タイトル ＆ 持参件数 */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
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
          {/* 左側: 目標重量 (変更可能) ＆ サブテキスト */}
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

            {/* ディファレンステキスト */}
            {targetWeightGrams > 0 && (
              <span
                className={`text-[11px] font-bold ${
                  isOverTarget ? 'text-red-400 font-black animate-pulse' : 'text-emerald-400'
                }`}
              >
                {isOverTarget
                  ? `(⚠️ 目標を ${formatKg(diffGrams)}kg オーバー！)`
                  : `(あと ${formatKg(diffGrams)}kg 持てる！)`}
              </span>
            )}
          </div>

          {/* 右側: 達成率パーセンテージ */}
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

      {/* 🚀 中段：行き ＆ 帰りの一体化スタックバー */}
      <div className="bg-[#27272A]/50 p-3.5 rounded-xl border border-zinc-700/60 space-y-3.5">
        {/* 1. 行きの行 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black text-white">
            <span className="flex items-center gap-1.5">
              <span>🚀 行き</span>
              <span className="text-zinc-400 font-normal text-[11px]">(満載時)</span>
            </span>
            <span className="font-mono text-sm text-white">{formatKg(totalWeight)} kg</span>
          </div>

          {/* 行き積層プログレスバー (ベース＋食料) */}
          <div className="w-full bg-zinc-800 rounded-xl h-8 overflow-hidden border border-zinc-700 flex text-xs font-mono font-bold shadow-inner">
            {/* ベースギア (オレンジ) */}
            {basePercent > 0 && (
              <div
                style={{ width: `${basePercent}%` }}
                className="bg-[#FF5500] h-full flex items-center justify-center text-white px-2 truncate transition-all duration-300"
                title={`ベース装備: ${formatKg(baseWeight)}kg`}
              >
                {basePercent >= 20 ? (
                  <span>{formatKg(baseWeight)}kg <span className="text-[10px] font-normal opacity-90">(⛺ベース)</span></span>
                ) : basePercent >= 10 ? (
                  <span>{formatKg(baseWeight)}kg</span>
                ) : null}
              </div>
            )}

            {/* 消耗品 (グリーン) */}
            {consumablePercent > 0 && (
              <div
                style={{ width: `${consumablePercent}%` }}
                className="bg-[#00E676] h-full flex items-center justify-center text-black px-2 truncate transition-all duration-300"
                title={`消耗品・食料: ${formatKg(consumableWeight)}kg`}
              >
                {consumablePercent >= 20 ? (
                  <span>{formatKg(consumableWeight)}kg <span className="text-[10px] font-normal opacity-90">(🍱消耗品)</span></span>
                ) : consumablePercent >= 10 ? (
                  <span>{formatKg(consumableWeight)}kg</span>
                ) : null}
              </div>
            )}

            {totalWeight === 0 && (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[11px] font-normal">
                アイテムが選択されていません
              </div>
            )}
          </div>
        </div>

        {/* 2. 帰りの行 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black text-white">
            <span className="flex items-center gap-1.5">
              <span>🏠 帰り</span>
              <span className="text-zinc-400 font-normal text-[11px]">(消費後)</span>
            </span>
            <span className="font-mono text-sm text-[#FF5500]">{formatKg(baseWeight)} kg</span>
          </div>

          {/* 帰り単色プログレスバー (ベースのみ) */}
          <div className="w-full bg-zinc-800/80 rounded-xl h-8 overflow-hidden border border-zinc-700/80 flex text-xs font-mono font-bold shadow-inner relative">
            {basePercent > 0 && (
              <div
                style={{ width: `${basePercent}%` }}
                className="bg-[#FF5500] h-full flex items-center justify-center text-white px-2 truncate transition-all duration-300"
                title={`帰り重量: ${formatKg(baseWeight)}kg`}
              >
                {basePercent >= 15 ? (
                  <span>{formatKg(baseWeight)}kg <span className="text-[10px] font-normal opacity-90">(ベースのみ)</span></span>
                ) : null}
              </div>
            )}

            {/* 消耗品分が減った可視領域 (グレー背景) */}
            {consumablePercent > 0 && (
              <div className="flex-1 h-full flex items-center justify-center text-[10px] font-bold text-zinc-500 bg-zinc-900/60 select-none">
                {consumablePercent >= 25 ? `-(🍱 ${formatKg(consumableWeight)}kg 消費)` : ''}
              </div>
            )}
          </div>
        </div>

        {/* バー下 カテゴリー凡例 */}
        <div className="flex items-center justify-end gap-3 pt-0.5 text-[11px] font-bold text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] inline-block" />
            ⛺ ベース装備
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] inline-block" />
            🍱 消耗品・食料
          </span>
        </div>
      </div>

      {/* 💰 最下段：合計金額 */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-xs">
        <span className="font-bold text-zinc-400 flex items-center gap-1">
          💰 パッキング合計金額:
        </span>
        <span className="font-mono text-base font-black text-amber-400">
          ¥{totalPrice.toLocaleString()}
        </span>
      </div>
    </section>
  );
}
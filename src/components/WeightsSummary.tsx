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
const CATEGORIES = [
  'ベース',
  '調理',
  '衣類',
  'その他',
  '消耗品',
];

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
  // ★ 目標重量ステート (デフォルト: 15.0 kg = 15000g)
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

  // ベース重量 (消耗品以外)
  const baseWeight = selectedGears
    .filter((g) => !g.is_consumable && !matchesCategory(g.category, '消耗品'))
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 消耗品重量
  const consumableWeight = categoryWeights['消耗品'] || 0;

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

  // 目標重量に対する達成率（最大100%までで制限）
  const targetWeightGrams = targetWeightKg * 1000;
  const targetPercent = targetWeightGrams > 0 ? Math.round((totalWeight / targetWeightGrams) * 100) : 0;
  const isOverTarget = targetWeightGrams > 0 && totalWeight > targetWeightGrams;

  return (
    <section className="bg-[#18181B] border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
          📊 総重量シミュレーション
        </h2>
        <span className="text-[11px] font-bold text-zinc-500">
          (持参対象: {selectedGears.length} / 全{gears.length}点)
        </span>
      </div>

      {/* サマリーカード 4列 ＋ 目標重量 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1: 行きの重量 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">🎒 行きの重量</span>
          <p className="text-lg font-black text-white font-mono mt-0.5">
            {formatKg(totalWeight)} <span className="text-xs font-normal text-zinc-400">kg</span>
          </p>
        </div>

        {/* 2: 🎯 目標重量 (タップして変更可能) */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 block">🎯 目標重量</span>
            <button
              onClick={() => setIsEditingTarget(!isEditingTarget)}
              className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
            >
              ✏️
            </button>
          </div>

          {isEditingTarget ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.5"
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                className="w-16 bg-[#18181B] border border-amber-500 rounded px-1.5 py-0.5 text-xs font-mono text-white"
              />
              <span className="text-xs text-zinc-400">kg</span>
              <button
                onClick={() => setIsEditingTarget(false)}
                className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-bold cursor-pointer"
              >
                OK
              </button>
            </div>
          ) : (
            <p
              onClick={() => setIsEditingTarget(true)}
              className="text-lg font-black text-amber-300 font-mono mt-0.5 cursor-pointer hover:underline"
              title="タップして目標重量を変更"
            >
              {targetWeightKg.toFixed(1)}{' '}
              <span className="text-xs font-normal text-zinc-400">kg</span>
            </p>
          )}
        </div>

        {/* 3: 帰りの重量 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">🏠 帰りの重量</span>
          <p className="text-lg font-black text-[#FF5500] font-mono mt-0.5">
            {formatKg(baseWeight)} <span className="text-xs font-normal text-zinc-400">kg</span>
          </p>
        </div>

        {/* 4: 装備総額 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">💰 装備総額</span>
          <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">
            ¥{totalPrice.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ★ 🎯 目標重量達成プログレスバー */}
      {targetWeightGrams > 0 && (
        <div className="bg-[#27272A]/40 p-3 rounded-xl border border-zinc-700/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-300 flex items-center gap-1">
              🎯 目標達成率 ({targetWeightKg}kg):
            </span>
            <span className={`font-mono ${isOverTarget ? 'text-red-400 font-black' : 'text-amber-400'}`}>
              {targetPercent}% {isOverTarget && '⚠️ 目標オーバー!'}
            </span>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isOverTarget ? 'bg-red-500' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, targetPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* 積み上げビジュアルバー（カテゴリー色分け） */}
      {totalWeight > 0 && (
        <div className="bg-[#27272A]/40 p-3 rounded-xl border border-zinc-700/50 space-y-2">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 block">🎒 行きの内訳</span>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700 flex">
              {CATEGORIES.map((cat) => {
                const weight = categoryWeights[cat] || 0;
                if (weight === 0) return null;
                const percent = (weight / totalWeight) * 100;
                const color = CATEGORY_COLORS[cat] || '#FF5500';

                return (
                  <div
                    key={cat}
                    style={{ width: `${percent}%`, backgroundColor: color }}
                    className="h-3 transition-all duration-300 cursor-pointer"
                    onClick={() => onCategoryClick && onCategoryClick(cat)}
                    title={cat}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-bold text-zinc-400 block">🏠 帰りの内訳</span>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700 flex">
              {CATEGORIES.filter((cat) => cat !== '消耗品').map((cat) => {
                const weight = categoryWeights[cat] || 0;
                if (weight === 0) return null;
                const percent = (weight / totalWeight) * 100;
                const color = CATEGORY_COLORS[cat] || '#FF5500';

                return (
                  <div
                    key={cat}
                    style={{ width: `${percent}%`, backgroundColor: color }}
                    className="h-3 transition-all duration-300 cursor-pointer"
                    onClick={() => onCategoryClick && onCategoryClick(cat)}
                    title={cat}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1 text-[10px] text-zinc-400 font-bold">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="flex items-center gap-1 cursor-pointer hover:text-white"
                onClick={() => onCategoryClick && onCategoryClick(cat)}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
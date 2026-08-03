'use client';

import { useState } from 'react';

type GearItem = {
  id: string;
  category?: string;
  weight: number;
  price?: number;
  quantity?: number;
  is_packed: boolean;
  is_consumable?: boolean;
};

type Props = {
  gears: GearItem[];
  onCategoryClick?: (category: string) => void;
};

const CATEGORIES = [
  'ベースギア',
  '調理ギア',
  '衣類',
  'その他・日用品',
  '食料・消耗品',
];

const CATEGORY_COLORS = {
  ベースギア: '#FF5500',
  調理ギア: '#FFB800',
  衣類: '#00E5FF',
  'その他・日用品': '#E040FB',
  '食料・消耗品': '#00E676',
};

export default function WeightsSummary({ gears, onCategoryClick }: Props) {
  const [targetWeightKg, setTargetWeightKg] = useState<number>(15.0);

  const packedGears = gears.filter((g) => g.is_packed);

  // 行き総重量 (g)
  const totalOutgoingWeight = packedGears.reduce(
    (sum, g) => sum + (g.weight || 0) * (g.quantity || 1),
    0
  );

  // 帰り総重量 (「食料・消耗品」以外)
  const totalReturnWeight = packedGears
    .filter((g) => (g.category || 'ベースギア') !== '食料・消耗品')
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // パッキング全体の合計金額
  const totalPrice = packedGears.reduce(
    (sum, g) => sum + (g.price || 0) * (g.quantity || 1),
    0
  );

  // 目標重量の計算
  const targetWeightG = targetWeightKg * 1000;
  const diffWeightG = targetWeightG - totalOutgoingWeight;
  const isOver = diffWeightG < 0;
  const progressPct = targetWeightG > 0 ? Math.min(100, (totalOutgoingWeight / targetWeightG) * 100) : 0;

  // カテゴリーごとの重量 ＆ 金額
  const categoryWeights: Record<string, number> = {};
  const categoryPrices: Record<string, number> = {};

  CATEGORIES.forEach((cat) => {
    const catGears = packedGears.filter((g) => (g.category || 'ベースギア') === cat);
    
    categoryWeights[cat] = catGears.reduce(
      (sum, g) => sum + (g.weight || 0) * (g.quantity || 1),
      0
    );

    categoryPrices[cat] = catGears.reduce(
      (sum, g) => sum + (g.price || 0) * (g.quantity || 1),
      0
    );
  });

  return (
    <div className="bg-[#18181B] p-3.5 sm:p-5 rounded-2xl border border-zinc-800 space-y-3 text-white shadow-xl">
      {/* 1段目: ヘッダー ＆ 目標設定 */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
        <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
          📊 パッキングサマリー
          <span className="text-xs text-zinc-400 font-normal">({packedGears.length}点)</span>
        </h2>

        <div className="flex items-center gap-1.5 bg-[#27272A] px-2.5 py-1 rounded-xl border border-zinc-700">
          <span className="text-[11px] sm:text-xs font-extrabold text-[#FFB800]">🎯 目標:</span>
          <input
            type="number"
            step="0.5"
            min="1"
            value={targetWeightKg}
            onChange={(e) => setTargetWeightKg(Math.max(0.1, Number(e.target.value) || 0))}
            className="w-14 bg-[#18181B] border border-zinc-600 rounded px-1.5 py-0.5 text-xs font-black text-white text-right focus:outline-none focus:border-[#FF5500]"
          />
          <span className="text-[11px] sm:text-xs font-bold text-zinc-300">kg</span>
        </div>
      </div>

      {/* 2段目: 目標達成率 ＆ プログレスバー */}
      <div className="bg-[#27272A] p-2.5 sm:p-3 rounded-xl border border-zinc-700/80 space-y-1.5">
        <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold">
          <span className="text-zinc-300">達成率 ({progressPct.toFixed(1)}%)</span>
          {isOver ? (
            <span className="text-[#FF5500] font-black animate-pulse">
              ⚠️ {Math.abs(diffWeightG / 1000).toFixed(2)} kg オーバー！
            </span>
          ) : (
            <span className="text-[#00E676] font-black">
              🎯 あと {(diffWeightG / 1000).toFixed(2)} kg
            </span>
          )}
        </div>
        
        <div className="h-2.5 w-full bg-[#18181B] rounded-full overflow-hidden p-0.5 border border-zinc-700">
          <div
            style={{
              width: `${progressPct}%`,
              backgroundColor: isOver ? '#FF5500' : '#00E676',
            }}
            className="h-full rounded-full transition-all duration-300"
          />
        </div>
      </div>

      {/* 3段目: 重量・金額 3分割表示 (スマホでも横並びで縦幅を圧縮) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#27272A] border border-[#FF5500]/50 p-2 sm:p-3 rounded-xl text-center shadow-inner">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-[#FF5500] block truncate">🚀 行き (全総重量)</span>
          <span className="text-sm sm:text-xl font-black text-white block mt-0.5">
            {(totalOutgoingWeight / 1000).toFixed(2)} <span className="text-[10px] font-bold text-zinc-400">kg</span>
          </span>
          <span className="text-[9px] text-zinc-400 block font-mono hidden sm:block">({totalOutgoingWeight.toLocaleString()} g)</span>
        </div>

        <div className="bg-[#27272A] border border-[#FFB800]/50 p-2 sm:p-3 rounded-xl text-center shadow-inner">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-[#FFB800] block truncate">🏠 帰り (消費後)</span>
          <span className="text-sm sm:text-xl font-black text-[#FFB800] block mt-0.5">
            {(totalReturnWeight / 1000).toFixed(2)} <span className="text-[10px] font-bold text-zinc-400">kg</span>
          </span>
          <span className="text-[9px] text-zinc-400 block font-mono hidden sm:block">({totalReturnWeight.toLocaleString()} g)</span>
        </div>

        <div className="bg-[#27272A] border border-[#00E676]/50 p-2 sm:p-3 rounded-xl text-center shadow-inner flex flex-col justify-center">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-[#00E676] block truncate">💰 合計金額</span>
          <span className="text-sm sm:text-xl font-black text-[#00E676] mt-0.5 block">
            ¥{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 4段目: カテゴリー別積載バランス */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-bold text-zinc-300">
          <span>積載バランス</span>
        </div>
        <div className="h-3 w-full bg-[#27272A] rounded-full overflow-hidden flex border border-zinc-700/60 p-0.5">
          {CATEGORIES.map((cat) => {
            const weight = categoryWeights[cat] || 0;
            const pct = totalOutgoingWeight > 0 ? (weight / totalOutgoingWeight) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={cat}
                style={{
                  width: `${pct}%`,
                  backgroundColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS],
                }}
                className="h-full rounded-xs transition-all duration-300"
                title={`${cat}: ${weight}g (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* 5段目: カテゴリージャンプボタン */}
      <div className="pt-0.5">
        <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 block mb-1.5">
          👇 タップすると各カテゴリーへ移動:
        </span>
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {CATEGORIES.map((cat) => {
            const weight = categoryWeights[cat] || 0;
            const price = categoryPrices[cat] || 0;
            const color = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS];
            return (
              <button
                key={cat}
                onClick={() => onCategoryClick && onCategoryClick(cat)}
                style={{ borderColor: `${color}80`, backgroundColor: `${color}15` }}
                className="p-1.5 sm:p-2 border rounded-xl text-left transition hover:brightness-125 active:scale-95 flex flex-col justify-between cursor-pointer shadow-sm min-w-0"
              >
                <span style={{ color: color }} className="font-extrabold text-[10px] sm:text-[11px] truncate block">
                  {cat}
                </span>

                <div className="space-y-0.2">
                  <div className="text-[10px] sm:text-xs font-black text-white block truncate">
                    ⚖️ {weight >= 1000 ? `${(weight / 1000).toFixed(1)}k` : `${weight}g`}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-zinc-300 block truncate">
                    ¥{price >= 10000 ? `${Math.round(price / 1000)}k` : price.toLocaleString()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
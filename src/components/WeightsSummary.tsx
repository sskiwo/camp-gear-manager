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

// ★ 5標準カテゴリーへの正規化関数（未定義・旧名称・未知のカテゴリーも漏れなく必ず5色のいずれかに集約）
const normalizeCategory = (gearCategory?: string, isConsumable?: boolean): 'ベース' | '調理' | '衣類' | 'その他' | '消耗品' => {
  if (isConsumable) return '消耗品';
  if (!gearCategory) return 'ベース';
  const cat = gearCategory.trim();
  if (cat === 'ベース' || cat === 'ベースギア') return 'ベース';
  if (cat === '調理' || cat === '調理ギア') return '調理';
  if (cat === '衣類') return '衣類';
  if (cat === '消耗品' || cat === '食料・消耗品' || cat === '食料') return '消耗品';
  if (cat === 'その他' || cat === 'その他・日用品') return 'その他';
  // 上記以外の未知のカテゴリー（例: 照明、電化製品など）はすべて「その他」に安全集約
  return 'その他';
};

// 重量フォーマット表示ルール (1,000g未満: 整数g / 1,000g以上: 小数点第2位kg)
const formatWeightDisplay = (grams: number) => {
  if (grams === 0) return '0g';
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

  // ① 各カテゴリーごとに (重量 × 数量) を集計
  const categoryWeights = CATEGORIES.reduce((acc, catName) => {
    acc[catName] = selectedGears
      .filter((g) => normalizeCategory(g.category, g.is_consumable) === catName)
      .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);
    return acc;
  }, {} as Record<string, number>);

  // ② 行き総重量は「5カテゴリー別重量の和」から直接算出（★これで計算ズレが100%発生しない構造に）
  const totalWeight = Object.values(categoryWeights).reduce((a, b) => a + b, 0);

  // ③ 帰りの重量（消耗品以外の合計）
  const baseWeight = totalWeight - (categoryWeights['消耗品'] || 0);

  // ④ 総額
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
    <section className="bg-[#18181B] border border-zinc-800 p-4 md:p-5 rounded-2xl shadow-xl space-y-3">
      {/* 📊 タイトル */}
      <div className="border-b border-zinc-800 pb-2">
        <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
          📊 パッキングサマリー
        </h2>
      </div>

      {/* 🎯 目標重量 ＆ プログレスバーエリア */}
      <div className="bg-[#27272A]/50 p-3 rounded-xl border border-zinc-700/60 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 font-bold text-zinc-200">
            <span>🎯 目標:</span>
            {isEditingTarget ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  className="w-16 bg-[#18181B] border border-[#FF5500] rounded px-1.5 py-0.5 text-xs font-mono tabular-nums text-white focus:outline-none"
                />
                <span className="text-xs text-zinc-300">kg</span>
                <button
                  onClick={() => setIsEditingTarget(false)}
                  className="text-[10px] bg-[#FF5500] text-white px-2 py-0.5 rounded font-bold cursor-pointer hover:bg-[#E04B00]"
                >
                  保存
                </button>
              </div>
            ) : (
              <span
                onClick={() => setIsEditingTarget(true)}
                className="font-mono tabular-nums text-xs font-bold text-zinc-100 cursor-pointer hover:underline flex items-center gap-1"
                title="タップして目標重量を変更"
              >
                {targetWeightKg.toFixed(2)} kg
                <span className="text-[10px] text-zinc-400 font-normal">✏️</span>
              </span>
            )}
          </div>

          {/* 残り重量表記 */}
          {targetWeightGrams > 0 && (
            <span className="text-xs font-bold font-mono tabular-nums shrink-0 text-white">
              {isOverTarget
                ? `⚠️ ${(diffGrams / 1000).toFixed(2)}kg オーバー`
                : `残り ${(diffGrams / 1000).toFixed(2)}kg`}
            </span>
          )}
        </div>

        {/* 目標プログレスバー */}
        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isOverTarget ? 'bg-[#EF4444]' : 'bg-[#FF5500]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, targetPercent))}%` }}
          />
        </div>
      </div>

      {/* 🚀 主要数値（行き / 帰り / 合計） */}
      <div className="bg-[#27272A]/50 p-2.5 rounded-xl border border-zinc-700/60 grid grid-cols-3 gap-1 text-[11px] sm:text-xs font-bold text-center">
        <div className="flex items-center justify-center gap-1 truncate">
          <span className="text-zinc-400 shrink-0">🚀 行き:</span>
          <span className="font-mono tabular-nums text-white font-bold truncate">
            {(totalWeight / 1000).toFixed(2)}kg
          </span>
        </div>

        <div className="flex items-center justify-center gap-1 truncate border-x border-zinc-700/60 px-0.5">
          <span className="text-zinc-400 shrink-0">🏠 帰り:</span>
          <span className="font-mono tabular-nums text-white font-bold truncate">
            {(baseWeight / 1000).toFixed(2)}kg
          </span>
        </div>

        <div className="flex items-center justify-center gap-1 truncate">
          <span className="text-zinc-400 shrink-0">💰 合計:</span>
          <span className="font-mono tabular-nums text-white font-bold truncate">
            ¥{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 🎨 5カテゴリー積載バランスバー ＆ 1行完全横並び内訳エリア */}
      <div className="bg-[#27272A]/50 p-3 rounded-xl border border-zinc-700/60 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
          <span>🎨 バランス</span>
        </div>

        {/* 積載バランスバー */}
        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700 flex shadow-inner">
          {CATEGORIES.map((cat) => {
            const weight = categoryWeights[cat] || 0;
            if (weight === 0 || totalWeight === 0) return null;
            const percent = (weight / totalWeight) * 100;
            const color = CATEGORY_COLORS[cat] || '#FF5500';

            return (
              <div
                key={cat}
                style={{ width: `${percent}%`, backgroundColor: color }}
                className="h-2.5 transition-all duration-300 cursor-pointer hover:opacity-80"
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

        {/* 全カテゴリー完全1行横並び (grid-cols-5) */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {CATEGORIES.map((cat) => {
            const weight = categoryWeights[cat] || 0;
            const color = CATEGORY_COLORS[cat] || '#FF5500';
            const icon = CATEGORY_ICONS[cat] || '📦';
            const isEmpty = weight === 0;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryClick && onCategoryClick(cat)}
                className={`p-1.5 rounded-lg border transition flex flex-col items-center justify-center text-center cursor-pointer group ${
                  isEmpty
                    ? 'bg-[#18181B]/40 border-zinc-800/60 opacity-50'
                    : 'bg-[#18181B]/80 hover:bg-[#18181B] border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* 上段: アイコン ＋ 名前 */}
                <div
                  className="flex items-center justify-center gap-0.5 text-[10px] sm:text-[11px] font-bold group-hover:scale-105 transition-transform w-full"
                  style={{ color: isEmpty ? '#71717A' : color }}
                >
                  <span className="shrink-0">{icon}</span>
                  <span className="truncate">{cat}</span>
                </div>

                {/* 下段: 重量数値 */}
                <span
                  className={`text-[10px] sm:text-xs font-mono tabular-nums font-extrabold mt-0.5 w-full ${
                    isEmpty ? 'text-zinc-600' : 'text-zinc-200'
                  }`}
                >
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
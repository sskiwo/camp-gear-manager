'use client';

import React, { useState } from 'react';
import { GearItem } from './GearItemCard';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface WeightsSummaryProps {
  gears: GearItem[];
  screenMode?: 'edit' | 'packing' | 'review';
  unusedGearIds?: Set<string>;
  onCategoryClick?: (catName: string) => void;
  targetWeightKg?: number;
  onTargetWeightChange?: (targetKg: number) => void;
}

const CATEGORIES = ['ベース', '調理', '衣類', 'その他', '消耗品'];

const CATEGORY_COLORS = {
  ベース: '#EF4444',
  調理: '#FFB800',
  衣類: '#00E5FF',
  その他: '#E040FB',
  消耗品: '#00E676',
};

const normalizeCategory = (
  gearCategory?: string,
  isConsumable?: boolean
): 'ベース' | '調理' | '衣類' | 'その他' | '消耗品' => {
  if (isConsumable) return '消耗品';
  if (!gearCategory) return 'ベース';
  const cat = gearCategory.trim();
  if (cat === 'ベース' || cat === 'ベースギア') return 'ベース';
  if (cat === '調理' || cat === '調理ギア') return '調理';
  if (cat === '衣類') return '衣類';
  if (cat === '消耗品' || cat === '食料・消耗品' || cat === '食料') return '消耗品';
  if (cat === 'その他' || cat === 'その他・日用品') return 'その他';
  return 'その他';
};

export default function WeightsSummary({
  gears,
  screenMode = 'edit',
  unusedGearIds = new Set(),
  onCategoryClick,
  targetWeightKg: externalTargetKg,
  onTargetWeightChange,
}: WeightsSummaryProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [internalTargetKg, setInternalTargetKg] = useState<number>(15.0);

  const targetKg = externalTargetKg !== undefined ? externalTargetKg : internalTargetKg;

  const handleTargetChange = (newVal: number) => {
    if (onTargetWeightChange) {
      onTargetWeightChange(newVal);
    } else {
      setInternalTargetKg(newVal);
    }
  };

  const selectedGears = gears.filter((g) => g.is_selected !== false);

  const outboundTotalWeight = selectedGears.reduce(
    (sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1),
    0
  );

  const inboundTotalWeight = selectedGears
    .filter((g) => !g.is_consumable)
    .reduce((sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1), 0);

  const unusedTotalWeight = selectedGears
    .filter((g) => unusedGearIds.has(g.id))
    .reduce((sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1), 0);

  const usedTotalWeight = Math.max(0, outboundTotalWeight - unusedTotalWeight);

  const totalPrice = selectedGears.reduce(
    (sum, g) => sum + (Number(g.price) || 0) * (Number(g.quantity) || 1),
    0
  );

  const targetGrams = (targetKg || 15.0) * 1000;
  const currentTotalWeight = outboundTotalWeight;
  const progressRatio = targetGrams > 0 ? Math.min(100, (currentTotalWeight / targetGrams) * 100) : 0;
  const isOverTarget = currentTotalWeight > targetGrams;

  const categoryWeights: Record<string, number> = {
    ベース: 0,
    調理: 0,
    衣類: 0,
    その他: 0,
    消耗品: 0,
  };

  selectedGears.forEach((g) => {
    const cat = normalizeCategory(g.category, g.is_consumable);
    categoryWeights[cat] += (Number(g.weight) || 0) * (Number(g.quantity) || 1);
  });

  const formatWeight = (grams: number) => {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)}kg`;
    }
    return `${Math.round(grams)}g`;
  };

  const getCategoryIcon = (catName: string) => {
    switch (catName) {
      case 'ベース':
        return '⛺';
      case '調理':
        return '🍳';
      case '衣類':
        return '👕';
      case 'その他':
        return '📦';
      case '消耗品':
        return '🍱';
      default:
        return '🎒';
    }
  };

  return (
    <section className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5 w-full overflow-hidden">
      {/* ヘッダー（パッキング中バッジを削除し、見出しと開閉ボタンを配置） */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-[17px] sm:text-[18px] font-bold text-white tracking-tight shrink-0 whitespace-nowrap">
            サマリー
          </h2>

          {screenMode === 'review' && (
            <span className="px-2 py-0.5 bg-amber-950/70 border border-amber-800/80 text-amber-400 rounded-lg text-[11px] font-bold shrink-0 whitespace-nowrap flex items-center gap-1">
              <span>⛺</span>
              <span>レビュー中</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
          aria-label="詳細サマリーを開閉"
          title={isOpen ? "詳細サマリーを折りたたむ" : "詳細サマリーを展開"}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 🎯 常に表示：目標重量ゲージ＆プログレスバー */}
      <div className="bg-[#27272A]/70 border border-zinc-700/60 rounded-xl p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] sm:text-[12px] gap-2">
          <div className="flex items-center gap-1.5 text-zinc-300 min-w-0">
            <span className="font-semibold text-white shrink-0">目標:</span>
            {isEditingTarget ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  value={targetKg}
                  onChange={(e) => handleTargetChange(Number(e.target.value))}
                  className="w-16 bg-[#18181B] border border-[#FF5500] text-white rounded px-1.5 py-0.5 text-[11px] font-mono font-bold focus:outline-none"
                  autoFocus
                />
                <span className="text-zinc-400 font-bold">kg</span>
                <button
                  type="button"
                  onClick={() => setIsEditingTarget(false)}
                  className="px-2 py-0.5 bg-[#FF5500] text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  完了
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTarget(true)}
                className="flex items-center gap-1 hover:text-white font-mono font-bold text-white transition cursor-pointer"
                title="目標重量を変更"
              >
                <span>{targetKg.toFixed(2)} kg</span>
                <span className="text-[10px] text-zinc-400 hover:text-[#FF5500]">✏️</span>
              </button>
            )}
          </div>

          {screenMode === 'review' ? (
            <div className="text-right shrink-0 font-mono text-[11px] sm:text-[12px]">
              <span className="text-zinc-400">未使用: </span>
              <span className="text-amber-400 font-bold">{formatWeight(unusedTotalWeight)}</span>
            </div>
          ) : (
            <div className="text-right shrink-0 font-mono text-[11px] sm:text-[12px]">
              <span className="text-zinc-400">差分: </span>
              <span className={`font-bold ${isOverTarget ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                {isOverTarget
                  ? `+${formatWeight(currentTotalWeight - targetGrams)} 超過`
                  : `残り ${formatWeight(targetGrams - currentTotalWeight)}`}
              </span>
            </div>
          )}
        </div>

        {/* プログレスバー */}
        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700/80">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              isOverTarget ? 'bg-[#EF4444]' : 'bg-[#FF5500]'
            }`}
            style={{ width: `${progressRatio}%` }}
          />
        </div>
      </div>

      {/* 🎯 開閉対象：詳細サマリー（3分割カード & 積載バランス） */}
      {isOpen && (
        <div className="space-y-3.5 pt-0.5">
          {/* 3分割サマリーカード */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            {screenMode === 'review' ? (
              <>
                <div className="bg-[#27272A]/50 border border-zinc-700/60 rounded-xl p-2 sm:p-2.5">
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                    実使用重量
                  </span>
                  <span className="text-[13px] sm:text-[15px] font-bold text-white font-mono block mt-0.5">
                    {formatWeight(usedTotalWeight)}
                  </span>
                </div>
                <div className="bg-[#27272A]/50 border border-zinc-700/60 rounded-xl p-2 sm:p-2.5">
                  <span className="text-[10px] sm:text-[11px] text-amber-400 block font-normal truncate">
                    未使用重量
                  </span>
                  <span className="text-[13px] sm:text-[15px] font-bold text-amber-400 font-mono block mt-0.5">
                    {formatWeight(unusedTotalWeight)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#27272A]/50 border border-zinc-700/60 rounded-xl p-2 sm:p-2.5">
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                    行き総重量 (満載)
                  </span>
                  <span className="text-[13px] sm:text-[15px] font-bold text-white font-mono block mt-0.5">
                    {formatWeight(outboundTotalWeight)}
                  </span>
                </div>
                <div className="bg-[#27272A]/50 border border-zinc-700/60 rounded-xl p-2 sm:p-2.5">
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                    帰り総重量 (消費後)
                  </span>
                  <span className="text-[13px] sm:text-[15px] font-bold text-emerald-400 font-mono block mt-0.5">
                    {formatWeight(inboundTotalWeight)}
                  </span>
                </div>
              </>
            )}

            <div className="bg-[#27272A]/50 border border-zinc-700/60 rounded-xl p-2 sm:p-2.5">
              <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                合計金額
              </span>
              <span className="text-[13px] sm:text-[15px] font-bold text-white font-mono block mt-0.5">
                ¥{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 積載バランスセクション */}
          <div className="space-y-2 pt-1 border-t border-zinc-800/80">
            <span className="text-[12px] font-bold text-zinc-300 block">積載バランス</span>

            <div className="w-full bg-zinc-800 h-2 sm:h-2.5 rounded-full overflow-hidden flex border border-zinc-700">
              {outboundTotalWeight > 0 ? (
                CATEGORIES.map((cat) => {
                  const weight = categoryWeights[cat] || 0;
                  const percent = (weight / outboundTotalWeight) * 100;
                  if (percent === 0) return null;
                  return (
                    <div
                      key={cat}
                      style={{
                        width: `${percent}%`,
                        backgroundColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS],
                      }}
                      className="h-full transition-all duration-300"
                      title={`${cat}: ${formatWeight(weight)} (${percent.toFixed(1)}%)`}
                    />
                  );
                })
              ) : (
                <div className="w-full h-full bg-zinc-800" />
              )}
            </div>

            <div className="grid grid-cols-5 gap-1 sm:gap-1.5 pt-0.5">
              {CATEGORIES.map((cat) => {
                const weight = categoryWeights[cat] || 0;
                const catColor = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS];
                const icon = getCategoryIcon(cat);

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onCategoryClick?.(cat)}
                    className="bg-[#27272A]/50 hover:bg-[#27272A] border border-zinc-700/60 hover:border-zinc-500 rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-center transition cursor-pointer min-w-0"
                    title={`${cat}カテゴリーへスクロール`}
                  >
                    <div className="flex items-center gap-0.5 max-w-full">
                      <span className="text-[10px] sm:text-[11px] shrink-0">{icon}</span>
                      <span
                        style={{ color: catColor }}
                        className="text-[10px] sm:text-[11px] font-bold truncate"
                      >
                        {cat}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-zinc-300 font-semibold mt-0.5 truncate">
                      {formatWeight(weight)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
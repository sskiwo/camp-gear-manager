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

  // 持参対象ギア（お留守番を除く）
  const selectedGears = gears.filter((g) => g.is_selected !== false);

  // 行き総重量（満載時）
  const outboundTotalWeight = selectedGears.reduce(
    (sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1),
    0
  );

  // 帰り総重量（消耗品を引いた重量）
  const inboundTotalWeight = selectedGears
    .filter((g) => !g.is_consumable)
    .reduce((sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1), 0);

  // レビュー用: 実使用重量・未使用重量
  const unusedTotalWeight = selectedGears
    .filter((g) => unusedGearIds.has(g.id))
    .reduce((sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1), 0);

  const usedTotalWeight = Math.max(0, outboundTotalWeight - unusedTotalWeight);

  // レビューモード時は実使用重量を基準にプログレスバーを計算
  const currentTotalWeight = screenMode === 'review' ? usedTotalWeight : outboundTotalWeight;

  const totalPrice = selectedGears.reduce(
    (sum, g) => sum + (Number(g.price) || 0) * (Number(g.quantity) || 1),
    0
  );

  const targetGrams = (targetKg || 15.0) * 1000;
  const progressRatio = targetGrams > 0 ? Math.min(100, (currentTotalWeight / targetGrams) * 100) : 0;
  const unusedRatio = targetGrams > 0 && screenMode === 'review' ? Math.min(100 - progressRatio, (unusedTotalWeight / targetGrams) * 100) : 0;
  const isOverTarget = currentTotalWeight > targetGrams;

  // カテゴリ別重量集計（レビューモード時は未使用品を除外した実使用重量で集計）
  const categoryWeights: Record<string, number> = {
    ベース: 0,
    調理: 0,
    衣類: 0,
    その他: 0,
    消耗品: 0,
  };

  selectedGears.forEach((g) => {
    // レビューモードで未使用チェックされている場合は除外
    if (screenMode === 'review' && unusedGearIds.has(g.id)) {
      return;
    }
    const cat = normalizeCategory(g.category, g.is_consumable);
    categoryWeights[cat] += (Number(g.weight) || 0) * (Number(g.quantity) || 1);
  });

  const displayTotalCategoryWeight = screenMode === 'review' ? usedTotalWeight : outboundTotalWeight;

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
    <section className="sticky top-2 z-30 bg-[#18181B]/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-2xl space-y-3 w-full overflow-hidden transition-all duration-200">
      {/* ヘッダー */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 cursor-pointer select-none group/header hover:opacity-90 transition-opacity"
        title={isOpen ? 'クリックして詳細を折りたたむ' : 'クリックして詳細を展開'}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-[16px] sm:text-[17px] font-bold text-white tracking-tight shrink-0 whitespace-nowrap group-hover/header:text-[#FF5500] transition-colors">
            サマリー
          </h2>

          {screenMode === 'review' && (
            <span className="px-2 py-0.5 bg-amber-950/70 border border-amber-800/80 text-amber-400 rounded-lg text-[10px] font-bold shrink-0 whitespace-nowrap flex items-center gap-1">
              <span>⛺</span>
              <span>レビュー中</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm group-hover/header:border-zinc-500"
          aria-label="詳細サマリーを開閉"
          title={isOpen ? '詳細を折りたたむ' : '詳細を展開'}
        >
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 【常時表示】目標重量ゲージ＆プログレスバー */}
      <div className="bg-[#27272A]/70 hover:bg-[#27272A] border border-zinc-700/60 hover:border-zinc-600 rounded-xl p-2.5 sm:p-3 space-y-1.5 transition-all duration-200">
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
                  className="px-2 py-0.5 bg-[#FF5500] hover:bg-[#e04c00] text-white rounded text-[10px] font-bold cursor-pointer transition active:scale-95"
                >
                  完了
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTarget(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-700/70 font-mono font-bold text-white transition cursor-pointer group/edit"
                title="目標重量を変更"
              >
                <span className="group-hover/edit:text-[#FF5500] transition-colors">{targetKg.toFixed(2)} kg</span>
                <span className="text-[10px] text-zinc-400 group-hover/edit:text-[#FF5500] transition-colors">✏️</span>
              </button>
            )}
          </div>

          {screenMode === 'review' ? (
            <div className="text-right shrink-0 font-mono text-[11px] sm:text-[12px] flex items-center gap-2">
              <div>
                <span className="text-zinc-400">実使用: </span>
                <span className="text-white font-bold">{formatWeight(usedTotalWeight)}</span>
              </div>
              <div>
                <span className="text-zinc-400">未使用: </span>
                <span className="text-amber-400 font-bold">{formatWeight(unusedTotalWeight)}</span>
              </div>
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

        {/* 🎯 プログレスバー（レビュー時は実使用と未使用がリアルタイムに反映） */}
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/80 flex">
          <div
            className={`h-2 transition-all duration-300 ${
              isOverTarget ? 'bg-[#EF4444]' : 'bg-[#FF5500]'
            }`}
            style={{ width: `${progressRatio}%` }}
            title={`実使用重量: ${formatWeight(usedTotalWeight)}`}
          />
          {screenMode === 'review' && unusedRatio > 0 && (
            <div
              className="h-2 bg-amber-500/80 transition-all duration-300"
              style={{ width: `${unusedRatio}%` }}
              title={`未使用重量: ${formatWeight(unusedTotalWeight)}`}
            />
          )}
        </div>
      </div>

      {/* 【開閉対象】3分割サマリーカード ＆ 積載バランス */}
      {isOpen && (
        <div className="space-y-3 pt-0.5 animate-fade-in">
          {/* 3分割サマリーカード */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            {screenMode === 'review' ? (
              <>
                <div className="bg-[#27272A]/50 hover:bg-[#27272A]/80 border border-zinc-700/60 hover:border-zinc-600 rounded-xl p-2 sm:p-2.5 transition-all duration-200">
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                    実使用重量
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-white font-mono block mt-0.5">
                    {formatWeight(usedTotalWeight)}
                  </span>
                </div>
                <div className="bg-[#27272A]/50 hover:bg-[#27272A]/80 border border-zinc-700/60 hover:border-zinc-600 rounded-xl p-2 sm:p-2.5 transition-all duration-200">
                  <span className="text-[10px] sm:text-[11px] text-amber-400 block font-normal truncate">
                    未使用重量
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-amber-400 font-mono block mt-0.5">
                    {formatWeight(unusedTotalWeight)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#27272A]/50 hover:bg-[#27272A]/80 border border-zinc-700/60 hover:border-zinc-600 rounded-xl p-2 sm:p-2.5 transition-all duration-200">
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                    行き (満載)
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-white font-mono block mt-0.5">
                    {formatWeight(outboundTotalWeight)}
                  </span>
                </div>
                <div className="bg-[#27272A]/50 hover:bg-[#27272A]/80 border border-zinc-700/60 hover:border-zinc-600 rounded-xl p-2 sm:p-2.5 transition-all duration-200">
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                    帰り (消費後)
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-emerald-400 font-mono block mt-0.5">
                    {formatWeight(inboundTotalWeight)}
                  </span>
                </div>
              </>
            )}

            <div className="bg-[#27272A]/50 hover:bg-[#27272A]/80 border border-zinc-700/60 hover:border-zinc-600 rounded-xl p-2 sm:p-2.5 transition-all duration-200">
              <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                合計金額
              </span>
              <span className="text-[13px] sm:text-[14px] font-bold text-white font-mono block mt-0.5">
                ¥{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 🎯 積載バランス（レビュー時は未使用品を除いた実使用割合でリアルタイム更新） */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 block">
                {screenMode === 'review' ? '実使用 積載バランス' : '積載バランス'}
              </span>
              {screenMode === 'review' && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  実使用合計: {formatWeight(usedTotalWeight)}
                </span>
              )}
            </div>

            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex border border-zinc-700">
              {displayTotalCategoryWeight > 0 ? (
                CATEGORIES.map((cat) => {
                  const weight = categoryWeights[cat] || 0;
                  const percent = (weight / displayTotalCategoryWeight) * 100;
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
                    className="bg-[#27272A]/50 hover:bg-[#27272A] border border-zinc-700/60 hover:border-zinc-500 rounded-lg p-1 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer min-w-0 hover:scale-105 active:scale-95 shadow-sm"
                    title={`${cat}カテゴリーへスクロール`}
                  >
                    <div className="flex items-center gap-0.5 max-w-full">
                      <span className="text-[10px] shrink-0">{icon}</span>
                      <span
                        style={{ color: catColor }}
                        className="text-[10px] font-bold truncate"
                      >
                        {cat}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-300 font-semibold mt-0.5 truncate">
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
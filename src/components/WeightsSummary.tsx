'use client';

import React, { useState, useEffect } from 'react';
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
  ベース: '#F97316', // テラコッタ・シェルターオレンジ（テント・寝具・ザックの基本装備）
  調理: '#FBBF24',  // キャンプファイヤー・アンバー（クッカー・バーナー・焚き火道具）
  衣類: '#38BDF8',  // アルパイン・スカイブルー（防寒着・レインウェア・着替え）
  その他: '#94A3B8', // チタニウム・スレートグレー（ランタン・ナイフ・日用品）
  消耗品: '#34D399', // フォレスト・セージグリーン（食材・水・ガス缶）
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

const STORAGE_KEY_SUMMARY_OPEN = 'camp_weights_summary_open';

export default function WeightsSummary({
  gears = [],
  screenMode = 'edit',
  unusedGearIds = new Set(),
  onCategoryClick,
  targetWeightKg = 15.0,
  onTargetWeightChange,
}: WeightsSummaryProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTargetInput, setTempTargetInput] = useState<number>(targetWeightKg);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUMMARY_OPEN);
      if (saved !== null) {
        setIsOpen(saved === 'true');
      }
    } catch {}
  }, []);

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_SUMMARY_OPEN, String(next));
      } catch {}
      return next;
    });
  };

  const handleSaveTarget = () => {
    if (onTargetWeightChange) {
      onTargetWeightChange(Number(tempTargetInput) || 15.0);
    }
    setIsEditingTarget(false);
  };

  // 持参対象ギア（お留守番を除く）
  const selectedGears = gears.filter((g) => g.is_selected !== false);
  const totalCount = selectedGears.length;

  // 行き総重量（持参総重量・満載時）
  const outboundTotalWeight = selectedGears.reduce(
    (sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1),
    0
  );

  // 帰り総重量（消耗品を引いた重量）
  const inboundTotalWeight = selectedGears
    .filter((g) => !g.is_consumable)
    .reduce((sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1), 0);

  // パッキング進捗用: パッキング完了重量 & 完了点数
  const packedGears = selectedGears.filter((g) => Boolean(g.is_packed));
  const packedCount = packedGears.length;
  const packedTotalWeight = packedGears.reduce(
    (sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1),
    0
  );
  const packingProgressRatio =
    outboundTotalWeight > 0
      ? Math.min(100, (packedTotalWeight / outboundTotalWeight) * 100)
      : totalCount > 0 && packedCount === totalCount
      ? 100
      : 0;

  // レビュー用: 実使用重量・未使用重量
  const unusedGears = selectedGears.filter((g) => unusedGearIds.has(String(g.id)));
  const unusedTotalWeight = unusedGears.reduce(
    (sum, g) => sum + (Number(g.weight) || 0) * (Number(g.quantity) || 1),
    0
  );
  const usedTotalWeight = Math.max(0, outboundTotalWeight - unusedTotalWeight);

  // レビュー用ゲージ幅
  const reviewUsedRatio =
    outboundTotalWeight > 0
      ? Math.min(100, (usedTotalWeight / outboundTotalWeight) * 100)
      : 0;

  // 目標プログレス計算 (エディット時)
  const targetGrams = (targetWeightKg || 15.0) * 1000;
  const editProgressRatio = targetGrams > 0 ? Math.min(100, (outboundTotalWeight / targetGrams) * 100) : 0;
  const isOverTarget = outboundTotalWeight > targetGrams;

  // 合計金額
  const totalPrice = selectedGears.reduce(
    (sum, g) => sum + (Number(g.price) || 0) * (Number(g.quantity) || 1),
    0
  );

  // カテゴリ別重量集計（レビューモード時は未使用品を除外）
  const categoryWeights: Record<string, number> = {
    ベース: 0,
    調理: 0,
    衣類: 0,
    その他: 0,
    消耗品: 0,
  };

  selectedGears.forEach((g) => {
    if (screenMode === 'review' && unusedGearIds.has(String(g.id))) {
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

  // パッキング完了重量比率フォーマット (例: "5.79 / 8.91kg")
  const formatPackedWeightRatio = (packedGrams: number, totalGrams: number) => {
    if (totalGrams >= 1000) {
      const packedVal = (packedGrams / 1000).toFixed(2);
      const totalVal = `${(totalGrams / 1000).toFixed(2)}kg`;
      return `${packedVal} / ${totalVal}`;
    }
    return `${Math.round(packedGrams)} / ${Math.round(totalGrams)}g`;
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
    <section className="sticky top-2 z-30 bg-[#18181B]/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl space-y-2 w-full overflow-hidden transition-all duration-200">
      {/* ヘッダー */}
      <div
        onClick={toggleOpen}
        className={`flex items-center justify-between gap-2 select-none cursor-pointer group/header hover:opacity-95 transition-all ${
          isOpen ? 'border-b border-zinc-800/80 pb-2' : ''
        }`}
        title={isOpen ? 'クリックして詳細を折りたたむ' : 'クリックして詳細を展開'}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className="text-[15px] sm:text-[16px] font-bold text-white tracking-tight shrink-0 whitespace-nowrap group-hover/header:text-[#FF5500] transition-colors flex items-center gap-1.5">
            <span>⚖️ サマリー</span>
          </h2>

          {/* 折りたたみ時：1行ミニ要約バッジ（スクロール中も邪魔にならない） */}
          {!isOpen && (
            <div className="flex items-center gap-2 text-xs font-mono truncate min-w-0 animate-fade-in">
              {screenMode === 'packing' ? (
                <span className="text-[#10B981] font-bold truncate">
                  {formatPackedWeightRatio(packedTotalWeight, outboundTotalWeight)} ({packingProgressRatio.toFixed(0)}%)
                </span>
              ) : screenMode === 'review' ? (
                <span className="text-white font-bold truncate">
                  実使用: {formatWeight(usedTotalWeight)}
                </span>
              ) : (
                <span className={`truncate font-bold ${isOverTarget ? 'text-[#EF4444]' : 'text-zinc-300'}`}>
                  持参: {formatWeight(outboundTotalWeight)} / 目標: {targetWeightKg.toFixed(1)}kg
                </span>
              )}
            </div>
          )}

          {screenMode === 'review' && isOpen && (
            <span className="px-2 py-0.5 bg-amber-950/70 border border-amber-800/80 text-amber-400 rounded-lg text-[10px] font-bold shrink-0 whitespace-nowrap flex items-center gap-1">
              <span>⛺</span>
              <span>レビュー中</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-zinc-400 group-hover/header:text-zinc-200 hidden xs:inline">
            {isOpen ? '折りたたむ' : '詳細を見る'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleOpen();
            }}
            className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm group-hover/header:border-zinc-500"
            aria-label="詳細サマリーを開閉"
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 【折りたたみ時】極細プログレスライン */}
      {!isOpen && (
        <div className="w-full bg-zinc-800/80 rounded-full h-1 overflow-hidden">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${
              screenMode === 'packing' || screenMode === 'review'
                ? 'bg-[#10B981]'
                : isOverTarget
                ? 'bg-[#EF4444]'
                : 'bg-[#FF5500]'
            }`}
            style={{
              width: `${
                screenMode === 'packing'
                  ? packingProgressRatio
                  : screenMode === 'review'
                  ? reviewUsedRatio
                  : editProgressRatio
              }%`,
            }}
          />
        </div>
      )}

      {/* 【開閉対象】詳細プログレス ＆ 3分割サマリーカード ＆ 積載バランス */}
      {isOpen && (
        <div className="space-y-2.5 pt-0.5 animate-fade-in">
          {/* モードに応じた詳細プログレスバー */}
          <div className="bg-[#27272A]/70 hover:bg-[#27272A] border border-zinc-700/60 hover:border-zinc-600 rounded-xl p-2.5 sm:p-3 space-y-1.5 transition-all duration-200">
            {screenMode === 'packing' ? (
              /* パッキングモード時 */
              <>
                <div className="flex items-center justify-between text-[11px] sm:text-[12px] gap-2 font-mono tabular-nums">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-bold min-w-0">
                    <span className="text-white font-sans font-semibold shrink-0">パッキング完了</span>
                    <span>
                      {formatPackedWeightRatio(packedTotalWeight, outboundTotalWeight)}
                    </span>
                  </div>

                  <div className="text-right shrink-0 text-zinc-300 font-bold">
                    <span>
                      {packedCount} / {totalCount} 点
                    </span>
                  </div>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/80">
                  <div
                    className="h-2 bg-[#10B981] rounded-full transition-all duration-300"
                    style={{ width: `${packingProgressRatio}%` }}
                  />
                </div>
              </>
            ) : screenMode === 'review' ? (
              /* レビューモード時 */
              <>
                <div className="flex items-center justify-between text-[11px] sm:text-[12px] font-mono tabular-nums">
                  <div className="flex items-center gap-1.5 font-bold text-white min-w-0">
                    <span className="font-sans font-semibold shrink-0">実使用重量</span>
                    <span>{formatWeight(usedTotalWeight)}</span>
                  </div>

                  <div className="text-right font-bold text-zinc-300 shrink-0">
                    <span className="text-zinc-400 font-sans font-normal mr-1">未使用</span>
                    <span>{formatWeight(unusedTotalWeight)}</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/80">
                  <div
                    className="h-2 bg-[#10B981] rounded-full transition-all duration-300"
                    style={{ width: `${reviewUsedRatio}%` }}
                    title={`実使用重量: ${formatWeight(usedTotalWeight)} / 持参総重量: ${formatWeight(outboundTotalWeight)}`}
                  />
                </div>
              </>
            ) : (
              /* エディット時 */
              <>
                <div className="flex items-center justify-between text-[11px] sm:text-[12px] gap-2">
                  <div className="flex items-center gap-1.5 text-zinc-300 min-w-0">
                    <span className="font-semibold text-white shrink-0">目標</span>
                    {isEditingTarget ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="50"
                          value={tempTargetInput}
                          onChange={(e) => setTempTargetInput(Number(e.target.value))}
                          className="w-16 bg-[#18181B] border border-[#FF5500] text-white rounded px-1.5 py-0.5 text-[11px] font-mono font-bold focus:outline-none"
                          autoFocus
                        />
                        <span className="text-zinc-400 font-bold">kg</span>
                        <button
                          type="button"
                          onClick={handleSaveTarget}
                          className="px-2 py-0.5 bg-[#FF5500] hover:bg-[#e04c00] text-white rounded text-[10px] font-bold cursor-pointer transition active:scale-95"
                        >
                          完了
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTempTargetInput(targetWeightKg);
                          setIsEditingTarget(true);
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-700/70 font-mono font-bold text-white transition cursor-pointer group/edit"
                        title="目標重量を変更"
                      >
                        <span className="group-hover/edit:text-[#FF5500] transition-colors">
                          {(targetWeightKg || 15.0).toFixed(2)} kg
                        </span>
                        <span className="text-[10px] text-zinc-400 group-hover/edit:text-[#FF5500] transition-colors">
                          ✏️
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="text-right shrink-0 font-mono text-[11px] sm:text-[12px]">
                    <span
                      className={`font-bold ${isOverTarget ? 'text-[#EF4444]' : 'text-white'}`}
                    >
                      {isOverTarget
                        ? `+${formatWeight(outboundTotalWeight - targetGrams)} 超過`
                        : `残り ${formatWeight(targetGrams - outboundTotalWeight)}`}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/80">
                  <div
                    className={`h-2 transition-all duration-300 ${
                      isOverTarget ? 'bg-[#EF4444]' : 'bg-[#FF5500]'
                    }`}
                    style={{ width: `${editProgressRatio}%` }}
                    title={`持参総重量: ${formatWeight(outboundTotalWeight)}`}
                  />
                </div>
              </>
            )}
          </div>
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
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                    未使用重量
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-white font-mono block mt-0.5">
                    {formatWeight(unusedTotalWeight)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#27272A]/50 hover:bg-[#27272A]/80 border border-zinc-700/60 hover:border-zinc-600 rounded-xl p-2 sm:p-2.5 transition-all duration-200">
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                    行き
                  </span>
                  <span className="text-[13px] sm:text-[14px] font-bold text-white font-mono block mt-0.5">
                    {formatWeight(outboundTotalWeight)}
                  </span>
                </div>
                <div className="bg-[#27272A]/50 hover:bg-[#27272A]/80 border border-zinc-700/60 hover:border-zinc-600 rounded-xl p-2 sm:p-2.5 transition-all duration-200">
                  <span className="text-[10px] sm:text-[11px] text-zinc-400 block font-normal truncate">
                    帰り
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

            {/* 🎯 スマホでは横スクロールで文字切れを防止、PCでは5列グリッド */}
            <div className="flex sm:grid sm:grid-cols-5 gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar pt-0.5 -mx-1 px-1">
              {CATEGORIES.map((cat) => {
                const weight = categoryWeights[cat] || 0;
                const catColor = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS];
                const icon = getCategoryIcon(cat);

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onCategoryClick?.(cat)}
                    className="flex-shrink-0 sm:flex-shrink min-w-[70px] sm:min-w-0 bg-[#27272A]/50 hover:bg-[#27272A] border border-zinc-700/60 hover:border-zinc-500 rounded-lg p-1.5 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
                    title={`${cat}カテゴリーへスクロール`}
                  >
                    <div className="flex items-center gap-1 max-w-full">
                      <span className="text-xs shrink-0">{icon}</span>
                      <span
                        style={{ color: catColor }}
                        className="text-[11px] font-bold whitespace-nowrap"
                      >
                        {cat}
                      </span>
                    </div>
                    <span className="text-[10.5px] font-mono text-zinc-300 font-bold mt-0.5 whitespace-nowrap">
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
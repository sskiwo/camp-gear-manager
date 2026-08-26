'use client';

import { useState, useEffect } from 'react';
import GearItemCard, { GearItem } from './GearItemCard';
import ReviewResultModal, { ReviewResultData } from './ReviewResultModal';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

type Props = {
  gears: GearItem[];
  allCampsCount?: number;
  allGearsInUserAccount?: GearItem[];
  screenMode?: 'edit' | 'packing' | 'review';
  targetWeightKg?: number;
  onScreenModeChange?: (mode: 'edit' | 'packing' | 'review') => void;
  unusedGearIds?: Set<string>;
  onToggleUnusedGear?: (id: string) => void;
  openCategories: Record<string, boolean>;
  onToggleCategoryOpen: (catName: string) => void;
  onTogglePacked: (id: string, currentStatus: boolean) => void;
  onToggleSelected: (id: string, currentStatus: boolean) => void;
  onUpdateQuantity?: (id: string, currentQty: number, delta: number) => void;
  onUpdateGear: (id: string, data: any) => Promise<void>;
  onDeleteGear: (id: string) => void;
  onDeleteAllGears?: () => void;
  onResetAllPacked?: () => void;
  onReorderGears?: (reorderedGears: GearItem[]) => void;
};

const CATEGORIES = ['ベース', '調理', '衣類', 'その他', '消耗品'];

const CATEGORY_COLORS = {
  ベース: '#EF4444',
  調理: '#FFB800',
  衣類: '#00E5FF',
  その他: '#E040FB',
  消耗品: '#00E676',
};

const STORAGE_KEY_SORT_ORDERS = 'camp_gear_sort_orders';

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

export default function GearList({
  gears,
  allCampsCount = 1,
  allGearsInUserAccount = [],
  screenMode: externalScreenMode,
  targetWeightKg = 15.0,
  onScreenModeChange,
  unusedGearIds: externalUnusedGearIds,
  onToggleUnusedGear,
  openCategories,
  onToggleCategoryOpen,
  onTogglePacked,
  onToggleSelected,
  onUpdateQuantity,
  onUpdateGear,
  onDeleteGear,
  onResetAllPacked,
}: Props) {
  const [sortOrders, setSortOrders] = useState<Record<string, string>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'unpacked'>('all');

  useEffect(() => {
    try {
      const savedSortOrders = localStorage.getItem(STORAGE_KEY_SORT_ORDERS);
      if (savedSortOrders) {
        setSortOrders(JSON.parse(savedSortOrders));
      }
    } catch (err) {
      console.warn('Failed to load sort orders from localStorage:', err);
    }
  }, []);

  const handleSortChange = (catName: string, newSort: string) => {
    setSortOrders((prev) => {
      const updated = { ...prev, [catName]: newSort };
      try {
        localStorage.setItem(STORAGE_KEY_SORT_ORDERS, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save sort orders to localStorage:', err);
      }
      return updated;
    });
  };

  const [internalScreenMode, setInternalScreenMode] = useState<'edit' | 'packing' | 'review'>('edit');
  const screenMode = externalScreenMode !== undefined ? externalScreenMode : internalScreenMode;

  const handleModeChange = (mode: 'edit' | 'packing' | 'review') => {
    if (onScreenModeChange) {
      onScreenModeChange(mode);
    } else {
      setInternalScreenMode(mode);
    }
  };

  const [internalUnusedGearIds, setInternalUnusedGearIds] = useState<Set<string>>(new Set());
  const unusedGearIds = externalUnusedGearIds !== undefined ? externalUnusedGearIds : internalUnusedGearIds;

  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isApplyingNext, setIsApplyingNext] = useState(false);
  const [reviewResultModal, setReviewResultModal] = useState<ReviewResultData | null>(null);

  const selectedGears = gears.filter((g) => g.is_selected !== false);
  const packedCount = selectedGears.filter((g) => g.is_packed).length;
  const totalCount = selectedGears.length;

  const getFilteredGears = () => {
    if (screenMode === 'packing') {
      return filterMode === 'unpacked'
        ? gears.filter((g) => g.is_selected !== false && !g.is_packed)
        : gears;
    }
    if (screenMode === 'review') {
      return selectedGears;
    }
    return gears;
  };

  const filteredGears = getFilteredGears();

  const getAdoptionRate = (gearName: string) => {
    if (!allGearsInUserAccount || allGearsInUserAccount.length === 0) {
      return `1/${allCampsCount}`;
    }

    const cleanName = (gearName || '').trim();
    const selectedCount = allGearsInUserAccount.filter(
      (g) => (g.name || '').trim() === cleanName && g.is_selected !== false
    ).length;

    return `${selectedCount}/${Math.max(1, allCampsCount)}`;
  };

  const handleToggleUnused = (gearId: string) => {
    if (onToggleUnusedGear) {
      onToggleUnusedGear(gearId);
    } else {
      setInternalUnusedGearIds((prev) => {
        const next = new Set(prev);
        if (next.has(gearId)) {
          next.delete(gearId);
        } else {
          next.add(gearId);
        }
        return next;
      });
    }
  };

  const handleCompleteReview = async () => {
    if (selectedGears.length === 0 || isSubmittingReview) return;
    setIsSubmittingReview(true);

    try {
      let totalWeight = 0;
      let totalUnusedWeight = 0;
      let totalUnusedGearsCount = 0;

      for (const gear of selectedGears) {
        const isUnused = unusedGearIds.has(gear.id);
        const gearWeight = (gear.weight || 0) * (gear.quantity || 1);
        totalWeight += gearWeight;

        const nextBrought = (gear.total_brought_count || 0) + 1;
        const nextUsed = (gear.total_used_count || 0) + (isUnused ? 0 : 1);

        if (isUnused) {
          totalUnusedWeight += gearWeight;
          totalUnusedGearsCount += 1;
        }

        await onUpdateGear(gear.id, {
          total_brought_count: nextBrought,
          total_used_count: nextUsed,
        });
      }

      const totalItemsCount = selectedGears.length;
      const usedItemsCount = totalItemsCount - totalUnusedGearsCount;
      const actualUsedWeight = Math.max(0, totalWeight - totalUnusedWeight);

      const weightUsageRate = totalWeight > 0 ? actualUsedWeight / totalWeight : 1;
      const countUsageRate = totalItemsCount > 0 ? usedItemsCount / totalItemsCount : 1;
      const operationScore = 60 * (weightUsageRate * 0.6 + countUsageRate * 0.4);

      const targetGrams = (targetWeightKg || 15.0) * 1000;
      let targetScore = 40;
      if (totalWeight > targetGrams && targetGrams > 0) {
        const overRatio = ((totalWeight - targetGrams) / targetGrams) * 100;
        targetScore = Math.max(0, 40 - overRatio);
      }

      const finalScore = Math.min(100, Math.max(0, Math.round(operationScore + targetScore)));

      let rank: 'S' | 'A' | 'B' | 'C' = 'C';
      let rankTitle = '伸びしろキャンパー';
      let rankIcon = '🥉';

      if (finalScore >= 95) {
        rank = 'S';
        rankTitle = '神パッキング（ULマスター）';
        rankIcon = '🏆';
      } else if (finalScore >= 85) {
        rank = 'A';
        rankTitle = 'ベテランULキャンパー';
        rankIcon = '🥇';
      } else if (finalScore >= 70) {
        rank = 'B';
        rankTitle = '快適重視のバランスキャンパー';
        rankIcon = '🥈';
      }

      setReviewResultModal({
        totalWeightGrams: totalWeight,
        unusedWeightGrams: totalUnusedWeight,
        usedWeightGrams: actualUsedWeight,
        totalCount: totalItemsCount,
        unusedCount: totalUnusedGearsCount,
        usedCount: usedItemsCount,
        score: finalScore,
        rank,
        rankTitle,
        rankIcon,
        targetWeightKg: targetWeightKg || 15.0,
      });
    } catch (err) {
      console.error('レビュー更新エラー:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleApplyToNextPacking = async () => {
    if (!reviewResultModal || isApplyingNext) return;
    setIsApplyingNext(true);

    try {
      for (const gearId of Array.from(unusedGearIds)) {
        await onUpdateGear(gearId, { is_selected: false });
      }
      setReviewResultModal(null);
      handleModeChange('edit');
    } catch (err) {
      console.error('次回パッキング反映エラー:', err);
      alert('パッキング設定の反映中にエラーが発生しました');
    } finally {
      setIsApplyingNext(false);
    }
  };

  return (
    <section className="bg-[#18181B] p-4 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
      {/* リストヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <h2 className="text-[18px] font-bold text-zinc-100 flex items-center gap-1.5">
          {screenMode === 'edit'
            ? `ギア選定 (${totalCount} / ${gears.length})`
            : screenMode === 'packing'
            ? `パッキングリスト (${packedCount} / ${totalCount})`
            : `レビュー (${selectedGears.length})`}
        </h2>

        {/* モード切替タブ */}
        <div className="grid grid-cols-3 gap-1 bg-[#09090B] p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => handleModeChange('edit')}
            className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap text-center ${
              screenMode === 'edit'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>✏️</span>
            <span>ギア編集</span>
          </button>
          <button
            onClick={() => handleModeChange('packing')}
            className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap text-center ${
              screenMode === 'packing'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🎒</span>
            <span>パッキング</span>
          </button>
          <button
            onClick={() => handleModeChange('review')}
            className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap text-center ${
              screenMode === 'review'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>⛺</span>
            <span>レビュー</span>
          </button>
        </div>
      </div>

      {/* モード別説明ガイドカード */}
      {screenMode === 'edit' && (
        <div className="bg-[#27272A]/40 border border-zinc-700/60 p-3 rounded-xl">
          <p className="text-[12px] text-zinc-300 font-normal leading-relaxed">
            持っていくギアにチェックを入れ、今回持っていかないギアはチェックを外して「お留守番（💤）」に設定できます。
          </p>
        </div>
      )}

      {screenMode === 'packing' && (
        <div className="bg-[#27272A]/40 border border-zinc-700/60 p-3 rounded-xl">
          <p className="text-[12px] text-zinc-300 font-normal leading-relaxed">
            💡 ザックに詰めたギアにチェック（✅）を入れてください。「未チェックのみ」ボタンで残りの荷造りアイテムを絞り込めます。
          </p>
        </div>
      )}

      {screenMode === 'review' && (
        <div className="bg-[#27272A]/40 border border-zinc-700/60 p-3.5 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[13px] font-bold text-white">
              キャンプお疲れ様でした！持参ギアのレビューを行いましょう
            </span>
          </div>
          <p className="text-[12px] text-zinc-300 leading-relaxed font-normal">
            持っていったが<span className="text-amber-400 font-bold">「使わなかった（未使用）」</span>ギアのチェック（✅）を外してください。完了すると次回の軽量化データに反映されます。
          </p>
        </div>
      )}

      {/* 🎯 パッキング進捗バー（エメラルドグリーン #10B981 に統一） */}
      {screenMode === 'packing' && totalCount > 0 && (
        <div className="bg-[#27272A]/80 p-3.5 rounded-2xl border border-zinc-700/70 space-y-2 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-normal text-white">
                パッキング済み:
              </span>
              <span className="text-[12px] font-normal text-white font-mono tabular-nums text-right">
                {packedCount} / {totalCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterMode(filterMode === 'all' ? 'unpacked' : 'all')}
                className={`text-[12px] font-normal px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  filterMode === 'unpacked'
                    ? 'bg-[#10B981] text-white border-[#10B981] font-bold'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                }`}
              >
                {filterMode === 'unpacked' ? '全て表示' : '未チェックのみ'}
              </button>

              {onResetAllPacked && (
                <button
                  onClick={onResetAllPacked}
                  className="text-[12px] font-normal px-2.5 py-1 rounded-lg bg-zinc-800 border border-[#EF4444]/60 text-white hover:bg-[#EF4444]/20 transition cursor-pointer"
                  title="当日のパッキング完了チェックをリセットします"
                >
                  リセット
                </button>
              )}
            </div>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700">
            <div
              className="bg-[#10B981] h-2.5 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${totalCount > 0 ? (packedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {gears.length === 0 ? (
        <p className="text-center text-zinc-500 py-6 font-normal bg-[#27272A]/50 rounded-xl border border-zinc-800 text-[12px]">
          ギアや食料がまだ登録されていません。
        </p>
      ) : screenMode === 'packing' && filterMode === 'unpacked' && filteredGears.length === 0 ? (
        <div className="bg-emerald-950/30 border border-emerald-800/60 p-6 rounded-2xl text-center space-y-2">
          <p className="text-[14px] font-semibold text-[#10B981]">🎉 本日のパッキング準備がすべて完了しました！</p>
          <p className="text-[12px] text-zinc-400 font-normal">持っていく予定のギアはすべてザックに入っています。行ってらっしゃい！⛺✨</p>
        </div>
      ) : (
        CATEGORIES.map((catName) => {
          const categoryAllGears = gears.filter((g) => normalizeCategory(g.category, g.is_consumable) === catName);
          if (categoryAllGears.length === 0 && (screenMode === 'packing' || screenMode === 'review')) return null;

          let categoryGears = filteredGears.filter((g) => normalizeCategory(g.category, g.is_consumable) === catName);
          if (categoryGears.length === 0 && screenMode === 'packing' && filterMode === 'unpacked') {
            return null;
          }

          const sortOrder = sortOrders[catName] || 'default';
          if (sortOrder === 'usage_desc') {
            categoryGears = [...categoryGears].sort((a, b) => {
              const broughtA = a.total_brought_count || 0;
              const usedA = a.total_used_count || 0;
              const rateA = broughtA > 0 ? usedA / broughtA : -1;

              const broughtB = b.total_brought_count || 0;
              const usedB = b.total_used_count || 0;
              const rateB = broughtB > 0 ? usedB / broughtB : -1;

              if (rateB !== rateA) return rateB - rateA;
              return usedB - usedA;
            });
          } else if (sortOrder === 'weight_desc') {
            categoryGears = [...categoryGears].sort(
              (a, b) => (b.weight || 0) * (b.quantity || 1) - (a.weight || 0) * (a.quantity || 1)
            );
          } else if (sortOrder === 'weight_asc') {
            categoryGears = [...categoryGears].sort(
              (a, b) => (a.weight || 0) * (a.quantity || 1) - (b.weight || 0) * (b.quantity || 1)
            );
          } else if (sortOrder === 'price_desc') {
            categoryGears = [...categoryGears].sort(
              (a, b) => (b.price || 0) * (b.quantity || 1) - (a.price || 0) * (a.quantity || 1)
            );
          }

          const catColor = CATEGORY_COLORS[catName as keyof typeof CATEGORY_COLORS] || '#EF4444';
          const isOpen = screenMode === 'packing' || screenMode === 'review' ? true : openCategories[catName] !== false;

          const selectedGearsInCat = categoryAllGears.filter((g) => g.is_selected !== false);
          const packedGearsInCat = selectedGearsInCat.filter((g) => g.is_packed);

          const countText =
            screenMode === 'packing'
              ? `${packedGearsInCat.length} / ${selectedGearsInCat.length}`
              : screenMode === 'review'
              ? `${selectedGearsInCat.length}`
              : `${selectedGearsInCat.length} / ${categoryAllGears.length}`;

          const catIcon =
            catName === 'ベース'
              ? '⛺'
              : catName === '調理'
              ? '🍳'
              : catName === '衣類'
              ? '👕'
              : catName === 'その他'
              ? '📦'
              : '🍱';

          return (
            <div
              key={catName}
              id={`category-${catName}`}
              className="border rounded-xl overflow-hidden shadow-md scroll-mt-6"
              style={{ borderColor: `${catColor}50` }}
            >
              {/* カテゴリー見出しバー */}
              <div
                style={{ backgroundColor: '#18181B', borderColor: `${catColor}40` }}
                className="sticky top-0 z-10 w-full flex items-center justify-between px-3 sm:px-4 py-2 border-b backdrop-blur-md gap-2"
              >
                <button
                  onClick={() => onToggleCategoryOpen(catName)}
                  className="flex items-center gap-1.5 sm:gap-2 text-left cursor-pointer flex-1 min-w-0 overflow-hidden"
                >
                  <span className="text-[12px] shrink-0">{catIcon}</span>
                  <span style={{ color: catColor }} className="font-semibold text-[14px] tracking-wide shrink-0 whitespace-nowrap">
                    {catName}
                  </span>
                  <span className="text-[12px] text-zinc-300 font-normal shrink-0 whitespace-nowrap font-mono tabular-nums text-right">
                    ({countText})
                  </span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={sortOrder}
                    onChange={(e) => handleSortChange(catName, e.target.value)}
                    className="bg-[#27272A] text-zinc-200 text-[11px] font-normal px-1.5 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-[#FF5500] cursor-pointer"
                  >
                    <option value="default">更新順</option>
                    <option value="usage_desc">使用率順</option>
                    <option value="weight_desc">重い順</option>
                    <option value="weight_asc">軽い順</option>
                    <option value="price_desc">高値順</option>
                  </select>

                  {screenMode === 'edit' && (
                    <button
                      onClick={() => onToggleCategoryOpen(catName)}
                      style={{ color: catColor }}
                      className="text-[12px] font-normal cursor-pointer px-1"
                    >
                      {isOpen ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>

              {(isOpen || screenMode === 'packing' || screenMode === 'review') && (
                <div className="p-1.5 space-y-1 bg-[#121215]">
                  {categoryGears.length === 0 ? (
                    <p className="text-center text-zinc-600 py-3 text-[12px] font-normal">
                      このカテゴリーのギアはありません
                    </p>
                  ) : (
                    categoryGears.map((item) => (
                      <GearItemCard
                        key={item.id}
                        item={item}
                        catColor={catColor}
                        adoptionRate={getAdoptionRate(item.name)}
                        mode={screenMode}
                        isUnusedInReview={unusedGearIds.has(item.id)}
                        onTogglePacked={onTogglePacked}
                        onToggleSelected={onToggleSelected}
                        onToggleUnusedInReview={handleToggleUnused}
                        onUpdateGear={onUpdateGear}
                        onDeleteGear={onDeleteGear}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* レビュー完了ボタン */}
      {screenMode === 'review' && selectedGears.length > 0 && (
        <div className="pt-2">
          <button
            onClick={handleCompleteReview}
            disabled={isSubmittingReview}
            className="w-full py-3.5 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-[12px] cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSubmittingReview ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>パッキング精度を集計中...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>レビューを完了してスコアを見る</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* リザルトモーダル */}
      <ReviewResultModal
        result={reviewResultModal}
        isApplyingNext={isApplyingNext}
        onClose={() => {
          setReviewResultModal(null);
          handleModeChange('edit');
        }}
        onApplyNextPacking={handleApplyToNextPacking}
      />
    </section>
  );
}
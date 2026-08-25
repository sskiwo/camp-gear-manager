'use client';

import { useState, useEffect } from 'react';
import GearItemCard, { GearItem } from './GearItemCard';
import { CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

type Props = {
  gears: GearItem[];
  allCampsCount?: number;
  allGearsInUserAccount?: GearItem[];
  screenMode?: 'packing' | 'edit' | 'review';
  onScreenModeChange?: (mode: 'packing' | 'edit' | 'review') => void;
  unusedGearIds?: Set<string>;
  onToggleUnusedGear?: (id: string) => void;
  openCategories: Record<string, boolean>;
  onToggleCategoryOpen: (catName: string) => void;
  onTogglePacked: (id: string, currentStatus: boolean) => void;
  onToggleSelected: (id: string, currentStatus: boolean) => void;
  onUpdateQuantity: (id: string, currentQty: number, delta: number) => void;
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

const formatUnusedWeight = (grams: number): string => {
  if (grams >= 1000) {
    return `未使用: ${(grams / 1000).toFixed(2)}kg`;
  }
  return `未使用: ${Math.round(grams)}g`;
};

export default function GearList({
  gears,
  allCampsCount = 1,
  allGearsInUserAccount = [],
  screenMode: externalScreenMode,
  onScreenModeChange,
  unusedGearIds: externalUnusedGearIds,
  onToggleUnusedGear,
  openCategories,
  onToggleCategoryOpen,
  onTogglePacked,
  onToggleSelected,
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

  const [internalScreenMode, setInternalScreenMode] = useState<'packing' | 'edit' | 'review'>('packing');
  const screenMode = externalScreenMode !== undefined ? externalScreenMode : internalScreenMode;

  const handleModeChange = (mode: 'packing' | 'edit' | 'review') => {
    if (onScreenModeChange) {
      onScreenModeChange(mode);
    } else {
      setInternalScreenMode(mode);
    }
  };

  const [internalUnusedGearIds, setInternalUnusedGearIds] = useState<Set<string>>(new Set());
  const unusedGearIds = externalUnusedGearIds !== undefined ? externalUnusedGearIds : internalUnusedGearIds;

  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewResultModal, setReviewResultModal] = useState<{
    unusedWeightGrams: number;
    unusedCount: number;
    totalCount: number;
  } | null>(null);

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
      let totalUnusedWeight = 0;
      let totalUnusedGearsCount = 0;

      for (const gear of selectedGears) {
        const isUnused = unusedGearIds.has(gear.id);
        const nextBrought = (gear.total_brought_count || 0) + 1;
        const nextUsed = (gear.total_used_count || 0) + (isUnused ? 0 : 1);

        if (isUnused) {
          totalUnusedWeight += (gear.weight || 0) * (gear.quantity || 1);
          totalUnusedGearsCount += 1;
        }

        await onUpdateGear(gear.id, {
          total_brought_count: nextBrought,
          total_used_count: nextUsed,
        });
      }

      setReviewResultModal({
        unusedWeightGrams: totalUnusedWeight,
        unusedCount: totalUnusedGearsCount,
        totalCount: selectedGears.length,
      });
    } catch (err) {
      console.error('振り返り更新エラー:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <section className="bg-[#18181B] p-4 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
      {/* リストヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <h2 className="text-[18px] font-bold text-zinc-100 flex items-center gap-1.5">
          {screenMode === 'packing'
            ? 'パッキングリスト'
            : screenMode === 'edit'
            ? `ギア選定 (${totalCount} / ${gears.length})`
            : `キャンプ振り返り (${selectedGears.length})`}
        </h2>

        {/* 画面横幅にフィットする3分割トグルバー */}
        <div className="grid grid-cols-3 gap-1 bg-[#09090B] p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => handleModeChange('packing')}
            className={`px-2 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap text-center ${
              screenMode === 'packing'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>☑️</span>
            <span>パッキング</span>
          </button>
          <button
            onClick={() => handleModeChange('edit')}
            className={`px-2 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap text-center ${
              screenMode === 'edit'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>✏️</span>
            <span>ギア編集</span>
          </button>
          <button
            onClick={() => handleModeChange('review')}
            className={`px-2 py-1.5 rounded-lg text-[12px] font-bold transition cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap text-center ${
              screenMode === 'review'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>⛺</span>
            <span>振り返り</span>
          </button>
        </div>
      </div>

      {/* 🎯 振り返りモード時のガイダンスカード（文言更新） */}
      {screenMode === 'review' && (
        <div className="bg-amber-950/30 border border-amber-800/60 p-3.5 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[12px] font-bold text-amber-300">
              キャンプお疲れ様でした！持参ギアを振り返りましょう
            </span>
          </div>
          <p className="text-[12px] text-zinc-300 leading-relaxed font-normal">
            持っていったが<strong className="text-amber-400 font-bold">「使わなかった（未使用）」ギアのチェック（✅）をタップして外してください</strong>。完了すると次回の軽量化データに反映されます。
          </p>
        </div>
      )}

      {/* パッキング進捗カード */}
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
                    ? 'bg-[#FF5500] text-white border-[#FF5500] font-bold'
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
              className="bg-[#FF5500] h-2.5 rounded-full transition-all duration-300 shadow-sm"
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
              <div
                style={{ backgroundColor: '#18181B', borderColor: `${catColor}40` }}
                className="sticky top-0 z-10 w-full flex items-center justify-between px-3 sm:px-4 py-2 border-b backdrop-blur-md gap-2"
              >
                <button
                  onClick={() => onToggleCategoryOpen(catName)}
                  className="flex items-center gap-1.5 sm:gap-2 text-left cursor-pointer flex-1 min-w-0"
                >
                  <span className="text-[12px] shrink-0">{catIcon}</span>
                  <span style={{ color: catColor }} className="font-semibold text-[14px] tracking-wide truncate">
                    {catName}
                  </span>
                  <span className="text-[12px] text-zinc-300 font-normal shrink-0 font-mono tabular-nums text-right">
                    ({countText})
                  </span>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={sortOrder}
                    onChange={(e) => handleSortChange(catName, e.target.value)}
                    className="bg-[#27272A] text-zinc-200 text-[12px] font-normal px-1.5 sm:px-2 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-[#FF5500] cursor-pointer"
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
                      className="text-[12px] font-normal cursor-pointer pl-0.5"
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

      {/* 振り返り完了ボタン */}
      {screenMode === 'review' && selectedGears.length > 0 && (
        <div className="pt-2">
          <button
            onClick={handleCompleteReview}
            disabled={isSubmittingReview}
            className="w-full py-3.5 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-[12px] cursor-pointer disabled:opacity-50"
          >
            {isSubmittingReview ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>振り返りを集計中...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>振り返りを完了する</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 振り返り結果モーダル */}
      {reviewResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#18181B] border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 text-zinc-100">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-800/80 rounded-full flex items-center justify-center mx-auto text-2xl">
                ⛺
              </div>
              <h3 className="font-semibold text-[14px] text-white">振り返りが完了しました！</h3>
              <p className="text-[12px] text-zinc-400 font-normal">ギアの稼働実績データが更新されました。</p>
            </div>

            <div className="bg-[#27272A]/70 p-3.5 rounded-xl border border-zinc-700/60 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-normal">持参ギア総数:</span>
                <span className="font-mono tabular-nums text-right font-normal text-white">{reviewResultModal.totalCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-normal">使わなかったギア:</span>
                <span className="font-mono tabular-nums text-right font-bold text-amber-400">{reviewResultModal.unusedCount}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-700/60">
                <span className="text-zinc-300 font-normal">今回の未使用重量:</span>
                <span className="font-mono tabular-nums text-right font-bold text-[#FF5500] text-[14px]">
                  {formatUnusedWeight(reviewResultModal.unusedWeightGrams)}
                </span>
              </div>
            </div>

            <p className="text-[12px] text-zinc-400 leading-relaxed text-center font-normal">
              使わなかったギアはお留守番候補（低稼働バッジ）として次回以降の軽量化に役立ちます！
            </p>

            <button
              onClick={() => {
                setReviewResultModal(null);
                handleModeChange('edit');
              }}
              className="w-full py-2.5 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl text-[12px] transition cursor-pointer shadow"
            >
              ギア一覧（編集モード）に戻る
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
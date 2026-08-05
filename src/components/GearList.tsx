'use client';

import { useState } from 'react';
import GearItemCard from './GearItemCard';

type GearItem = {
  id: string;
  name: string;
  brand?: string;
  model_number?: string;
  product_name?: string;
  category?: string;
  weight: number;
  price: number;
  quantity?: number;
  is_packed: boolean;
  is_selected?: boolean;
  is_consumable: boolean;
  product_url?: string;
  storage_location?: string;
  purchase_date?: string;
  fuel_type?: string;
  memo?: string;
};

type Props = {
  gears: GearItem[];
  allCampsCount?: number;
  allGearsInUserAccount?: GearItem[];
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
  ベース: '#FF5500',
  調理: '#FFB800',
  衣類: '#00E5FF',
  その他: '#E040FB',
  消耗品: '#00E676',
};

const normalizeCategory = (gearCategory?: string, isConsumable?: boolean): 'ベース' | '調理' | '衣類' | 'その他' | '消耗品' => {
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
  openCategories,
  onToggleCategoryOpen,
  onTogglePacked,
  onToggleSelected,
  onUpdateQuantity,
  onUpdateGear,
  onDeleteGear,
  onDeleteAllGears,
  onResetAllPacked,
}: Props) {
  const [sortOrders, setSortOrders] = useState<Record<string, string>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'unpacked'>('all');

  const [screenMode, setScreenMode] = useState<'packing' | 'edit'>('packing');

  const selectedGears = gears.filter((g) => g.is_selected !== false);
  const packedCount = selectedGears.filter((g) => g.is_packed).length;
  const totalCount = selectedGears.length;

  const filteredGears =
    filterMode === 'unpacked'
      ? gears.filter((g) => g.is_selected !== false && !g.is_packed)
      : gears;

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

  return (
    <section className="bg-[#18181B] p-4 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
      {/* リストヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-1.5">
          {screenMode === 'packing'
            ? '🎒 パッキングリスト'
            : `ギア選定 (${totalCount} / ${gears.length}点)`}
        </h2>

        {/* モード切替トグル */}
        <div className="flex items-center bg-[#09090B] p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setScreenMode('packing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              screenMode === 'packing'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ☑️ パッキング
          </button>
          <button
            onClick={() => setScreenMode('edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              screenMode === 'edit'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ✏️ ギア編集
          </button>
        </div>
      </div>

      {/* パッキング進捗カード */}
      {screenMode === 'packing' && totalCount > 0 && (
        <div className="bg-[#27272A]/80 p-3.5 rounded-2xl border border-zinc-700/70 space-y-2 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">
                パッキング済み:
              </span>
              <span className="text-sm font-black text-white font-mono">
                {packedCount} / {totalCount} 点
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterMode(filterMode === 'all' ? 'unpacked' : 'all')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  filterMode === 'unpacked'
                    ? 'bg-[#FF5500] text-white border-[#FF5500] font-extrabold'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                }`}
              >
                {filterMode === 'unpacked' ? '全て表示' : '未チェックのみ'}
              </button>

              {onResetAllPacked && (
                <button
                  onClick={onResetAllPacked}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-[#EF4444]/60 text-white hover:bg-[#EF4444]/20 transition cursor-pointer"
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
        <p className="text-center text-zinc-500 py-6 font-medium bg-[#27272A]/50 rounded-xl border border-zinc-800 text-xs">
          ギアや食料がまだ登録されていません。
        </p>
      ) : filterMode === 'unpacked' && filteredGears.length === 0 ? (
        <div className="bg-emerald-950/30 border border-emerald-800/60 p-6 rounded-2xl text-center space-y-2">
          {/* ★ 「本日の」を削除 */}
          <p className="text-base font-black text-[#10B981]">🎉 パッキング準備がすべて完了しました！</p>
          <p className="text-xs text-zinc-400">持っていく予定のギアはすべてザックに入っています。行ってらっしゃい！⛺✨</p>
        </div>
      ) : (
        CATEGORIES.map((catName) => {
          let categoryGears = filteredGears.filter((g) => normalizeCategory(g.category, g.is_consumable) === catName);
          if (categoryGears.length === 0) return null;

          // ★ カテゴリーごとの持参対象数・チェック済み数を算出
          const catAllGears = gears.filter((g) => normalizeCategory(g.category, g.is_consumable) === catName);
          const catSelectedGears = catAllGears.filter((g) => g.is_selected !== false);
          const catPackedCount = catSelectedGears.filter((g) => g.is_packed).length;
          const catSelectedCount = catSelectedGears.length;

          const sortOrder = sortOrders[catName] || 'default';
          if (sortOrder === 'weight_desc') {
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
          } else if (sortOrder === 'name_asc') {
            categoryGears = [...categoryGears].sort(
              (a, b) => (a.name || '').localeCompare(b.name || '', 'ja')
            );
          }

          const catColor = CATEGORY_COLORS[catName as keyof typeof CATEGORY_COLORS] || '#FF5500';
          const isOpen = screenMode === 'packing' ? true : openCategories[catName] !== false;

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
                className="sticky top-0 z-10 w-full flex items-center justify-between px-4 py-2 border-b backdrop-blur-md"
              >
                <button
                  onClick={() => onToggleCategoryOpen(catName)}
                  className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0"
                >
                  <span className="text-sm">{catIcon}</span>
                  <span style={{ color: catColor }} className="font-extrabold text-xs sm:text-sm tracking-wide truncate">
                    {catName}
                  </span>
                  {/* ★ パッキングモード時は (チェック済数/持参数点) を表示 */}
                  <span className="text-[11px] text-zinc-400 font-normal shrink-0">
                    {screenMode === 'packing'
                      ? `(${catPackedCount}/${catSelectedCount}点)`
                      : `(${categoryGears.length}点)`}
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrders((prev) => ({ ...prev, [catName]: e.target.value }))
                    }
                    className="bg-[#27272A] text-zinc-200 text-[10px] font-bold px-2 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-[#FF5500] cursor-pointer"
                  >
                    <option value="default">更新順</option>
                    <option value="weight_desc">重い順</option>
                    <option value="weight_asc">軽い順</option>
                    <option value="price_desc">高値順</option>
                    <option value="name_asc">名前順</option>
                  </select>

                  {screenMode === 'edit' && (
                    <button
                      onClick={() => onToggleCategoryOpen(catName)}
                      style={{ color: catColor }}
                      className="text-xs font-bold cursor-pointer pl-1"
                    >
                      {isOpen ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="p-1.5 space-y-1 bg-[#121215]">
                  {categoryGears.map((item) => (
                    <GearItemCard
                      key={item.id}
                      item={item}
                      catColor={catColor}
                      adoptionRate={getAdoptionRate(item.name)}
                      mode={screenMode}
                      onTogglePacked={onTogglePacked}
                      onToggleSelected={onToggleSelected}
                      onUpdateQuantity={onUpdateQuantity}
                      onUpdateGear={onUpdateGear}
                      onDeleteGear={onDeleteGear}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
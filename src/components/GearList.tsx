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

// ★ 短縮カテゴリー定義
const CATEGORIES = [
  'ベース',
  '調理',
  '衣類',
  'その他',
  '消耗品',
];

const CATEGORY_COLORS = {
  ベース: '#FF5500',
  調理: '#FFB800',
  衣類: '#00E5FF',
  その他: '#E040FB',
  消耗品: '#00E676',
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
  onReorderGears,
}: Props) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [sortOrders, setSortOrders] = useState<Record<string, 'default' | 'desc' | 'asc'>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'unpacked'>('all');

  const [screenMode, setScreenMode] = useState<'packing' | 'edit'>('packing');

  const toggleSortOrder = (catName: string) => {
    setSortOrders((prev) => {
      const current = prev[catName] || 'default';
      const next = current === 'default' ? 'desc' : current === 'desc' ? 'asc' : 'default';
      return { ...prev, [catName]: next };
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetId: string, categoryGears: GearItem[]) => {
    if (!draggedItemId || draggedItemId === targetId) return;

    const dragIndex = categoryGears.findIndex((g) => g.id === draggedItemId);
    const dropIndex = categoryGears.findIndex((g) => g.id === targetId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newCatGears = [...categoryGears];
    const [removed] = newCatGears.splice(dragIndex, 1);
    newCatGears.splice(dropIndex, 0, removed);

    const otherGears = gears.filter((g) => !categoryGears.some((cg) => cg.id === g.id));
    const reorderedAll = [...otherGears, ...newCatGears];

    if (onReorderGears) {
      onReorderGears(reorderedAll);
    }
    setDraggedItemId(null);
  };

  const selectedGears = gears.filter((g) => g.is_selected !== false);
  const packedCount = selectedGears.filter((g) => g.is_packed).length;
  const totalCount = selectedGears.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

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

  // 旧名カテゴリー互換マッチング関数
  const matchesCategory = (gearCategory: string | undefined, catName: string) => {
    const cat = gearCategory || 'ベース';
    if (catName === 'ベース') return cat === 'ベース' || cat === 'ベースギア';
    if (catName === '調理') return cat === '調理' || cat === '調理ギア';
    if (catName === '衣類') return cat === '衣類';
    if (catName === 'その他') return cat === 'その他' || cat === 'その他・日用品';
    if (catName === '消耗品') return cat === '消耗品' || cat === '食料・消耗品';
    return cat === catName;
  };

  return (
    <section className="bg-[#18181B] p-4 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
      {/* モード切替トグル */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            🎒 パッキングリスト
          </h2>
          <span className="text-xs text-zinc-400 font-normal">({gears.length}件)</span>
        </div>

        <div className="flex items-center bg-[#09090B] p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setScreenMode('packing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              screenMode === 'packing'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🎒 パッキング
          </button>
          <button
            onClick={() => setScreenMode('edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              screenMode === 'edit'
                ? 'bg-[#FFB800] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ✏️ 編集・整理
          </button>
        </div>
      </div>

      {/* 進捗プログレスバー */}
      {totalCount > 0 && (
        <div className="bg-[#27272A]/80 p-3.5 rounded-2xl border border-zinc-700/70 space-y-2 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white flex items-center gap-1.5">
                🎒 当日完了率:
              </span>
              <span className="text-sm font-black text-[#00E676] font-mono">
                {packedCount} / {totalCount} 点 ({progressPercent}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterMode(filterMode === 'all' ? 'unpacked' : 'all')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  filterMode === 'unpacked'
                    ? 'bg-amber-500 text-black border-amber-400 font-extrabold'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                }`}
              >
                {filterMode === 'unpacked' ? '👁️ 全て表示' : `⚠️ 未完了のみ (${totalCount - packedCount}点)`}
              </button>

              {onResetAllPacked && (
                <button
                  onClick={onResetAllPacked}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer"
                  title="当日のパッキング開始！チェックのみを外して0%にします"
                >
                  🔄 全解除
                </button>
              )}
            </div>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700">
            <div
              className="bg-[#00E676] h-2.5 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercent}%` }}
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
          <p className="text-base font-black text-[#00E676]">🎉 本日のパッキング準備がすべて完了しました！</p>
          <p className="text-xs text-zinc-400">持っていく予定のギアはすべてザックに入っています。行ってらっしゃい！⛺✨</p>
        </div>
      ) : (
        CATEGORIES.map((catName) => {
          let categoryGears = filteredGears.filter((g) => matchesCategory(g.category, catName));
          if (categoryGears.length === 0) return null;

          const sortOrder = sortOrders[catName] || 'default';
          if (sortOrder === 'desc') {
            categoryGears = [...categoryGears].sort(
              (a, b) => (b.weight || 0) * (b.quantity || 1) - (a.weight || 0) * (a.quantity || 1)
            );
          } else if (sortOrder === 'asc') {
            categoryGears = [...categoryGears].sort(
              (a, b) => (a.weight || 0) * (a.quantity || 1) - (b.weight || 0) * (b.quantity || 1)
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
                  <span className="text-[11px] text-zinc-400 font-normal shrink-0">({categoryGears.length}件)</span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleSortOrder(catName)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    ⚖️ {sortOrder === 'default' ? '登録順' : sortOrder === 'desc' ? '重い順' : '軽い順'}
                  </button>

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
                      isDragging={draggedItemId === item.id}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={(targetId) => handleDrop(targetId, categoryGears)}
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
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
};

type Props = {
  gears: GearItem[];
  openCategories: Record<string, boolean>;
  onToggleCategoryOpen: (catName: string) => void;
  onTogglePacked: (id: string, currentStatus: boolean) => void;
  onToggleSelected: (id: string, currentStatus: boolean) => void;
  onUpdateQuantity: (id: string, currentQty: number, delta: number) => void;
  onUpdateGear: (id: string, data: any) => Promise<void>;
  onDeleteGear: (id: string) => void;
  onDeleteAllGears?: () => void;
  onResetAllPacked?: () => void;
  onCheckAllPacked?: () => void;
  onReorderGears?: (reorderedGears: GearItem[]) => void;
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

export default function GearList({
  gears,
  openCategories,
  onToggleCategoryOpen,
  onTogglePacked,
  onToggleSelected,
  onUpdateQuantity,
  onUpdateGear,
  onDeleteGear,
  onDeleteAllGears,
  onResetAllPacked,
  onCheckAllPacked,
  onReorderGears,
}: Props) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [sortOrders, setSortOrders] = useState<Record<string, 'default' | 'desc' | 'asc'>>({});

  // フィルター状態 ('all' | 'unpacked')
  const [filterMode, setFilterMode] = useState<'all' | 'unpacked'>('all');

  const toggleSortOrder = (catName: string) => {
    setSortOrders((prev) => {
      const current = prev[catName] || 'default';
      const next = current === 'default' ? 'desc' : current === 'desc' ? 'asc' : 'default';
      return { ...prev, [catName]: next };
    });
  };

  const isAnyOpen = CATEGORIES.some((cat) => openCategories[cat] !== false);

  const handleToggleAll = () => {
    CATEGORIES.forEach((catName) => {
      const isOpen = openCategories[catName] !== false;
      if ((isAnyOpen && isOpen) || (!isAnyOpen && !isOpen)) {
        onToggleCategoryOpen(catName);
      }
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

  // 「持っていく」ギアのみに進捗計算を限定
  const selectedGears = gears.filter((g) => g.is_selected !== false);
  const packedCount = selectedGears.filter((g) => g.is_packed).length;
  const totalCount = selectedGears.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  // フィルター適用後のギアリスト
  const filteredGears =
    filterMode === 'unpacked'
      ? gears.filter((g) => g.is_selected !== false && !g.is_packed)
      : gears;

  return (
    <section className="bg-[#18181B] p-5 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
      {/* ヘッダーエリア */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          🎒 積載パッキングリスト
          <span className="text-xs text-zinc-400 font-normal">({gears.length}件)</span>
        </h2>

        {gears.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleAll}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-[#27272A] border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer"
            >
              {isAnyOpen ? '📁 たたむ' : '📂 展開'}
            </button>
            {onDeleteAllGears && (
              <button
                onClick={onDeleteAllGears}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 hover:text-white hover:bg-red-900/60 transition cursor-pointer"
                title="このキャンプのギアを全削除"
              >
                🗑️ 一括削除
              </button>
            )}
          </div>
        )}
      </div>

      {/* 🚀 パッキング準備・進捗プログレスバー */}
      {totalCount > 0 && (
        <div className="bg-[#27272A]/80 p-3.5 rounded-2xl border border-zinc-700/70 space-y-2 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white flex items-center gap-1.5">
                🎒 当日パッキング完了率:
              </span>
              <span className="text-sm font-black text-[#00E676] font-mono">
                {packedCount} / {totalCount} 点 ({progressPercent}%)
              </span>
            </div>

            {/* パッキング一括操作ボタン */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterMode(filterMode === 'all' ? 'unpacked' : 'all')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  filterMode === 'unpacked'
                    ? 'bg-amber-500 text-black border-amber-400 font-extrabold'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                }`}
              >
                {filterMode === 'unpacked' ? '👁️ 全て表示に戻す' : `⚠️ 未完了のみ表示 (${totalCount - packedCount}点)`}
              </button>

              {onResetAllPacked && (
                <button
                  onClick={onResetAllPacked}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer"
                  title="当日のパッキング開始！チェックのみを外して0%にします"
                >
                  🔄 パッキング全解除
                </button>
              )}

              {onCheckAllPacked && (
                <button
                  onClick={onCheckAllPacked}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-300 hover:text-white hover:bg-emerald-900 transition cursor-pointer"
                  title="「持っていく」ギアをすべてパッキング済みにします"
                >
                  ✅ 全完了
                </button>
              )}
            </div>
          </div>

          {/* ゲージバー */}
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
          let categoryGears = filteredGears.filter((g) => (g.category || 'ベースギア') === catName);
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
          const isOpen = openCategories[catName] !== false;

          const catIcon =
            catName === 'ベースギア'
              ? '⛺'
              : catName === '調理ギア'
              ? '🍳'
              : catName === '衣類'
              ? '👕'
              : catName === 'その他・日用品'
              ? '📦'
              : '🍱';

          return (
            <div key={catName} id={`category-${catName}`} className="border rounded-xl overflow-hidden shadow-md scroll-mt-6" style={{ borderColor: `${catColor}50` }}>
              <div
                style={{ backgroundColor: `${catColor}15`, borderColor: `${catColor}40` }}
                className="w-full flex items-center justify-between px-4 py-2.5 border-b"
              >
                <button
                  onClick={() => onToggleCategoryOpen(catName)}
                  className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0"
                >
                  <span className="text-base">{catIcon}</span>
                  <span style={{ color: catColor }} className="font-extrabold text-sm tracking-wide truncate">{catName}</span>
                  <span className="text-xs text-zinc-400 font-normal shrink-0">({categoryGears.length}件)</span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleSortOrder(catName)}
                    className="text-[11px] font-bold px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                  >
                    ⚖️ {sortOrder === 'default' ? '登録順' : sortOrder === 'desc' ? '重い順' : '軽い順'}
                  </button>

                  <button
                    onClick={() => onToggleCategoryOpen(catName)}
                    style={{ color: catColor }}
                    className="text-xs font-bold cursor-pointer pl-1"
                  >
                    {isOpen ? '▲ 閉じる' : '▼ 開く'}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="p-2 space-y-2 bg-[#121215]">
                  {categoryGears.map((item) => (
                    <GearItemCard
                      key={item.id}
                      item={item}
                      catColor={catColor}
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
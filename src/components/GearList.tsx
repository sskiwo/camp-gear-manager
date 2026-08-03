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
  is_consumable: boolean;
  product_url?: string;
};

type Props = {
  gears: GearItem[];
  openCategories: Record<string, boolean>;
  onToggleCategoryOpen: (catName: string) => void;
  onTogglePacked: (id: string, currentStatus: boolean) => void;
  onUpdateQuantity: (id: string, currentQty: number, delta: number) => void;
  onUpdateGear: (id: string, data: any) => Promise<void>;
  onDeleteGear: (id: string) => void;
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
  onUpdateQuantity,
  onUpdateGear,
  onDeleteGear,
  onReorderGears,
}: Props) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // カテゴリーごとのソート順 ('default' | 'desc' | 'asc')
  const [sortOrders, setSortOrders] = useState<Record<string, 'default' | 'desc' | 'asc'>>({});

  const toggleSortOrder = (catName: string) => {
    setSortOrders((prev) => {
      const current = prev[catName] || 'default';
      const next = current === 'default' ? 'desc' : current === 'desc' ? 'asc' : 'default';
      return { ...prev, [catName]: next };
    });
  };

  // 一括開閉機能
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

  return (
    <section className="bg-[#18181B] p-5 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          🎒 積載パッキングリスト
          <span className="text-xs text-zinc-400 font-normal">({gears.length}件)</span>
        </h2>

        {gears.length > 0 && (
          <button
            onClick={handleToggleAll}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#27272A] border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1"
          >
            {isAnyOpen ? '📁 すべてたたむ' : '📂 すべて展開'}
          </button>
        )}
      </div>

      {gears.length === 0 ? (
        <p className="text-center text-zinc-500 py-6 font-medium bg-[#27272A]/50 rounded-xl border border-zinc-800 text-xs">
          ギアや食料がまだ登録されていません。
        </p>
      ) : (
        CATEGORIES.map((catName) => {
          let categoryGears = gears.filter((g) => (g.category || 'ベースギア') === catName);
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
                  {catName === '食料・消耗品' && (
                    <span className="text-[10px] bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40 px-1.5 py-0.2 rounded font-normal shrink-0">
                      ※自動消費
                    </span>
                  )}
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
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
  '調理ギア・燃料',
  '衣類・防寒着',
  '食料・飲料',
  'その他・日用品',
];

const CATEGORY_COLORS = {
  ベースギア: '#FF5500',
  '調理ギア・燃料': '#FFB800',
  '衣類・防寒着': '#00E5FF',
  '食料・飲料': '#00E676',
  'その他・日用品': '#E040FB',
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
      <h2 className="text-lg font-extrabold text-white">🎒 積載パッキングリスト</h2>

      {gears.length === 0 ? (
        <p className="text-center text-zinc-500 py-6 font-medium bg-[#27272A]/50 rounded-xl border border-zinc-800 text-xs">
          ギアや食料がまだ登録されていません。
        </p>
      ) : (
        CATEGORIES.map((catName) => {
          const categoryGears = gears.filter((g) => (g.category || 'ベースギア') === catName);
          if (categoryGears.length === 0) return null;

          const catColor = CATEGORY_COLORS[catName as keyof typeof CATEGORY_COLORS] || '#FF5500';
          const isOpen = openCategories[catName] !== false;

          const catIcon =
            catName === 'ベースギア'
              ? '⛺'
              : catName === '調理ギア・燃料'
              ? '🍳'
              : catName === '衣類・防寒着'
              ? '👕'
              : catName === '食料・飲料'
              ? '🍱'
              : '📦';

          return (
            <div key={catName} id={`category-${catName}`} className="border rounded-xl overflow-hidden shadow-md scroll-mt-6" style={{ borderColor: `${catColor}50` }}>
              <button
                onClick={() => onToggleCategoryOpen(catName)}
                style={{ backgroundColor: `${catColor}15`, borderColor: `${catColor}40` }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left transition hover:brightness-125 border-b cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{catIcon}</span>
                  <span style={{ color: catColor }} className="font-extrabold text-sm tracking-wide">{catName}</span>
                  <span className="text-xs text-zinc-400 font-normal">({categoryGears.length}件)</span>
                </div>
                <span style={{ color: catColor }} className="text-xs font-bold">{isOpen ? '▲ 閉じる' : '▼ 開く'}</span>
              </button>

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
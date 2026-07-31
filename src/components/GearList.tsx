'use client';

import React, { useState } from 'react';
import GearItemCard from './GearItemCard';

type GearItem = {
  id: string;
  name: string;
  brand?: string;
  model_number?: string;
  weight: number;
  price: number;
  quantity: number;
  category: string;
  amazon_url?: string;
  source_url?: string;
  is_packed: boolean;
  is_consumable: boolean;
};

type Props = {
  gears: GearItem[];
  openCategory: string | null;
  onToggleCategory: (categoryId: string) => void;
  onTogglePacked: (id: string, current: boolean) => void;
  onQuantityChange: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<GearItem>) => void;
};

const CATEGORIES = [
  { id: 'base', name: 'ベースギア', icon: '⛺', color: '#FF5500' },
  { id: 'cook', name: '調理ギア・燃料', icon: '🍳', color: '#FFB800' },
  { id: 'wear', name: '衣類・防寒着', icon: '👕', color: '#00E5FF' },
  { id: 'other', name: 'その他・日用品', icon: '📦', color: '#E040FB' },
  { id: 'food', name: '食料・飲料', icon: '🍱', color: '#00E676' },
];

export default function GearList({
  gears,
  openCategory,
  onToggleCategory,
  onTogglePacked,
  onQuantityChange,
  onDelete,
  onUpdate,
}: Props) {
  const [closedCategories, setClosedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setClosedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl text-white">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-[#FF5500] flex items-center gap-2">
          🎒 積載パッキングリスト
        </h2>
        <span className="text-xs text-zinc-400 font-bold bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
          全 {gears.length} 件
        </span>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const catGears = gears.filter((g) => {
            if (cat.id === 'other') {
              return g.category === 'other' || !CATEGORIES.some((c) => c.id === g.category);
            }
            return g.category === cat.id;
          });

          const isClosed = closedCategories[cat.id];
          const isOpen = !isClosed || openCategory === cat.id;

          return (
            <div
              key={cat.id}
              id={`category-section-${cat.id}`}
              className="border border-zinc-800 rounded-xl overflow-hidden bg-[#1f1f23]"
            >
              <button
                onClick={() => {
                  toggleCategory(cat.id);
                  onToggleCategory(cat.id);
                }}
                className="w-full flex items-center justify-between p-3.5 bg-[#27272A] hover:bg-zinc-700/60 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="font-bold text-sm" style={{ color: cat.color }}>
                    {cat.name}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    ({catGears.length}件)
                  </span>
                </div>
                <span className="text-xs text-zinc-400 font-bold">
                  {isOpen ? '▲ 閉じる' : '▼ 開く'}
                </span>
              </button>

              {isOpen && (
                <div className="p-3 bg-[#18181B]">
                  {catGears.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-2 text-center">
                      このカテゴリーのギアはありません
                    </p>
                  ) : (
                    catGears.map((item) => (
                      <GearItemCard
                        key={item.id}
                        item={item}
                        categoryColor={cat.color}
                        onTogglePacked={onTogglePacked}
                        onQuantityChange={onQuantityChange}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
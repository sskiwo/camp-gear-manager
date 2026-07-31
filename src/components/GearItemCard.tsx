'use client';

import React, { useState } from 'react';
import ClearableInput from './ClearableInput';

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
  item: GearItem;
  categoryColor: string;
  onTogglePacked: (id: string, current: boolean) => void;
  onQuantityChange: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedData: Partial<GearItem>) => void;
};

const CATEGORIES = [
  { id: 'base', name: 'ベースギア', icon: '⛺' },
  { id: 'cook', name: '調理ギア・燃料', icon: '🍳' },
  { id: 'wear', name: '衣類・防寒着', icon: '👕' },
  { id: 'other', name: 'その他・日用品', icon: '📦' },
  { id: 'food', name: '食料・飲料', icon: '🍱' },
];

export default function GearItemCard({
  item,
  categoryColor,
  onTogglePacked,
  onQuantityChange,
  onDelete,
  onUpdate,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBrand, setEditBrand] = useState(item.brand || '');
  const [editModel, setEditModel] = useState(item.model_number || '');
  const [editName, setEditName] = useState(item.name || '');
  const [editWeight, setEditWeight] = useState(item.weight);
  const [editPrice, setEditPrice] = useState(item.price);
  const [editCategory, setEditCategory] = useState(item.category);
  const [editConsumable, setEditConsumable] = useState(item.is_consumable || false);
  const [editAmazonUrl, setEditAmazonUrl] = useState(item.amazon_url || '');

  const handleSave = () => {
    onUpdate(item.id, {
      brand: editBrand,
      model_number: editModel,
      name: editName,
      weight: editWeight,
      price: editPrice,
      category: editCategory,
      is_consumable: editConsumable,
      amazon_url: editAmazonUrl,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-[#27272A] p-3 rounded-xl border border-zinc-700/80 mb-2">
      {!isEditing ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <input
              type="checkbox"
              checked={item.is_packed}
              onChange={() => onTogglePacked(item.id, item.is_packed)}
              className="w-4 h-4 rounded border-zinc-600 text-[#FF5500] focus:ring-[#FF5500] bg-[#18181B] cursor-pointer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.brand && (
                  <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700 font-medium">
                    {item.brand}
                  </span>
                )}
                {item.model_number && (
                  <span className="text-[10px] font-mono text-[#FFB800] bg-[#FFB800]/10 px-1.5 py-0.2 rounded border border-[#FFB800]/20">
                    型番: {item.model_number}
                  </span>
                )}
                {item.is_consumable && (
                  <span className="text-[10px] text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.2 rounded border border-[#00E676]/20 font-bold">
                    🔥 帰りに消費
                  </span>
                )}
              </div>
              <p
                className={`text-sm font-bold truncate ${
                  item.is_packed ? 'text-white' : 'text-zinc-500 line-through'
                }`}
              >
                {item.name}
              </p>
              <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-0.5">
                <span>{(item.weight * item.quantity).toLocaleString()}g</span>
                <span>¥{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-[#18181B] rounded-lg border border-zinc-700 px-1 py-0.5">
              <button
                onClick={() => onQuantityChange(item.id, -1)}
                className="w-5 h-5 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-xs"
              >
                -
              </button>
              <span className="w-5 text-center text-xs font-mono font-bold text-white">
                {item.quantity}
              </span>
              <button
                onClick={() => onQuantityChange(item.id, 1)}
                className="w-5 h-5 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-zinc-400 hover:text-white bg-zinc-800 p-1.5 rounded-lg border border-zinc-700"
              title="編集"
            >
              ✏️
            </button>

            <button
              onClick={() => onDelete(item.id)}
              className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 p-1.5 rounded-lg border border-red-500/20"
              title="削除"
            >
              🗑️
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400">メーカー名</label>
              <ClearableInput
                value={editBrand}
                onChange={setEditBrand}
                placeholder="例: SOTO"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400">型番</label>
              <ClearableInput
                value={editModel}
                onChange={setEditModel}
                placeholder="例: ST-310"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400">商品名</label>
            <ClearableInput
              value={editName}
              onChange={setEditName}
              placeholder="商品名を入力"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400">重量 (g) [10g刻み]</label>
              <input
                type="number"
                step="10"
                value={editWeight}
                onChange={(e) => setEditWeight(parseInt(e.target.value) || 0)}
                className="w-full bg-[#18181B] text-white px-2 py-1 rounded border border-zinc-700 font-mono text-xs focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400">価格 (円) [100円刻み]</label>
              <input
                type="number"
                step="100"
                value={editPrice}
                onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-[#18181B] text-white px-2 py-1 rounded border border-zinc-700 font-mono text-xs focus:outline-none focus:border-[#FF5500]"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400">カテゴリー</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full bg-[#18181B] text-white px-1.5 py-1 rounded border border-zinc-700 text-xs focus:outline-none focus:border-[#FF5500]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id={`edit-consumable-${item.id}`}
              checked={editConsumable}
              onChange={(e) => setEditConsumable(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 text-[#00E676] focus:ring-[#00E676] bg-[#18181B] cursor-pointer"
            />
            <label
              htmlFor={`edit-consumable-${item.id}`}
              className="text-xs text-[#00E676] font-bold cursor-pointer select-none"
            >
              🔥 帰りに消費する品 (食品・飲料・ガソリン等)
            </label>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400">Amazon特定商品URL</label>
            <ClearableInput
              value={editAmazonUrl}
              onChange={setEditAmazonUrl}
              placeholder="https://www.amazon.co.jp/..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1 rounded text-xs font-bold"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="bg-[#00E676] hover:bg-[#00c865] text-black px-3 py-1 rounded text-xs font-bold"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
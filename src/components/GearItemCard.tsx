'use client';

import { useState } from 'react';

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
  item: GearItem;
  catColor: string;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
  onTogglePacked: (id: string, currentStatus: boolean) => void;
  onUpdateQuantity: (id: string, currentQty: number, delta: number) => void;
  onUpdateGear: (id: string, data: any) => Promise<void>;
  onDeleteGear: (id: string) => void;
};

const CATEGORIES = [
  'ベースギア',
  '調理ギア・燃料',
  '衣類・防寒着',
  '食料・飲料',
  'その他・日用品',
];

export default function GearItemCard({
  item,
  catColor,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onTogglePacked,
  onUpdateQuantity,
  onUpdateGear,
  onDeleteGear,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBrand, setEditBrand] = useState(item.brand || '');
  const [editModelNumber, setEditModelNumber] = useState(item.model_number || '');
  const [editProductName, setEditProductName] = useState(item.product_name || item.name || '');
  const [editCategory, setEditCategory] = useState(item.category || 'ベースギア');
  const [editWeight, setEditWeight] = useState(String(item.weight || 0));
  const [editPrice, setEditPrice] = useState(String(item.price || 0));
  const [editQuantity, setEditQuantity] = useState(String(item.quantity || 1));
  const [editIsConsumable, setEditIsConsumable] = useState(item.is_consumable);
  const [editProductUrl, setEditProductUrl] = useState(item.product_url || '');

  const handleSave = async () => {
    const fullName = `${editBrand} ${editProductName} ${editModelNumber}`.trim();
    const defaultSearchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(fullName || editProductName)}`;
    const finalUrl = editProductUrl.trim() ? editProductUrl.trim() : defaultSearchUrl;

    await onUpdateGear(item.id, {
      name: fullName || editProductName,
      brand: editBrand,
      model_number: editModelNumber,
      product_name: editProductName,
      category: editCategory,
      weight: Number(editWeight) || 0,
      price: Number(editPrice) || 0,
      quantity: Math.max(1, Number(editQuantity) || 1),
      is_consumable: editIsConsumable,
      product_url: finalUrl,
    });
    setIsEditing(false);
  };

  const qty = item.quantity || 1;
  const totalWeight = (item.weight || 0) * qty;
  const totalPrice = (item.price || 0) * qty;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(item.id)}
      className={`p-2.5 rounded-lg border text-xs transition select-none ${
        isDragging ? 'opacity-30 border-[#FF5500] bg-zinc-800' : ''
      } ${
        item.is_packed
          ? 'bg-[#27272A] border-zinc-700/80 hover:border-zinc-500'
          : 'bg-zinc-900/50 opacity-40 border-transparent'
      }`}
    >
      {isEditing ? (
        /* ✏️ 編集モード */
        <div className="space-y-2">
          {/* メーカー名・型番・商品名 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {/* メーカー名 */}
            <div className="relative">
              <input
                type="text"
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                className="w-full pl-2 pr-6 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
                placeholder="メーカー名"
              />
              {editBrand && (
                <button
                  type="button"
                  onClick={() => setEditBrand('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-[10px] font-bold p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 型番 */}
            <div className="relative">
              <input
                type="text"
                value={editModelNumber}
                onChange={(e) => setEditModelNumber(e.target.value)}
                className="w-full pl-2 pr-6 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
                placeholder="型番"
              />
              {editModelNumber && (
                <button
                  type="button"
                  onClick={() => setEditModelNumber('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-[10px] font-bold p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 商品名 */}
            <div className="relative">
              <input
                type="text"
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                className="w-full pl-2 pr-6 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
                placeholder="商品名"
              />
              {editProductName && (
                <button
                  type="button"
                  onClick={() => setEditProductName('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-[10px] font-bold p-0.5"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* カテゴリー・重量(10g単位)・価格(100円単位)・数量 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs font-bold"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* ⚖️ 重量 (10g単位) */}
            <input
              type="number"
              step="10"
              min="0"
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
              className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
              placeholder="重量(g)"
            />

            {/* 💴 価格 (100円単位) */}
            <input
              type="number"
              step="100"
              min="0"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
              placeholder="価格(円)"
            />

            {/* 数量 */}
            <input
              type="number"
              step="1"
              min="1"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
              placeholder="数量"
            />
          </div>

          {/* Amazon特定商品URL */}
          <div className="relative">
            <input
              type="text"
              value={editProductUrl}
              onChange={(e) => setEditProductUrl(e.target.value)}
              className="w-full pl-2 pr-6 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs font-mono"
              placeholder="Amazon特定商品URL"
            />
            {editProductUrl && (
              <button
                type="button"
                onClick={() => setEditProductUrl('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-[10px] font-bold p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1 text-[11px] text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editIsConsumable}
                onChange={(e) => setEditIsConsumable(e.target.checked)}
                className="w-3 h-3 accent-[#FF5500]"
              />
              🔥 消費物
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-[#FF5500] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-[#E04B00]"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded text-[11px] font-bold"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 📋 通常表示 */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
            <span
              className="text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing font-bold text-sm tracking-tighter shrink-0 px-0.5"
              title="ドラッグして並び替え"
            >
              ⋮⋮
            </span>

            <input
              type="checkbox"
              checked={item.is_packed}
              onChange={() => onTogglePacked(item.id, item.is_packed)}
              className="w-4 h-4 mt-0.5 sm:mt-0 accent-[#FF5500] cursor-pointer"
            />
            <div className="
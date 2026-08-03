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
  '調理ギア',
  '衣類',
  'その他・日用品',
  '食料・消耗品',
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
  const [editProductUrl, setEditProductUrl] = useState(item.product_url || '');

  const startEdit = () => {
    setIsEditing(true);
    setEditBrand(item.brand || '');
    setEditModelNumber(item.model_number || '');
    setEditProductName(item.product_name || item.name || '');
    setEditCategory(item.category || 'ベースギア');
    setEditWeight(String(item.weight || 0));
    setEditPrice(String(item.price || 0));
    setEditQuantity(String(item.quantity || 1));
    setEditProductUrl(item.product_url || '');
  };

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
      is_consumable: editCategory === '食料・消耗品',
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
      className={`p-3 rounded-xl border text-xs transition select-none ${
        isDragging ? 'opacity-30 border-[#FF5500] bg-zinc-800' : ''
      } ${
        item.is_packed
          ? 'bg-[#27272A] border-zinc-700/80 hover:border-zinc-500'
          : 'bg-zinc-900/50 opacity-40 border-transparent'
      }`}
    >
      {isEditing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <input
              type="text"
              value={editBrand}
              onChange={(e) => setEditBrand(e.target.value)}
              className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
              placeholder="メーカー名"
            />
            <input
              type="text"
              value={editModelNumber}
              onChange={(e) => setEditModelNumber(e.target.value)}
              className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
              placeholder="型番"
            />
            <input
              type="text"
              value={editProductName}
              onChange={(e) => setEditProductName(e.target.value)}
              className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
              placeholder="商品名"
            />
          </div>
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
            <input
              type="number"
              step="10"
              min="0"
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
              className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
              placeholder="重量(g)"
            />
            <input
              type="number"
              step="100"
              min="0"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs"
              placeholder="価格(円)"
            />
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
          <div>
            <input
              type="text"
              value={editProductUrl}
              onChange={(e) => setEditProductUrl(e.target.value)}
              className="w-full px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs font-mono"
              placeholder="Amazon特定商品URL"
            />
          </div>
          <div className="flex items-center justify-end pt-1 gap-2">
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
      ) : (
        <div className="space-y-2">
          {/* 【上段：情報 ＆ 編集・削除アクション】 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
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
                className="w-4 h-4 accent-[#FF5500] cursor-pointer shrink-0"
              />
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {item.brand && (
                  <span
                    style={{ color: catColor, borderColor: `${catColor}60`, backgroundColor: `${catColor}20` }}
                    className="text-[10px] px-1.5 py-0.2 rounded font-bold border shrink-0"
                  >
                    {item.brand}
                  </span>
                )}
                <span className="font-bold text-xs text-white truncate">{item.product_name || item.name}</span>
                {item.model_number && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1 py-0.2 rounded font-mono shrink-0">
                    [{item.model_number}]
                  </span>
                )}
              </div>
            </div>

            {/* 編集・削除ボタン（誤タップ防止の余白を保持） */}
            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
              <button
                onClick={startEdit}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
                title="編集"
              >
                ✏️
              </button>
              <button
                onClick={() => onDeleteGear(item.id)}
                className="p-1 text-zinc-400 hover:text-[#FF5500] rounded hover:bg-zinc-800 transition"
                title="削除"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* 【下段：数値 ＆ 数量操作・Amazonリンク】 */}
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-zinc-800/80 text-[11px] pl-6">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200">
                {totalWeight.toLocaleString()}g
              </span>
              <span className="text-zinc-600">|</span>
              <span className="font-semibold text-zinc-200">
                ¥{totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded overflow-hidden">
                <button
                  onClick={() => onUpdateQuantity(item.id, qty, -1)}
                  className="px-2 py-0.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600"
                >
                  -
                </button>
                <span className="px-1.5 font-bold text-[#FF5500] text-[11px] min-w-[20px] text-center">{qty}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, qty, 1)}
                  className="px-2 py-0.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600"
                >
                  +
                </button>
              </div>

              {item.product_url && (
                <a
                  href={item.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FFB800] hover:underline font-bold px-1 py-0.5 rounded hover:bg-zinc-800 transition"
                  title="Amazonで購入・詳細を見る"
                >
                  🛒
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
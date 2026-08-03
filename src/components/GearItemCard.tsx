'use client';

import React, { useState } from 'react';
import ClearableInput from './ClearableInput';

export type GearItem = {
  id: string;
  name: string;
  maker_name?: string;
  model_number?: string;
  product_name?: string;
  weight: number;
  price: number;
  quantity: number;
  category: string;
  is_consumable: boolean;
  product_url?: string;
};

type GearItemCardProps = {
  item: GearItem;
  onUpdate: (updatedItem: GearItem) => void;
  onDelete: (id: string) => void;
};

export default function GearItemCard({ item, onUpdate, onDelete }: GearItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<GearItem>(item);

  const handleSave = () => {
    onUpdate(editForm);
    setIsEditing(false);
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, (item.quantity || 1) + delta);
    onUpdate({ ...item, quantity: newQty });
  };

  const amazonSearchUrl = item.product_url
    ? item.product_url
    : `https://www.amazon.co.jp/s?k=${encodeURIComponent(item.name)}`;

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-xl border border-[#E0DED3] shadow-sm space-y-3">
        <div className="flex justify-between items-center border-b border-[#E0DED3] pb-2">
          <span className="font-bold text-sm text-[#333333]">✏️ ギア情報の編集</span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#384F41] text-white font-medium hover:bg-[#2c3e33] transition"
            >
              保存
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ClearableInput
            label="メーカー名"
            value={editForm.maker_name || ''}
            onChange={(val) => setEditForm({ ...editForm, maker_name: val })}
            placeholder="例: SOTO"
          />
          <ClearableInput
            label="型番"
            value={editForm.model_number || ''}
            onChange={(val) => setEditForm({ ...editForm, model_number: val })}
            placeholder="例: ST-310"
          />
          <ClearableInput
            label="商品名"
            value={editForm.product_name || editForm.name}
            onChange={(val) => setEditForm({ ...editForm, product_name: val, name: val })}
            placeholder="例: レギュレーターストーブ"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">重量 (g)</label>
            <input
              type="number"
              step="10"
              value={editForm.weight}
              onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
              className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#384F41]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">価格 (円)</label>
            <input
              type="number"
              step="100"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
              className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#384F41]"
            />
          </div>
          <div className="col-span-2 md:col-span-1 flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2 text-sm text-[#333333]">
              <input
                type="checkbox"
                checked={editForm.is_consumable}
                onChange={(e) => setEditForm({ ...editForm, is_consumable: e.target.checked })}
                className="w-4 h-4 text-[#384F41] rounded focus:ring-[#384F41]"
              />
              🔥 帰りに消費する品
            </label>
          </div>
        </div>

        <ClearableInput
          label="Amazon商品URL (任意)"
          value={editForm.product_url || ''}
          onChange={(val) => setEditForm({ ...editForm, product_url: val })}
          placeholder="https://www.amazon.co.jp/dp/..."
        />
      </div>
    );
  }

  const totalWeight = item.weight * (item.quantity || 1);
  const totalPrice = item.price * (item.quantity || 1);

  return (
    <div className="bg-white p-3.5 rounded-xl border border-[#E0DED3] shadow-sm hover:border-[#BFA58A] transition space-y-2.5">
      {/* 【上段：情報行】 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-gray-400 cursor-grab active:cursor-grabbing select-none pt-0.5" title="並び替え">
            ⋮⋮
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {item.maker_name && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {item.maker_name}
                </span>
              )}
              {item.model_number && (
                <span className="text-xs font-mono font-medium text-[#384F41] bg-[#384F41]/10 px-1.5 py-0.5 rounded border border-[#384F41]/20">
                  型番: {item.model_number}
                </span>
              )}
            </div>
            <h4 className="font-bold text-sm text-[#333333] truncate mt-0.5">
              {item.product_name || item.name}
            </h4>
          </div>
        </div>

        {/* 右上の編集・削除ボタン（誤タップ防止のために余白を配置） */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-500 hover:text-[#384F41] hover:bg-gray-100 rounded-lg transition"
            title="編集"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="削除"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* 【下段：操作・数値行】 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-gray-100 text-xs text-gray-600">
        {/* 重量・価格表示 */}
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-sm font-semibold text-gray-800">{totalWeight.toLocaleString()}g</strong>
            {item.quantity > 1 && <span className="text-gray-400 ml-1">({item.weight}g×{item.quantity})</span>}
          </span>
          <span className="text-gray-300">|</span>
          <span>
            <strong className="text-sm font-semibold text-gray-800">¥{totalPrice.toLocaleString()}</strong>
            {item.quantity > 1 && <span className="text-gray-400 ml-1">(¥{item.price.toLocaleString()}×{item.quantity})</span>}
          </span>
        </div>

        {/* 数量操作 ＆ Amazonリンク */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded-l-lg transition font-bold"
            >
              -
            </button>
            <span className="px-2 py-1 font-semibold text-gray-700 min-w-[24px] text-center">
              {item.quantity || 1}
            </span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded-r-lg transition font-bold"
            >
              +
            </button>
          </div>

          <a
            href={amazonSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF9900]/10 text-[#CC7A00] hover:bg-[#FF9900]/20 font-medium transition text-xs"
          >
            🛒 Amazon
          </a>
        </div>
      </div>
    </div>
  );
}
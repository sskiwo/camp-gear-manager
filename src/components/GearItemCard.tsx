'use client';

import { useState } from 'react';

export type GearItem = {
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
  total_brought_count?: number;
  total_used_count?: number;
  is_emergency_gear?: boolean;
};

type Props = {
  item: GearItem;
  catColor?: string;
  adoptionRate?: string;
  mode?: 'packing' | 'edit' | 'review';
  isUnusedInReview?: boolean;
  onTogglePacked?: (id: string, currentStatus: boolean) => void;
  onToggleSelected?: (id: string, currentStatus: boolean) => void;
  onToggleUnusedInReview?: (id: string) => void;
  onUpdateQuantity?: (id: string, currentQty: number, delta: number) => void;
  onUpdateGear: (id: string, data: any) => Promise<void>;
  onDeleteGear?: (id: string) => void;
};

const CATEGORY_OPTIONS = ['ベース', '調理', '衣類', 'その他', '消耗品'];

const getBadgeStyle = (fuelType?: string) => {
  if (!fuelType || fuelType === '不要/なし') return null;

  const typeUpper = fuelType.toUpperCase();

  if (typeUpper.includes('CB') || typeUpper.includes('カセット')) {
    return { label: 'CB', className: 'bg-[#FF5500] text-white font-bold' };
  }
  if (typeUpper.includes('OD') || typeUpper.includes('アウトドア')) {
    return { label: 'OD', className: 'bg-[#EAB308] text-black font-bold' };
  }
  if (typeUpper.includes('WG') || typeUpper.includes('ガソリン')) {
    return { label: 'WG', className: 'bg-[#EF4444] text-white font-bold' };
  }
  if (fuelType.includes('灯油') || typeUpper.includes('KEROSENE')) {
    return { label: '灯油', className: 'bg-[#B45309] text-white font-bold' };
  }
  if (fuelType.includes('薪') || fuelType.includes('炭') || typeUpper.includes('WOOD')) {
    return { label: '薪炭', className: 'bg-[#52525B] text-white font-bold' };
  }
  if (typeUpper.includes('USB') || typeUpper.includes('充電')) {
    return { label: 'USB-C', className: 'bg-[#06B6D4] text-white font-bold' };
  }
  if (fuelType.includes('単3')) {
    return { label: '単3電池', className: 'bg-[#10B981] text-white font-bold' };
  }
  if (fuelType.includes('単4')) {
    return { label: '単4電池', className: 'bg-[#059669] text-white font-bold' };
  }
  if (typeUpper.includes('AC') || typeUpper.includes('コンセント')) {
    return { label: 'AC', className: 'bg-[#8B5CF6] text-white font-bold' };
  }

  return { label: fuelType, className: 'bg-zinc-800 text-zinc-300 border border-zinc-700' };
};

const getCleanItemName = (fullName: string, brandName?: string): string => {
  if (!brandName || !brandName.trim()) return fullName;
  const regex = new RegExp(`^${brandName.trim()}\\s*`, 'i');
  return fullName.replace(regex, '');
};

const formatWeight = (grams: number) => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)}kg`;
  }
  return `${Math.round(grams)}g`;
};

const FUEL_OPTIONS = [
  '不要/なし',
  'USB-C充電',
  '単3電池',
  '単4電池',
  'CB缶',
  'OD缶',
  'ホワイトガソリン',
  '灯油/ケロシン',
  '薪/炭',
  'ACコンセント',
  'その他',
];

export default function GearItemCard({
  item,
  mode = 'packing',
  isUnusedInReview = false,
  onTogglePacked,
  onToggleSelected,
  onToggleUnusedInReview,
  onUpdateQuantity,
  onUpdateGear,
  onDeleteGear,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);

  const [editBrand, setEditBrand] = useState(item.brand || '');
  const [editName, setEditName] = useState(item.name);
  const [editCategory, setEditCategory] = useState(item.category || 'ベース');
  const [editWeight, setEditWeight] = useState(item.weight || 0);
  const [editPrice, setEditPrice] = useState(item.price || 0);
  const [editPurchaseDate, setEditPurchaseDate] = useState(item.purchase_date || '');
  const [editFuelType, setEditFuelType] = useState(item.fuel_type || '不要/なし');
  const [editMemo, setEditMemo] = useState(item.memo || '');

  const isSelected = item.is_selected !== false;
  const badge = getBadgeStyle(item.fuel_type);
  const cleanName = getCleanItemName(item.name, item.brand);

  const qty = item.quantity || 1;
  const totalWeight = item.weight * qty;

  // 🎯 稼働率バッジの判定ロジック
  const broughtCount = item.total_brought_count || 0;
  const usedCount = item.total_used_count || 0;
  const usageRate = broughtCount > 0 ? (usedCount / broughtCount) * 100 : 0;

  const renderUsageBadge = () => {
    if (broughtCount === 0) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-sans">
          NEW
        </span>
      );
    }

    if (usageRate >= 75) {
      return (
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono"
          title={`高稼働: 使用率 ${usageRate.toFixed(0)}% (${usedCount}/${broughtCount}回)`}
        >
          🔥 {usedCount}/{broughtCount}回
        </span>
      );
    }

    if (usageRate <= 39 && broughtCount >= 2) {
      return (
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60 font-mono"
          title={`低稼働 (お留守番候補): 使用率 ${usageRate.toFixed(0)}% (${usedCount}/${broughtCount}回)`}
        >
          💤 {usedCount}/{broughtCount}回
        </span>
      );
    }

    return (
      <span
        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono"
        title={`通常: 使用率 ${usageRate.toFixed(0)}% (${usedCount}/${broughtCount}回)`}
      >
        {usedCount}/{broughtCount}回
      </span>
    );
  };

  const handleSaveEdit = async () => {
    await onUpdateGear(item.id, {
      brand: editBrand,
      name: editName,
      product_name: editName,
      category: editCategory,
      weight: Number(editWeight),
      price: Number(editPrice),
      purchase_date: editPurchaseDate,
      fuel_type: editFuelType === '不要/なし' ? '' : editFuelType,
      memo: editMemo,
    });
    setIsEditing(false);
  };

  // 🎒 【1】 パッキングモード UI
  if (mode === 'packing') {
    return (
      <div className="space-y-1">
        <div
          className={`h-[48px] px-2 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2 select-text ${
            !isSelected
              ? 'bg-[#18181B]/40 border-zinc-800/80 opacity-40'
              : item.is_packed
              ? 'bg-[#1F1F23] border-zinc-800'
              : 'bg-[#27272A] border-zinc-700/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* 持参/お休み */}
            {onToggleSelected && (
              <button
                onClick={() => onToggleSelected(item.id, isSelected)}
                className={`w-8 h-8 rounded-lg text-sm transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#FF5500]/20 border-[#FF5500]/60 text-[#FF5500]'
                    : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                }`}
                title={isSelected ? '持参（タップでお休みに変更）' : 'お休み（タップで持参に変更）'}
              >
                {isSelected ? '🎒' : '💤'}
              </button>
            )}

            {/* パッキング完了チェック */}
            {isSelected && onTogglePacked ? (
              <button
                onClick={() => onTogglePacked(item.id, item.is_packed)}
                className={`w-8 h-8 rounded-lg text-sm transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
                  item.is_packed
                    ? 'bg-[#10B981] border-[#10B981] text-white shadow-sm'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
                title={item.is_packed ? '完了済み（タップで未完了に変更）' : '未完了（タップで完了に変更）'}
              >
                {item.is_packed ? '✅' : '⬜'}
              </button>
            ) : (
              <span className="w-8 h-8 flex items-center justify-center text-xs text-zinc-600 font-mono font-bold select-none shrink-0">
                [-]
              </span>
            )}

            {/* 商品名 */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-left flex-1 min-w-0 cursor-pointer group focus:outline-none"
              title="タップしてギア情報を編集"
            >
              <span
                className={`text-xs truncate block transition-colors ${
                  !isSelected
                    ? 'text-zinc-500 font-medium'
                    : item.is_packed
                    ? 'text-zinc-400 font-medium group-hover:text-white'
                    : 'text-white font-extrabold group-hover:text-[#FF5500]'
                }`}
              >
                {cleanName}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {qty > 1 && (
              <span className="text-[11px] font-mono font-black text-[#FFB800] bg-[#FFB800]/15 border border-[#FFB800]/40 px-1.5 py-0.5 rounded shrink-0">
                ×{qty}
              </span>
            )}

            <span className="text-xs font-mono tabular-nums font-bold text-zinc-300 shrink-0 min-w-[55px] text-right">
              {formatWeight(totalWeight)}
            </span>
          </div>
        </div>

        {isEditing && renderEditForm()}
      </div>
    );
  }

  // ⛺ 【2】 振り返りモード UI
  if (mode === 'review') {
    return (
      <div className="space-y-1">
        <div
          className={`h-[48px] px-2 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2 select-text ${
            isUnusedInReview
              ? 'bg-amber-950/30 border-amber-800/80 shadow-sm'
              : 'bg-[#1F1F23] border-zinc-800/80'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* 未使用トグルボタン */}
            {onToggleUnusedInReview && (
              <button
                onClick={() => onToggleUnusedInReview(item.id)}
                className={`w-8 h-8 rounded-lg text-sm transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
                  isUnusedInReview
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
                title={isUnusedInReview ? '使わなかった（タップで使用済みに変更）' : '使った（タップで未使用に変更）'}
              >
                {isUnusedInReview ? '⚠️' : '✅'}
              </button>
            )}

            <div className="text-left flex-1 min-w-0">
              <span
                className={`text-xs truncate block font-bold ${
                  isUnusedInReview ? 'text-amber-300 font-extrabold' : 'text-zinc-200'
                }`}
              >
                {cleanName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {renderUsageBadge()}
            <span className="text-xs font-mono tabular-nums font-bold text-zinc-300 shrink-0 min-w-[55px] text-right">
              {formatWeight(totalWeight)}
            </span>
          </div>
        </div>

        {isEditing && renderEditForm()}
      </div>
    );
  }

  // ✏️ 【3】 ギア編集モード UI
  return (
    <div
      className={`py-2 px-2.5 border-b border-zinc-800/80 transition-colors select-text hover:bg-[#1F1F23]/60 space-y-1.5 ${
        !isSelected ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {onToggleSelected && (
            <button
              onClick={() => onToggleSelected(item.id, isSelected)}
              className={`w-7 h-7 rounded-lg text-xs transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-[#FF5500]/20 border-[#FF5500]/60 text-[#FF5500]'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
              }`}
              title={isSelected ? '持参（タップでお休みに変更）' : 'お休み（タップで持参に変更）'}
            >
              {isSelected ? '🎒' : '💤'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="min-w-0 flex-1 text-left flex items-center gap-1.5 text-xs truncate cursor-pointer group focus:outline-none"
            title="タップしてギア情報を編集"
          >
            {item.brand && (
              <span className="text-zinc-400 font-medium shrink-0">
                {item.brand}
              </span>
            )}
            <span
              className={`font-bold truncate group-hover:text-[#FF5500] transition-colors ${
                !isSelected ? 'text-zinc-500' : 'text-white'
              }`}
            >
              {cleanName}
            </span>
          </button>
        </div>

        {badge && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.className} shrink-0`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="text-[11px] font-mono tabular-nums text-zinc-400 flex items-center gap-1.5 shrink-0 pl-1">
          <span>{formatWeight(totalWeight)}</span>
          {/* 🎯 価格の代わりに稼働率バッジを表示 */}
          <span className="text-zinc-600 font-sans">/</span>
          {renderUsageBadge()}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onUpdateQuantity && (
            <div className="flex items-center bg-[#18181B] rounded-lg border border-zinc-700/80">
              <button
                onClick={() => onUpdateQuantity(item.id, qty, -1)}
                className="w-7 h-6 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-xs cursor-pointer rounded-l-lg"
              >
                -
              </button>
              <span className="px-1.5 text-xs font-mono tabular-nums font-bold text-white">
                {qty}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, qty, 1)}
                className="w-7 h-6 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-xs cursor-pointer rounded-r-lg"
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition border cursor-pointer ${
              isEditing
                ? 'bg-[#FF5500]/20 border-[#FF5500] text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
            title="ギア詳細を編集"
          >
            ✏️
          </button>

          {onDeleteGear && (
            <button
              onClick={() => onDeleteGear(item.id)}
              className="ml-2 w-7 h-7 flex items-center justify-center text-[#EF4444] hover:text-white hover:bg-[#EF4444]/20 rounded-lg text-xs transition border border-[#EF4444]/40 cursor-pointer"
              title="ギアを削除"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {isEditing && renderEditForm()}
    </div>
  );

  // 編集フォーム（モーダル/アコーディオン内）
  function renderEditForm() {
    return (
      <div className="mt-2 pt-2 border-t border-zinc-800 space-y-2.5 bg-[#18181B] p-3 rounded-xl animate-fade-in text-left">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">カテゴリー</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-[#FF5500] focus:outline-none cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">メーカー/ブランド</label>
            <input
              type="text"
              placeholder="例: モンベル"
              value={editBrand}
              onChange={(e) => setEditBrand(e.target.value)}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-[#FF5500] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">商品名</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-[#27272A] border border-[#FF5500] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">重量(g)</label>
            <input
              type="number"
              value={editWeight}
              onChange={(e) => setEditWeight(Number(e.target.value))}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-[#FF5500] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">価格(円)</label>
            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(Number(e.target.value))}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-[#FF5500] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">購入時期</label>
            <input
              type="month"
              value={editPurchaseDate}
              onChange={(e) => setEditPurchaseDate(e.target.value)}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">燃料・電源タイプ</label>
            <select
              value={editFuelType}
              onChange={(e) => setEditFuelType(e.target.value)}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {FUEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">メモ</label>
          <input
            type="text"
            placeholder="例: リビング棚保管、コンテナA"
            value={editMemo}
            onChange={(e) => setEditMemo(e.target.value)}
            className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-[#FF5500] focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={handleSaveEdit}
            className="bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-xl cursor-pointer transition active:scale-95"
          >
            保存
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-3.5 py-1.5 rounded-xl cursor-pointer transition"
          >
            中止
          </button>
        </div>
      </div>
    );
  }
}
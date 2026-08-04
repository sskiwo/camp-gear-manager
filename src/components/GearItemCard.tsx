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
  is_selected?: boolean;
  is_consumable: boolean;
  product_url?: string;
  purchase_date?: string;
  fuel_type?: string;
  memo?: string;
};

type Props = {
  item: GearItem;
  catColor: string;
  adoptionRate?: string;
  mode?: 'packing' | 'edit';
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (targetId: string) => void;
  onTogglePacked: (id: string, currentStatus: boolean) => void;
  onToggleSelected: (id: string, currentStatus: boolean) => void;
  onUpdateQuantity: (id: string, currentQty: number, delta: number) => void;
  onUpdateGear: (id: string, data: any) => Promise<void>;
  onDeleteGear: (id: string) => void;
};

// 属性バッジ(燃料・電源タイプ) マッピング
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

// メーカー名重複トリミング関数
const getCleanItemName = (fullName: string, brandName?: string): string => {
  if (!brandName || !brandName.trim()) return fullName;
  const regex = new RegExp(`^${brandName.trim()}\\s*`, 'i');
  return fullName.replace(regex, '');
};

// 重量表示フォーマット関数 (1000g未満: g整数 / 1000g以上: 小数点第2位kg)
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
  catColor,
  adoptionRate,
  mode = 'packing',
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onTogglePacked,
  onToggleSelected,
  onUpdateQuantity,
  onUpdateGear,
  onDeleteGear,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);

  // 編集フォーム用ステート
  const [editBrand, setEditBrand] = useState(item.brand || '');
  const [editName, setEditName] = useState(item.name);
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
  const totalPrice = item.price * qty;

  const handleSaveEdit = async () => {
    await onUpdateGear(item.id, {
      brand: editBrand,
      name: editName,
      product_name: editName,
      weight: Number(editWeight),
      price: Number(editPrice),
      purchase_date: editPurchaseDate,
      fuel_type: editFuelType === '不要/なし' ? '' : editFuelType,
      memo: editMemo,
    });
    setIsEditing(false);
  };

  // 🎒 【1】 パッキングモード UI (超スリム1行表示)
  if (mode === 'packing') {
    return (
      <div
        onDragOver={onDragOver}
        onDrop={() => onDrop && onDrop(item.id)}
        className={`h-[48px] px-2 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2 select-text ${
          !isSelected
            ? 'bg-[#18181B]/40 border-zinc-800/80 opacity-60'
            : item.is_packed
            ? 'bg-[#1F1F23] border-zinc-800'
            : 'bg-[#27272A] border-zinc-700/80 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* ① 持参/お休み */}
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

          {/* ② パッキング完了チェック */}
          {isSelected ? (
            <button
              onClick={() => onTogglePacked(item.id, item.is_packed)}
              className={`w-8 h-8 rounded-lg text-sm transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
                item.is_packed
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
              title={item.is_packed ? '完了済み（タップで未完了に変更）' : '未完了（タップで完了に変更）'}
            >
              {item.is_packed ? '✅' : '⬜'}
            </button>
          ) : (
            <span className="w-8 h-8 flex items-center justify-center text-xs text-zinc-600 select-none shrink-0">-</span>
          )}

          {/* ③ 商品名 */}
          <span
            title={item.name}
            className={`text-xs font-bold truncate flex-1 min-w-0 ${
              !isSelected
                ? 'line-through text-zinc-500'
                : item.is_packed
                ? 'text-zinc-400'
                : 'text-white'
            }`}
          >
            {cleanName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 数量表示: 2個以上の時だけ ×2 */}
          {qty > 1 && (
            <span className="text-[11px] font-mono font-black text-[#FFB800] bg-[#FFB800]/15 border border-[#FFB800]/40 px-1.5 py-0.5 rounded shrink-0">
              ×{qty}
            </span>
          )}

          {/* 重量 (天秤アイコンなし・右揃え・固定幅) */}
          <span className="text-xs font-mono tabular-nums font-bold text-zinc-300 shrink-0 min-w-[55px] text-right">
            {formatWeight(totalWeight)}
          </span>
        </div>
      </div>
    );
  }

  // ✏️ 【2】 ギア編集モード UI (2行構造)
  return (
    <div
      onDragOver={onDragOver}
      onDrop={() => onDrop && onDrop(item.id)}
      className={`py-2 px-2.5 border-b border-zinc-800/80 transition-colors select-text hover:bg-[#1F1F23]/60 space-y-1.5 ${
        isDragging ? 'opacity-30 bg-amber-950/20' : ''
      } ${!isSelected ? 'opacity-50' : ''}`}
    >
      {/* ── 上段：識別ゾーン（ドラッグハンドル ➔ 持参アイコン ➔ ブランド ＋ 商品名 ➔ 最右端: 属性バッジ） ── */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 最左端: ドラッグハンドル [⋮⋮] (確実に掴めるよう draggable={true} と touch-none 設定) */}
          <span
            draggable={true}
            onDragStart={(e) => {
              e.stopPropagation();
              if (onDragStart) onDragStart(e, item.id);
            }}
            className="text-zinc-400 hover:text-white cursor-grab active:cursor-grabbing text-sm font-black select-none shrink-0 px-1 py-0.5 touch-none"
            title="ドラッグして並び替え"
          >
            ⋮⋮
          </span>

          {/* 持参・お休みトグルアイコン [🎒/💤] */}
          <button
            onClick={() => onToggleSelected(item.id, isSelected)}
            className={`w-6 h-6 rounded-md text-xs transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
              isSelected
                ? 'bg-[#FF5500]/20 border-[#FF5500]/60 text-[#FF5500]'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
            }`}
            title={isSelected ? '持参（タップでお休みに変更）' : 'お休み（タップで持参に変更）'}
          >
            {isSelected ? '🎒' : '💤'}
          </button>

          {/* ブランド名 ＋ 商品名 */}
          <div className="min-w-0 flex-1 flex items-center gap-1.5 text-xs truncate">
            {item.brand && (
              <span className="text-zinc-400 font-medium shrink-0">
                {item.brand}
              </span>
            )}
            <span
              className={`font-bold truncate ${
                !isSelected ? 'line-through text-zinc-500' : 'text-white'
              }`}
              title={item.name}
            >
              {cleanName}
            </span>
          </div>
        </div>

        {/* 最右端: 属性バッジ (CB, OD, USB-C等) */}
        {badge && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.className} shrink-0`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* ── 下段：数値・操作ゾーン（重量 / 金額 [天秤アイコンなし] ➔ 数量 [- 1 +] ➔ ✏️ [鉛筆アイコンのみ] ➔ 🗑️） ── */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* 左側: 重量 / 金額 （天秤アイコン削除済み） */}
        <div className="text-[11px] font-mono tabular-nums text-zinc-400 flex items-center gap-1.5 shrink-0">
          <span>{formatWeight(totalWeight)}</span>
          {totalPrice > 0 && (
            <span className="text-zinc-500">/ ¥{totalPrice.toLocaleString()}</span>
          )}
        </div>

        {/* 右側: 数量コントロール ＋ ✏️ [鉛筆アイコンのみ] ＋ 🗑️ */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 数量コントロール [- 1 +] */}
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

          {/* ✏️ 編集ボタン (文字削除・鉛筆アイコンのみ) */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs transition border cursor-pointer ${
              isEditing
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
            title="ギア詳細を編集"
          >
            ✏️
          </button>

          {/* 🗑️ 削除ボタン */}
          <button
            onClick={() => onDeleteGear(item.id)}
            className="ml-2 w-7 h-7 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-950/60 rounded-lg text-xs transition border border-red-900/40 cursor-pointer"
            title="ギアを削除"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* ── 詳細インライン編集フォーム ── */}
      {isEditing && (
        <div className="mt-2 pt-2 border-t border-zinc-800 space-y-2.5 bg-[#18181B] p-3 rounded-xl animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
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
                className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-[#FF5500] focus:outline-none"
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
              <label className="text-[10px] font-bold text-emerald-400 block mb-0.5">📅 購入時期</label>
              <input
                type="month"
                value={editPurchaseDate}
                onChange={(e) => setEditPurchaseDate(e.target.value)}
                className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-cyan-400 block mb-0.5">🔋 燃料・電源タイプ</label>
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
            <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">📝 メモ</label>
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
              className="bg-[#00E676] hover:bg-emerald-400 text-black text-xs font-bold px-4 py-1.5 rounded-xl cursor-pointer transition active:scale-95"
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
      )}
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';

export type GearItem = {
  id: string;
  camp_id?: string;
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
  is_weight_estimated?: boolean;
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
  onUpdateGear,
  onDeleteGear,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);

  const [editBrand, setEditBrand] = useState(item.brand || '');
  const [editName, setEditName] = useState(item.name || '');
  const [editCategory, setEditCategory] = useState(item.category || 'ベース');
  const [editWeight, setEditWeight] = useState(item.weight || 0);
  const [editPrice, setEditPrice] = useState(item.price || 0);
  const [editQuantity, setEditQuantity] = useState(item.quantity || 1);
  const [editPurchaseDate, setEditPurchaseDate] = useState(item.purchase_date || '');
  const [editFuelType, setEditFuelType] = useState(item.fuel_type || '不要/なし');
  const [editMemo, setEditMemo] = useState(item.memo || '');
  const [editIsWeightEstimated, setEditIsWeightEstimated] = useState(item.is_weight_estimated ?? false);

  const resetEditForm = useCallback(() => {
    setEditBrand(item.brand || '');
    setEditName(item.name || '');
    setEditCategory(item.category || 'ベース');
    setEditWeight(item.weight || 0);
    setEditPrice(item.price || 0);
    setEditQuantity(item.quantity || 1);
    setEditPurchaseDate(item.purchase_date || '');
    setEditFuelType(item.fuel_type || '不要/なし');
    setEditMemo(item.memo || '');
    setEditIsWeightEstimated(item.is_weight_estimated ?? false);
  }, [item]);

  useEffect(() => {
    if (!isEditing) {
      resetEditForm();
    }
  }, [item, isEditing, resetEditForm]);

  const handleToggleEdit = () => {
    if (isEditing) {
      resetEditForm();
      setIsEditing(false);
    } else {
      resetEditForm();
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    resetEditForm();
    setIsEditing(false);
  };

  const isSelected = item.is_selected !== false;
  const badge = getBadgeStyle(item.fuel_type);
  const cleanName = getCleanItemName(item.name, item.brand);

  const qty = item.quantity || 1;
  const totalWeight = item.weight * qty;

  const broughtCount = item.total_brought_count || 0;
  const usedCount = item.total_used_count || 0;
  const usageRate = broughtCount > 0 ? (usedCount / broughtCount) * 100 : 0;

  const renderWeightEstimatedBadge = () => {
    if (!item.is_weight_estimated) return null;

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpdateGear(item.id, { is_weight_estimated: false });
        }}
        className="text-[12px] font-normal text-amber-400 bg-amber-950/70 border border-amber-800/80 px-1 py-0.2 rounded hover:bg-amber-800/80 transition cursor-pointer shrink-0"
        title="AIによる推測値です。タップして確定状態に変更"
      >
        推定
      </button>
    );
  };

  const renderUsageBadge = () => {
    if (broughtCount === 0) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[12px] font-normal bg-cyan-950/60 text-cyan-300 border border-cyan-700/60 font-sans">
          NEW
        </span>
      );
    }

    if (usageRate >= 75) {
      return (
        <span
          className="px-1.5 py-0.5 rounded text-[12px] font-normal bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 font-mono tabular-nums text-right"
          title={`高稼働: 使用率 ${usageRate.toFixed(0)}% (${usedCount}/${broughtCount}回)`}
        >
          {usedCount}/{broughtCount}回
        </span>
      );
    }

    if (usageRate <= 39 && broughtCount >= 2) {
      return (
        <span
          className="px-1.5 py-0.5 rounded text-[12px] font-normal bg-amber-950/60 text-amber-300 border border-amber-700/60 font-mono tabular-nums text-right"
          title={`低稼働 (お留守番候補): 使用率 ${usageRate.toFixed(0)}% (${usedCount}/${broughtCount}回)`}
        >
          💤 {usedCount}/{broughtCount}回
        </span>
      );
    }

    return (
      <span
        className="px-1.5 py-0.5 rounded text-[12px] font-normal bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono tabular-nums text-right"
        title={`通常: 使用率 ${usageRate.toFixed(0)}% (${usedCount}/${broughtCount}回)`}
      >
        {usedCount}/{broughtCount}回
      </span>
    );
  };

  const handleSaveEdit = async () => {
    const finalName = editName.trim() || item.name;
    const finalBrand = editBrand.trim();

    await onUpdateGear(item.id, {
      name: finalName,
      product_name: finalName,
      brand: finalBrand,
      category: editCategory,
      is_consumable: editCategory === '消耗品',
      weight: Math.max(0, Number(editWeight) || 0),
      price: Math.max(0, Number(editPrice) || 0),
      quantity: Math.max(1, Number(editQuantity) || 1),
      purchase_date: editPurchaseDate,
      fuel_type: editFuelType === '不要/なし' ? '' : editFuelType,
      memo: editMemo.trim(),
      is_weight_estimated: editIsWeightEstimated,
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
              ? 'bg-[#18181B] border-zinc-800/80 border-dashed'
              : item.is_packed
              ? 'bg-[#1F1F23] border-zinc-800'
              : 'bg-[#27272A] border-zinc-700/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {onToggleSelected && (
              <button
                onClick={() => onToggleSelected(item.id, isSelected)}
                className={`w-8 h-8 rounded-lg text-[12px] transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#FF5500]/20 border-[#FF5500]/60 text-[#FF5500]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                }`}
                title={isSelected ? '持参（タップでお休みに変更）' : 'お休み（タップで持参に変更）'}
              >
                {isSelected ? '🎒' : '💤'}
              </button>
            )}

            {isSelected && onTogglePacked ? (
              <button
                onClick={() => onTogglePacked(item.id, item.is_packed)}
                className={`w-8 h-8 rounded-lg text-[12px] transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
                  item.is_packed
                    ? 'bg-[#10B981] border-[#10B981] text-white shadow-sm'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
                title={item.is_packed ? '完了済み（タップで未完了に変更）' : '未完了（タップで完了に変更）'}
              >
                {item.is_packed ? '✅' : '⬜'}
              </button>
            ) : (
              <span className="w-8 h-8 flex items-center justify-center text-[12px] text-zinc-500 font-mono select-none shrink-0 font-normal">
                [-]
              </span>
            )}

            <button
              type="button"
              onClick={handleToggleEdit}
              className="text-left flex-1 min-w-0 cursor-pointer group focus:outline-none"
              title="タップしてギア情報を編集"
            >
              <span
                className={`text-[12px] font-normal truncate block transition-colors ${
                  !isSelected
                    ? 'text-zinc-300 group-hover:text-white'
                    : item.is_packed
                    ? 'text-zinc-400 group-hover:text-white'
                    : 'text-white group-hover:text-[#FF5500]'
                }`}
              >
                {cleanName}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {renderWeightEstimatedBadge()}

            {qty > 1 && (
              <span className="text-[12px] font-mono font-bold text-[#FFB800] bg-[#FFB800]/15 border border-[#FFB800]/40 px-1.5 py-0.5 rounded shrink-0">
                ×{qty}
              </span>
            )}

            <span className="text-[12px] font-mono tabular-nums font-normal text-zinc-300 shrink-0 min-w-[50px] text-right">
              {formatWeight(totalWeight)}
            </span>
          </div>
        </div>

        {isEditing && renderEditForm()}
      </div>
    );
  }

  // ⛺ 【2】 振り返りモード UI（使用率は非表示、チェック外し方式に統一）
  if (mode === 'review') {
    return (
      <div className="space-y-1">
        <div
          className={`h-[48px] px-2 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2 select-text ${
            isUnusedInReview
              ? 'bg-[#18181B] border-zinc-800/80 opacity-60'
              : 'bg-[#27272A] border-zinc-700/80 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* 🎯 使った(✅) / 未使用(⬜)の切り替えボタン */}
            {onToggleUnusedInReview && (
              <button
                onClick={() => onToggleUnusedInReview(item.id)}
                className={`w-8 h-8 rounded-lg text-[12px] transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
                  isUnusedInReview
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                    : 'bg-[#10B981] border-[#10B981] text-white shadow-sm'
                }`}
                title={isUnusedInReview ? '使わなかった（タップで使用済みに変更）' : '使った（タップで未使用に変更）'}
              >
                {isUnusedInReview ? '⬜' : '✅'}
              </button>
            )}

            <div className="text-left flex-1 min-w-0">
              <span
                className={`text-[12px] truncate block ${
                  isUnusedInReview
                    ? 'text-zinc-500 line-through font-normal'
                    : 'text-white font-bold'
                }`}
              >
                {cleanName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 🎯 数量バッジ（2個以上のみ表示） */}
            {qty > 1 && (
              <span className="text-[12px] font-mono font-bold text-[#FFB800] bg-[#FFB800]/15 border border-[#FFB800]/40 px-1.5 py-0.5 rounded shrink-0">
                ×{qty}
              </span>
            )}
            
            {/* 💡 振り返り画面では使用率バッジは非表示 */}

            <span className={`text-[12px] font-mono tabular-nums min-w-[50px] text-right ${
              isUnusedInReview ? 'text-zinc-500 font-normal' : 'text-zinc-300 font-bold'
            }`}>
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
      className={`py-2 px-2.5 border-b border-zinc-800/80 transition-colors select-text hover:bg-[#1F1F23] space-y-1.5 ${
        !isSelected ? 'bg-[#141416]/90' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {onToggleSelected && (
            <button
              onClick={() => onToggleSelected(item.id, isSelected)}
              className={`w-7 h-7 rounded-lg text-[12px] transition flex items-center justify-center border shrink-0 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-[#FF5500]/20 border-[#FF5500]/60 text-[#FF5500]'
                  : 'bg-zinc-800/90 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'
              }`}
              title={isSelected ? '持参（タップでお休みに変更）' : 'お休み（タップで持参に変更）'}
            >
              {isSelected ? '🎒' : '💤'}
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleEdit}
            className="min-w-0 flex-1 text-left flex items-center gap-1.5 text-[12px] font-normal truncate cursor-pointer group focus:outline-none"
            title="タップしてギア情報を編集"
          >
            {item.brand && (
              <span className="text-zinc-400 font-normal shrink-0">
                {item.brand}
              </span>
            )}
            <span
              className={`truncate group-hover:text-[#FF5500] transition-colors ${
                !isSelected ? 'text-zinc-300 font-normal' : 'text-white font-normal'
              }`}
            >
              {cleanName}
            </span>
          </button>
        </div>

        {badge && (
          <span className={`text-[12px] px-1.5 py-0.5 rounded ${badge.className} shrink-0 font-normal`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="text-[11px] font-mono tabular-nums text-zinc-300 flex items-center gap-1.5 shrink-0 pl-1 font-normal">
          <span className="text-zinc-200">{formatWeight(totalWeight)}</span>
          {renderWeightEstimatedBadge()}
          {qty > 1 && (
            <span className="text-[11px] font-mono font-bold text-[#FFB800] bg-[#FFB800]/15 border border-[#FFB800]/40 px-1 py-0.2 rounded shrink-0">
              ×{qty}
            </span>
          )}
          <span className="text-zinc-500 font-sans">/</span>
          {renderUsageBadge()}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleToggleEdit}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-[12px] transition border cursor-pointer ${
              isEditing
                ? 'bg-[#FF5500]/20 border-[#FF5500] text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border-zinc-700'
            }`}
            title="ギア詳細を編集"
          >
            ✏️
          </button>
        </div>
      </div>

      {isEditing && renderEditForm()}
    </div>
  );

  function renderEditForm() {
    return (
      <div className="mt-2 pt-2 border-t border-zinc-800 space-y-2.5 bg-[#18181B] p-3 rounded-xl animate-fade-in text-left">
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
          <div>
            <label className="text-[12px] font-normal text-zinc-400 block mb-0.5">カテゴリー</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-[12px] text-white focus:border-[#FF5500] focus:outline-none cursor-pointer font-normal"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-normal text-zinc-400 block mb-0.5">メーカー/ブランド</label>
            <input
              type="text"
              placeholder="例: モンベル"
              value={editBrand}
              onChange={(e) => setEditBrand(e.target.value)}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-[12px] text-white focus:border-[#FF5500] focus:outline-none font-normal"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[12px] font-normal text-zinc-400 block mb-0.5">商品名</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-[#27272A] border border-[#FF5500] rounded-lg px-2 py-1.5 text-[12px] text-white focus:outline-none font-normal"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[12px] font-normal text-zinc-400 block">重量(g)</label>
              <button
                type="button"
                onClick={() => setEditIsWeightEstimated(!editIsWeightEstimated)}
                className={`text-[12px] font-normal px-1.5 py-0.2 rounded border cursor-pointer ${
                  editIsWeightEstimated
                    ? 'bg-amber-950/70 border-amber-800/80 text-amber-400 font-bold'
                    : 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400 font-bold'
                }`}
                title="タップして推定/確定を切り替え"
              >
                {editIsWeightEstimated ? '推定' : '確定'}
              </button>
            </div>
            <input
              type="number"
              step="10"
              value={editWeight === 0 ? '' : editWeight}
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                setEditWeight(val);
                setEditIsWeightEstimated(false);
              }}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono tabular-nums text-right focus:border-[#FF5500] focus:outline-none font-normal"
            />
          </div>

          <div>
            <label className="text-[12px] font-normal text-zinc-400 block mb-0.5">数量</label>
            <input
              type="number"
              min="1"
              step="1"
              value={editQuantity}
              onChange={(e) => setEditQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono tabular-nums text-right focus:border-[#FF5500] focus:outline-none font-normal"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[12px] font-normal text-zinc-400 block mb-0.5">価格(円)</label>
            <input
              type="number"
              step="100"
              value={editPrice === 0 ? '' : editPrice}
              placeholder="0"
              onChange={(e) => setEditPrice(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono tabular-nums text-right focus:border-[#FF5500] focus:outline-none font-normal"
            />
          </div>
          <div>
            <label className="text-[12px] font-normal text-zinc-400 block mb-0.5">購入時期</label>
            <input
              type="month"
              value={editPurchaseDate}
              onChange={(e) => setEditPurchaseDate(e.target.value)}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1 text-[12px] text-white focus:outline-none font-normal"
            />
          </div>
          <div>
            <label className="text-[12px] font-normal text-zinc-400 block mb-0.5">燃料・電源タイプ</label>
            <select
              value={editFuelType}
              onChange={(e) => setEditFuelType(e.target.value)}
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-[12px] text-white focus:outline-none font-normal"
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
          <label className="text-[12px] font-normal text-zinc-400 block mb-0.5">メモ</label>
          <input
            type="text"
            placeholder="例: リビング棚保管、コンテナA"
            value={editMemo}
            onChange={(e) => setEditMemo(e.target.value)}
            className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:border-[#FF5500] focus:outline-none font-normal"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <div>
            {onDeleteGear && (
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(`「${item.name}」を削除してもよろしいですか？`);
                  if (confirmed) {
                    onDeleteGear(item.id);
                  }
                }}
                className="text-[#EF4444] hover:text-white hover:bg-[#EF4444]/20 border border-[#EF4444]/40 px-3 py-1.5 rounded-xl text-[12px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="このギアを削除"
              >
                <span>🗑️</span>
                <span>ギアを削除</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[12px] font-normal px-3.5 py-1.5 rounded-xl cursor-pointer transition"
            >
              中止
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="bg-[#10B981] hover:bg-emerald-600 text-white text-[12px] font-bold px-4 py-1.5 rounded-xl cursor-pointer transition active:scale-95 shadow-sm"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }
}
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

// メーカー名トリミング関数
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
  const [showDetail, setShowDetail] = useState(false);

  // 編集用ステート
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

  // 🎒 パッキングモード (数量変更ボタンを撤去し、2個以上の場合のみ『×2』テキスト表示)
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
            title={isSelected ? '持参（タップで休みに変更）' : 'お休み（タップで持参に変更）'}
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

          {/* ③ 商品名 (領域最大化) */}
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
          {/* ★ 数量表示: 2個以上のときだけ 『×2』 などのテキストを表示 */}
          {qty > 1 && (
            <span className="text-[11px] font-mono font-black text-[#FFB800] bg-[#FFB800]/15 border border-[#FFB800]/40 px-1.5 py-0.5 rounded shrink-0">
              ×{qty}
            </span>
          )}

          {/* 重量 (右揃え・固定幅) */}
          <span className="text-xs font-mono tabular-nums font-bold text-zinc-300 shrink-0 min-w-[55px] text-right">
            {formatWeight(totalWeight)}
          </span>
        </div>
      </div>
    );
  }

  // ✏️ 編集・整理モード (数量変更 [- 1 +] ボタンを配置)
  return (
    <div
      onDragOver={onDragOver}
      onDrop={() => onDrop && onDrop(item.id)}
      className={`p-3 rounded-xl border transition-all duration-200 space-y-2 select-text ${
        isDragging ? 'opacity-30 border-amber-500 bg-amber-950/20' : ''
      } ${
        !isSelected
          ? 'bg-[#18181B]/40 border-zinc-800/80 opacity-60'
          : item.is_packed
          ? 'bg-[#1F1F23] border-zinc-800'
          : 'bg-[#27272A] border-zinc-700/80 shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            draggable
            onDragStart={(e) => onDragStart && onDragStart(e, item.id)}
            className="text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing text-xs select-none shrink-0 p-1"
            title="ドラッグして並び替え"
          >
            ⋮⋮
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.brand && (
                <span className="inline-flex items-center h-5 text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                  {item.brand}
                </span>
              )}

              <span
                className={`text-xs font-bold truncate ${
                  !isSelected
                    ? 'line-through text-zinc-500'
                    : item.is_packed
                    ? 'text-zinc-300'
                    : 'text-white'
                }`}
              >
                {item.name}
              </span>

              {adoptionRate && (
                <span
                  className="inline-flex items-center h-5 text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#FF5500]/15 border border-[#FF5500]/40 text-[#FF5500] font-mono shrink-0"
                  title="全キャンプでの採用数"
                >
                  ⛺ {adoptionRate}
                </span>
              )}

              {badge && (
                <span className={`inline-flex items-center h-5 text-[10px] px-2 py-0.5 rounded ${badge.className} shrink-0`}>
                  🔋 {badge.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono tabular-nums">
              <span>
                ⚖️ {formatWeight(totalWeight)}{' '}
                {qty > 1 ? `(${formatWeight(item.weight)}×${qty})` : ''}
              </span>
              {item.price > 0 && <span>💰 ¥{(item.price * qty).toLocaleString()}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 shrink-0 border-t sm:border-t-0 border-zinc-800/80 pt-2 sm:pt-0">
          <button
            onClick={() => onToggleSelected(item.id, isSelected)}
            className={`w-8 h-8 rounded-lg text-sm transition border shrink-0 cursor-pointer flex items-center justify-center ${
              isSelected
                ? 'bg-[#FF5500]/20 border-[#FF5500]/60 text-[#FF5500]'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
            }`}
            title={isSelected ? '持参（タップで休みに変更）' : 'お休み（タップで持参に変更）'}
          >
            {isSelected ? '🎒' : '💤'}
          </button>

          {/* 編集・整理モードでは数量調整ボタンを表示 */}
          <div className="flex items-center bg-[#18181B] rounded-lg border border-zinc-700/80">
            <button
              onClick={() => onUpdateQuantity(item.id, qty, -1)}
              className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-xs cursor-pointer rounded-l-lg"
            >
              -
            </button>
            <span className="px-1.5 text-xs font-mono tabular-nums font-bold text-white">
              {qty}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, qty, 1)}
              className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-xs cursor-pointer rounded-r-lg"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setShowDetail(!showDetail)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs transition cursor-pointer ${
              showDetail ? 'text-amber-400 bg-amber-950/40' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {showDetail ? '▲' : '🔍'}
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer rounded-lg hover:bg-zinc-800"
            title="編集"
          >
            ✏️
          </button>

          <button
            onClick={() => onDeleteGear(item.id)}
            className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-red-400 text-xs cursor-pointer rounded-lg hover:bg-zinc-800"
            title="削除"
          >
            🗑️
          </button>
        </div>
      </div>

      {showDetail && !isEditing && (
        <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-300 bg-[#18181B]/60 p-2.5 rounded-lg font-sans animate-fade-in">
          <div>
            <span className="text-zinc-500 font-bold block text-[10px]">📅 購入時期:</span>
            <span>{item.purchase_date || '未設定'}</span>
          </div>
          <div>
            <span className="text-zinc-500 font-bold block text-[10px]">🔋 燃料・電源タイプ:</span>
            <span>{item.fuel_type || '不要/未設定'}</span>
          </div>
          <div>
            <span className="text-zinc-500 font-bold block text-[10px]">📝 メモ・特記事項:</span>
            <span>{item.memo || 'なし'}</span>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="pt-2 border-t border-zinc-800/80 space-y-2.5 bg-[#18181B] p-3 rounded-lg animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">メーカー/ブランド</label>
              <input
                type="text"
                placeholder="例: Snow Peak"
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">商品名</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">重量(g)</label>
              <input
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(Number(e.target.value))}
                className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-0.5">価格(円)</label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(Number(e.target.value))}
                className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
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
                className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-cyan-400 block mb-0.5">🔋 燃料・電源タイプ</label>
              <select
                value={editFuelType}
                onChange={(e) => setEditFuelType(e.target.value)}
                className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
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
              className="w-full bg-[#27272A] border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleSaveEdit}
              className="bg-[#00E676] hover:bg-emerald-400 text-black text-xs font-bold px-4 py-1.5 rounded-xl cursor-pointer transition"
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
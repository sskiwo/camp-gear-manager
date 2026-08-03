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
};

type Props = {
  item: GearItem;
  catColor: string;
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

export default function GearItemCard({
  item,
  catColor,
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
  const [editName, setEditName] = useState(item.name);
  const [editWeight, setEditWeight] = useState(item.weight || 0);
  const [editPrice, setEditPrice] = useState(item.price || 0);

  const isSelected = item.is_selected !== false; // デフォルトtrue

  const handleSaveEdit = async () => {
    await onUpdateGear(item.id, {
      name: editName,
      product_name: editName,
      weight: Number(editWeight),
      price: Number(editPrice),
    });
    setIsEditing(false);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop && onDrop(item.id)}
      className={`p-3 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDragging ? 'opacity-30 border-amber-500 bg-amber-950/20' : ''
      } ${
        !isSelected
          ? 'bg-[#18181B]/40 border-zinc-800/80 opacity-60'
          : item.is_packed
          ? 'bg-[#1F1F23] border-zinc-800'
          : 'bg-[#27272A] border-zinc-700/80 shadow-md'
      }`}
    >
      {/* 左側: ドラッグハンドル ＆ 当日パッキングチェック */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing text-xs select-none">
          ⋮⋮
        </span>

        {/* 当日の朝ポチポチ「詰めた！」チェックボックス */}
        {isSelected ? (
          <button
            onClick={() => onTogglePacked(item.id, item.is_packed)}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 border ${
              item.is_packed
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
            title="当日のパッキング完了チェック"
          >
            {item.is_packed ? '✅ 詰めた！' : '⬜ 未パッキング'}
          </button>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/60 shrink-0">
            💤 お休み中
          </span>
        )}

        {/* ギア詳細情報 */}
        {isEditing ? (
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-[#18181B] border border-zinc-700 rounded px-2 py-1 text-xs text-white flex-1 min-w-[120px]"
            />
            <input
              type="number"
              value={editWeight}
              onChange={(e) => setEditWeight(Number(e.target.value))}
              placeholder="重量(g)"
              className="bg-[#18181B] border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20"
            />
            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(Number(e.target.value))}
              placeholder="価格(円)"
              className="bg-[#18181B] border border-zinc-700 rounded px-2 py-1 text-xs text-white w-20"
            />
            <button
              onClick={handleSaveEdit}
              className="bg-[#00E676] text-black text-xs font-bold px-2 py-1 rounded cursor-pointer"
            >
              保存
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded cursor-pointer"
            >
              中止
            </button>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.brand && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
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
            </div>

            <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5 font-mono">
              <span>
                ⚖️ {item.weight * (item.quantity || 1)}g{' '}
                {item.quantity && item.quantity > 1 ? `(${item.weight}g×${item.quantity})` : ''}
              </span>
              {item.price > 0 && <span>💰 ¥{(item.price * (item.quantity || 1)).toLocaleString()}</span>}
            </div>
          </div>
        )}
      </div>

      {/* 右側: 持ち出しスイッチ & 個数 & 編集・削除 */}
      {!isEditing && (
        <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 border-zinc-800/80 pt-2 sm:pt-0">
          {/* 今回持っていくかどうかの選定スイッチ */}
          <button
            onClick={() => onToggleSelected(item.id, isSelected)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              isSelected
                ? 'bg-[#FF5500]/20 border-[#FF5500]/60 text-[#FF5500] hover:bg-[#FF5500]/30'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
            title="今回のキャンプに持っていくか選定"
          >
            {isSelected ? '🎒 持っていく' : '💤 今回お休み'}
          </button>

          {/* 個数変更ボタン */}
          <div className="flex items-center bg-[#18181B] rounded-lg border border-zinc-700/80 p-0.5">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity || 1, -1)}
              className="px-1.5 text-zinc-400 hover:text-white font-bold text-xs cursor-pointer"
            >
              -
            </button>
            <span className="px-1.5 text-xs font-mono font-bold text-white">
              {item.quantity || 1}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity || 1, 1)}
              className="px-1.5 text-zinc-400 hover:text-white font-bold text-xs cursor-pointer"
            >
              +
            </button>
          </div>

          {/* 編集・削除ボタン */}
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
            title="編集"
          >
            ✏️
          </button>
          <button
            onClick={() => onDeleteGear(item.id)}
            className="p-1 text-zinc-500 hover:text-red-400 text-xs cursor-pointer"
            title="削除"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}
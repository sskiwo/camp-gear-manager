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
  storage_location?: string;
  purchase_date?: string;
  fuel_type?: string;
  memo?: string;
};

type Props = {
  item: GearItem;
  catColor: string;
  adoptionRate?: string; // 例: "3/5"
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
  adoptionRate,
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
  const [editName, setEditName] = useState(item.name);
  const [editWeight, setEditWeight] = useState(item.weight || 0);
  const [editPrice, setEditPrice] = useState(item.price || 0);
  const [editStorage, setEditStorage] = useState(item.storage_location || '');
  const [editPurchaseDate, setEditPurchaseDate] = useState(item.purchase_date || '');
  const [editFuelType, setEditFuelType] = useState(item.fuel_type || '');
  const [editMemo, setEditMemo] = useState(item.memo || '');

  const isSelected = item.is_selected !== false; // デフォルトtrue

  const handleSaveEdit = async () => {
    await onUpdateGear(item.id, {
      name: editName,
      product_name: editName,
      weight: Number(editWeight),
      price: Number(editPrice),
      storage_location: editStorage,
      purchase_date: editPurchaseDate,
      fuel_type: editFuelType,
      memo: editMemo,
    });
    setIsEditing(false);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, item.id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop && onDrop(item.id)}
      className={`p-3 rounded-xl border transition-all duration-200 space-y-2 ${
        isDragging ? 'opacity-30 border-amber-500 bg-amber-950/20' : ''
      } ${
        !isSelected
          ? 'bg-[#18181B]/40 border-zinc-800/80 opacity-60'
          : item.is_packed
          ? 'bg-[#1F1F23] border-zinc-800'
          : 'bg-[#27272A] border-zinc-700/80 shadow-md'
      }`}
    >
      {/* 上段: 基本操作ライン */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* 左側: ドラッグ & 当日完了ボタン & ギア名・各種タグ */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing text-xs select-none shrink-0">
            ⋮⋮
          </span>

          {/* 当日パッキングボタン (文言短縮: ✅ 完了 / ⬜ 未) */}
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
              {item.is_packed ? '✅ 完了' : '⬜ 未'}
            </button>
          ) : (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/60 shrink-0">
              💤 お休み
            </span>
          )}

          {/* ギア詳細名 ＆ タグ */}
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

              {/* 採用数タグ (例: ⛺ 3/5) */}
              {adoptionRate && (
                <span
                  className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[#FF5500]/15 border border-[#FF5500]/40 text-[#FF5500] font-mono shrink-0"
                  title="全キャンプでの採用数 (持参ON数 / 全キャンプ数)"
                >
                  ⛺ {adoptionRate}
                </span>
              )}

              {/* 収納場所タグ */}
              {item.storage_location && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800/90 text-amber-300 border border-amber-500/30 shrink-0">
                  📦 {item.storage_location}
                </span>
              )}

              {/* 燃料・電源タグ */}
              {item.fuel_type && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 shrink-0">
                  🔋 {item.fuel_type}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5 font-mono">
              <span>
                ⚖️ {item.weight * (item.quantity || 1)}g{' '}
                {item.quantity && item.quantity > 1 ? `(${item.weight}g×${item.quantity})` : ''}
              </span>
              {item.price > 0 && <span>💰 ¥{(item.price * (item.quantity || 1)).toLocaleString()}</span>}
            </div>
          </div>
        </div>

        {/* 右側: 持ち出しスイッチ & 個数 & 詳細・編集・削除 */}
        <div className="flex items-center justify-end gap-1.5 shrink-0 border-t sm:border-t-0 border-zinc-800/80 pt-2 sm:pt-0">
          {/* 今回持っていくかどうかの選定スイッチ (文言短縮: 🎒 持参 / 💤 お休み) */}
          <button
            onClick={() => onToggleSelected(item.id, isSelected)}
            className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
              isSelected
                ? 'bg-[#FF5500]/20 border-[#FF5500]/60 text-[#FF5500] hover:bg-[#FF5500]/30'
                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
            title="今回のキャンプに持っていくか選定"
          >
            {isSelected ? '🎒 持参' : '💤 お休み'}
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

          {/* 詳細開閉ボタン */}
          <button
            onClick={() => setShowDetail(!showDetail)}
            className={`p-1 rounded text-xs transition cursor-pointer ${
              showDetail ? 'text-amber-400 bg-amber-950/30' : 'text-zinc-400 hover:text-white'
            }`}
            title="収納・購入時期・メモ等の詳細表示"
          >
            {showDetail ? '▲' : '🔍'}
          </button>

          {/* 編集ボタン */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
            title="編集"
          >
            ✏️
          </button>

          {/* 削除ボタン */}
          <button
            onClick={() => onDeleteGear(item.id)}
            className="p-1 text-zinc-500 hover:text-red-400 text-xs cursor-pointer"
            title="削除"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* 下段: 詳細アコーディオン (タップ時表示) */}
      {showDetail && !isEditing && (
        <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 bg-[#18181B]/60 p-2.5 rounded-lg font-sans animate-fade-in">
          <div>
            <span className="text-zinc-500 font-bold block text-[10px]">📦 収納・保管場所:</span>
            <span>{item.storage_location || '未設定'}</span>
          </div>
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

      {/* 下段: 編集モード */}
      {isEditing && (
        <div className="pt-2 border-t border-zinc-800/80 space-y-2 bg-[#18181B] p-3 rounded-lg animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="商品名"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-[#27272A] border border-zinc-700 rounded px-2 py-1 text-xs text-white"
            />
            <input
              type="number"
              placeholder="重量(g)"
              value={editWeight}
              onChange={(e) => setEditWeight(Number(e.target.value))}
              className="bg-[#27272A] border border-zinc-700 rounded px-2 py-1 text-xs text-white"
            />
            <input
              type="number"
              placeholder="価格(円)"
              value={editPrice}
              onChange={(e) => setEditPrice(Number(e.target.value))}
              className="bg-[#27272A] border border-zinc-700 rounded px-2 py-1 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="収納場所 (例: コンテナA)"
              value={editStorage}
              onChange={(e) => setEditStorage(e.target.value)}
              className="bg-[#27272A] border border-zinc-700 rounded px-2 py-1 text-xs text-white"
            />
            <input
              type="text"
              placeholder="購入時期 (例: 2026/05)"
              value={editPurchaseDate}
              onChange={(e) => setEditPurchaseDate(e.target.value)}
              className="bg-[#27272A] border border-zinc-700 rounded px-2 py-1 text-xs text-white"
            />
            <input
              type="text"
              placeholder="燃料/電源 (例: USB-C, OD缶)"
              value={editFuelType}
              onChange={(e) => setEditFuelType(e.target.value)}
              className="bg-[#27272A] border border-zinc-700 rounded px-2 py-1 text-xs text-white"
            />
          </div>

          <input
            type="text"
            placeholder="メモ (例: スタッキング可、要充電)"
            value={editMemo}
            onChange={(e) => setEditMemo(e.target.value)}
            className="w-full bg-[#27272A] border border-zinc-700 rounded px-2 py-1 text-xs text-white"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={handleSaveEdit}
              className="bg-[#00E676] text-black text-xs font-bold px-3 py-1 rounded cursor-pointer"
            >
              保存
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded cursor-pointer"
            >
              中止
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
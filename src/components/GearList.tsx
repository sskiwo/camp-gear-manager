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
  gears: GearItem[];
  openCategories: Record<string, boolean>;
  onToggleCategoryOpen: (catName: string) => void;
  onTogglePacked: (id: string, currentStatus: boolean) => void;
  onUpdateQuantity: (id: string, currentQty: number, delta: number) => void;
  onUpdateGear: (id: string, data: any) => Promise<void>;
  onDeleteGear: (id: string) => void;
  onReorderGears?: (reorderedGears: GearItem[]) => void;
};

const CATEGORIES = [
  'ベースギア',
  '調理ギア',
  '衣類',
  'その他・日用品',
  '食料・消耗品',
];

const CATEGORY_COLORS = {
  ベースギア: '#FF5500',
  調理ギア: '#FFB800',
  衣類: '#00E5FF',
  'その他・日用品': '#E040FB',
  '食料・消耗品': '#00E676',
};

export default function GearList({
  gears,
  openCategories,
  onToggleCategoryOpen,
  onTogglePacked,
  onUpdateQuantity,
  onUpdateGear,
  onDeleteGear,
  onReorderGears,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBrand, setEditBrand] = useState('');
  const [editModelNumber, setEditModelNumber] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editCategory, setEditCategory] = useState('ベースギア');
  const [editWeight, setEditWeight] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editProductUrl, setEditProductUrl] = useState('');

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const startEdit = (item: GearItem) => {
    setEditingId(item.id);
    setEditBrand(item.brand || '');
    setEditModelNumber(item.model_number || '');
    setEditProductName(item.product_name || item.name || '');
    setEditCategory(item.category || 'ベースギア');
    setEditWeight(String(item.weight || 0));
    setEditPrice(String(item.price || 0));
    setEditQuantity(String(item.quantity || 1));
    setEditProductUrl(item.product_url || '');
  };

  const handleSave = async (id: string) => {
    const fullName = `${editBrand} ${editProductName} ${editModelNumber}`.trim();
    const defaultSearchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(fullName || editProductName)}`;
    const finalUrl = editProductUrl.trim() ? editProductUrl.trim() : defaultSearchUrl;

    await onUpdateGear(id, {
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
    setEditingId(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetId: string, categoryGears: GearItem[]) => {
    if (!draggedItemId || draggedItemId === targetId) return;

    const dragIndex = categoryGears.findIndex((g) => g.id === draggedItemId);
    const dropIndex = categoryGears.findIndex((g) => g.id === targetId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newCatGears = [...categoryGears];
    const [removed] = newCatGears.splice(dragIndex, 1);
    newCatGears.splice(dropIndex, 0, removed);

    const otherGears = gears.filter((g) => !categoryGears.some((cg) => cg.id === g.id));
    const reorderedAll = [...otherGears, ...newCatGears];

    if (onReorderGears) {
      onReorderGears(reorderedAll);
    }
    setDraggedItemId(null);
  };

  return (
    <section className="bg-[#18181B] p-5 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
      <h2 className="text-lg font-extrabold text-white">🎒 積載パッキングリスト</h2>

      {gears.length === 0 ? (
        <p className="text-center text-zinc-500 py-6 font-medium bg-[#27272A]/50 rounded-xl border border-zinc-800 text-xs">
          ギアや食料がまだ登録されていません。
        </p>
      ) : (
        CATEGORIES.map((catName) => {
          const categoryGears = gears.filter((g) => (g.category || 'ベースギア') === catName);
          if (categoryGears.length === 0) return null;

          const catColor = CATEGORY_COLORS[catName as keyof typeof CATEGORY_COLORS] || '#FF5500';
          const isOpen = openCategories[catName] !== false;

          const catIcon =
            catName === 'ベースギア'
              ? '⛺'
              : catName === '調理ギア'
              ? '🍳'
              : catName === '衣類'
              ? '👕'
              : catName === 'その他・日用品'
              ? '📦'
              : '🍱';

          return (
            <div key={catName} id={`category-${catName}`} className="border rounded-xl overflow-hidden shadow-md scroll-mt-6" style={{ borderColor: `${catColor}50` }}>
              <button
                onClick={() => onToggleCategoryOpen(catName)}
                style={{ backgroundColor: `${catColor}15`, borderColor: `${catColor}40` }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left transition hover:brightness-125 border-b cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{catIcon}</span>
                  <span style={{ color: catColor }} className="font-extrabold text-sm tracking-wide">{catName}</span>
                  <span className="text-xs text-zinc-400 font-normal">({categoryGears.length}件)</span>
                </div>
                <span style={{ color: catColor }} className="text-xs font-bold">{isOpen ? '▲ 閉じる' : '▼ 開く'}</span>
              </button>

              {isOpen && (
                <div className="p-2 space-y-2 bg-[#121215]">
                  {categoryGears.map((item) => {
                    const qty = item.quantity || 1;
                    const totalWeight = (item.weight || 0) * qty;
                    const totalPrice = (item.price || 0) * qty;
                    const isDragging = draggedItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(item.id, categoryGears)}
                        className={`p-2.5 rounded-lg border text-xs transition select-none ${
                          isDragging ? 'opacity-30 border-[#FF5500] bg-zinc-800' : ''
                        } ${
                          item.is_packed
                            ? 'bg-[#27272A] border-zinc-700/80 hover:border-zinc-500'
                            : 'bg-zinc-900/50 opacity-40 border-transparent'
                        }`}
                      >
                        {editingId === item.id ? (
                          /* ✏️ 編集モード */
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              <input type="text" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="メーカー名" />
                              <input type="text" value={editModelNumber} onChange={(e) => setEditModelNumber(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="型番" />
                              <input type="text" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="商品名" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs font-bold">
                                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                              </select>
                              <input type="number" step="10" min="0" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="重量(g)" />
                              <input type="number" step="100" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="価格(円)" />
                              <input type="number" step="1" min="1" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="数量" />
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
                              <button onClick={() => handleSave(item.id)} className="bg-[#FF5500] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-[#E04B00]">保存</button>
                              <button onClick={() => setEditingId(null)} className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded text-[11px] font-bold">キャンセル</button>
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
                              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                {item.brand && (
                                  <span style={{ color: catColor, borderColor: `${catColor}60`, backgroundColor: `${catColor}20` }} className="text-[10px] px-1.5 py-0.2 rounded font-bold border shrink-0">
                                    {item.brand}
                                  </span>
                                )}
                                <span className="font-bold text-xs text-white truncate">{item.product_name || item.name}</span>
                                {item.model_number && (
                                  <span className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1 py-0.2 rounded font-mono shrink-0">[{item.model_number}]</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] pl-8 sm:pl-0">
                              <span className="font-semibold text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                                {totalWeight.toLocaleString()}g / ¥{totalPrice.toLocaleString()}
                              </span>
                              <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded">
                                <button onClick={() => onUpdateQuantity(item.id, qty, -1)} className="px-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700">-</button>
                                <span className="px-1.5 font-bold text-[#FF5500] text-[10px]">{qty}</span>
                                <button onClick={() => onUpdateQuantity(item.id, qty, 1)} className="px-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700">+</button>
                              </div>
                              {item.product_url && (
                                <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="text-[#FFB800] hover:underline font-bold" title="Amazonで購入・詳細を見る">🛒</a>
                              )}
                              <button onClick={() => startEdit(item)} className="text-zinc-400 hover:text-white" title="編集">✏️</button>
                              <button onClick={() => onDeleteGear(item.id)} className="text-zinc-400 hover:text-[#FF5500]" title="削除">🗑️</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Camera, X, Loader2, Lightbulb, RefreshCw, RotateCcw, CheckSquare, Square, Check } from 'lucide-react';

export interface ScannedItem {
  product_name: string;
  brand: string;
  weight: number;
  price: number;
  category: string;
  is_weight_estimated?: boolean;
  purchase_date?: string;
  fuel_type?: string;
  memo?: string;
}

interface GearSearchProps {
  onAddGear: (item: ScannedItem) => Promise<void> | void;
  onOpenManualInput?: () => void;
  onSearchQueryChange?: (query: string) => void;
}

const compressImage = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], 'scanned_gear.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

const CATEGORIES = ['ベース', '調理', '衣類', 'その他', '消耗品'];

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

export default function GearSearch({ onAddGear, onSearchQueryChange }: GearSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [scannedResults, setScannedResults] = useState<ScannedItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    }
  };

  const runAiSearch = async (file?: File | null, query?: string, isRefresh = false) => {
    let targetQuery = query !== undefined ? query : searchQuery;

    if (targetQuery.startsWith('data:')) {
      targetQuery = '';
    }
    if (targetQuery.length > 1000) {
      targetQuery = targetQuery.substring(0, 1000);
    }

    const fileToUpload = file !== undefined ? file : lastSelectedFile;

    if (!fileToUpload && !targetQuery.trim()) {
      setErrorMessage('キーワードを入力するか、カメラ/フォトライブラリから写真を選択してください');
      return;
    }

    setErrorMessage(null);
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsScanning(true);
    }

    const formData = new FormData();
    if (fileToUpload) {
      const compressedFile = await compressImage(fileToUpload);
      formData.append('file', compressedFile);
    }
    if (targetQuery.trim()) {
      formData.append('queryHint', targetQuery.trim());
    }

    if (isRefresh && scannedResults.length > 0) {
      const excludeNames = scannedResults.map((item) => item.product_name).join(', ');
      formData.append('exclude', excludeNames);
    }

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '検索・解析に失敗しました');
      }

      if (data.results && data.results.length > 0) {
        const formattedResults = data.results.map((item: any) => ({
          ...item,
          purchase_date: '',
          fuel_type: '不要/なし',
          memo: '',
        }));
        setScannedResults(formattedResults);
        setSelectedIndices(new Set(formattedResults.map((_: any, i: number) => i)));
        setShowModal(true);
      } else {
        setErrorMessage('該当するギア情報が見つかりませんでした。別の写真やキーワードでお試しください。');
      }
    } catch (err: any) {
      console.error('Search/Scan Error:', err);
      setErrorMessage(err.message || 'エラーが発生しました');
    } finally {
      setIsScanning(false);
      setIsRefreshing(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLastSelectedFile(null);
    runAiSearch(null, searchQuery, false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLastSelectedFile(file);
    runAiSearch(file, searchQuery, false);

    if (e.target) e.target.value = '';
  };

  const handleRefreshResults = () => {
    runAiSearch(lastSelectedFile, searchQuery, true);
  };

  // 🔄 安全なオブジェクト一括更新関数（重量が消えるバグを解消）
  const handleResultChange = (index: number, updates: Partial<ScannedItem>) => {
    setScannedResults((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        ...updates,
      };
      return updated;
    });
  };

  const toggleItemSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === scannedResults.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(scannedResults.map((_, i) => i)));
    }
  };

  const handleBulkAdd = async () => {
    const itemsToAdd = scannedResults.filter((_, i) => selectedIndices.has(i));
    if (itemsToAdd.length === 0 || isSubmittingBulk) return;

    setIsSubmittingBulk(true);
    try {
      for (const item of itemsToAdd) {
        await onAddGear(item);
      }
      setShowModal(false);
      setScannedResults([]);
      setSelectedIndices(new Set());
      setSearchQuery('');
      setLastSelectedFile(null);
    } catch (err: any) {
      console.error('Bulk add error:', err);
      alert('ギアの登録中にエラーが発生しました');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-[18px]">ギアを追加</h2>
        <button
          type="button"
          onClick={() => setShowTipsModal(true)}
          className="text-[12px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-normal transition"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>撮影のコツ</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <form onSubmit={handleFormSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="型番・商品名・Amazon URLを入力"
            className="w-full bg-[#27272A] border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 text-[12px] focus:outline-none focus:border-[#FF5500] transition shadow-inner font-normal"
          />
        </div>

        <button
          type="submit"
          disabled={isScanning || isRefreshing}
          className="py-3 px-5 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl shadow transition flex items-center justify-center shrink-0 text-[12px] cursor-pointer disabled:opacity-50"
        >
          {isScanning ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <span>検索</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning || isRefreshing}
          className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
          title="写真またはアルバムから自動入力"
        >
          <Camera className="w-5 h-5" />
        </button>
      </form>

      <div className="pt-2 pb-2">
        <Link
          href="/community"
          className="w-full inline-flex items-center justify-center gap-2 bg-transparent hover:bg-[#FF5500]/10 text-white border border-[#FF5500] px-4 py-3 rounded-xl text-[12px] font-bold transition shadow-sm group cursor-pointer"
        >
          <span>みんなのギアから追加</span>
          <span className="group-hover:translate-x-1 transition-transform">➔</span>
        </Link>
      </div>

      {errorMessage && !showModal && (
        <p className="text-[12px] text-red-500 font-normal">{errorMessage}</p>
      )}

      {showTipsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#18181B] border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-[14px] flex items-center gap-1.5 text-amber-400">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>AI解析率を高める撮影のコツ (厳選4項目)</span>
              </h3>
              <button
                onClick={() => setShowTipsModal(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-3 text-[12px] leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <li className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <span className="font-semibold text-white block text-[12px]">
                  🔍 1. 検索窓の「文字」と組み合わせる【効果絶大】
                </span>
                <p className="text-zinc-300 font-normal">
                  検索枠に「SOTO」や「テント」などブランドや種類を入力してカメラを押すと、テキスト＋写真で認識精度が劇的に上がります！
                </p>
              </li>

              <li className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <span className="font-semibold text-white block text-[12px]">
                  🔤 2. 複数ギアの一括認識
                </span>
                <p className="text-zinc-300 font-normal">
                  広げたキャンプギア一式を撮影すると、AIが自動で複数のギアを個別に検出してリストアップします。
                </p>
              </li>

              <li className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <span className="font-semibold text-white block text-[12px]">
                  ☀️ 3. 型番やロゴの文字を写す
                </span>
                <p className="text-zinc-300 font-normal">
                  本体の印字・パッケージの型番（例: ST-310）が入ると特定がスムーズです。
                </p>
              </li>

              <li className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <span className="font-semibold text-white block text-[12px]">
                  🧾 4. レシートや注文画面のスクショもOK
                </span>
                <p className="text-zinc-300 font-normal">
                  商品名と金額が入った画像ならそのまま自動入力可能です！
                </p>
              </li>
            </ul>

            <button
              onClick={() => setShowTipsModal(false)}
              className="w-full py-2.5 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl text-[12px] transition cursor-pointer shadow"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 🎯 AI検出結果モーダル（重量編集修正＆追加項目を統合） */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#18181B] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-zinc-100 font-semibold text-[14px] flex items-center gap-1.5">
                  <span>✨</span>
                  <span>AI検出結果 ({scannedResults.length}件)</span>
                </h3>
                <p className="text-zinc-400 text-[12px] font-normal">追加するアイテムを選択し、詳細情報を入力・修正してください</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-2.5 border-b border-zinc-800/80 bg-[#121215] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-[12px] font-normal text-zinc-300 hover:text-white transition cursor-pointer"
              >
                {selectedIndices.size === scannedResults.length ? (
                  <CheckSquare className="w-4 h-4 text-[#FF5500]" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-500" />
                )}
                <span>全選択 / 全解除</span>
              </button>
              <span className="text-[12px] font-mono text-zinc-400 font-normal">
                選択中: <strong className="text-white font-bold">{selectedIndices.size}</strong> / {scannedResults.length} 点
              </span>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {isRefreshing ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF5500]" />
                  <p className="text-[12px] font-normal">別の候補を検索中...</p>
                </div>
              ) : (
                scannedResults.map((item, index) => {
                  const isChecked = selectedIndices.has(index);

                  return (
                    <div
                      key={index}
                      className={`border rounded-xl p-3.5 space-y-3 transition ${
                        isChecked
                          ? 'bg-[#27272A]/80 border-zinc-700 shadow-sm'
                          : 'bg-[#18181B]/50 border-zinc-800/70 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItemSelection(index)}
                            className="w-4 h-4 accent-[#FF5500] rounded cursor-pointer shrink-0"
                          />
                          <span className="text-[12px] font-bold text-white">
                            アイテム #{index + 1}
                          </span>
                        </label>

                        <select
                          value={item.category || 'ベース'}
                          onChange={(e) => handleResultChange(index, { category: e.target.value })}
                          className="bg-[#18181B] text-[#FF5500] border border-zinc-700 rounded-lg px-2 py-1 text-[12px] font-semibold focus:outline-none focus:border-[#FF5500] cursor-pointer"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* 商品名・ブランド */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[12px] text-zinc-400 font-normal block">商品名・型番</label>
                          <input
                            type="text"
                            value={item.product_name}
                            onChange={(e) => handleResultChange(index, { product_name: e.target.value })}
                            className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:outline-none focus:border-[#FF5500] font-normal"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[12px] text-zinc-400 font-normal block">ブランド・メーカー</label>
                          <input
                            type="text"
                            value={item.brand || ''}
                            onChange={(e) => handleResultChange(index, { brand: e.target.value })}
                            className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:outline-none focus:border-[#FF5500] font-normal"
                          />
                        </div>
                      </div>

                      {/* 重量・価格 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[12px] text-zinc-400 font-normal block">重量 (g)</label>
                            <button
                              type="button"
                              onClick={() => handleResultChange(index, { is_weight_estimated: !item.is_weight_estimated })}
                              className={`text-[12px] font-normal px-1.5 py-0.2 rounded border cursor-pointer ${
                                item.is_weight_estimated
                                  ? 'bg-amber-950/70 border-amber-800/80 text-amber-400 font-bold'
                                  : 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400 font-bold'
                              }`}
                            >
                              {item.is_weight_estimated ? '[推定]' : '[確定]'}
                            </button>
                          </div>
                          <input
                            type="number"
                            step="10"
                            value={item.weight === 0 ? '' : item.weight}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              handleResultChange(index, {
                                weight: val,
                                is_weight_estimated: false,
                              });
                            }}
                            className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono tabular-nums text-right focus:outline-none focus:border-[#FF5500] font-normal"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[12px] text-zinc-400 font-normal block">価格 (円)</label>
                          <input
                            type="number"
                            step="100"
                            value={item.price === 0 ? '' : item.price}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              handleResultChange(index, { price: val });
                            }}
                            className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-mono tabular-nums text-right focus:outline-none focus:border-[#FF5500] font-normal"
                          />
                        </div>
                      </div>

                      {/* 🎯 追加項目: 購入時期・燃料タイプ */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[12px] text-zinc-400 font-normal block">購入時期</label>
                          <input
                            type="month"
                            value={item.purchase_date || ''}
                            onChange={(e) => handleResultChange(index, { purchase_date: e.target.value })}
                            className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:outline-none font-normal"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[12px] text-zinc-400 font-normal block">燃料・電源タイプ</label>
                          <select
                            value={item.fuel_type || '不要/なし'}
                            onChange={(e) => handleResultChange(index, { fuel_type: e.target.value })}
                            className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:outline-none font-normal cursor-pointer"
                          >
                            {FUEL_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 🎯 追加項目: メモ */}
                      <div className="space-y-0.5">
                        <label className="text-[12px] text-zinc-400 font-normal block">メモ</label>
                        <input
                          type="text"
                          placeholder="例: リビング棚保管、コンテナA"
                          value={item.memo || ''}
                          onChange={(e) => handleResultChange(index, { memo: e.target.value })}
                          className="w-full bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:outline-none focus:border-[#FF5500] font-normal"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-[#18181B] space-y-2 shrink-0">
              <button
                type="button"
                onClick={handleBulkAdd}
                disabled={selectedIndices.size === 0 || isSubmittingBulk}
                className="w-full py-3 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-[12px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isSubmittingBulk ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>登録中...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>選択した {selectedIndices.size} 件をまとめて登録</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRefreshing || isScanning || isSubmittingBulk}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-normal rounded-lg text-[12px] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>写真を選び直す</span>
                </button>

                <button
                  type="button"
                  onClick={handleRefreshResults}
                  disabled={isRefreshing || isScanning || isSubmittingBulk}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-normal rounded-lg text-[12px] transition border border-zinc-700 hover:border-zinc-600 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5500]" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>別の候補（再検索）</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
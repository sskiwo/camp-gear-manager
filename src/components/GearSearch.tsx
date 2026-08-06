'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Camera, Plus, X, Loader2, Lightbulb, RefreshCw, RotateCcw } from 'lucide-react';

interface ScannedItem {
  product_name: string;
  brand: string;
  weight: number;
  price: number;
  category: string;
}

interface GearSearchProps {
  onAddGear: (item: ScannedItem) => void;
  onOpenManualInput?: () => void;
  onSearchQueryChange?: (query: string) => void;
}

// 💡 高画質写真を自動リサイズ・軽量化＆MIMEタイプ補正関数
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

export default function GearSearch({ onAddGear, onOpenManualInput, onSearchQueryChange }: GearSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scannedResults, setScannedResults] = useState<ScannedItem[]>([]);
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

  // 🚀 共通AI検索・解析実行関数
  const runAiSearch = async (file?: File | null, query?: string, isRefresh = false) => {
    let targetQuery = query !== undefined ? query : searchQuery;

    // Data URLなどの貼り付け事故防止
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

    // 💡 更新（別候補表示）の場合は、現在画面に出ている候補商品名を除外リストとして渡す
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
        setScannedResults(data.results);
        setShowModal(true);
      } else {
        setErrorMessage('該当する別のギア情報が見つかりませんでした。');
      }
    } catch (err: any) {
      console.error('Search/Scan Error:', err);
      setErrorMessage(err.message || 'エラーが発生しました');
    } finally {
      setIsScanning(false);
      setIsRefreshing(false);
    }
  };

  // 🔍 フォーム送信（「検索」ボタン押下時）
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLastSelectedFile(null);
    runAiSearch(null, searchQuery, false);
  };

  // 📷 画像選択時（カメラ/ライブラリ選択時）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLastSelectedFile(file);
    runAiSearch(file, searchQuery, false);

    if (e.target) e.target.value = '';
  };

  // 🔄 別候補の取得（更新）
  const handleRefreshResults = () => {
    runAiSearch(lastSelectedFile, searchQuery, true);
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* カード見出し ＆ 撮影のコツガイドボタン */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">ギアを追加</h2>
        <button
          type="button"
          onClick={() => setShowTipsModal(true)}
          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium transition"
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

      {/* 検索・スキャンフォームエリア */}
      <form onSubmit={handleFormSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="型番・商品名・Amazon URLを入力"
            className="w-full bg-[#27272A] border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FF5500] transition shadow-inner"
          />
        </div>

        {/* 検索ボタン (オレンジベタ塗り) */}
        <button
          type="submit"
          disabled={isScanning || isRefreshing}
          className="py-3 px-5 bg-[#FF5500] hover:bg-[#e04c00] text-white font-medium rounded-xl shadow transition flex items-center justify-center shrink-0 text-sm cursor-pointer disabled:opacity-50"
        >
          {isScanning ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <span>検索</span>
          )}
        </button>

        {/* カメラ・写真選択ボタン */}
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

      {/* みんなのギアから追加 ボタン */}
      <div className="pt-1">
        <Link
          href="/community"
          className="w-full inline-flex items-center justify-center gap-2 bg-transparent hover:bg-[#FF5500]/10 text-white border border-[#FF5500] px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm group cursor-pointer"
        >
          <span>みんなのギアから追加</span>
          <span className="group-hover:translate-x-1 transition-transform">➔</span>
        </Link>
      </div>

      {errorMessage && !showModal && (
        <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
      )}

      {/* 💡 撮影のコツ モーダル (厳選4項目) */}
      {showTipsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#18181B] border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-xs sm:text-sm flex items-center gap-1.5 text-amber-400">
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

            <ul className="space-y-3 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <li className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <span className="font-bold text-white block text-xs">
                  🔍 1. 検索窓の「文字」と組み合わせる【効果絶大】
                </span>
                <p className="text-zinc-300">
                  検索枠に「SOTO」や「テント」などブランドや種類を入力してカメラを押すと、テキスト＋写真で認識精度が劇的に上がります！
                </p>
              </li>

              <li className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <span className="font-bold text-white block text-xs">
                  🔤 2. 型番やロゴの文字を写す
                </span>
                <p className="text-zinc-300">
                  本体の印字・パッケージの型番（例: ST-310）が入ると特定がスムーズです。
                </p>
              </li>

              <li className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <span className="font-bold text-white block text-xs">
                  ☀️ 3. 明るい場所でギア単体を置く
                </span>
                <p className="text-zinc-300">
                  他のギアの映り込みや影を減らすと誤認識を防げます。
                </p>
              </li>

              <li className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50 space-y-1">
                <span className="font-bold text-white block text-xs">
                  🧾 4. レシートや注文画面のスクショもOK
                </span>
                <p className="text-zinc-300">
                  商品名と金額が入った画像ならそのまま自動入力可能です！
                </p>
              </li>
            </ul>

            <button
              onClick={() => setShowTipsModal(false)}
              className="w-full py-2.5 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* AIスキャン・検索結果モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#18181B] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-zinc-100 font-bold text-lg">AI検索・解析結果</h3>
                <p className="text-zinc-400 text-xs">リストに追加する項目を選んでください</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 候補カードエリア */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {isRefreshing ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF5500]" />
                  <p className="text-xs font-bold">別の候補を検索中...</p>
                </div>
              ) : (
                scannedResults.map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#27272A]/60 border border-zinc-700/60 rounded-xl p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-[#FF5500]/10 text-[#FF5500] rounded-full border border-[#FF5500]/20">
                          {item.category || 'その他'}
                        </span>
                        <h4 className="text-zinc-100 font-semibold text-base mt-1">
                          {item.product_name}
                        </h4>
                        {item.brand && (
                          <p className="text-zinc-400 text-xs">ブランド: {item.brand}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-700/40 text-xs text-zinc-300">
                      <div className="flex items-center gap-4">
                        <span>⚖️ {item.weight || 0}g</span>
                        <span>💰 ¥{(item.price || 0).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => {
                          onAddGear(item);
                          setShowModal(false);
                        }}
                        className="px-3 py-1.5 bg-[#FF5500] hover:bg-[#e04c00] text-white font-medium rounded-lg shadow transition flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>追加</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* モーダル下部フッター操作エリア（写真選び直し ＆ 別の候補表示） */}
            <div className="p-3 border-t border-zinc-800 bg-[#18181B] flex flex-col sm:flex-row gap-2 items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRefreshing || isScanning}
                className="w-full sm:w-auto px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>写真を選び直す</span>
              </button>

              <button
                type="button"
                onClick={handleRefreshResults}
                disabled={isRefreshing || isScanning}
                className="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition border border-zinc-700 hover:border-zinc-600 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRefreshing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5500]" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>別の候補を表示（更新）</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
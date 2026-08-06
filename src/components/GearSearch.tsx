'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Camera, Plus, X, Loader2 } from 'lucide-react';

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
            // 💡 常に image/jpeg 形式で File オブジェクトを作成
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
  const [scannedResults, setScannedResults] = useState<ScannedItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    }
  };

  // 🚀 共通検索API実行関数
  const runAiSearch = async (file?: File | null, query?: string) => {
    let targetQuery = query !== undefined ? query : searchQuery;

    // Data URLなどの貼り付け事故防止
    if (targetQuery.startsWith('data:')) {
      targetQuery = '';
    }
    if (targetQuery.length > 1000) {
      targetQuery = targetQuery.substring(0, 1000);
    }

    if (!file && !targetQuery.trim()) {
      setErrorMessage('キーワードを入力するか、カメラで撮影してください');
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);

    const formData = new FormData();
    if (file) {
      // 画像送信前に自動圧縮＆JPEG固定
      const compressedFile = await compressImage(file);
      formData.append('file', compressedFile);
    }
    if (targetQuery.trim()) {
      formData.append('queryHint', targetQuery.trim());
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
        setErrorMessage('該当するギア情報が見つかりませんでした。');
      }
    } catch (err: any) {
      console.error('Search/Scan Error:', err);
      setErrorMessage(err.message || 'エラーが発生しました');
    } finally {
      setIsScanning(false);
    }
  };

  // 🔍 フォーム送信（「検索」ボタン押下時）
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runAiSearch(null, searchQuery);
  };

  // 📷 画像選択時（「カメラ」ボタン押下時）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    runAiSearch(file, searchQuery);

    if (e.target) e.target.value = '';
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* カード見出し */}
      <h2 className="text-white font-bold text-lg">ギアを追加</h2>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
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
          disabled={isScanning}
          className="py-3 px-5 bg-[#FF5500] hover:bg-[#e04c00] text-white font-medium rounded-xl shadow transition flex items-center justify-center shrink-0 text-sm cursor-pointer disabled:opacity-50"
        >
          {isScanning ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <span>検索</span>
          )}
        </button>

        {/* カメラボタン (暗いグレー背景・アイコンのみ) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
          title="写真で自動入力"
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

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {scannedResults.map((item, index) => (
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
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
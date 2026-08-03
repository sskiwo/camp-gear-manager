'use client';

import React, { useRef } from 'react';
import { supabase } from '@/lib/supabase';

type GearItem = {
  id?: string;
  name: string;
  brand?: string;
  model_number?: string;
  product_name?: string;
  category?: string;
  weight: number;
  price: number;
  quantity?: number;
  is_packed?: boolean;
  is_consumable?: boolean;
  product_url?: string;
};

type Props = {
  gears: GearItem[];
  selectedCampId: string; // 選択中のキャンプIDを受け取る
  onGearsUpdated: () => void;
};

// カテゴリー名の表記揺れ吸収マッピング
const normalizeCategory = (cat: string): string => {
  const trimmed = (cat || '').trim();
  if (trimmed.includes('調理') || trimmed.includes('燃料')) return '調理ギア';
  if (trimmed.includes('衣類') || trimmed.includes('防寒')) return '衣類';
  if (trimmed.includes('食料') || trimmed.includes('消耗品')) return '食料・消耗品';
  if (trimmed.includes('ベース')) return 'ベースギア';
  return 'その他・日用品';
};

export default function CsvManager({ gears, selectedCampId, onGearsUpdated }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSVエクスポート
  const handleExportCsv = () => {
    if (gears.length === 0) {
      alert('出力するギアデータがありません。');
      return;
    }

    const header = 'カテゴリー,メーカー名,商品名,型番,重量(g),価格(円),数量,パッキング済(1/0),商品URL\n';
    const rows = gears
      .map((g) => {
        const cat = `"${g.category || 'ベースギア'}"`;
        const brand = `"${g.brand || ''}"`;
        const pname = `"${g.product_name || g.name || ''}"`;
        const model = `"${g.model_number || ''}"`;
        const weight = g.weight || 0;
        const price = g.price || 0;
        const qty = g.quantity || 1;
        const packed = g.is_packed ? 1 : 0;
        const url = `"${g.product_url || ''}"`;
        return [cat, brand, pname, model, weight, price, qty, packed, url].join(',');
      })
      .join('\n');

    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.download = `camp_gears_${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSVインポート
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedCampId) {
      alert('キャンプが選択されていません。上部でキャンプを選択してください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/);
      const newItems: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const clean = matches.map((m) => m.replace(/^"|"$/g, '').trim());

        if (clean.length < 3) continue;

        const rawCat = clean[0] || 'ベースギア';
        const brand = clean[1] || '';
        const pname = clean[2] || '';
        const model = clean[3] || '';
        const weight = Number(clean[4]) || 0;
        const price = Number(clean[5]) || 0;
        const quantity = Number(clean[6]) || 1;
        const isPacked = clean[7] === '1' || clean[7] === 'true';
        const url = clean[8] && clean[8] !== '0' ? clean[8] : '';

        const cat = normalizeCategory(rawCat);
        const fullName = `${brand} ${pname} ${model}`.trim();

        newItems.push({
          camp_id: selectedCampId, // 選択中キャンプIDを紐付け！
          name: fullName || pname || '名称未設定ギア',
          brand: brand,
          product_name: pname || fullName,
          model_number: model,
          category: cat,
          weight: weight,
          price: price,
          quantity: Math.max(1, quantity),
          is_packed: isPacked,
          is_consumable: cat === '食料・消耗品',
          product_url: url,
        });
      }

      if (newItems.length === 0) {
        alert('有効なギアデータが見つかりませんでした。');
        return;
      }

      const { error } = await supabase.from('gears').insert(newItems);

      if (error) {
        console.error('Import Error:', error);
        alert(`インポートに失敗しました:\n${error.message}`);
      } else {
        alert(`🎉 ${newItems.length}件のギアを一括登録しました！`);
        onGearsUpdated();
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="bg-[#18181B] p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
      <div className="text-center sm:text-left">
        <h3 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
          📂 CSVバックアップ・一括管理
        </h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          ギアリストをCSVファイルで保存・復元できます
        </p>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button
          onClick={handleExportCsv}
          className="flex-1 sm:flex-none bg-[#27272A] hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center"
        >
          📥 CSV書き出し
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 sm:flex-none bg-[#FF5500] hover:bg-[#E04B00] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center"
        >
          📤 CSV読み込み
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
      </div>
    </div>
  );
}
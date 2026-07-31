'use client';

import { useState, useRef } from 'react';
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
  is_packed: boolean;
  is_consumable?: boolean;
  product_url?: string;
};

type Props = {
  gears: GearItem[];
  onGearsUpdated: () => void;
};

export default function CsvManager({ gears, onGearsUpdated }: Props) {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (gears.length === 0) {
      alert('エクスポートするギアがありません。');
      return;
    }

    const headers = [
      'カテゴリー',
      'メーカー名',
      '商品名',
      '型番',
      '重量(g)',
      '価格(円)',
      '数量',
      'パッキング済(1/0)',
      '商品URL',
    ];

    const rows = gears.map((g) => [
      `"${(g.category || 'ベースギア').replace(/"/g, '""')}"`,
      `"${(g.brand || '').replace(/"/g, '""')}"`,
      `"${(g.product_name || g.name || '').replace(/"/g, '""')}"`,
      `"${(g.model_number || '').replace(/"/g, '""')}"`,
      g.weight || 0,
      g.price || 0,
      g.quantity || 1,
      g.is_packed ? 1 : 0,
      `"${(g.product_url || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `camp_gears_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== '');
        if (lines.length <= 1) {
          alert('データが含まれていないか、ヘッダーのみです。');
          setIsImporting(false);
          return;
        }

        const newGears: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((col) => col.replace(/^"(.*)"$/, '$1').trim());

          if (cols.length < 3) continue;

          const category = cols[0] || 'ベースギア';
          const brand = cols[1] || '';
          const productName = cols[2] || '無題のギア';
          const modelNumber = cols[3] || '';
          const weight = Number(cols[4]) || 0;
          const price = Number(cols[5]) || 0;
          const quantity = Math.max(1, Number(cols[6]) || 1);
          const isPacked = cols[7] === '1' || cols[7]?.toLowerCase() === 'true';
          const productUrl = cols[8] || `https://www.amazon.co.jp/s?k=${encodeURIComponent(productName)}`;

          const fullName = `${brand} ${productName} ${modelNumber}`.trim();
          const isConsumable = category === '食料・消耗品';

          newGears.push({
            name: fullName || productName,
            brand,
            model_number: modelNumber,
            product_name: productName,
            category,
            weight,
            price,
            quantity,
            is_packed: isPacked,
            is_consumable: isConsumable,
            product_url: productUrl,
          });
        }

        if (newGears.length > 0) {
          const { error } = await supabase.from('gears').insert(newGears);
          if (error) {
            alert(`登録に失敗しました: ${error.message}`);
          } else {
            alert(`🎉 ${newGears.length}件のギアを一括登録しました！`);
            onGearsUpdated();
          }
        } else {
          alert('有効なデータが見つかりませんでした。');
        }
      } catch (err: any) {
        alert(`CSVの読み込みエラー: ${err.message}`);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-[#18181B] p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
      <div className="text-xs text-zinc-400 text-center sm:text-left">
        <span className="font-extrabold text-white block mb-0.5">📂 CSVバックアップ・一括登録</span>
        <span>ギアリストのデータ保存（ダウンロード）や一括復元ができます</span>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
        <button
          onClick={handleExport}
          className="flex-1 sm:flex-none px-3.5 py-2 bg-[#27272A] hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
        >
          📥 CSV書き出し
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex-1 sm:flex-none px-3.5 py-2 bg-[#FF5500] hover:bg-[#E04B00] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          {isImporting ? '読み込み中...' : '📤 CSV取り込み'}
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
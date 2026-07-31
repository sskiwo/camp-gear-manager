'use client';

import React, { useRef } from 'react';
import { supabase } from '@/lib/supabase';

type GearItem = {
  id: string;
  name: string;
  brand?: string;
  model_number?: string;
  weight: number;
  price: number;
  quantity: number;
  category: string;
  amazon_url?: string;
  source_url?: string;
  is_packed: boolean;
  is_consumable: boolean;
};

type Props = {
  gears: GearItem[];
  onImportSuccess: () => void;
};

export default function CsvManager({ gears, onImportSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCsv = () => {
    if (gears.length === 0) {
      alert('エクスポートするギアデータがありません');
      return;
    }

    const headers = [
      'id',
      'brand',
      'model_number',
      'name',
      'weight',
      'price',
      'quantity',
      'category',
      'amazon_url',
      'source_url',
      'is_packed',
      'is_consumable',
    ];

    const rows = gears.map((g) => [
      `"${g.id || ''}"`,
      `"${(g.brand || '').replace(/"/g, '""')}"`,
      `"${(g.model_number || '').replace(/"/g, '""')}"`,
      `"${(g.name || '').replace(/"/g, '""')}"`,
      g.weight || 0,
      g.price || 0,
      g.quantity || 1,
      `"${g.category || 'other'}"`,
      `"${(g.amazon_url || '').replace(/"/g, '""')}"`,
      `"${(g.source_url || '').replace(/"/g, '""')}"`,
      g.is_packed ? 'true' : 'false',
      g.is_consumable ? 'true' : 'false',
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `camp_gears_backup_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== '');
        if (lines.length <= 1) {
          alert('CSVファイルにデータが含まれていません');
          return;
        }

        const newGears = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((col) => col.replace(/^"|"$/g, '').trim());
          if (cols.length < 4) continue;

          const brand = cols[1] || '';
          const model_number = cols[2] || '';
          const name = cols[3] || '名称未設定ギア';
          const weight = parseInt(cols[4]) || 0;
          const price = parseInt(cols[5]) || 0;
          const quantity = parseInt(cols[6]) || 1;
          const category = cols[7] || 'other';
          const amazon_url = cols[8] || '';
          const source_url = cols[9] || '';
          const is_packed = cols[10] === 'true';
          const is_consumable = cols[11] === 'true';

          newGears.push({
            brand,
            model_number,
            name,
            weight,
            price,
            quantity,
            category,
            amazon_url,
            source_url,
            is_packed,
            is_consumable,
          });
        }

        if (newGears.length === 0) {
          alert('有効なギアデータが見つかりませんでした');
          return;
        }

        const { error } = await supabase.from('gears').insert(newGears);

        if (error) {
          alert(`インポートエラー: ${error.message}`);
          return;
        }

        alert(`${newGears.length}件のギアをインポートしました！`);
        onImportSuccess();
      } catch (err: any) {
        alert(`CSV読み込み失敗: ${err.message}`);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl text-white">
      <h2 className="text-lg font-bold text-[#FF5500] mb-3 flex items-center gap-2">
        📂 CSVバックアップ・一括登録
      </h2>
      <p className="text-xs text-zinc-400 mb-4">
        登録済みのギアリストをCSVファイルとしてバックアップ保存したり、一括で復元・追加できます。
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExportCsv}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 transition-all active:scale-95 flex items-center gap-1.5"
        >
          📥 CSVで出力 (バックアップ)
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 transition-all active:scale-95 flex items-center gap-1.5"
        >
          📤 CSVから読み込み (一括登録)
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportCsv}
          accept=".csv"
          className="hidden"
        />
      </div>
    </div>
  );
}
'use client';

import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GearItem } from './GearItemCard';
import { Download, Upload, Loader2, FileSpreadsheet } from 'lucide-react';

interface CsvManagerProps {
  gears: GearItem[];
  selectedCampId: string;
  onGearsUpdated: () => void;
}

export default function CsvManager({
  gears,
  selectedCampId,
  onGearsUpdated,
}: CsvManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // CSVエクスポート（書き出し）
  const handleExportCsv = () => {
    if (gears.length === 0) {
      alert('書き出すギアデータがありません。');
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        '商品名',
        'ブランド',
        '型番',
        'カテゴリー',
        '重量(g)',
        '価格(円)',
        '数量',
        '持参フラグ',
        '消耗品フラグ',
        '購入年月',
        '燃料タイプ',
        'メモ',
      ];

      const rows = gears.map((g) => [
        `"${(g.product_name || g.name || '').replace(/"/g, '""')}"`,
        `"${(g.brand || '').replace(/"/g, '""')}"`,
        `"${(g.model_number || '').replace(/"/g, '""')}"`,
        `"${(g.category || 'ベース').replace(/"/g, '""')}"`,
        g.weight || 0,
        g.price || 0,
        g.quantity || 1,
        g.is_selected !== false ? '1' : '0',
        g.is_consumable ? '1' : '0',
        `"${(g.purchase_date || '').replace(/"/g, '""')}"`,
        `"${(g.fuel_type || '').replace(/"/g, '""')}"`,
        `"${(g.memo || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `camp_gears_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export Error:', err);
      alert('CSVの書き出しに失敗しました。');
    } finally {
      setIsExporting(false);
    }
  };

  // CSVインポート（読み込み）
  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCampId) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text
        .split(/\r\n|\n|\r/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length <= 1) {
        alert('有効なデータが含まれていません。');
        setIsImporting(false);
        return;
      }

      // ヘッダーを除いた行をパース
      const dataRows = lines.slice(1);
      const parsedGears = dataRows.map((line) => {
        // カンマ区切り（ダブルクォート考慮）
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        const matches: string[] = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          let field = match[1] || '';
          if (field.startsWith('"') && field.endsWith('"')) {
            field = field.slice(1, -1).replace(/""/g, '"');
          }
          matches.push(field);
          if (regex.lastIndex >= line.length) break;
        }

        const [
          productName = '',
          brand = '',
          modelNumber = '',
          category = 'ベース',
          weightStr = '0',
          priceStr = '0',
          quantityStr = '1',
          isSelectedStr = '1',
          isConsumableStr = '0',
          purchaseDate = '',
          fuelType = '',
          memo = '',
        ] = matches;

        const fullName = `${brand} ${productName} ${modelNumber}`.trim() || productName || '名称未設定ギア';

        return {
          camp_id: selectedCampId,
          name: fullName,
          product_name: productName || fullName,
          brand: brand,
          model_number: modelNumber,
          category: category || 'ベース',
          weight: Number(weightStr) || 0,
          price: Number(priceStr) || 0,
          quantity: Math.max(1, Number(quantityStr) || 1),
          is_selected: isSelectedStr !== '0',
          is_packed: false,
          is_consumable: isConsumableStr === '1' || category === '消耗品',
          purchase_date: purchaseDate,
          fuel_type: fuelType,
          memo: memo,
          total_brought_count: 0,
          total_used_count: 0,
          is_emergency_gear: false,
          is_weight_estimated: false,
        };
      });

      if (parsedGears.length > 0) {
        const { error } = await supabase.from('gears').insert(parsedGears);
        if (error) throw error;
        alert(`🎉 ${parsedGears.length}件のギアをインポートしました！`);
        onGearsUpdated();
      }
    } catch (err: any) {
      console.error('CSV Import Error:', err);
      alert(`CSVの読み込みに失敗しました:\n${err.message || err}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <section className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-zinc-100 font-semibold text-[14px] flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
          <span>CSVデータ管理</span>
        </h3>
        <span className="text-[12px] text-zinc-500 font-normal">バックアップ・一括管理</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportCsv}
        accept=".csv"
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* CSV書き出しボタン */}
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting || gears.length === 0}
          className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-normal rounded-xl border border-zinc-700 transition flex items-center justify-center gap-2 text-[12px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
          title="現在のキャンプギア一覧をCSV形式で保存"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
          ) : (
            <Download className="w-4 h-4 text-zinc-400" />
          )}
          <span>CSV書き出し（保存）</span>
        </button>

        {/* 🎯 CSV読み込みボタン（サブアクショントーンに統一） */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-normal rounded-xl border border-zinc-700 transition flex items-center justify-center gap-2 text-[12px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
          title="CSVファイルからギアデータを一括インポート"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
          ) : (
            <Upload className="w-4 h-4 text-zinc-400" />
          )}
          <span>CSV読み込み（追加）</span>
        </button>
      </div>
    </section>
  );
}
'use client';

import Link from 'next/link';
import SplitBill from '@/components/SplitBill';

export default function SplitBillPage() {
  return (
    <main className="min-h-screen bg-[#F6F5EF] text-[#333333] p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* トップに戻るボタン */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs bg-white text-[#384F41] border border-[#E0DED3] px-4 py-2 rounded-xl font-bold hover:bg-[#F6F5EF] transition shadow-sm"
          >
            ← パッキングリストに戻る
          </Link>
        </div>

        {/* 割り勘コンポーネント */}
        <SplitBill />
      </div>
    </main>
  );
}
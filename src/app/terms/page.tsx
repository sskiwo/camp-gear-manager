import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '利用規約 | Camp Gear Manager',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>トップへ戻る</span>
        </Link>

        <header className="border-b border-zinc-800 pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            利用規約
          </h1>
          <p className="text-xs text-zinc-500 mt-1">制定日: 2026年3月1日</p>
        </header>

        <div className="space-y-6 text-xs text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第1条（適用）</h2>
            <p>
              本規約は、Camp Gear Manager（以下、「本サービス」）の利用条件を定めるものです。利用者の皆さまには、本規約に従って本サービスをご利用いただきます。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第2条（禁止事項）</h2>
            <p>利用者は、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスのサーバーやネットワークの機能を破壊・妨害する行為</li>
              <li>他の利用者の迷惑となる行為や不当なデータ改ざん</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第3条（サービスの変更・中断）</h2>
            <p>
              本サービスは、利用者に事前に通知することなく、内容の変更や提供の中断・停止を行うことができるものとします。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第4条（保証の否認および免責）</h2>
            <p>
              本サービスは、提供するギア情報や重量計算結果についてその正確性を完全に保証するものではありません。利用により生じた損害について、当サービス運営者は一切の責任を負いません。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
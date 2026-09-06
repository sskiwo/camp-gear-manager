import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: '利用規約 | Camp Gear Manager',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 sm:p-8 font-sans flex flex-col justify-between">
      <div className="max-w-3xl mx-auto space-y-6 w-full flex-1">
        <Link className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition" href="/">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>トップへ戻る</span>
        </Link>

        <header className="border-b border-zinc-800 pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            利用規約
          </h1>
          <p className="text-xs text-zinc-500 mt-1">最終改定日: 2026年3月1日</p>
        </header>

        <div className="space-y-6 text-xs text-zinc-300 leading-relaxed pb-12">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第1条（適用）</h2>
            <p>
              本規約は、Camp Gear Manager（以下「本サービス」といいます）の利用条件を定めるものです。利用者の皆さまには、本規約に従って本サービスをご利用いただきます。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第2条（禁止事項）</h2>
            <p>利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスのサーバーやネットワークの機能を破壊、妨害、または過度な負荷をかける行為</li>
              <li>APIエンドポイントへの不正な大量リクエストやスクレイピング行為</li>
              <li>他の利用者の迷惑となる行為や不当なデータ改ざん・不正アクセス</li>
              <li>その他、当サービスが不適切と判断する行為</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第3条（AI機能および提供情報の免責）</h2>
            <p>
              1. 本サービスが提供するギア情報、重量・価格・カテゴリーの自動推計値、およびAI（人工知能）による解析・画像認識結果は、あくまで参考情報・目安であり、その正確性、完全性、有用性を保証するものではありません。
            </p>
            <p>
              2. 実際の積載重量、ギアの耐荷重、安全性、適合性等の最終確認は、利用者ご自身の責任において行ってください。本サービスの算出結果に起因して生じた事故、損害、超過手荷物料金の発生等について、当サービスは一切の責任を負いません。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第4条（データ共有および管理）</h2>
            <p>
              本サービスのURL共有機能（リアルタイム共有等）を利用して第三者へリストを開示・共有する場合、そのURLの管理および共有に伴うトラブル・損害について、当サービスは関与せず一切の責任を負わないものとします。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第5条（外部ストア・アフィリエイト連携）</h2>
            <p>
              本サービス内に掲載されるAmazon等の外部リンク先における商品・サービスの購入、取引、および紛争については、利用者と当該販売元との間で直接解決されるものとし、当サービスはこれらについて責任を負いません。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第6条（サービスの変更・中断・責任の制限）</h2>
            <p>
              1. 本サービスは、利用者に事前に通知することなく、内容の変更、提供の中断または終了を行うことができるものとします。
            </p>
            <p>
              2. 当サービスの過失（重過失を除きます）により利用者に損害が生じた場合であっても、当サービスが負う賠償責任は、利用者が直接かつ現実に被った通常の損害（上限1,000円）を限度とします。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第7条（規約の変更）</h2>
            <p>
              当サービスは、必要と判断した場合にはいつでも本規約を変更できるものとします。変更後の利用規約を本サービス上に掲載した時点で効力を生じるものとし、変更後に利用者が本サービスを利用した場合、変更後の規約に同意したものとみなします。
            </p>
          </section>
        </div>
      </div>

      {/* フッター（規約・ポリシー・お問い合わせリンク＆Amazon免責文言） */}
      <div className="max-w-3xl mx-auto w-full">
        <Footer />
      </div>
    </main>
  );
}
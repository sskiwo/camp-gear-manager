import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'プライバシーポリシー | Camp Gear Manager',
};

export default function PrivacyPage() {
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
            プライバシーポリシー
          </h1>
          <p className="text-xs text-zinc-500 mt-1">最終改定日: 2026年3月1日</p>
        </header>

        <div className="space-y-6 text-xs text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">1. 個人情報の収集・利用目的</h2>
            <p>
              当サービス（Camp Gear Manager）では、利用者が入力したギア情報、キャンプ設定、お問い合わせ内容を、サービスの円滑な提供および利便性向上の目的でのみ利用します。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">2. Amazonアソシエイト・プログラムについて</h2>
            <p>
              当サイトは、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。第三者がコンテンツおよび宣伝を提供し、訪問者から直接情報を収集し、訪問者のブラウザにクッキーを設定または認識する場合があります。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">3. アクセス解析・Cookie（クッキー）について</h2>
            <p>
              サービス向上のため、Cookieやアクセス解析ツールを利用する場合があります。利用者はブラウザの設定によりCookieの受け入れを拒否することができます。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">4. 免責事項</h2>
            <p>
              当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねます。また、紹介先ストア（Amazon等）での購入・取引に関するトラブルにつきましては、各販売店へ直接お問い合わせください。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
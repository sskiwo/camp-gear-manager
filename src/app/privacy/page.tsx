import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'プライバシーポリシー | Camp Gear Manager',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 sm:p-8 font-sans flex flex-col justify-between">
      <div className="max-w-3xl mx-auto space-y-6 w-full flex-1">
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

        <div className="space-y-6 text-xs text-zinc-300 leading-relaxed pb-12">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第1条（収集する情報）</h2>
            <p>
              当サービス（Camp Gear Manager）では、ユーザーが入力・登録したギア情報、キャンプ設定、お問い合わせ情報のほか、以下の情報を収集する場合があります。
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>AI解析用のアップロード画像および検索クエリ</li>
              <li>アクセスログ、IPアドレス、ブラウザ情報等のアクセス解析データ</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第2条（情報の利用目的）</h2>
            <p>収集した情報は、以下の目的で利用いたします。</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>サービスの提供、維持、および利便性向上のため</li>
              <li>AIによるギア情報の解析・自動補正、重量計算等の機能提供のため</li>
              <li>不正利用の防止およびサービスの安全な運営のため</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第3条（外部送信および第三者提供）</h2>
            <p>
              当サービスでは、画像認識やテキスト解析を行うために、Google Gemini APIへデータ（アップロード画像・クエリ等）を送信する場合があります。法令に基づく場合を除き、事前の同意なく個人情報を第三者に無断で提供することはありません。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第4条（Cookie・アクセス解析・広告配信）</h2>
            <p>
              サービス向上のためCookie等を利用する場合があります。また、将来的に第三者による広告配信（パーソナライズ広告等）やアクセス解析ツールを導入する際、トラッキング等の目的でCookieを使用する可能性があります。ユーザーはブラウザの設定によりCookieの受け入れを拒否することができます。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第5条（Amazonアソシエイト・プログラム）</h2>
            <p>
              当サイトは、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。第三者がコンテンツおよび宣伝を提供し、訪問者から直接情報を収集し、訪問者のブラウザにクッキーを設定または認識する場合があります。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第6条（運営者・お問い合わせ窓口）</h2>
            <p>
              本サービスに関するお問い合わせや、情報の開示・訂正・削除等のご請求は、<Link href="/contact" className="text-[#FF5500] hover:underline">お問い合わせページ</Link>よりご連絡ください。
            </p>
          </section>
        </div>
      </div>

      {/* 共通フッター */}
      <div className="max-w-3xl mx-auto w-full">
        <Footer />
      </div>
    </main>
  );
}
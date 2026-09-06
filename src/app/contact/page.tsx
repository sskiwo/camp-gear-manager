import Link from 'next/link';
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';

export const metadata = {
  title: 'お問い合わせ | Camp Gear Manager',
};

// 🎯 ご自身のGoogleフォームURLまたは連絡先メールアドレスに置き換えてください
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>トップへ戻る</span>
        </Link>

        <header className="border-b border-zinc-800 pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            お問い合わせ
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            ご意見・ご要望・不具合報告などはこちらからお送りください。
          </p>
        </header>

        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">フィードバックフォーム</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              外部の問い合わせ受付フォーム（Googleフォーム）が開きます。
            </p>
          </div>

          <div className="pt-2">
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FF5500] hover:bg-[#e04c00] text-white text-xs font-bold rounded-xl transition shadow-lg active:scale-95 cursor-pointer"
            >
              <span>問い合わせフォームを開く</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
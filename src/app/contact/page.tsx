import Link from 'next/link';
import { ArrowLeft, Mail, ExternalLink, MessageSquare } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'お問い合わせ | Camp Gear Manager',
};

// 🎯 設定したGoogleフォームのURL
const GOOGLE_FORM_URL = 'https://forms.gle/e5Lf5GT4MFiHSUwy7';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 sm:p-8 font-sans flex flex-col justify-between">
      <div className="max-w-2xl mx-auto space-y-6 w-full flex-1">
        {/* ヘッダー・戻るナビゲーション */}
        <header className="border-b border-zinc-800 pb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#FF5500]" />
              <span>お問い合わせ</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              ご意見・ご要望・不具合のご報告はこちらからお送りください。
            </p>
          </div>

          <Link
            href="/"
            className="bg-[#27272A] hover:bg-zinc-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition border border-zinc-700 shrink-0 flex items-center gap-1 active:scale-95 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>戻る</span>
          </Link>
        </header>

        {/* Googleフォーム案内カード */}
        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6 text-[#FF5500]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">
              Googleフォームにて受け付けております
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
              機能の改善要望、新機能のリクエスト、バグの報告など、キャンパーの皆さまからの貴重なご意見をお待ちしております。
            </p>
          </div>

          <div className="pt-2">
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF5500] hover:bg-[#e04c00] text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg active:scale-95 cursor-pointer"
            >
              <span>お問い合わせフォームを開く</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        <Footer />
      </div>
    </main>
  );
}
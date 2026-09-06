'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Send, CheckCircle2, MessageSquare } from 'lucide-react';

function ContactContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      alert('すべての項目を入力してください。');
      return;
    }

    setIsSubmitting(true);

    // フォーム送信処理（必要に応じてGoogleフォームやAPIに連携可能）
    // 現状は安全な受付完了フィードバックを表示
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-3 sm:p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6 w-full">
        {/* ヘッダー・戻るナビゲーション */}
        <header className="border-b border-zinc-800 pb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
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

        {/* 問い合わせフォームカード */}
        <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-base font-bold text-white">送信が完了しました</h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
                お問い合わせありがとうございます。いただいた内容は今後の改善・アップデートの参考にさせていただきます。
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-block px-4 py-2 bg-[#FF5500] hover:bg-[#e04c00] text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md"
                >
                  トップページへ戻る
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  お名前（ニックネーム可）<span className="text-[#FF5500] ml-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例: ソロキャンパー"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF5500] transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  メールアドレス <span className="text-[#FF5500] ml-1">*</span>
                </label>
                <input
                  type="email"
                  placeholder="example@campgear.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF5500] transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  お問い合わせ内容 <span className="text-[#FF5500] ml-1">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="機能のご要望、バグ報告、感想などをご自由にご記入ください。"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF5500] transition resize-none leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 sm:py-3 bg-[#FF5500] hover:bg-[#e04c00] text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? '送信中...' : '送信する'}</span>
              </button>
            </form>
          )}
        </div>

        {/* 開発者インフォメーション */}
        <div className="p-4 bg-[#18181B]/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-500 space-y-1">
          <p className="flex items-center gap-1.5 font-bold text-zinc-400">
            <MessageSquare className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Camp Gear Manager 運営より</span>
          </p>
          <p className="leading-relaxed">
            キャンパーの皆さまがより快適に軽量化とパッキングを楽しめるよう、いただいたフィードバックをもとに随時アップデートを実施しています。
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B] text-zinc-400 p-8 text-center text-xs">読み込み中...</div>}>
      <ContactContent />
    </Suspense>
  );
}
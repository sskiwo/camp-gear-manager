import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="pt-8 pb-10 border-t border-zinc-800 space-y-4 text-center">
      {/* 規約・問い合わせリンク */}
      <nav className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 flex-wrap">
        <Link href="/terms" className="hover:text-zinc-200 transition underline underline-offset-4">
          利用規約
        </Link>
        <span className="text-zinc-700">|</span>
        <Link href="/privacy" className="hover:text-zinc-200 transition underline underline-offset-4">
          プライバシーポリシー
        </Link>
        <span className="text-zinc-700">|</span>
        <Link href="/contact" className="hover:text-zinc-200 transition underline underline-offset-4">
          お問い合わせ
        </Link>
      </nav>

      {/* Amazonアソシエイト規定文言 */}
      <p className="text-[10px] text-zinc-600 font-normal max-w-xl mx-auto leading-relaxed px-4">
        ※ 当サイトはAmazon.co.jpアソシエイト・プログラムに参加しており、適格販売により収入を得ています。
      </p>

      <p className="text-[10px] text-zinc-700 font-mono">
        © 2026 Camp Gear Manager
      </p>
    </footer>
  );
}
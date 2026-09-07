'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Users, FileText, Shield, Mail, Home } from 'lucide-react';

const GOOGLE_FORM_URL = 'https://forms.gle/e5Lf5GT4MFiHSUwy7';

export default function Footer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCampId = searchParams.get('camp');
  const fromCampId = searchParams.get('from');

  // 現在「みんなのギアギャラリー」ページにいるかどうかを判定
  const isCommunityPage = pathname === '/community';

  // ギャラリーへ移動するURL（現在のキャンプIDを保持）
  const galleryUrl = currentCampId ? `/community?from=${currentCampId}` : '/community';

  // トップ（マイパッキング）へ戻るURL（直前に開いていたキャンプがあればそこへ復帰）
  const targetHomeCampId = fromCampId || currentCampId;
  const homeUrl = targetHomeCampId ? `/?camp=${targetHomeCampId}` : '/';

  return (
    <footer className="border-t border-zinc-800/80 pt-6 pb-10 mt-8 text-zinc-500 text-xs space-y-4">
      {/* ナビゲーションリンク */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-zinc-400 font-bold">
        {/* 🎯 ギャラリーにいる時は「マイパッキング（トップ）」を表示、それ以外のページでは「みんなのギアギャラリー」を表示 */}
        {isCommunityPage ? (
          <Link
            href={homeUrl}
            className="hover:text-[#FF5500] transition flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>マイパッキングに戻る</span>
          </Link>
        ) : (
          <Link
            href={galleryUrl}
            className="hover:text-[#00E5FF] transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>みんなのギアギャラリー</span>
          </Link>
        )}

        <Link
          href="/terms"
          className="hover:text-zinc-200 transition flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>利用規約</span>
        </Link>

        <Link
          href="/privacy"
          className="hover:text-zinc-200 transition flex items-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>プライバシーポリシー</span>
        </Link>

        {/* Googleフォームへの直通リンク */}
        <a
          href={GOOGLE_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#FF5500] transition flex items-center gap-1.5"
        >
          <Mail className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>お問い合わせ</span>
        </a>
      </div>

      {/* Amazonアソシエイト規約遵守文言 ＆ コピーライト */}
      <div className="text-center space-y-1.5 text-[11px] text-zinc-500 max-w-xl mx-auto px-4 leading-relaxed">
        <p className="text-[10px] text-zinc-600">
          Camp Gear Manager は、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。
        </p>
        <p className="text-zinc-600 font-mono">© 2026 Camp Gear Manager. All rights reserved.</p>
      </div>
    </footer>
  );
}
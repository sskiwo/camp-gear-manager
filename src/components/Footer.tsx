'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Users, FileText, Shield, Mail } from 'lucide-react';

export default function Footer() {
  const searchParams = useSearchParams();
  const currentCampId = searchParams.get('camp');

  // 現在開いているキャンプIDを保持したままギャラリーへ移動するURL
  const galleryUrl = currentCampId ? `/community?from=${currentCampId}` : '/community';

  return (
    <footer className="border-t border-zinc-800/80 pt-6 pb-12 mt-8 text-zinc-500 text-xs space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-zinc-400 font-bold">
        {/* みんなのギアギャラリー */}
        <Link
          href={galleryUrl}
          className="hover:text-[#00E5FF] transition flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>みんなのギアギャラリー</span>
        </Link>

        {/* 利用規約 */}
        <Link
          href="/terms"
          className="hover:text-zinc-200 transition flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>利用規約</span>
        </Link>

        {/* プライバシーポリシー */}
        <Link
          href="/privacy"
          className="hover:text-zinc-200 transition flex items-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>プライバシーポリシー</span>
        </Link>

        {/* 🎯 お問い合わせリンクを復活 */}
        <Link
          href="/contact"
          className="hover:text-[#FF5500] transition flex items-center gap-1.5"
        >
          <Mail className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>お問い合わせ</span>
        </Link>
      </div>

      <div className="text-center space-y-1 text-[11px] text-zinc-600 font-mono">
        <p className="flex items-center justify-center gap-1">
          <span>Camp Gear Manager</span>
          <span>•</span>
          <span className="text-[#FF5500]">UL Packing & Gear Tool</span>
        </p>
        <p>© 2026 Camp Gear Manager. All rights reserved.</p>
      </div>
    </footer>
  );
}
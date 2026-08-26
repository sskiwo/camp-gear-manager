import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Camp Gear Manager',
    short_name: 'CampGear',
    description: 'キャンプギア重量＆パッキング管理アプリ',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090B',
    theme_color: '#FF5500',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
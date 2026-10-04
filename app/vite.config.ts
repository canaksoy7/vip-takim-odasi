import fs from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * İki derleme:
 *  - `npm run build`        → dist/        : PWA (manifest + service worker, çevrimdışı), statik barındırma için
 *  - `npm run build:single` → dist-single/ : tek dosya VIP_Hafiza_Demo.html, sunucusuz (file://) açılır.
 *    file:// altında service worker çalışmadığı için bu derlemede PWA eklentisi yoktur.
 */
export default defineConfig(({ mode }) => {
  const tekDosya = mode === 'single';
  return {
    base: './',
    plugins: [
      react(),
      ...(tekDosya ? [viteSingleFile({ removeViteModuleLoader: true }), tekDosyaHtml()] : [pwa()]),
    ],
    build: tekDosya
      ? { outDir: 'dist-single', emptyOutDir: true, copyPublicDir: false, chunkSizeWarningLimit: 4000 }
      : { chunkSizeWarningLimit: 2000 },
    test: { environment: 'node' },
  };
});

function pwa() {
  return VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    includeAssets: ['icons/favicon.svg'],
    manifest: {
      id: './',
      name: 'VIP Hafıza — Demo',
      short_name: 'VIP Hafıza',
      description: 'VIP Hafıza mobil prototipi. Yalnızca uydurma demo verisi içerir.',
      lang: 'tr',
      start_url: './',
      scope: './',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#0b2a4a',
      theme_color: '#0b2a4a',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      navigateFallback: 'index.html',
    },
  });
}

/** Tek dosya derlemesi: ikonu data URI olarak gömer, dış dosya bağlantılarını kaldırır, çıktıyı yeniden adlandırır. */
function tekDosyaHtml(): Plugin {
  return {
    name: 'vip-tek-dosya-html',
    enforce: 'post',
    transformIndexHtml(html) {
      const svg = fs.readFileSync('public/icons/favicon.svg', 'utf8');
      return html
        .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(svg)}" />`)
        .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '');
    },
    generateBundle(_opts, bundle) {
      const html = bundle['index.html'];
      if (html) html.fileName = 'VIP_Hafiza_Demo.html';
    },
  };
}

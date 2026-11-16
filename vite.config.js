import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Kehityksessä lomakkeen PHP-pyyntö ohjataan paikalliselle PHP-palvelimelle:
    // php -S localhost:8000 -t public
    proxy: {
      '/contact.php': 'http://localhost:8000',
    },
  },
  build: {
    // Monisivutila: pelisivu on oma HTML-tiedostonsa, jotta sen koodi ei kasvata etusivun latausta.
    // pelit/index.html eikä pelit.html, jotta osoite on /pelit/.
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        pelit: fileURLToPath(new URL('pelit/index.html', import.meta.url)),
      },
      // Molempien sivujen yhteinen paketti (React, animaatiot, navi, footer, Jari-Bot jne.)
      // saisi muuten nimensä jonkin sattumanvaraisen komponentin mukaan (esim. JariBot-….js).
      // Annetaan sille kuvaava nimi. Muuttaa vain tiedostonimen, ei sitä, mitä paketeissa on.
      output: {
        chunkFileNames: (chunk) =>
          // Kenoviiva tai vinoviiva: Windowsissa polut voivat olla kumpaa tahansa
          chunk.moduleIds.some((id) => /[\\/]node_modules[\\/]react-dom[\\/]/.test(id))
            ? 'assets/yhteinen-[hash].js'
            : 'assets/[name]-[hash].js',
        // Yhteisen paketin CSS:llä ei ole omaa lähdetiedostoa (originalFileNames on tyhjä)
        assetFileNames: (asset) =>
          asset.names.some((n) => n.endsWith('.css')) && asset.originalFileNames.length === 0
            ? 'assets/yhteinen-[hash][extname]'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
})
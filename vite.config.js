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
    },
  },
})
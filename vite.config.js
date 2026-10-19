import react from '@vitejs/plugin-react'
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
})
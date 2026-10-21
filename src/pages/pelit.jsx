import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';

import '@fontsource-variable/unbounded';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/600.css';
import '../index.css';

import PelitPage from './PelitPage.jsx';

// Pelisivun (/pelit/) käynnistys: sama runko kuin src/main.jsx:ssä, mutta sisältönä pelialue
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <PelitPage />
    </MotionConfig>
  </StrictMode>,
);

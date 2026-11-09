import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/alegreya/400.css';
import '@fontsource/alegreya/700.css';
import './styles/tokens.css';
import './styles/version-styles.css';
import './styles/global.css';
import { App } from './app/App';
import { removeLegacyStorage } from './state/legacyStorage';

removeLegacyStorage();

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

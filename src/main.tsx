import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/inter';
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/600.css';
import '@fontsource/oswald/700.css';
import './styles/theme.css';

import { App } from './App';
import { Providers } from './app/providers';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);

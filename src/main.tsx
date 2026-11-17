import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import StoryApp from './StoryApp';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoryApp />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ReportApp from './ReportApp';
import './styles.css';
import './report.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReportApp />
  </StrictMode>,
);

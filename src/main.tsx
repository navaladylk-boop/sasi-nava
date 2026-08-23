import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runPayrollEngineTests } from './services/payrollEngine.test.ts';

// Run LankaHR Payroll engine verification test suite
runPayrollEngineTests();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

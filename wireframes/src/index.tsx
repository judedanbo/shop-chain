import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './context/AppProviders';
import App from './App';
import { SaleVerificationPage } from './pages/verify/SaleVerificationPage';
import './styles/globals.css';

/** Renders the verify page for /#/verify/... routes, otherwise the full app */
const Root: React.FC = () => {
  const [isVerify, setIsVerify] = useState(() => window.location.hash.startsWith('#/verify/'));

  useEffect(() => {
    const onHashChange = () => {
      setIsVerify(window.location.hash.startsWith('#/verify/'));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (isVerify) return <SaleVerificationPage />;

  return (
    <AppProviders>
      <App />
    </AppProviders>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);

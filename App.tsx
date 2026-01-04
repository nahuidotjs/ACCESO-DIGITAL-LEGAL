import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Converter } from './components/Converter';
import { StrategyGenerator } from './components/StrategyGenerator';
import { Analytics } from './components/Analytics';
import { AppView } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case AppView.CONVERTER:
        return <Converter />;
      case AppView.STRATEGY:
        return <StrategyGenerator />;
      case AppView.ANALYTICS:
        return <Analytics />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;

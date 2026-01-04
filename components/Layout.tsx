import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, FileText, ScrollText, BarChart3, Settings, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
  const navItems = [
    { view: AppView.DASHBOARD, label: 'Inicio', icon: LayoutDashboard },
    { view: AppView.CONVERTER, label: 'Digitalizador IA', icon: FileText },
    { view: AppView.STRATEGY, label: 'Diseñador de Política', icon: ScrollText },
    { view: AppView.ANALYTICS, label: 'Impacto y Métricas', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xl">
            <ShieldCheck size={28} />
            <span>LegisLink AI</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">GobTech Solutions</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === item.view
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 text-slate-400 hover:text-white px-4 py-2 w-full text-sm">
            <Settings size={18} />
            <span>Configuración</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-0">
          <h1 className="text-xl font-semibold text-slate-800">
            {currentView === AppView.DASHBOARD && 'Panel de Control'}
            {currentView === AppView.CONVERTER && 'Conversión de Leyes (PDF a Estándar)'}
            {currentView === AppView.STRATEGY && 'Generador de Política Pública'}
            {currentView === AppView.ANALYTICS && 'Análisis de Impacto'}
          </h1>
          <div className="flex items-center gap-4">
             <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium border border-green-200">
                Sistema Operativo
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

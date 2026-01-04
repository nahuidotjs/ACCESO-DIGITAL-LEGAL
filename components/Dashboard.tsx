import React from 'react';
import { AppView } from '../types';
import { ArrowRight, FileJson, FileType, Database, Network } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Bienvenido a la Transición Digital Legislativa</h2>
        <p className="text-blue-100 max-w-2xl text-lg mb-8">
          Diseñe, implemente y supervise la política pública para transformar documentos legales estáticos (PDF) en datos estructurados, accesibles y computables.
        </p>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => onNavigate(AppView.CONVERTER)}
            className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            Iniciar Digitalización <ArrowRight size={18} />
          </button>
          <button 
             onClick={() => onNavigate(AppView.STRATEGY)}
             className="bg-blue-800/50 backdrop-blur-sm text-white border border-blue-400/30 px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            Crear Hoja de Ruta
          </button>
        </div>
      </div>

      {/* Why standardize? */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
            <FileType size={24} />
          </div>
          <h3 className="font-semibold text-lg text-slate-800 mb-2">Interoperabilidad</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Convierte PDFs cerrados en formatos como XML (Akoma Ntoso), JSON o LaTeX que permiten el intercambio automático de datos entre instituciones.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
            <Database size={24} />
          </div>
          <h3 className="font-semibold text-lg text-slate-800 mb-2">Análisis de Datos</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Permite el uso de Big Data e IA para analizar contradicciones legales, impacto económico y dependencias entre normativas.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-4">
            <Network size={24} />
          </div>
          <h3 className="font-semibold text-lg text-slate-800 mb-2">Acceso Ciudadano</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Facilita la creación de aplicaciones ciudadanas, buscadores semánticos y herramientas de cumplimiento automatizado.
          </p>
        </div>
      </div>

      {/* Stats Mockup */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg text-slate-800">Estado de la Digitalización Nacional</h3>
          <span className="text-sm text-slate-500">Última actualización: Hoy</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Leyes Procesadas</div>
              <div className="text-2xl font-bold text-slate-800">1,240</div>
           </div>
           <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Ahorro Estimado</div>
              <div className="text-2xl font-bold text-green-600">$4.2M</div>
           </div>
           <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Acceso API</div>
              <div className="text-2xl font-bold text-blue-600">85k req/mo</div>
           </div>
           <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Adopción</div>
              <div className="text-2xl font-bold text-purple-600">32%</div>
           </div>
        </div>
      </div>
    </div>
  );
};

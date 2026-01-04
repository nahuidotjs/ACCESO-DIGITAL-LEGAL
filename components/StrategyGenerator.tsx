import React, { useState } from 'react';
import { generatePolicyStrategy } from '../services/geminiService';
import { PolicyStep } from '../types';
import { Lightbulb, Send, PlayCircle, Layers, Users, Server, Globe } from 'lucide-react';

export const StrategyGenerator: React.FC = () => {
  const [country, setCountry] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<PolicyStep[] | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country || !context) return;
    
    setLoading(true);
    try {
      const steps = await generatePolicyStrategy(context, country);
      setRoadmap(steps);
    } catch (error) {
      console.error(error);
      alert('Error al generar la estrategia. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getIconForPhase = (index: number) => {
    const icons = [Lightbulb, Layers, Server, Users, Globe];
    const Icon = icons[index % icons.length];
    return <Icon className="text-white" size={20} />;
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Generador de Estrategia de Política Pública</h2>
        <p className="text-slate-500 mt-2">
          Responde a la pregunta: <em>"¿Cómo lo hago?"</em>. Esta herramienta utiliza IA para crear una hoja de ruta personalizada para la adopción de leyes legibles por máquina en tu jurisdicción.
        </p>
      </div>

      {!roadmap ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                País o Jurisdicción
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ej: México, Ayuntamiento de Madrid, Colombia..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contexto y Objetivos Específicos
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ej: Queremos modernizar el archivo histórico del congreso para facilitar búsquedas a investigadores y reducir burocracia en programas sociales..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-32 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                loading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-[1.01]'
              }`}
            >
              {loading ? (
                'Diseñando Estrategia...'
              ) : (
                <>
                  <Send size={20} /> Generar Hoja de Ruta
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800">
               <span className="font-semibold">Estrategia Generada para:</span> {country}
            </div>
            <button 
              onClick={() => setRoadmap(null)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Generar nueva
            </button>
          </div>

          <div className="relative border-l-4 border-slate-200 ml-4 space-y-12">
            {roadmap.map((step, index) => (
              <div key={index} className="relative pl-8">
                {/* Timeline Node */}
                <div className="absolute -left-[22px] top-0 w-10 h-10 rounded-full bg-blue-600 border-4 border-white shadow-md flex items-center justify-center">
                  {getIconForPhase(index)}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                      Fase {index + 1}: {step.phase}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <PlayCircle size={16} className="text-green-600" />
                      Acciones Clave
                    </h4>
                    <ul className="space-y-2">
                      {step.actionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-900 text-slate-300 p-8 rounded-xl text-center">
             <h3 className="text-white text-lg font-bold mb-2">¿Listo para comenzar?</h3>
             <p className="mb-6">Utiliza la herramienta de "Digitalizador IA" en el menú para crear tu primer piloto.</p>
          </div>
        </div>
      )}
    </div>
  );
};

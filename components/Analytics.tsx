import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export const Analytics: React.FC = () => {
  // Mock data representing the projected impact of the policy
  const efficiencyData = [
    { name: 'Año 1', manual: 100, digital: 90 },
    { name: 'Año 2', manual: 105, digital: 70 },
    { name: 'Año 3', manual: 110, digital: 50 },
    { name: 'Año 4', manual: 115, digital: 35 },
    { name: 'Año 5', manual: 120, digital: 25 },
  ];

  const accessData = [
    { name: 'Q1', consultas: 1200 },
    { name: 'Q2', consultas: 1900 },
    { name: 'Q3', consultas: 3500 },
    { name: 'Q4', consultas: 5200 },
    { name: 'Q5', consultas: 8900 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Análisis de Impacto Proyectado</h2>
        <p className="text-slate-500 mt-2">Visualización de los beneficios estimados al implementar la política de estandarización digital.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chart 1: Time/Cost Reduction */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Reducción de Tiempo en Procesos Legales (Horas/Expediente)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={efficiencyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="manual" name="Proceso Actual (PDF/Papel)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="digital" name="Con Estándar Digital" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            *Estimación basada en la reducción de tiempo de búsqueda, transcripción y verificación manual.
          </p>
        </div>

        {/* Chart 2: Access Growth */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Crecimiento en Consultas Automatizadas (API)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={accessData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Line type="monotone" dataKey="consultas" name="Consultas API" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            *Proyección de uso de la API pública por startups, investigadores y otros ministerios.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
             <h4 className="text-indigo-900 font-bold text-lg mb-2">Transparencia</h4>
             <p className="text-indigo-700 text-sm">El formato estructurado permite auditar cambios en la ley línea por línea (diffing), aumentando la confianza pública.</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
             <h4 className="text-emerald-900 font-bold text-lg mb-2">Programas Sociales</h4>
             <p className="text-emerald-700 text-sm">Las reglas de elegibilidad extraídas automáticamente (JSON) pueden integrarse directamente en sistemas de validación de beneficiarios.</p>
          </div>
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
             <h4 className="text-amber-900 font-bold text-lg mb-2">Actualización</h4>
             <p className="text-amber-700 text-sm">Evita la fragmentación. Una "Single Source of Truth" en formato digital asegura que todos usen la versión vigente.</p>
          </div>
      </div>
    </div>
  );
};

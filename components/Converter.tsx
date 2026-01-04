import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, RefreshCw, Loader2, MousePointerClick, Calendar, Shield, ChevronDown, ChevronRight, Code2, Layers, Hash, FileJson, FileType, FileCode, FileText } from 'lucide-react';
import { convertDocument, analyzeDocumentStructure } from '../services/geminiService';
import { ProcessingResult, LawChunk, LawMetadata, IndexNode } from '../types';
import ReactMarkdown from 'react-markdown';

declare var mammoth: any;

// Recursive Tree Component
const IndexTreeItem: React.FC<{ 
  node: IndexNode; 
  onSelect: (node: IndexNode) => void;
  selectedId?: string;
  depth?: number 
}> = ({ node, onSelect, selectedId, depth = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  const isSelected = selectedId === node.id;
  
  return (
    <div className={`select-none ${depth > 0 ? 'ml-4 border-l border-slate-200 pl-2' : ''}`}>
      <div 
        className={`flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors ${
           isSelected ? 'bg-blue-100 text-blue-900' :
           node.type === 'TITULO' ? 'bg-slate-100 font-bold text-slate-900' : 
           'text-slate-700 hover:bg-slate-50 text-sm'
        }`}
        onClick={(e) => {
           e.stopPropagation();
           if (hasChildren) setExpanded(!expanded);
           onSelect(node);
        }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />
        ) : <div className="w-3.5" />}
        
        <span className="truncate flex-1">
          {node.id} {node.description && <span className="font-normal opacity-80 text-xs ml-1">- {node.description}</span>}
        </span>
        
        {node.pageRange && (
          <span className="text-[9px] text-slate-500 font-mono bg-white px-1 border border-slate-200 rounded ml-2">P.{node.pageRange}</span>
        )}
      </div>
      
      {expanded && hasChildren && (
        <div className="mt-1">
          {node.children!.map((child, idx) => (
            <IndexTreeItem key={idx} node={child} onSelect={onSelect} selectedId={selectedId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const Converter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [docKey, setDocKey] = useState<string>(''); 
  const [effectiveMimeType, setEffectiveMimeType] = useState<string>('');
  
  const [stage, setStage] = useState<'idle' | 'analyzing' | 'selecting' | 'processing' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [lawMetadata, setLawMetadata] = useState<LawMetadata | null>(null);
  const [selectedNode, setSelectedNode] = useState<IndexNode | null>(null);
  
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'structure' | 'markdown' | 'latex' | 'json' | 'xml' | 'html'>('structure');
  const [exportMode, setExportMode] = useState<'batch' | 'single'>('batch');
  const [selectedChunk, setSelectedChunk] = useState<LawChunk | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];

      // Validate Type
      if (selectedFile.type === 'application/msword') {
          setError("El formato .doc antiguo no es soportado. Por favor conviértalo a .docx o PDF.");
          return;
      }

      setFile(selectedFile);
      setDocKey(''); 
      setStage('idle');
      setResult(null);
      setError(null);
      setLawMetadata(null);
      setSelectedNode(null);
      setFileBase64(null);
      setEffectiveMimeType('');

      // Processing
      try {
        if (selectedFile.type === 'application/pdf') {
             const reader = new FileReader();
             reader.onloadend = () => {
                 const base64 = (reader.result as string).split(',')[1];
                 setFileBase64(base64);
                 setEffectiveMimeType('application/pdf');
             };
             reader.readAsDataURL(selectedFile);
        } else if (
             selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
             selectedFile.name.endsWith('.docx')
        ) {
             const reader = new FileReader();
             reader.onloadend = async (e) => {
                 const arrayBuffer = e.target?.result as ArrayBuffer;
                 try {
                     const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                     const text = result.value;
                     // Encode text to base64 to pass it to the service consistently
                     // Using decodeURIComponent(escape(..)) pattern for utf8 safe base64
                     const base64Text = btoa(unescape(encodeURIComponent(text)));
                     setFileBase64(base64Text);
                     setEffectiveMimeType('text/plain'); // We treat parsed docx as text
                 } catch (err) {
                     console.error(err);
                     setError("Error al leer el archivo Word. Asegúrese que sea un .docx válido.");
                 }
             };
             reader.readAsArrayBuffer(selectedFile);
        } else {
             setError("Formato no soportado. Use PDF o Word (.docx)");
        }
      } catch (e) {
         setError("Error procesando el archivo.");
      }
    }
  };

  const startAnalysis = async () => {
    if (!file || !fileBase64 || !effectiveMimeType) return;
    setStage('analyzing');
    setError(null);
    setProgress(10);
    setStatusMessage('Escaneando estructura y preámbulo...');

    try {
      const metadata = await analyzeDocumentStructure(fileBase64, effectiveMimeType);
      setLawMetadata({ ...metadata, docKey: docKey }); 
      setStage('selecting');
      setProgress(100);
    } catch (err) {
      setError('Error al analizar. Intente con otro documento.');
      console.error(err);
      setStage('idle');
    }
  };

  const processNode = async (node: IndexNode) => {
    if (!fileBase64 || !effectiveMimeType) return;
    setSelectedNode(node);
    setStage('processing');
    setError(null);
    setProgress(0);
    setStatusMessage(`Digitalizando ${node.id}...`);

    try {
      const data = await convertDocument(fileBase64, effectiveMimeType, node);
      setProgress(100);
      setStatusMessage('¡Completado!');
      setTimeout(() => {
        setResult(data);
        if (data.chunks && data.chunks.length > 0) setSelectedChunk(data.chunks[0]);
        setStage('completed');
      }, 600);
    } catch (err) {
      setError(`Error al procesar ${node.id}. Intente de nuevo.`);
      console.error(err);
      setStage('selecting');
    }
  };

  const resetProcess = () => {
    setStage('selecting');
    setResult(null);
  };

  /**
   * UNIVERSAL DOCUMENT BUILDER
   * Stitches Metadata (Key, Preamble) + Content (Chunks)
   */
  const generateExportContent = (format: 'markdown' | 'latex' | 'json' | 'xml' | 'html'): string => {
    if (!lawMetadata || !result) return "";

    // Determine what content to include (Single Article vs Full Batch)
    const chunksToInclude = exportMode === 'single' 
      ? (selectedChunk ? [selectedChunk] : [])
      : result.chunks;

    if (chunksToInclude.length === 0) return "No hay contenido seleccionado.";

    // Common Variables
    const title = lawMetadata.lawTitle;
    const key = lawMetadata.docKey || "S/N";
    const date = lawMetadata.lastReformDate;
    const preamble = lawMetadata.presentationText;

    // --- BUILDERS ---

    if (format === 'markdown') {
      const header = `# ${title}\n> **Clave Documento:** ${key}\n> **Última Reforma:** ${date}\n\n## Presentación / Preámbulo\n${preamble}\n\n---\n\n`;
      const body = chunksToInclude.map(c => 
        `### ${c.id} ${c.title || ''}\n${c.content}`
      ).join('\n\n---\n\n');
      return header + body;
    }

    if (format === 'latex') {
      const latexHeader = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{${title}}
\\author{Clave: ${key}}
\\date{Última Reforma: ${date}}

\\begin{document}

\\maketitle

\\begin{abstract}
${preamble}
\\end{abstract}

\\section*{Contenido}
`;
      const latexBody = chunksToInclude.map(c => `
\\begin{lawarticle}{${c.id}}{${c.title || ''}}
  ${c.content}
\\end{lawarticle}
`).join('\n');
      return `${latexHeader}${latexBody}\n\\end{document}`;
    }

    if (format === 'xml') {
        // Akoma Ntoso inspired structure
        return `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso>
  <act>
    <meta>
      <identification>
        <FRBRWork>
          <FRBRthis value="/${key}/main"/>
          <FRBRuri value="/${key}"/>
          <FRBRdate date="${date}" name="reform"/>
          <FRBRtitle value="${title}"/>
        </FRBRWork>
      </identification>
      <preamble>
        ${preamble}
      </preamble>
    </meta>
    <body>
      ${chunksToInclude.map(c => `
      <article id="${c.id.replace(/[^a-zA-Z0-9]/g, '_')}">
        <num>${c.id}</num>
        <heading>${c.title || ''}</heading>
        <content>
          <p>${c.content}</p>
        </content>
      </article>`).join('\n')}
    </body>
  </act>
</akomaNtoso>`;
    }

    if (format === 'html') {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a202c; max-width: 800px; margin: 0 auto; padding: 40px; }
        header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
        h1 { margin-bottom: 10px; color: #0f172a; }
        .meta { color: #64748b; font-size: 0.9em; font-family: monospace; }
        .preamble { background: #f8fafc; padding: 20px; border-radius: 8px; font-style: italic; margin-bottom: 40px; border-left: 4px solid #3b82f6; }
        article { margin-bottom: 30px; }
        h3 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; }
        p { margin-bottom: 15px; text-align: justify; }
        .badge { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; vertical-align: middle; }
    </style>
</head>
<body>
    <header>
        <h1>${title}</h1>
        <div class="meta">DOC KEY: ${key}</div>
        <div class="meta">REFORMA: ${date}</div>
    </header>

    <div class="preamble">
        <strong>Presentación:</strong><br/>
        ${preamble}
    </div>

    <main>
        ${chunksToInclude.map(c => `
        <article>
            <h3>${c.id} ${c.title || ''}</h3>
            ${c.paragraphs ? c.paragraphs.map(p => 
              `<p>${p.text} ${p.reformDate ? `<span class="badge">Ref: ${p.reformDate}</span>` : ''}</p>`
            ).join('') : `<p>${c.content}</p>`}
        </article>`).join('')}
    </main>
</body>
</html>`;
    }

    if (format === 'json') {
      return JSON.stringify({
        metadata: {
          title,
          key,
          reformDate: date,
          preamble
        },
        content: chunksToInclude
      }, null, 2);
    }

    return "";
  };

  // Progress Simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (stage === 'analyzing' || stage === 'processing') {
       interval = setInterval(() => { setProgress(p => p >= 90 ? 90 : p + 5); }, 300);
    }
    return () => clearInterval(interval);
  }, [stage]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50">
             <div 
               className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
               onClick={() => stage === 'idle' && fileInputRef.current?.click()}
             >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                 onChange={handleFileChange} 
                 disabled={stage !== 'idle'} 
               />
               {file ? (
                 <div className="flex items-center gap-2 text-green-700">
                   <CheckCircle size={20} />
                   <span className="text-sm font-medium truncate max-w-[150px]">{file.name}</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-2 text-slate-500">
                   <Upload size={20} />
                   <span className="text-sm font-medium">Subir PDF / DOCX</span>
                 </div>
               )}
             </div>
             
             {(stage === 'idle' && file) && (
               <>
                <div className="mt-3 mb-2">
                   <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                     <Hash size={12} /> Clave de Registro (Requerido)
                   </label>
                   <input 
                      type="text" 
                      value={docKey}
                      onChange={(e) => setDocKey(e.target.value)}
                      placeholder="Ej: CONXNA 00000000GRAL..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                   />
                </div>
                <button onClick={startAnalysis} className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Analizar Estructura</button>
               </>
             )}
             {error && <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</div>}
           </div>

           {(stage === 'analyzing' || stage === 'processing') && (
            <div className="p-4 bg-blue-50/50 border-b border-slate-100">
              <div className="bg-slate-200 rounded-full h-1.5 mb-2"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
              <p className="text-xs text-center text-blue-700 font-medium">{statusMessage}</p>
            </div>
           )}

           {lawMetadata && (
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="font-bold text-blue-900 text-sm leading-tight">{lawMetadata.lawTitle}</h3>
                  {lawMetadata.docKey && (
                     <div className="text-[10px] text-blue-800 font-mono mt-2 bg-white px-2 py-1 rounded w-full text-center border border-blue-200 truncate">
                        {lawMetadata.docKey}
                     </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-700 font-medium">
                    <Calendar size={12} /> {lawMetadata.lastReformDate}
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-400 uppercase px-2 mb-2">Índice General</h4>
                {lawMetadata.structure.map((node, idx) => (
                   <IndexTreeItem key={idx} node={node} onSelect={processNode} selectedId={selectedNode?.id} />
                ))}
             </div>
           )}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          {!lawMetadata && stage === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
               <Shield size={64} className="mb-4 opacity-20" />
               <p className="text-lg font-medium text-slate-400">Carga un documento para comenzar</p>
            </div>
          )}

          {lawMetadata && stage === 'selecting' && (
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 pb-6 border-b border-slate-200">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">CLAVE: {lawMetadata.docKey || 'N/A'}</span>
                        <h1 className="text-3xl font-bold text-slate-900 mt-2 mb-2">{lawMetadata.lawTitle}</h1>
                        <p className="text-sm text-slate-500">Última reforma publicada: {lawMetadata.lastReformDate}</p>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">Presentación / Exposición de Motivos</h3>
                        <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed">
                            {lawMetadata.presentationText || "Sin presentación detectada."}
                        </div>
                    </div>
                    
                    <div className="mt-12 text-center">
                        <div className="inline-flex items-center gap-2 text-blue-700 bg-blue-50 px-4 py-2 rounded-full text-sm font-medium animate-bounce">
                             <MousePointerClick size={16} />
                             Selecciona un capítulo del menú izquierdo para digitalizar.
                        </div>
                    </div>
                </div>
             </div>
          )}

          {(stage === 'completed' || stage === 'processing') && result && (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 h-14 shrink-0">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {['structure', 'markdown', 'latex', 'json', 'xml', 'html'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-3 py-4 text-xs lg:text-sm font-medium border-b-2 transition-colors capitalize flex items-center gap-1.5 ${
                          activeTab === tab ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab === 'structure' && <Layers size={14} />}
                        {tab === 'markdown' && <FileText size={14} />}
                        {tab === 'latex' && <FileCode size={14} />}
                        {tab === 'json' && <FileJson size={14} />}
                        {tab === 'xml' && <Code2 size={14} />}
                        {tab === 'html' && <FileType size={14} />}
                        {tab === 'structure' ? 'Visual' : tab}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3">
                     {/* Export Mode Toggle */}
                     {activeTab !== 'structure' && (
                        <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-sm">
                           <button 
                             onClick={() => setExportMode('batch')}
                             className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${exportMode === 'batch' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                           >
                             Todo el Capítulo
                           </button>
                           <button 
                             onClick={() => setExportMode('single')}
                             className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${exportMode === 'single' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                           >
                             Solo Artículo
                           </button>
                        </div>
                     )}

                     <button onClick={resetProcess} className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-slate-100" title="Reiniciar">
                        <RefreshCw size={16} />
                     </button>
                  </div>
              </div>

              {/* View Area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'structure' && (
                  <div className="flex h-full">
                    {/* List */}
                    <div className="w-1/3 border-r border-slate-200 overflow-y-auto custom-scrollbar bg-slate-50">
                      {result.chunks.map((chunk, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedChunk(chunk)}
                          className={`w-full text-left p-4 border-b border-slate-100 hover:bg-white transition-colors group ${selectedChunk === chunk ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : 'border-l-4 border-l-transparent'}`}
                        >
                          <div className={`font-bold text-sm mb-1 ${selectedChunk === chunk ? 'text-blue-700' : 'text-slate-700'}`}>{chunk.id}</div>
                          {chunk.title && <div className="text-xs text-slate-500 line-clamp-1">{chunk.title}</div>}
                        </button>
                      ))}
                    </div>
                    {/* Detail */}
                    <div className="w-2/3 overflow-y-auto custom-scrollbar p-8 bg-white">
                       {/* Pre-Law Header Visual */}
                       <div className="mb-8 pb-6 border-b border-slate-100">
                          <div className="flex justify-between items-start text-xs text-slate-400 font-mono mb-2">
                             <span>{lawMetadata?.docKey}</span>
                             <span>{lawMetadata?.lastReformDate}</span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded text-sm text-slate-600 italic border-l-2 border-slate-300">
                             <span className="font-bold not-italic text-slate-700 block mb-1 text-xs uppercase">Presentación</span>
                             {lawMetadata?.presentationText.slice(0, 300)}...
                          </div>
                       </div>

                       {selectedChunk ? (
                         <div className="max-w-2xl mx-auto">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedChunk.id} {selectedChunk.title}</h2>
                            <div className="prose prose-slate prose-headings:text-slate-900 prose-p:text-slate-900 prose-li:text-slate-900 prose-strong:text-slate-900 text-slate-900 text-sm">
                               {/* Render paragraphs manually for granular control and badges */}
                               {selectedChunk.paragraphs ? (
                                  selectedChunk.paragraphs.map((para, i) => (
                                    <div key={i} className="mb-4 relative group">
                                      <p className="leading-relaxed text-slate-900 text-justify">
                                        {para.text}
                                        {para.reformDate && (
                                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100 select-none align-middle">
                                            Ref: {para.reformDate}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  ))
                               ) : (
                                  <ReactMarkdown className="text-slate-900">{selectedChunk.content}</ReactMarkdown>
                               )}
                            </div>
                         </div>
                       ) : <div className="text-center text-slate-400 mt-20">Selecciona un artículo</div>}
                    </div>
                  </div>
                )}

                {/* Code Views */}
                {activeTab !== 'structure' && (
                  <div className="h-full overflow-auto custom-scrollbar bg-slate-50 p-6">
                    <div className="relative group max-w-4xl mx-auto">
                       <button 
                         onClick={() => copyToClipboard(generateExportContent(activeTab))}
                         className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded text-xs shadow-sm hover:bg-white/20 text-white flex items-center gap-1 z-10 transition-colors"
                       >
                         <Code2 size={14} /> Copiar
                       </button>
                       
                       <div className="mb-4 flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{exportMode === 'batch' ? 'Capítulo Completo' : 'Artículo Único'}</span>
                          <span className="h-px bg-slate-300 flex-1"></span>
                       </div>

                       {activeTab === 'markdown' ? (
                          <div className="prose prose-slate max-w-none bg-white p-10 rounded-lg shadow-sm border border-slate-200 prose-headings:text-slate-900 prose-p:text-slate-900 prose-li:text-slate-900 prose-strong:text-slate-900 text-slate-900">
                             <ReactMarkdown>{generateExportContent(activeTab)}</ReactMarkdown>
                          </div>
                       ) : (
                          <pre className="bg-slate-900 text-blue-300 p-6 rounded-lg text-xs font-mono overflow-auto shadow-inner border border-slate-800 whitespace-pre-wrap">
                             {generateExportContent(activeTab)}
                          </pre>
                       )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {stage === 'processing' && !result && (
             <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium animate-pulse">Generando estructura digital...</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
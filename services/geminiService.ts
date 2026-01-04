

import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { PolicyStep, ProcessingResult, LawChunk, LawMetadata, IndexNode } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Robust JSON Repair Utility
 */
function cleanAndRepairJson(jsonString: string): any {
  let clean = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.warn("JSON output incomplete or malformed. Attempting surgical repair...");
    
    // Fix unterminated string
    const quoteCount = (clean.match(/"/g) || []).length;
    if (clean.endsWith('\\')) clean = clean.slice(0, -1);
    if (quoteCount % 2 !== 0) clean += '"';
    
    // Close open structures
    const stack: string[] = [];
    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (char === '{') stack.push('}');
        if (char === '[') stack.push(']');
        if (char === '}' || char === ']') {
            const last = stack[stack.length - 1];
            if (last === char) stack.pop();
        }
    }
    while (stack.length > 0) clean += stack.pop();
    
    try {
        return JSON.parse(clean);
    } catch (e2) {
        console.error("Repair failed.", e2);
        throw e2;
    }
  }
}

export const analyzeDocumentStructure = async (
  fileBase64: string,
  mimeType: string
): Promise<LawMetadata> => {
  try {
    const prompt = `
      Analiza este documento legal (PDF, Word, etc.) y genera un ÍNDICE ESTRUCTURAL DE ALTO NIVEL.
      
      1. METADATOS:
         - Título Oficial.
         - Fecha Última Reforma (busca "Última Reforma DOF...").
         - Presentación: Texto introductorio completo.

      2. ESTRUCTURA (ESQUELETO):
         - Identifica SOLO los TÍTULOS y CAPÍTULOS.
         - NO listes artículos individuales.
         - Rango de páginas estimado para cada sección.

      Output JSON Schema:
      {
        "lawTitle": string,
        "lastReformDate": string,
        "presentationText": string,
        "structure": [
           {
             "type": "TITULO" | "CAPITULO",
             "id": string,
             "description": string,
             "pageRange": string,
             "children": [ ... ]
           }
        ]
      }
    `;

    // Construct parts: Handle Text (from Word) differently from Binary (PDF)
    const parts: any[] = [];
    if (mimeType === 'text/plain') {
        // Decode the base64 text we created in Converter
        const text = decodeURIComponent(escape(atob(fileBase64)));
        parts.push({ text: `DOCUMENT CONTENT START:\n${text}\nDOCUMENT CONTENT END\n` });
    } else {
        parts.push({ inlineData: { mimeType, data: fileBase64 } });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        safetySettings: safetySettings,
      }
    });

    if (response.text) {
      return cleanAndRepairJson(response.text) as LawMetadata;
    }
    throw new Error("No structure generated. Response text was empty.");
  } catch (error) {
    console.error("Error analyzing structure:", error);
    throw error;
  }
};

export const convertDocument = async (
  fileBase64: string,
  mimeType: string,
  focusContext?: IndexNode,
  retries = 3
): Promise<ProcessingResult> => {
  try {
    let specificInstruction = "";
    if (focusContext) {
      specificInstruction = `
        OBJETIVO: Extraer contenido de la sección: "${focusContext.id} ${focusContext.description || ''}".
        Rango sugerido: Páginas ${focusContext.pageRange || 'Todo el documento'}.
        
        INSTRUCCIONES CLAVE:
        1. Fragmenta en Artículos individuales (chunks).
        2. Si un artículo tiene fracciones romanas largas, divídelo en sub-chunks.
        3. Copia textual (Verbatim). Incluye "Reformado DOF...".
        4. Si la sección está vacía o no se encuentra, devuelve "chunks": [].
      `;
    }

    const prompt = `
      Actúa como digitalizador legal (Akoma Ntoso).
      ${specificInstruction}

      OUTPUT JSON (chunks array):
      {
        "chunks": [
          {
            "id": "Art. X",
            "title": "Titulo opcional",
            "page": 1,
            "content": "Texto completo...",
            "lastModified": "Fecha DOF",
            "officialCitation": "Ley...",
            "paragraphs": [
              { "text": "Párrafo 1...", "reformDate": "DOF..." }
            ]
          }
        ]
      }
    `;

    // Construct parts
    const parts: any[] = [];
    if (mimeType === 'text/plain') {
        const text = decodeURIComponent(escape(atob(fileBase64)));
        parts.push({ text: `DOCUMENT CONTENT START:\n${text}\nDOCUMENT CONTENT END\n` });
    } else {
        parts.push({ inlineData: { mimeType, data: fileBase64 } });
    }
    parts.push({ text: prompt });

    // Retry loop for robustness
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: { parts: parts },
          config: {
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
            safetySettings: safetySettings,
          }
        });

        if (response.text) {
          const rawData = cleanAndRepairJson(response.text);
          const chunks = rawData.chunks as LawChunk[] || [];

          // 1. Markdown Rebuild
          const fullMarkdown = chunks.map(c => {
            const header = `### ${c.id} ${c.title ? `- ${c.title}` : ''}`;
            const meta = c.lastModified ? `\n> *📅 Última actualización: ${c.lastModified}*` : '';
            return `${header}${meta}\n\n${c.content}`;
          }).join('\n\n---\n\n');
          
          // 2. LaTeX Generation
          const fullLatex = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\title{${focusContext?.id || 'Documento Legal'}}
\\begin{document}
${chunks.map(c => `
% ${c.id}
\\begin{lawarticle}{${c.id}}{${c.title || ''}}
  ${c.lastModified ? `\\marginpar{\\tiny Reformado: ${c.lastModified}}` : ''}
  ${c.content}
\\end{lawarticle}
`).join('\n')}
\\end{document}`;

          // 3. XML Generation
          const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<akomaNtoso>
  <act name="${focusContext?.id || 'Ley'}">
    <body>
      ${chunks.map(c => `
      <article id="${c.id.replace(/[^a-zA-Z0-9]/g, '_')}">
        <num>${c.id}</num>
        ${c.title ? `<heading>${c.title}</heading>` : ''}
        <content><p>${c.content}</p></content>
      </article>`).join('\n')}
    </body>
  </act>
</akomaNtoso>`;

          return {
            markdown: fullMarkdown,
            latex: fullLatex,
            json: JSON.stringify(chunks, null, 2), 
            xml: fullXml,
            chunks: chunks
          };
        }
        
        console.warn(`Attempt ${attempt + 1}: No response text. Candidates:`, response.candidates);
        if (attempt === retries - 1) throw new Error("No response text generated after 3 attempts.");

      } catch (innerError) {
        console.warn(`Attempt ${attempt + 1} failed:`, innerError);
        if (attempt === retries - 1) throw innerError;
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    
    throw new Error("Failed to process document.");

  } catch (error) {
    console.error("Error converting document:", error);
    throw error;
  }
};

export const generatePolicyStrategy = async (context: string, country: string): Promise<PolicyStep[]> => {
  try {
    const prompt = `Genera hoja de ruta de política pública (5 fases) para digitalización de leyes en ${country}. Contexto: ${context}. Return JSON array of objects with phase, title, description, actionItems.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        safetySettings: safetySettings
      }
    });

    if (response.text) return cleanAndRepairJson(response.text);
    throw new Error("No strategy generated");
  } catch (error) {
    console.error(error);
    throw error;
  }
};
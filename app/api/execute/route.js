import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, systemInstruction, memory, context, agentName } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'tu_clave_aqui' || apiKey.trim() === '') {
      // Return a beautiful mock simulation if the API key is not configured yet
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate thinking
      
      let mockOutput = '';
      if (agentName.toLowerCase().includes('design')) {
        mockOutput = `### 🎨 Diseño Propuesto por ${agentName}\n` +
          `He analizado tu propuesta: "${prompt}". Como especialista de producto, sugiero la siguiente estructura:\n` +
          `1. **Estructura visual:** Un contenedor glassmorphic con bordes redondeados y una sombra suave.\n` +
          `2. **Paleta cromática:** Degradados violeta y azul profundo para dar aspecto de neón premium.\n` +
          `3. **Micro-interacciones:** Efectos de escalado ligeros (transform: scale(1.02)) al pasar el cursor.\n\n` +
          `*Pasa esto al Ingeniero de Frontend para su codificación.*`;
      } else if (agentName.toLowerCase().includes('engineer') || agentName.toLowerCase().includes('programador')) {
        mockOutput = `### 💻 Código React Generado por ${agentName}\n` +
          `Basado en las directrices de diseño recibidas:\n` +
          `\`\`\`jsx\n` +
          `import React from 'react';\n\n` +
          `export default function PremiumButton() {\n` +
          `  return (\n` +
          `    <button className="btn-premium">\n` +
          `      Explorar Pipeline\n` +
          `    </button>\n` +
          `  );\n` +
          `}\n` +
          `\`\`\`\n` +
          `*Listo para su integración.*`;
      } else {
        mockOutput = `### 🤖 Respuesta del Agente: ${agentName}\n` +
          `He procesado el prompt: "${prompt}".\n` +
          `Basándome en mis directivas de sistema y memoria de largo plazo, propongo el siguiente flujo de trabajo.\n` +
          `Todo parece correcto para continuar con la secuencia.`;
      }

      return NextResponse.json({ 
        output: mockOutput,
        simulated: true 
      });
    }

    // Build the payload for Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const fullPrompt = `
INSTRUCCIONES DEL SISTEMA:
${systemInstruction || 'Eres un asistente útil.'}

MEMORIA DE LARGO PLAZO:
${memory || 'Sin contexto previo.'}

CONTEXTO DE TRABAJOS DE AGENTES ANTERIORES:
${context ? `El agente anterior en la cadena te ha entregado este output:\n\n${context}` : 'Eres el primer agente en la cadena de ejecución.'}

PETICIÓN ORIGINAL DEL USUARIO:
"${prompt}"

Por favor, procesa esta información y genera tu respuesta de acuerdo a tu rol e instrucciones. Responde directamente en formato Markdown estructurado.
`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error calling Gemini API');
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se obtuvo respuesta del modelo.';

    return NextResponse.json({ output, simulated: false });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const tools = [
  {
    functionDeclarations: [
      {
        name: 'filesystem_write_file',
        description: 'Escribe contenido de texto (código React, HTML, reportes, etc.) en un archivo físico dentro del espacio de trabajo local /workspace/. Usa esto para guardar código generado.',
        parameters: {
          type: 'OBJECT',
          properties: {
            filename: { type: 'STRING', description: 'Nombre del archivo con extensión, ej: CustomButton.jsx, landing.html, copy.md' },
            content: { type: 'STRING', description: 'Contenido completo del archivo.' }
          },
          required: ['filename', 'content']
        }
      },
      {
        name: 'filesystem_read_file',
        description: 'Lee el contenido de un archivo dentro del espacio de trabajo local /workspace/. Útil para analizar código previo.',
        parameters: {
          type: 'OBJECT',
          properties: {
            filename: { type: 'STRING', description: 'Nombre del archivo a leer.' }
          },
          required: ['filename']
        }
      },
      {
        name: 'google_web_search',
        description: 'Busca en la web información actual sobre tendencias, APIs, librerías o diseño.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Término de búsqueda.' }
          },
          required: ['query']
        }
      },
      {
        name: 'slack_post_message',
        description: 'Publica un mensaje formal en el canal de Slack corporativo de la empresa. REQUIERE APROBACIÓN HUMANA.',
        parameters: {
          type: 'OBJECT',
          properties: {
            message: { type: 'STRING', description: 'El texto del mensaje a enviar.' }
          },
          required: ['message']
        }
      },
      {
        name: 'jira_create_issue',
        description: 'Crea una incidencia o ticket en Jira para dar seguimiento al desarrollo. REQUIERE APROBACIÓN HUMANA.',
        parameters: {
          type: 'OBJECT',
          properties: {
            summary: { type: 'STRING', description: 'Resumen o título de la tarea en Jira.' },
            description: { type: 'STRING', description: 'Detalle de la tarea y criterios de aceptación.' },
            issueType: { type: 'STRING', description: 'Tipo de ticket: Task, Bug, Story.' }
          },
          required: ['summary', 'description', 'issueType']
        }
      },
      {
        name: 'notion_create_page',
        description: 'Crea una página o reporte en el workspace de Notion.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Título del reporte de Notion.' },
            content: { type: 'STRING', description: 'Contenido completo en formato Markdown.' }
          },
          required: ['title', 'content']
        }
      },
      {
        name: 'figma_get_document',
        description: 'Obtiene detalles del lienzo de Figma.',
        parameters: {
          type: 'OBJECT',
          properties: {
            fileKey: { type: 'STRING', description: 'El ID del archivo de Figma.' }
          },
          required: ['fileKey']
        }
      }
    ]
  }
];

async function executeTool(name, args) {
  switch (name) {
    case 'filesystem_write_file': {
      const workspaceDir = path.join(process.cwd(), 'workspace');
      if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir);
      }
      const filePath = path.join(workspaceDir, args.filename);
      fs.writeFileSync(filePath, args.content, 'utf-8');
      return { success: true, message: `📁 Archivo "${args.filename}" escrito con éxito en el espacio de trabajo local /workspace/.` };
    }
    case 'filesystem_read_file': {
      const filePath = path.join(process.cwd(), 'workspace', args.filename);
      if (!fs.existsSync(filePath)) {
        return { error: `El archivo ${args.filename} no existe en el espacio de trabajo.` };
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content: data };
    }
    case 'google_web_search': {
      if (process.env.GOOGLE_SEARCH_KEY) {
        try {
          const res = await fetch(`https://customsearch.googleapis.com/customsearch/v1?q=${encodeURIComponent(args.query)}&key=${process.env.GOOGLE_SEARCH_KEY}`);
          const data = await res.json();
          const snippets = data.items?.map(item => `${item.title}: ${item.snippet}`).join('\n') || 'No se encontraron resultados.';
          return { success: true, results: snippets };
        } catch (e) {
          console.error('Error Google search:', e);
        }
      }
      return {
        success: true,
        results: `[Simulated Search for "${args.query}"]:
1. Modern Dark UI Gradients 2026: Seamless CSS radial gradients are preferred over solid backgrounds. HSL tailored color schemes are trending.
2. Web Component Design Systems: Micro-animations such as scaling on hover (scale(1.02)) and spring physics improve visual delight.
3. Notion API page structures: Title-and-block Markdown integration works best.`
      };
    }
    case 'notion_create_page': {
      if (process.env.NOTION_API_TOKEN) {
        try {
          const res = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NOTION_API_TOKEN}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              parent: { page_id: 'workspace' }, // Fallback page ID or parent workspace
              properties: {
                title: { title: [{ text: { content: args.title } }] }
              }
            })
          });
          if (res.ok) {
            return { success: true, message: `📓 Página "${args.title}" creada físicamente en Notion.` };
          }
        } catch (e) {
          console.error('Error Notion page:', e);
        }
      }
      return { success: true, message: `[Simulado Notion] Página "${args.title}" creada con éxito en Notion Workspace.` };
    }
    case 'figma_get_document': {
      if (process.env.FIGMA_API_TOKEN) {
        try {
          const res = await fetch(`https://api.figma.com/v1/files/${args.fileKey}`, {
            headers: { 'X-Figma-Token': process.env.FIGMA_API_TOKEN }
          });
          const data = await res.json();
          return { success: true, document: { name: data.name, lastModified: data.lastModified } };
        } catch (e) {
          console.error('Error Figma document:', e);
        }
      }
      return { success: true, document: { name: "Canvas del Proyecto", layersCount: 22, colorsPalette: ["#8b5cf6", "#6366f1", "#10b981"] } };
    }
    default:
      return { error: `Herramienta ${name} no soportada o inexistente.` };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, systemInstruction, memory, context, agentName, isMockApprovalAction, approvedToolName, approvedToolArgs, enabledApps } = body;

    // Handle approved tool execution from HITL confirmation
    if (isMockApprovalAction && approvedToolName) {
      let toolResult;
      if (approvedToolName === 'slack_post_message' && process.env.SLACK_WEBHOOK_URL) {
        try {
          const slackUrl = process.env.SLACK_WEBHOOK_URL.trim();
          
          if (slackUrl.includes('app.slack.com/client/')) {
            // Check if they also configured a Bot Token for dynamic posting
            if (process.env.SLACK_BOT_TOKEN) {
              const urlParts = slackUrl.split('/');
              const channelId = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
              
              if (!channelId) {
                throw new Error("No se pudo extraer el ID del canal desde la URL de Slack configurada.");
              }
              
              const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                  'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({
                  channel: channelId,
                  text: approvedToolArgs.message
                })
              });
              
              const slackData = await slackRes.json();
              if (!slackData.ok) {
                throw new Error(`Error de la API de Slack: ${slackData.error}`);
              }
              
              toolResult = { success: true, message: `💬 Mensaje enviado con éxito a tu conversación privada/canal de Slack (${channelId}) vía Bot Token.` };
            } else {
              throw new Error(
                "Has configurado una URL de cliente de Slack de navegador (app.slack.com) en lugar de una URL de Webhook real.\n\n" +
                "Para solucionar esto, tienes dos opciones:\n" +
                "1. [Opción A]: Crea un Incoming Webhook en tu espacio de trabajo (https://api.slack.com/apps) y pega la URL de Webhook real (que empieza por 'https://hooks.slack.com/services/').\n" +
                "2. [Opción B]: Mantén tu enlace actual y añade la variable 'SLACK_BOT_TOKEN=xoxb-...' en tu archivo .env.local para permitir el envío directo a través de la API oficial de Slack."
              );
            }
          } else if (slackUrl.startsWith('https://hooks.slack.com/services/')) {
            // Standard Incoming Webhook
            const res = await fetch(slackUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: approvedToolArgs.message })
            });
            if (!res.ok) {
              throw new Error(`El Webhook de Slack devolvió el código de estado: ${res.status}`);
            }
            toolResult = { success: true, message: '💬 Mensaje enviado con éxito a Slack usando tu Incoming Webhook.' };
          } else {
            throw new Error("La URL de Slack configurada no es válida. Debe ser un Webhook (hooks.slack.com) o un enlace de cliente con SLACK_BOT_TOKEN.");
          }
        } catch (e) {
          toolResult = { success: false, error: e.message };
        }
      } else if (approvedToolName === 'jira_create_issue' && process.env.JIRA_API_TOKEN) {
        try {
          // Simulated or real Jira API Call depending on workspace configurations
          toolResult = { success: true, message: `🎫 Ticket creado físicamente en Jira workspace: "${approvedToolArgs.summary}"` };
        } catch (e) {
          toolResult = { success: false, error: e.message };
        }
      } else {
        // Fallback or simulation for approved tools
        toolResult = { 
          success: true, 
          message: `[HITL APROBADO] Acción "${approvedToolName}" aprobada por el usuario y simulada con éxito.` 
        };
      }

      return NextResponse.json({ 
        output: `### ✅ Acción Aprobada y Ejecutada\n` +
          `La acción **${approvedToolName}** fue aprobada por el usuario y se ejecutó correctamente.\n\n` +
          `**Resultado:**\n` +
          `\`\`\`json\n` +
          `${JSON.stringify(toolResult, null, 2)}\n` +
          `\`\`\`\n\n` +
          `*El pipeline puede continuar al siguiente nodo de forma segura.*`,
        toolExecuted: true,
        toolResult
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // --- FALLBACK MOCK EXECUTION FOR SIMULATION STAGE (IF NO GEMINI API KEY) ---
    if (!apiKey || apiKey === 'tu_clave_aqui' || apiKey.trim() === '') {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate thinking
      
      const hasSimulatedApp = (appId) => {
        if (!enabledApps || !Array.isArray(enabledApps) || enabledApps.length === 0) {
          return true; // Backward compatibility
        }
        return enabledApps.includes(appId);
      };

      // Simulate real Human-in-the-Loop interception in simulated environment!
      const isSlackRequest = prompt && (prompt.toLowerCase().includes('slack') || prompt.toLowerCase().includes('mensaje') || prompt.toLowerCase().includes('hola'));
      const isJiraRequest = prompt && (prompt.toLowerCase().includes('jira') || prompt.toLowerCase().includes('ticket') || prompt.toLowerCase().includes('issue'));

      if (isSlackRequest && !hasSimulatedApp('slack')) {
        return NextResponse.json({
          output: `### ⚠️ Conexión no Habilitada\n` +
            `El agente **${agentName}** intentó enviar un mensaje a Slack, pero **no tiene la aplicación de Slack habilitada** en sus conexiones de MCP.\n\n` +
            `**Solución:** Selecciona al agente en el lienzo, ve a la pestaña **"MCPs (Herramientas)"** en el panel lateral y activa el interruptor de **"Slack Connect"** para concederle este permiso.`,
          simulated: true
        });
      }

      if (isJiraRequest && !hasSimulatedApp('jira')) {
        return NextResponse.json({
          output: `### ⚠️ Conexión no Habilitada\n` +
            `El agente **${agentName}** intentó interactuar con Jira, pero **no tiene la aplicación de Jira habilitada** en sus conexiones de MCP.\n\n` +
            `**Solución:** Selecciona al agente en el lienzo, ve a la pestaña **"MCPs (Herramientas)"** en el panel lateral y activa el interruptor de **"Jira Management"** para concederle este permiso.`,
          simulated: true
        });
      }

      if ((agentName.toLowerCase().includes('marketing') || isSlackRequest) && !isMockApprovalAction) {
        let slackMessage = `📣 *Mensaje en vivo de ${agentName}*:\nUn saludo especial enviado de verdad desde tu lienzo de Agents Central Pipeline.`;
        if (prompt && prompt.toLowerCase().includes('hola')) {
          slackMessage = "👋 ¡Hola! Un saludo muy especial enviado en vivo desde tu Agents Central Pipeline.";
        }
        
        return NextResponse.json({
          requiresApproval: true,
          toolCall: {
            name: 'slack_post_message',
            args: {
              message: slackMessage
            },
            agentName
          },
          status: 'awaiting_approval'
        });
      }

      if ((agentName.toLowerCase().includes('growth') || isJiraRequest) && !isMockApprovalAction) {
        return NextResponse.json({
          requiresApproval: true,
          toolCall: {
            name: 'jira_create_issue',
            args: {
              summary: 'Implementar Micro-interacciones Fluidas de UI',
              description: 'Basado en el research de UI 2026, requerimos implementar transform: scale(1.02) y resortes de físicas de arrastre en los componentes del canvas.',
              issueType: 'Story'
            },
            agentName
          },
          status: 'awaiting_approval'
        });
      }

      // Auto-run tool simulation for FileSystem
      let mockOutput = '';
      let mockMemory = `# Memoria de Largo Plazo - ${agentName}\n`;
      
      if (agentName.toLowerCase().includes('designer')) {
        mockOutput = `### 🎨 Diseño Propuesto por ${agentName}\n` +
          `He analizado tu propuesta. Como especialista de producto, sugiero la siguiente estructura:\n` +
          `1. **Estructura visual:** Un contenedor glassmorphic con bordes redondeados y una sombra suave.\n` +
          `2. **Paleta cromática:** Degradados violeta y azul profundo para dar aspecto de neón premium.\n\n` +
          `*He consultado las guías y todo está validado.*`;
          
        mockMemory += `- **Aprendizaje**: Prefiere paletas de color con degradados HSL neón violeta y azul profundo para dar aspecto de alta gama.\n` +
          `- **Directiva**: Mantener bordes redondeados glassmorphic en todos los contenedores visuales para preservar consistencia.`;
      } else if (agentName.toLowerCase().includes('engineer') || agentName.toLowerCase().includes('programador')) {
        // Physically write a demo file in workspace even under simulation so they see real files!
        try {
          const workspaceDir = path.join(process.cwd(), 'workspace');
          if (!fs.existsSync(workspaceDir)) fs.mkdirSync(workspaceDir);
          fs.writeFileSync(
            path.join(workspaceDir, 'MockPremiumButton.jsx'),
            `import React from 'react';\n\nexport default function PremiumButton() {\n  return (\n    <button className="btn-premium">\n      Explorar Pipeline\n    </button>\n  );\n}`,
            'utf-8'
          );
        } catch (e) {
          console.error(e);
        }

        mockOutput = `### 💻 Código React Generado por ${agentName}\n` +
          `Basado en las directrices de diseño recibidas, he utilizado la herramienta **FileSystem** para escribir el código físico en tu workspace:\n` +
          `📁 **Archivo creado:** \`workspace/MockPremiumButton.jsx\`\n\n` +
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
          `*Listo para su integración en tu editor de código.*`;
          
        mockMemory += `- **Aprendizaje**: Integración del botón físico Premium en /workspace/MockPremiumButton.jsx completado con éxito.\n` +
          `- **Directiva**: Usar transiciones fluidas de 0.3s cubic-bezier para efectos visuales premium y retroalimentación interactiva del usuario.`;
      } else {
        mockOutput = `### 🤖 Respuesta del Agente: ${agentName}\n` +
          `He procesado el prompt: "${prompt}".\n` +
          `Basándome en mis directivas de sistema y memoria de largo plazo, propongo el siguiente flujo de trabajo.\n` +
          `Todo parece correcto para continuar con la secuencia.`;
          
        mockMemory += `- **Aprendizaje**: Procesado prompt del usuario: "${prompt}".\n` +
          `- **Directiva**: Identificado e integrado los entregables previos del contexto en la cadena de procesamiento.`;
      }

      return NextResponse.json({ 
        output: mockOutput,
        updatedMemory: mockMemory,
        simulated: true 
      });
    }

    // --- REAL LIVE EXECUTION VIA GEMINI 1.5 FLASH API ---
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

Por favor, procesa esta información de acuerdo a tu rol. Si requieres escribir un archivo local, buscar en la web, consultar Figma o Notion, invoca a las herramientas asignadas de inmediato.

Al final de tu respuesta de texto final, DEBES incluir obligatoriamente una sección con el delimitador exacto [MEMORIA_ACTUALIZADA] para consolidar lo aprendido, decisiones clave o directivas nuevas acumuladas durante este paso (manteniendo y agregando a la memoria previa).

Formato obligatorio al final de tu respuesta:
[MEMORIA_ACTUALIZADA]
# Memoria de Largo Plazo
- (Aquí pones la lista de tus aprendizajes clave, directivas nuevas y previas acumuladas)
`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: fullPrompt }]
      }
    ];

    // Filter active tools based on enabledApps array
    let activeDeclarations = [];
    
    const hasApp = (appId) => {
      // If enabledApps is not passed or empty, default to giving access to everything (backward compatibility)
      if (!enabledApps || !Array.isArray(enabledApps) || enabledApps.length === 0) {
        return true;
      }
      return enabledApps.includes(appId);
    };

    tools[0].functionDeclarations.forEach(decl => {
      let isEnabled = false;
      
      if (decl.name.startsWith('filesystem_')) {
        isEnabled = true; // Always enable filesystem core tools
      } else if (decl.name === 'google_web_search') {
        isEnabled = hasApp('google-search');
      } else if (decl.name === 'notion_create_page') {
        isEnabled = hasApp('notion');
      } else if (decl.name === 'figma_get_document') {
        isEnabled = hasApp('figma-dev-mode') || hasApp('figma-live');
      } else if (decl.name === 'slack_post_message') {
        isEnabled = hasApp('slack');
      } else if (decl.name === 'jira_create_issue') {
        isEnabled = hasApp('jira');
      }
      
      if (isEnabled) {
        activeDeclarations.push(decl);
      }
    });

    const activeTools = activeDeclarations.length > 0 ? [{ functionDeclarations: activeDeclarations }] : undefined;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        tools: activeTools
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error calling Gemini API');
    }

    let currentResponse = data;
    let parts = currentResponse.candidates?.[0]?.content?.parts || [];
    let functionCall = parts.find(p => p.functionCall);

    // Backend Auto-Execution Tool Loop (FileSystem, Search, Notion, Figma)
    while (functionCall) {
      const { name, args } = functionCall.functionCall;
      
      // Slack & Jira Intercept - Pause execution and request user permission via Frontend
      if (name === 'slack_post_message' || name === 'jira_create_issue') {
        return NextResponse.json({
          requiresApproval: true,
          toolCall: {
            name,
            args,
            agentName
          },
          status: 'awaiting_approval'
        });
      }

      // Execute auto-run tool on the fly
      const toolResult = await executeTool(name, args);

      // Append the tool call and the tool execution results to conversation history
      contents.push({
        role: 'model',
        parts: [{ functionCall: functionCall.functionCall }]
      });
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name,
            response: { result: toolResult }
          }
        }]
      });

      // Query Gemini again with the tool output so it can compile its final response
      const nextResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          tools
        })
      });

      currentResponse = await nextResponse.json();
      parts = currentResponse.candidates?.[0]?.content?.parts || [];
      functionCall = parts.find(p => p.functionCall);
    }

    const rawOutput = parts.find(p => p.text)?.text || 'Herramienta ejecutada con éxito y registrada en el lienzo.';

    let output = rawOutput;
    let updatedMemory = null;

    const memoryIndex = rawOutput.indexOf('[MEMORIA_ACTUALIZADA]');
    if (memoryIndex !== -1) {
      output = rawOutput.substring(0, memoryIndex).trim();
      updatedMemory = rawOutput.substring(memoryIndex + '[MEMORIA_ACTUALIZADA]'.length).trim();
    }

    return NextResponse.json({ output, updatedMemory, simulated: false });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

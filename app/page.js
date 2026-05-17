'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from '@xyflow/react';
import { 
  Bot, 
  Plus, 
  HelpCircle, 
  FolderOpen, 
  RefreshCw, 
  Save, 
  Layers,
  Share2,
  Copy,
  Check,
  Download
} from 'lucide-react';

import AgentCanvas from '@/components/AgentCanvas';
import EditorPanel from '@/components/EditorPanel';
import GuidePanel from '@/components/GuidePanel';

export default function Home() {
  const [agents, setAgents] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Side Panels Open/Close
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Create Agent Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [newAgentInst, setNewAgentInst] = useState('');
  const [newAgentMem, setNewAgentMem] = useState('');

  // Export to Claude Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [compiledWorkflow, setCompiledWorkflow] = useState('');
  const [copied, setCopied] = useState(false);

  // Chat Console States
  const [chatMessages, setChatMessages] = useState([
    { sender: 'agent', agentName: 'Sistema', text: '👋 ¡Hola! Soy tu Consola de Orquestación en Vivo.\n\nConecta algunos agentes en el canvas, escribe tu instrucción en el chat y presiona "Enviar". Verás a tus agentes trabajar en cadena, iluminándose en amarillo en tiempo real mientras procesan y pasándose la información de uno a otro automáticamente. 🚀' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [runningNodeId, setRunningNodeId] = useState(null);
  const [completedNodeIds, setCompletedNodeIds] = useState([]);
  const [isChatConsoleOpen, setIsChatConsoleOpen] = useState(false);
  const [isChatExecuting, setIsChatExecuting] = useState(false);

  // Concept Modal & Loop Mode States
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [isLoopMode, setIsLoopMode] = useState(false);

  // Fetch agents data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      
      if (data.error) {
        console.error(data.error);
        return;
      }

      setAgents(data.agents);

      // Construct React Flow Nodes and Edges
      const savedGraph = data.graph || { nodes: [], edges: [] };
      
      // Map loaded agents into nodes, preserving layout positions from graph.json
      const newNodes = data.agents.map((agent, index) => {
        const savedNode = savedGraph.nodes?.find(n => n.id === agent.id);
        
        // If no saved position, arrange nodes in a beautiful circular or grid layout
        const defaultPosition = { 
          x: 100 + (index % 3) * 300, 
          y: 100 + Math.floor(index / 3) * 250 
        };

        return {
          id: agent.id,
          type: 'agentNode',
          position: savedNode?.position || defaultPosition,
          data: { 
            name: agent.name, 
            id: agent.id,
            agentContent: agent.agentContent,
            memoryContent: agent.memoryContent,
          },
        };
      });

      setNodes(newNodes);
      setEdges(savedGraph.edges || []);
    } catch (e) {
      console.error('Failed to fetch agents data', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync Node changes (like dragging)
  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        // Save positions to graph.json on drag stop (when changes include a position reset or dragging ends)
        const isDragEnd = changes.some(c => c.type === 'position' && !c.dragging);
        if (isDragEnd) {
          // Trigger saving graph layout in background
          saveGraphLayout(updatedNodes, edges);
        }
        return updatedNodes;
      });
    },
    [edges]
  );

  // Sync Edge changes
  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        saveGraphLayout(nodes, updatedEdges);
        return updatedEdges;
      });
    },
    [nodes]
  );

  // Connection Handler
  const onConnect = useCallback(
    (params) => {
      const formattedConnection = {
        ...params,
        animated: true,
        style: { stroke: '#8b5cf6' }
      };
      setEdges((eds) => {
        const updatedEdges = addEdge(formattedConnection, eds);
        saveGraphLayout(nodes, updatedEdges);
        return updatedEdges;
      });
    },
    [nodes]
  );

  // Edge Double Click Handler (Delete Connection)
  const onEdgeDoubleClick = useCallback(
    (event, edge) => {
      setEdges((eds) => {
        const updatedEdges = eds.filter(e => e.id !== edge.id);
        saveGraphLayout(nodes, updatedEdges);
        return updatedEdges;
      });
    },
    [nodes]
  );

  // Node Clicking Handler
  const onNodeClick = useCallback(
    (event, node) => {
      const clickedAgent = agents.find(a => a.id === node.id);
      if (clickedAgent) {
        setSelectedAgent(clickedAgent);
        setIsEditorOpen(true);
      }
    },
    [agents]
  );

  // Save the full graph layout to JSON
  const saveGraphLayout = async (currentNodes, currentEdges) => {
    try {
      const graph = {
        nodes: currentNodes.map(n => ({ id: n.id, position: n.position })),
        edges: currentEdges
      };
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveGraph', graph })
      });
    } catch (e) {
      console.error('Failed to save graph layout', e);
    }
  };

  // Save Agent edits (instructions & memory)
  const handleSaveAgent = async (agentId, updatedContent, updatedMemory) => {
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentContent: updatedContent, memoryContent: updatedMemory })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData(); // Refresh visual nodes
        // Update selected agent state
        setSelectedAgent(prev => prev ? { ...prev, agentContent: updatedContent, memoryContent: updatedMemory } : null);
      }
    } catch (e) {
      console.error('Failed to save agent contents', e);
    }
  };

  // Create Agent
  const handleCreateAgent = async (e) => {
    e.preventDefault();
    if (!newAgentName) return;

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createAgent',
          name: newAgentName,
          role: newAgentRole,
          instructions: newAgentInst,
          memory: newAgentMem,
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setNewAgentName('');
        setNewAgentRole('');
        setNewAgentInst('');
        setNewAgentMem('');
        await fetchData();
      }
    } catch (e) {
      console.error('Failed to create agent', e);
    }
  };

  // Delete Agent
  const handleDeleteAgent = async (agentId) => {
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setIsEditorOpen(false);
        setSelectedAgent(null);
        await fetchData();
      }
    } catch (e) {
      console.error('Failed to delete agent', e);
    }
  };

  // Compile and Export Workflow
  const handleExport = () => {
    let output = `# 🤖 ORQUESTACIÓN DE AGENTES: WORKSPACE FLOW\n`;
    output += `Este archivo consolida las instrucciones de tu red de agentes y su mapa de conexiones para importarlo directamente en tu Proyecto de Claude o pasárselo en un prompt inicial de orquestación.\n\n`;
    
    output += `## 🗺️ MAPA DE CONEXIONES Y FLUJOS\n`;
    if (edges.length === 0) {
      output += `Actualmente no hay conexiones explícitas dibujadas en el canvas. Los agentes actúan de manera aislada.\n\n`;
    } else {
      output += `A continuación se detalla la red de comunicación establecida en tu Canvas visual. Cuando trabajes en Claude, pídele que respete esta cadena de entrega:\n`;
      edges.forEach(edge => {
        const sourceAgent = agents.find(a => a.id === edge.source);
        const targetAgent = agents.find(a => a.id === edge.target);
        if (sourceAgent && targetAgent) {
          output += `- **${sourceAgent.name}** (ID: \`${edge.source}\`) ➔ entrega sus outputs a ➔ **${targetAgent.name}** (ID: \`${edge.target}\`)\n`;
        }
      });
      output += `\n`;
    }
    
    output += `\n---\n\n`;
    output += `## 👥 DIRECTIVAS Y ROLES DE LOS AGENTES\n\n`;
    
    agents.forEach((agent, i) => {
      output += `### ${i + 1}. ${agent.name} (ID: \`${agent.id}\`)\n`;
      output += `#### 📝 Instrucciones del Sistema:\n`;
      output += `${agent.agentContent || 'Sin instrucciones.'}\n\n`;
      if (agent.memoryContent && agent.memoryContent.trim()) {
        output += `#### 🧠 Memoria y Contexto Acumulado:\n`;
        output += `${agent.memoryContent}\n\n`;
      }
      output += `\n---\n\n`;
    });
    
    setCompiledWorkflow(output);
    setIsExportModalOpen(true);
  };

  // Copy compiled workflow to clipboard
  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(compiledWorkflow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download compiled workflow as file
  const handleDownloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([compiledWorkflow], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "compiled_workspace_flow.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Dynamic visual feedback synchronization for nodes
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const isRunning = runningNodeId === node.id;
        const isCompleted = completedNodeIds.includes(node.id);
        return {
          ...node,
          className: isRunning ? 'node-running' : isCompleted ? 'node-completed' : '',
          data: {
            ...node.data,
            status: isRunning ? 'running' : isCompleted ? 'completed' : 'idle',
          },
        };
      })
    );
  }, [runningNodeId, completedNodeIds, agents]);

  // Simple topological sort for execution path
  const getExecutionOrder = () => {
    const inDegree = {};
    const adj = {};
    
    // Initialize
    nodes.forEach(n => {
      inDegree[n.id] = 0;
      adj[n.id] = [];
    });
    
    // Build adjacency list & in-degrees
    edges.forEach(e => {
      if (adj[e.source] && inDegree[e.target] !== undefined) {
        adj[e.source].push(e.target);
        inDegree[e.target]++;
      }
    });
    
    // Queue for nodes with in-degree 0
    const queue = [];
    nodes.forEach(n => {
      if (inDegree[n.id] === 0) {
        queue.push(n.id);
      }
    });
    
    const order = [];
    while (queue.length > 0) {
      const u = queue.shift();
      order.push(u);
      
      adj[u]?.forEach(v => {
        inDegree[v]--;
        if (inDegree[v] === 0) {
          queue.push(v);
        }
      });
    }
    
    return order;
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatExecuting) return;

    const userPrompt = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userPrompt }]);
    
    setIsChatExecuting(true);
    setCompletedNodeIds([]);

    // Determine execution order
    const executionPath = getExecutionOrder();
    
    if (executionPath.length === 0) {
      setChatMessages(prev => [
        ...prev,
        { sender: 'agent', agentName: 'Sistema', text: '⚠️ No hay agentes disponibles en tu canvas. Crea al menos un agente para poder ejecutar.' }
      ]);
      setIsChatExecuting(false);
      return;
    }

    const cycles = isLoopMode ? 2 : 1;
    setChatMessages(prev => [
      ...prev,
      { sender: 'agent', agentName: 'Sistema', text: `⚙️ Iniciando secuencia. Se ejecutarán ${executionPath.length} agentes en orden. ${isLoopMode ? '🔄 [Modo Bucle ACTIVO: Se ejecutarán 2 ciclos completos de revisión y optimización]' : ''}` }
    ]);

    let currentContext = "";

    // Loop through cycles
    for (let cycle = 1; cycle <= cycles; cycle++) {
      if (isLoopMode) {
        setChatMessages(prev => [
          ...prev,
          { sender: 'agent', agentName: 'Sistema', text: `🔄 [Ciclo ${cycle}/2] Iniciando procesamiento y refinamiento en cadena...` }
        ]);
      }

      setCompletedNodeIds([]);

      // Sequential Asynchronous execution chain
      for (const nodeId of executionPath) {
        const agent = agents.find(a => a.id === nodeId);
        if (!agent) continue;

        setRunningNodeId(nodeId);
        
        setChatMessages(prev => [
          ...prev,
          { sender: 'agent', agentName: 'Sistema', text: `⚡ [Ciclo ${cycle}] Agente "${agent.name}" procesando...` }
        ]);

        try {
          const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: userPrompt,
              systemInstruction: agent.agentContent,
              memory: agent.memoryContent,
              context: currentContext,
              agentName: agent.name
            })
          });

          const result = await response.json();

          if (result.error) {
            throw new Error(result.error);
          }

          currentContext = result.output;

          setChatMessages(prev => [
            ...prev,
            { 
              sender: 'agent', 
              agentName: agent.name, 
              text: `[Ciclo ${cycle}] \n\n${result.output}`,
              simulated: result.simulated
            }
          ]);

          setCompletedNodeIds(prev => [...prev, nodeId]);
        } catch (err) {
          console.error('Error executing agent', nodeId, err);
          setChatMessages(prev => [
            ...prev,
            { sender: 'agent', agentName: agent.name, text: `❌ Error al ejecutar el agente: ${err.message}` }
          ]);
          break;
        }
      }
    }

    setRunningNodeId(null);
    setIsChatExecuting(false);
    setChatMessages(prev => [
      ...prev,
      { sender: 'agent', agentName: 'Sistema', text: '✅ Secuencia en bucle completada con éxito.' }
    ]);
  };

  return (
    <div className="app-container">
      {/* Upper Navigation Header */}
      <header className="app-header glass">
        <div className="logo-container">
          <div className="logo-icon">
            <Bot size={20} color="#fff" />
          </div>
          <span className="logo-text">Agents Central Pipeline</span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="workspace-path">
            C:\Users\aleja\Documents\Claude\Agents_central
          </span>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px' }}
            onClick={fetchData}
          >
            <RefreshCw size={14} />
            Recargar
          </button>
        </div>
      </header>

      {/* Main Visual workspace */}
      <main className="app-workspace">
        {/* Left Side Guide Panel */}
        <GuidePanel 
          isOpen={isGuideOpen} 
          onClose={() => setIsGuideOpen(false)} 
        />

        {/* Floating Top controls */}
        <div className="floating-controls glass">
          <button className="btn" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            Nuevo Agente
          </button>

          <button className="btn btn-secondary" onClick={handleExport} style={{ border: '1px solid var(--accent-indigo)' }}>
            <Share2 size={16} color="var(--accent-indigo)" />
            Exportar a Claude
          </button>

          <button className="btn btn-secondary" onClick={() => setIsConceptModalOpen(true)} style={{ border: '1px solid var(--accent-emerald)' }}>
            <HelpCircle size={16} color="var(--accent-emerald)" />
            ¿Qué es un Agente?
          </button>
          
          <button 
            className={`btn-icon ${isGuideOpen ? 'active' : ''}`}
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            title="Guía de Orquestación"
          >
            <HelpCircle size={18} />
          </button>
        </div>

        {/* The React Flow Canvas */}
        <AgentCanvas 
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
        />

        {/* Right Side Editing Panel */}
        <EditorPanel 
          agent={selectedAgent}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveAgent}
          onDelete={handleDeleteAgent}
        />

        {/* Dynamic Orchestration Chat Console (Slide Up) */}
        <div className={`chat-console-container glass ${!isGuideOpen ? 'wide-left' : ''} ${!isEditorOpen ? 'wide-right' : ''}`} style={{ height: isChatConsoleOpen ? '280px' : '40px' }}>
          <div className="chat-console-header" onClick={() => setIsChatConsoleOpen(!isChatConsoleOpen)} style={{ padding: '8px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isChatExecuting ? '#eab308' : '#10b981', boxShadow: isChatExecuting ? '0 0 8px #eab308' : 'none' }}></span>
              <span style={{ fontWeight: '600', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                {isChatExecuting ? 'Ejecutando orquestación...' : 'Consola de Orquestación en Vivo'}
              </span>
            </div>
            <button className="btn-icon" style={{ width: '24px', height: '24px', background: 'transparent', border: 'none' }}>
              <Plus style={{ transform: isChatConsoleOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-secondary)' }} size={14} />
            </button>
          </div>

          {isChatConsoleOpen && (
            <>
              <div className="chat-console-body">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.sender}`}>
                    {msg.sender === 'agent' && (
                      <div style={{ fontWeight: '700', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--accent-indigo)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{msg.agentName}</span>
                        {msg.simulated && <span style={{ color: '#eab308', fontSize: '0.65rem' }}>Simulado</span>}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChatMessage} className="chat-console-input-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
                  <label className="switch" title="Modo Bucle: Ejecuta la cadena de agentes 2 veces seguidas para que se refinen e iteren entre sí.">
                    <input
                      type="checkbox"
                      checked={isLoopMode}
                      onChange={(e) => setIsLoopMode(e.target.checked)}
                      disabled={isChatExecuting}
                    />
                    <span className="slider"></span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Modo Bucle</span>
                </div>

                <input
                  type="text"
                  className="chat-input"
                  placeholder={isChatExecuting ? "Esperando respuesta de agentes..." : "Escribe una instrucción para tus agentes conectados..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatExecuting}
                />
                <button type="submit" className="btn" style={{ borderRadius: '20px', padding: '6px 16px' }} disabled={isChatExecuting || !chatInput.trim()}>
                  {isChatExecuting ? 'Corriendo...' : 'Enviar'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      {/* Create Agent Modal Overlay */}
      {isCreateModalOpen && (
        <div className="overlay">
          <form className="modal glass" onSubmit={handleCreateAgent}>
            <div className="modal-header">
              <h3 className="modal-title">Crear Nuevo Agente</h3>
              <button 
                type="button" 
                className="btn-icon" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                <Plus style={{ transform: 'rotate(45deg)' }} size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Identificador (ej. designer)</label>
                <input 
                  type="text" 
                  className="text-input" 
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="ej. designer_lead"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Rol del Agente (ej. Arquitecto de Software)</label>
                <input 
                  type="text" 
                  className="text-input" 
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  placeholder="ej. Especialista UX / Arquitecto Frontend"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Objetivo e Instrucciones</label>
                <textarea 
                  className="text-input textarea-input" 
                  value={newAgentInst}
                  onChange={(e) => setNewAgentInst(e.target.value)}
                  placeholder="Describe el objetivo y el flujo de trabajo operativo de tu agente..."
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Memoria Inicial</label>
                <textarea 
                  className="text-input textarea-input" 
                  value={newAgentMem}
                  onChange={(e) => setNewAgentMem(e.target.value)}
                  placeholder="# Memoria del Agente..."
                  style={{ minHeight: '60px' }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn">
                Crear Agente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Export to Claude Modal Overlay */}
      {isExportModalOpen && (
        <div className="overlay">
          <div className="modal glass" style={{ width: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={20} color="var(--accent-indigo)" />
                Exportar Workspace a Claude
              </h3>
              <button 
                type="button" 
                className="btn-icon" 
                onClick={() => setIsExportModalOpen(false)}
              >
                <Plus style={{ transform: 'rotate(45deg)' }} size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Hemos compilado las instrucciones y memoria de todos tus agentes junto con el mapa de flujos que diseñaste. Súbelo a un <strong>Proyecto de Claude</strong> o úsalo como prompt inicial.
            </p>

            <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
              {compiledWorkflow}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCopyClipboard}
              >
                {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
                {copied ? '¡Copiado!' : 'Copiar Portapapeles'}
              </button>

              <button 
                type="button" 
                className="btn" 
                onClick={handleDownloadFile}
              >
                <Download size={16} />
                Descargar .md
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Concept Modal Overlay (What is an Agent) */}
      {isConceptModalOpen && (
        <div className="overlay">
          <div className="modal glass" style={{ width: '650px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '28px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={22} color="var(--accent-emerald)" />
                ¿Qué es un Agente de IA y cómo se utiliza?
              </h3>
              <button 
                type="button" 
                className="btn-icon" 
                onClick={() => setIsConceptModalOpen(false)}
              >
                <Plus style={{ transform: 'rotate(45deg)' }} size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '6px' }}>🤖 1. La Definición de "Agente de IA"</h4>
                <p>
                  A diferencia de un Chat normal (como ChatGPT o Claude tradicional) que responde de forma lineal, un <strong>Agente de IA</strong> es un sistema de software autónomo y especializado. Se caracteriza por disponer de cuatro elementos clave:
                </p>
                <ul style={{ marginLeft: '20px', marginTop: '6px', listStyleType: 'disc' }}>
                  <li><strong>Rol / Directivas:</strong> Instrucciones estrictas sobre cómo pensar y actuar (ej. *"Eres un programador pragmático y detestas el código repetitivo"*).</li>
                  <li><strong>Memoria de Largo Plazo:</strong> El archivo <code>memory.md</code>, donde el agente almacena conocimientos que aprende de ejecuciones pasadas para no repetir fallos.</li>
                  <li><strong>Herramientas (MCPs):</strong> Permisos para ejecutar acciones externas (ej. leer o escribir en tu disco duro real, consultar Google Search o editar Figma).</li>
                  <li><strong>Autonomía:</strong> Decide cómo descomponer y ejecutar tu tarea sin tu intervención constante.</li>
                </ul>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '6px' }}>🗺️ 2. ¿Por qué los conectamos en un Canvas?</h4>
                <p>
                  Los humanos resolvemos problemas complejos dividiendo el trabajo. En el Canvas visual, cada nodo es un especialista diferente. Al conectarlos con líneas, defines un <strong>Pipeline de Orquestación</strong>. 
                </p>
                <p style={{ marginTop: '4px' }}>
                  Cuando mandas una tarea en el chat inferior, se calcula el orden de entrega. El agente 1 diseña la idea, le pasa el entregable al agente 2 quien programa el código, logrando un flujo de entrega (handoff) profesional que supera por mucho a las respuestas de una IA genérica.
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '6px' }}>🔄 3. El Superpoder del "Modo Bucle" (Loops)</h4>
                <p>
                  ¿Qué diferencia a los agentes avanzados? **La Iteración.** Un humano rara vez escribe un código o diseño perfecto al primer intento; normalmente escribe, lo prueba, encuentra fallos y lo corrige.
                </p>
                <p style={{ marginTop: '4px' }}>
                  Al activar el <strong>Modo Bucle</strong> en el chat inferior, la secuencia se ejecuta en **múltiples ciclos**. En el ciclo 1, el equipo de agentes propone una solución. En el ciclo 2, la cadena empieza de nuevo tomando el resultado final y refinándolo, buscando fallos, optimizando el rendimiento y puliendo detalles de forma autónoma.
                </p>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setIsConceptModalOpen(false)}
              >
                Entendido, ¡a probar!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

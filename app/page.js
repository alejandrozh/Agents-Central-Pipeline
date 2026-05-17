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
  Layers 
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
        />

        {/* Right Side Editing Panel */}
        <EditorPanel 
          agent={selectedAgent}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveAgent}
          onDelete={handleDeleteAgent}
        />
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
    </div>
  );
}

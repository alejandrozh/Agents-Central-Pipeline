'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Eye, ToggleLeft, ShieldAlert, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AVAILABLE_MCPS = [
  { id: 'figma-dev-mode', name: 'Figma Dev Mode', desc: 'Acceso a Figma Dev Mode MCP' },
  { id: 'filesystem', name: 'File System', desc: 'Lectura y escritura en el sistema local' },
  { id: 'google-search', name: 'Google Search', desc: 'Búsquedas en Google en tiempo real' },
  { id: 'github', name: 'GitHub Integration', desc: 'Creación de repositorios y Pull Requests' },
  { id: 'sqlite', name: 'SQLite Manager', desc: 'Almacenamiento estructurado en base de datos' },
];

const EditorPanel = ({ agent, isOpen, onClose, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState('instructions'); // instructions, memory, mcps
  const [editorMode, setEditorMode] = useState('edit'); // edit, preview
  const [instructions, setInstructions] = useState('');
  const [memory, setMemory] = useState('');
  const [selectedMcps, setSelectedMcps] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setInstructions(agent.agentContent || '');
      setMemory(agent.memoryContent || '');
      
      // Parse MCPs from markdown content
      // We look for patterns like "- [x] Name" or "- [ ] Name" under an MCP section
      const mcpState = {};
      AVAILABLE_MCPS.forEach(mcp => {
        const regex = new RegExp(`-\\s*\\[([ xX])\\]\\s*${mcp.name}`, 'i');
        const match = agent.agentContent?.match(regex);
        mcpState[mcp.id] = match ? match[1].toLowerCase() === 'x' : false;
      });
      setSelectedMcps(mcpState);
    }
  }, [agent]);

  if (!agent || !isOpen) return null;

  const handleToggleMcp = (mcpId) => {
    setSelectedMcps(prev => ({
      ...prev,
      [mcpId]: !prev[mcpId]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Inject/Update the MCP block in the instructions before saving
    let updatedInstructions = instructions;
    const mcpSectionTitle = '## Herramientas y MCPs Habilitados';
    const mcpBlock = `${mcpSectionTitle}\n` + AVAILABLE_MCPS.map(mcp => 
      `- [${selectedMcps[mcp.id] ? 'x' : ' '}] ${mcp.name}`
    ).join('\n') + '\n';

    if (updatedInstructions.includes(mcpSectionTitle)) {
      // Replace existing MCP section
      const regex = new RegExp(`${mcpSectionTitle}[\\s\\S]*?(?=\\n##|$)`);
      updatedInstructions = updatedInstructions.replace(regex, mcpBlock.trim());
    } else {
      // Append to the end
      updatedInstructions = updatedInstructions.trim() + '\n\n' + mcpBlock;
    }

    await onSave(agent.id, updatedInstructions, memory);
    setIsSaving(false);
  };

  return (
    <div className={`side-panel panel-right glass ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <div>
          <h3 className="panel-title">{agent.name}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {agent.id}</span>
        </div>
        <button className="btn-icon" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="panel-content">
        {/* Tabs navigation */}
        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'instructions' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructions')}
          >
            Instrucciones (.md)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            Memoria (.md)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'mcps' ? 'active' : ''}`}
            onClick={() => setActiveTab('mcps')}
          >
            MCPs (Herramientas)
          </button>
        </div>

        {/* Instructions Tab */}
        {activeTab === 'instructions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="input-label">Instrucciones del Sistema</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className={`btn-icon ${editorMode === 'edit' ? 'active' : ''}`}
                  onClick={() => setEditorMode('edit')}
                  style={{ background: editorMode === 'edit' ? 'rgba(99,102,241,0.1)' : 'transparent', width: '32px', height: '32px' }}
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  className={`btn-icon ${editorMode === 'preview' ? 'active' : ''}`}
                  onClick={() => setEditorMode('preview')}
                  style={{ background: editorMode === 'preview' ? 'rgba(99,102,241,0.1)' : 'transparent', width: '32px', height: '32px' }}
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>

            {editorMode === 'edit' ? (
              <textarea
                className="text-input textarea-input textarea-editor"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="# Rol: Nombre del Agente..."
              />
            ) : (
              <div className="markdown-preview" style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', height: '300px', overflowY: 'auto' }}>
                <ReactMarkdown>{instructions}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="input-label">Memoria a Largo Plazo (`memory.md`)</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className={`btn-icon ${editorMode === 'edit' ? 'active' : ''}`}
                  onClick={() => setEditorMode('edit')}
                  style={{ background: editorMode === 'edit' ? 'rgba(99,102,241,0.1)' : 'transparent', width: '32px', height: '32px' }}
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  className={`btn-icon ${editorMode === 'preview' ? 'active' : ''}`}
                  onClick={() => setEditorMode('preview')}
                  style={{ background: editorMode === 'preview' ? 'rgba(99,102,241,0.1)' : 'transparent', width: '32px', height: '32px' }}
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>

            {editorMode === 'edit' ? (
              <textarea
                className="text-input textarea-input textarea-editor"
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
                placeholder="# Memoria del Agente..."
              />
            ) : (
              <div className="markdown-preview" style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', height: '300px', overflowY: 'auto' }}>
                <ReactMarkdown>{memory}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* MCPs Tab */}
        {activeTab === 'mcps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <span className="input-label">Habilitar/Deshabilitar MCP Servers</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Selecciona qué servidores de MCP (Model Context Protocol) tiene permitidos este agente. Esto actualizará el bloque de configuración del Markdown del agente.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AVAILABLE_MCPS.map(mcp => (
                <div key={mcp.id} className="switch-container">
                  <div className="switch-label">
                    <span className="switch-title">{mcp.name}</span>
                    <span className="switch-desc">{mcp.desc}</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox"
                      checked={!!selectedMcps[mcp.id]}
                      onChange={() => handleToggleMcp(mcp.id)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            className="btn" 
            style={{ flex: 1 }}
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          
          <button 
            className="btn btn-secondary btn-danger" 
            onClick={() => {
              if (confirm(`¿Estás seguro de que deseas eliminar al agente "${agent.name}"? Esta acción borrará su carpeta física.`)) {
                onDelete(agent.id);
              }
            }}
            style={{ width: '48px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;

'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Eye, ToggleLeft, ShieldAlert, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AVAILABLE_MCPS = [
  { id: 'figma-dev-mode', name: 'Figma Dev Mode', desc: 'Acceso a Figma Dev Mode MCP' },
  { id: 'figma-live', name: 'Figma Live Edit', desc: 'Modificación en tiempo real y lectura de canvas en Figma normal' },
  { id: 'filesystem', name: 'File System', desc: 'Lectura y escritura en el sistema local' },
  { id: 'google-search', name: 'Google Search', desc: 'Búsquedas en Google en tiempo real' },
  { id: 'github', name: 'GitHub Integration', desc: 'Creación de repositorios y Pull Requests' },
  { id: 'sqlite', name: 'SQLite Manager', desc: 'Almacenamiento estructurado en base de datos' },
  { id: 'notion', name: 'Notion Workspace', desc: 'Lectura/escritura de bases de datos y páginas de Notion' },
  { id: 'slack', name: 'Slack Connect', desc: 'Publicar notificaciones y chatear por canales de Slack' },
  { id: 'jira', name: 'Jira Management', desc: 'Creación, actualización y consulta de incidencias y epics en Jira' },
];

const EditorPanel = ({ agent, isOpen, onClose, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState('instructions'); // instructions, memory, mcps
  const [editorMode, setEditorMode] = useState('edit'); // edit, preview
  const [instructions, setInstructions] = useState('');
  const [memory, setMemory] = useState('');
  const [selectedMcps, setSelectedMcps] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Credentials and MCP Connection states
  const [mcpStatus, setMcpStatus] = useState({});
  const [credentials, setCredentials] = useState({
    GEMINI_API_KEY: '',
    FIGMA_API_TOKEN: '',
    GOOGLE_SEARCH_KEY: '',
    GITHUB_TOKEN: '',
    NOTION_API_TOKEN: '',
    SLACK_WEBHOOK_URL: '',
    JIRA_API_TOKEN: '',
    JIRA_WORKSPACE_URL: '',
  });
  const [activeMcpConfig, setActiveMcpConfig] = useState(null);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  const fetchMcpStatus = async () => {
    try {
      const res = await fetch('/api/mcp-status');
      const data = await res.json();
      if (data.success) {
        setMcpStatus(data.status);
        setCredentials(data.credentials);
      }
    } catch (e) {
      console.error('Failed to fetch MCP status', e);
    }
  };

  useEffect(() => {
    if (agent) {
      setInstructions(agent.agentContent || '');
      setMemory(agent.memoryContent || '');
      
      // Parse MCPs from markdown content or from enabledApps array
      const mcpState = {};
      AVAILABLE_MCPS.forEach(mcp => {
        let isEnabled = false;
        if (agent.enabledApps && Array.isArray(agent.enabledApps)) {
          isEnabled = agent.enabledApps.includes(mcp.id);
        } else {
          const regex = new RegExp(`-\\s*\\[([ xX])\\]\\s*${mcp.name}`, 'i');
          const match = agent.agentContent?.match(regex);
          isEnabled = match ? match[1].toLowerCase() === 'x' : false;
        }
        mcpState[mcp.id] = isEnabled;
      });
      setSelectedMcps(mcpState);
    }
  }, [agent]);

  // Load MCP status and keys whenever MCP tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'mcps') {
      fetchMcpStatus();
    }
  }, [isOpen, activeTab]);

  if (!agent || !isOpen) return null;

  const handleToggleMcp = (mcpId) => {
    setSelectedMcps(prev => ({
      ...prev,
      [mcpId]: !prev[mcpId]
    }));
  };

  const handleSaveCredential = async (keysToSave) => {
    setIsSavingCreds(true);
    try {
      const res = await fetch('/api/mcp-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keysToSave)
      });
      const data = await res.json();
      if (data.success) {
        await fetchMcpStatus(); // Re-fetch to update the badge from yellow to green
        alert('🔑 ¡Credenciales guardadas y cargadas en caliente con éxito!');
        setActiveMcpConfig(null);
      }
    } catch (e) {
      console.error('Failed to save credentials', e);
      alert('Error al guardar credenciales.');
    }
    setIsSavingCreds(false);
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
      const regex = new RegExp(`${mcpSectionTitle}[\\s\\S]*?(?=\\n##|$)`);
      updatedInstructions = updatedInstructions.replace(regex, mcpBlock.trim());
    } else {
      updatedInstructions = updatedInstructions.trim() + '\n\n' + mcpBlock;
    }

    // Convert selectedMcps map to enabledApps array
    const enabledApps = Object.keys(selectedMcps).filter(key => selectedMcps[key]);

    await onSave(agent.id, updatedInstructions, memory, enabledApps);
    setIsSaving(false);
  };

  const renderCredentialsForm = (mcpId) => {
    switch (mcpId) {
      case 'figma-dev-mode':
      case 'figma-live':
        return (
          <div className="credentials-form-box">
            <span className="input-label-mini">Figma API Personal Token</span>
            <input 
              type="password" 
              className="text-input-mini"
              value={credentials.FIGMA_API_TOKEN}
              onChange={(e) => setCredentials(prev => ({ ...prev, FIGMA_API_TOKEN: e.target.value }))}
              placeholder="figd_..."
            />
            <button 
              type="button"
              className="btn-mini"
              onClick={() => handleSaveCredential({ FIGMA_API_TOKEN: credentials.FIGMA_API_TOKEN })}
              disabled={isSavingCreds}
            >
              {isSavingCreds ? 'Guardando...' : '💾 Guardar token'}
            </button>
          </div>
        );
      case 'google-search':
        return (
          <div className="credentials-form-box">
            <span className="input-label-mini">Google Search API Key</span>
            <input 
              type="password" 
              className="text-input-mini"
              value={credentials.GOOGLE_SEARCH_KEY}
              onChange={(e) => setCredentials(prev => ({ ...prev, GOOGLE_SEARCH_KEY: e.target.value }))}
              placeholder="AIzaSy..."
            />
            <button 
              type="button"
              className="btn-mini"
              onClick={() => handleSaveCredential({ GOOGLE_SEARCH_KEY: credentials.GOOGLE_SEARCH_KEY })}
              disabled={isSavingCreds}
            >
              {isSavingCreds ? 'Guardando...' : '💾 Guardar clave'}
            </button>
          </div>
        );
      case 'github':
        return (
          <div className="credentials-form-box">
            <span className="input-label-mini">GitHub Access Token (ghp_...)</span>
            <input 
              type="password" 
              className="text-input-mini"
              value={credentials.GITHUB_TOKEN}
              onChange={(e) => setCredentials(prev => ({ ...prev, GITHUB_TOKEN: e.target.value }))}
              placeholder="ghp_..."
            />
            <button 
              type="button"
              className="btn-mini"
              onClick={() => handleSaveCredential({ GITHUB_TOKEN: credentials.GITHUB_TOKEN })}
              disabled={isSavingCreds}
            >
              {isSavingCreds ? 'Guardando...' : '💾 Guardar token'}
            </button>
          </div>
        );
      case 'notion':
        return (
          <div className="credentials-form-box">
            <span className="input-label-mini">Notion Integration Token</span>
            <input 
              type="password" 
              className="text-input-mini"
              value={credentials.NOTION_API_TOKEN}
              onChange={(e) => setCredentials(prev => ({ ...prev, NOTION_API_TOKEN: e.target.value }))}
              placeholder="secret_..."
            />
            <button 
              type="button"
              className="btn-mini"
              onClick={() => handleSaveCredential({ NOTION_API_TOKEN: credentials.NOTION_API_TOKEN })}
              disabled={isSavingCreds}
            >
              {isSavingCreds ? 'Guardando...' : '💾 Guardar token'}
            </button>
          </div>
        );
      case 'slack':
        return (
          <div className="credentials-form-box">
            <span className="input-label-mini">Slack Webhook URL</span>
            <input 
              type="text" 
              className="text-input-mini"
              value={credentials.SLACK_WEBHOOK_URL}
              onChange={(e) => setCredentials(prev => ({ ...prev, SLACK_WEBHOOK_URL: e.target.value }))}
              placeholder="https://hooks.slack.com/services/..."
            />
            <button 
              type="button"
              className="btn-mini"
              onClick={() => handleSaveCredential({ SLACK_WEBHOOK_URL: credentials.SLACK_WEBHOOK_URL })}
              disabled={isSavingCreds}
            >
              {isSavingCreds ? 'Guardando...' : '💾 Guardar webhook'}
            </button>
          </div>
        );
      case 'jira':
        return (
          <div className="credentials-form-box" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span className="input-label-mini">Jira API Token</span>
              <input 
                type="password" 
                className="text-input-mini"
                value={credentials.JIRA_API_TOKEN}
                onChange={(e) => setCredentials(prev => ({ ...prev, JIRA_API_TOKEN: e.target.value }))}
                placeholder="ATATT..."
              />
            </div>
            <div>
              <span className="input-label-mini">Jira Workspace URL</span>
              <input 
                type="text" 
                className="text-input-mini"
                value={credentials.JIRA_WORKSPACE_URL}
                onChange={(e) => setCredentials(prev => ({ ...prev, JIRA_WORKSPACE_URL: e.target.value }))}
                placeholder="https://your-domain.atlassian.net"
              />
            </div>
            <button 
              type="button"
              className="btn-mini"
              onClick={() => handleSaveCredential({ 
                JIRA_API_TOKEN: credentials.JIRA_API_TOKEN,
                JIRA_WORKSPACE_URL: credentials.JIRA_WORKSPACE_URL
              })}
              disabled={isSavingCreds}
            >
              {isSavingCreds ? 'Guardando...' : '💾 Guardar credenciales'}
            </button>
          </div>
        );
      default:
        return null;
    }
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <span className="input-label">Habilitar/Deshabilitar MCP Servers</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Selecciona qué servidores de MCP tiene permitidos este agente. Si la herramienta requiere credenciales locales (Tokens/API Keys), configúralas abajo en caliente para activarla.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {AVAILABLE_MCPS.map(mcp => {
                const isSystemMcp = mcp.id === 'sqlite' || mcp.id === 'filesystem';
                const isConnected = isSystemMcp || !!mcpStatus[mcp.id];
                
                return (
                  <div key={mcp.id} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255, 255, 255, 0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="switch-label" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="switch-title" style={{ fontSize: '0.8rem', fontWeight: '600' }}>{mcp.name}</span>
                          {!isSystemMcp && (
                            <span className={`mcp-status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                              {isConnected ? '🟢 Conectado' : '🟡 Desconectado'}
                            </span>
                          )}
                        </div>
                        <span className="switch-desc" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{mcp.desc}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {!isSystemMcp && (
                          <button 
                            type="button"
                            className="mcp-config-btn"
                            onClick={() => setActiveMcpConfig(activeMcpConfig === mcp.id ? null : mcp.id)}
                          >
                            {activeMcpConfig === mcp.id ? 'Ocultar' : 'Configurar'}
                          </button>
                        )}
                        <label className="switch">
                          <input 
                            type="checkbox"
                            checked={!!selectedMcps[mcp.id]}
                            onChange={() => handleToggleMcp(mcp.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>

                    {/* Drawer de configuración de credenciales */}
                    {activeMcpConfig === mcp.id && renderCredentialsForm(mcp.id)}
                  </div>
                );
              })}
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

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Layers, Search, BookOpen, MessageSquare, Ticket, Palette, Play } from 'lucide-react';

const AgentNode = ({ data }) => {
  // Try to extract a brief description from the markdown instructions
  const getSummary = (content) => {
    if (!content) return 'Sin instrucciones definidas.';
    const objectiveMatch = content.match(/## Objetivo\n([\s\S]*?)(?=\n##|$)/);
    let summary = objectiveMatch ? objectiveMatch[1].trim() : content;
    
    summary = summary.replace(/[#*`_-]/g, '').trim();
    if (summary.length > 70) {
      return summary.substring(0, 70) + '...';
    }
    return summary;
  };

  const enabledApps = data.enabledApps || [];

  // Determine wrapper classes based on visual flow status
  const classes = [
    'agent-node-inner',
    data.isStartNode ? 'start-node' : '',
    data.hasSelection && !data.isActiveFlow ? 'excluded-node' : '',
    data.isActiveFlow && !data.isStartNode ? 'active-flow-node' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {data.isStartNode && (
        <div className="start-node-ribbon">
          <Play size={8} style={{ fill: '#10b981', stroke: '#10b981', marginRight: '2px' }} />
          PUNTO INICIO
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: '#6366f1', width: '8px', height: '8px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: '#6366f1', width: '8px', height: '8px' }}
      />
      
      <div className="node-header">
        <div className="node-icon">
          <Bot size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="node-title">{data.name}</div>
          <div className="node-badge">{data.id.split('_')[0]}</div>
        </div>
      </div>
      
      <div className="node-body">
        <p className="node-summary-text">{getSummary(data.agentContent)}</p>
        
        {/* Render App badges if any are enabled */}
        {enabledApps.length > 0 && (
          <div className="node-apps-row">
            {enabledApps.includes('google-search') && (
              <span className="app-badge google" title="Google Search">
                <Search size={8} /> Google
              </span>
            )}
            {enabledApps.includes('notion') && (
              <span className="app-badge notion" title="Notion Workspace">
                <BookOpen size={8} /> Notion
              </span>
            )}
            {(enabledApps.includes('figma-dev-mode') || enabledApps.includes('figma-live')) && (
              <span className="app-badge figma" title="Figma Integration">
                <Palette size={8} /> Figma
              </span>
            )}
            {enabledApps.includes('slack') && (
              <span className="app-badge slack" title="Slack Connect">
                <MessageSquare size={8} /> Slack
              </span>
            )}
            {enabledApps.includes('jira') && (
              <span className="app-badge jira" title="Jira Management">
                <Ticket size={8} /> Jira
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="node-footer">
        <div className="node-mcp-status">
          <span 
            className="status-dot" 
            style={{ 
              backgroundColor: data.status === 'running' ? '#eab308' : (data.status === 'completed' ? '#10b981' : (data.isActiveFlow ? '#8b5cf6' : '#4b5563')),
              boxShadow: data.status === 'running' ? '0 0 8px #eab308' : 'none'
            }}
          ></span>
          <span style={{ color: data.isActiveFlow ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {data.status === 'running' ? 'Procesando...' : (data.status === 'completed' ? 'Completado' : (data.isActiveFlow ? 'Activo' : 'Listo'))}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Layers size={10} />
          <span>Agent</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#8b5cf6', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#8b5cf6', width: '8px', height: '8px' }}
      />
    </div>
  );
};

export default memo(AgentNode);

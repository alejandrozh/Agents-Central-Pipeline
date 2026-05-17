import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Layers, CheckCircle } from 'lucide-react';

const AgentNode = ({ data }) => {
  // Try to extract a brief description from the markdown instructions
  const getSummary = (content) => {
    if (!content) return 'Sin instrucciones definidas.';
    // Find content under "Objetivo" or just the first paragraph
    const objectiveMatch = content.match(/## Objetivo\n([\s\S]*?)(?=\n##|$)/);
    let summary = objectiveMatch ? objectiveMatch[1].trim() : content;
    
    // Clean up markdown formatting for summary
    summary = summary.replace(/[#*`_-]/g, '').trim();
    if (summary.length > 80) {
      return summary.substring(0, 80) + '...';
    }
    return summary;
  };

  return (
    <div className="agent-node-inner">
      <Handle
        type="target"
        position={Position.Top}
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
        {getSummary(data.agentContent)}
      </div>
      
      <div className="node-footer">
        <div className="node-mcp-status">
          <span 
            className="status-dot" 
            style={{ 
              backgroundColor: data.status === 'running' ? '#eab308' : (data.status === 'completed' ? '#10b981' : '#6366f1'),
              boxShadow: data.status === 'running' ? '0 0 8px #eab308' : 'none'
            }}
          ></span>
          <span>{data.status === 'running' ? 'Procesando...' : (data.status === 'completed' ? 'Completado' : 'Listo')}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Layers size={10} />
          <span>Agent</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#8b5cf6', width: '8px', height: '8px' }}
      />
    </div>
  );
};

export default memo(AgentNode);

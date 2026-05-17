'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AgentNode from './AgentNode';

const AgentCanvas = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect, 
  onNodeClick,
  onEdgeDoubleClick
}) => {
  const nodeTypes = useMemo(() => ({ agentNode: AgentNode }), []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        fitView
        colorMode="dark"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1} 
          color="rgba(255,255,255,0.07)" 
        />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default AgentCanvas;

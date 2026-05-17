import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AGENTS_DIR = 'C:\\Users\\aleja\\Documents\\Claude\\Agents_central';

export async function PUT(request, { params }) {
  try {
    const { id } = params; // E.g., '01_product_designer_agent'
    const body = await request.json();
    const { agentContent, memoryContent } = body;

    const agentDir = path.join(AGENTS_DIR, id);
    if (!fs.existsSync(agentDir)) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const files = fs.readdirSync(agentDir);
    let agentFile = null;
    for (const file of files) {
      if (file !== 'memory.md' && file.endsWith('.md')) {
        agentFile = file;
        break;
      }
    }

    if (!agentFile) {
      return NextResponse.json({ error: 'Agent markdown file not found' }, { status: 404 });
    }

    // Write updated agent content
    if (agentContent !== undefined) {
      fs.writeFileSync(path.join(agentDir, agentFile), agentContent, 'utf-8');
    }

    // Write updated memory content
    if (memoryContent !== undefined) {
      fs.writeFileSync(path.join(agentDir, 'memory.md'), memoryContent, 'utf-8');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const agentDir = path.join(AGENTS_DIR, id);

    if (!fs.existsSync(agentDir)) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Recursive directory deletion
    fs.rmSync(agentDir, { recursive: true, force: true });

    // Also need to clean up references in graph.json if any
    const graphPath = path.join(AGENTS_DIR, 'graph.json');
    if (fs.existsSync(graphPath)) {
      try {
        const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
        const filteredNodes = graph.nodes.filter(node => node.id !== id);
        const filteredEdges = graph.edges.filter(edge => edge.source !== id && edge.target !== id);
        fs.writeFileSync(graphPath, JSON.stringify({ nodes: filteredNodes, edges: filteredEdges }, null, 2), 'utf-8');
      } catch (e) {
        console.error('Error cleaning up deleted agent in graph.json', e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

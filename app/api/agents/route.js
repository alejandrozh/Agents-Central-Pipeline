import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AGENTS_DIR = 'C:\\Users\\aleja\\Documents\\Claude\\Agents_central';

// Helper to get all agent directories and their markdown files
function getAgentsData() {
  if (!fs.existsSync(AGENTS_DIR)) {
    return { agents: [], graph: { nodes: [], edges: [] } };
  }

  const items = fs.readdirSync(AGENTS_DIR);
  const agents = [];

  for (const item of items) {
    const itemPath = path.join(AGENTS_DIR, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      const files = fs.readdirSync(itemPath);
      let agentFile = null;
      let memoryFile = null;

      for (const file of files) {
        if (file === 'memory.md') {
          memoryFile = file;
        } else if (file.endsWith('.md')) {
          agentFile = file;
        }
      }

      if (agentFile) {
        const agentFilePath = path.join(itemPath, agentFile);
        const agentContent = fs.readFileSync(agentFilePath, 'utf-8');
        
        let memoryContent = '';
        if (memoryFile) {
          memoryContent = fs.readFileSync(path.join(itemPath, memoryFile), 'utf-8');
        }

        // Extract Title/Role from markdown (usually first line with # or ##)
        const titleMatch = agentContent.match(/^#\s+(.+)$/m);
        const name = titleMatch ? titleMatch[1].trim() : agentFile.replace('.md', '').replace(/_/g, ' ');

        // Extract basic metadata like active MCPs if configured in the markdown
        // For now, let's parse MCPs list from the MD or just look for a section
        // We'll also allow custom JSON configuration inside the markdown or parsed from headers.
        
        agents.push({
          id: item, // folder name serves as ID (e.g., '01_product_designer_agent')
          name,
          folder: item,
          agentFile,
          agentContent,
          memoryContent,
          path: agentFilePath,
        });
      }
    }
  }

  // Load graph layout
  let graph = { nodes: [], edges: [] };
  const graphPath = path.join(AGENTS_DIR, 'graph.json');
  if (fs.existsSync(graphPath)) {
    try {
      graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    } catch (e) {
      console.error('Error parsing graph.json', e);
    }
  }

  return { agents, graph };
}

export async function GET() {
  try {
    const data = getAgentsData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'saveGraph') {
      const { graph } = body;
      const graphPath = path.join(AGENTS_DIR, 'graph.json');
      fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf-8');
      return NextResponse.json({ success: true });
    }

    if (action === 'createAgent') {
      const { name, role, instructions, memory } = body;
      
      // Generate standard directory name: e.g. "08_my_new_agent"
      const items = fs.readdirSync(AGENTS_DIR);
      let maxNum = 0;
      for (const item of items) {
        const match = item.match(/^(\d+)_/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      
      const newNum = String(maxNum + 1).padStart(2, '0');
      const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const folderName = `${newNum}_${safeName}`;
      const newAgentDir = path.join(AGENTS_DIR, folderName);
      
      fs.mkdirSync(newAgentDir);
      
      // Write agent file
      const agentFileName = `${safeName}.md`;
      const agentFilePath = path.join(newAgentDir, agentFileName);
      const agentContent = `# ${role || name}\n\n## Objetivo\n${instructions || 'Define el objetivo aquí.'}\n`;
      fs.writeFileSync(agentFilePath, agentContent, 'utf-8');
      
      // Write memory file
      const memoryFilePath = path.join(newAgentDir, 'memory.md');
      fs.writeFileSync(memoryFilePath, memory || '# Memoria del Agente\n', 'utf-8');
      
      return NextResponse.json({ success: true, agent: { id: folderName, name: role || name } });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

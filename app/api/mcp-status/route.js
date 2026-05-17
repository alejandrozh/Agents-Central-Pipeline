import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');

// Helper to parse key-value pairs from .env.local
function readEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    return {};
  }
  const content = fs.readFileSync(ENV_PATH, 'utf-8');
  const lines = content.split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      env[key] = value;
    }
  }
  return env;
}

// Helper to write key-value pairs back to .env.local preserving comments
function writeEnv(newKeys) {
  let content = '';
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf-8');
  }

  const env = readEnv();
  const updatedEnv = { ...env, ...newKeys };

  // Generate clean env content
  let output = '';
  const lines = content.split('\n');
  const processedKeys = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed || !trimmed.includes('=')) {
      output += line + '\n';
    } else {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      if (updatedEnv[key] !== undefined) {
        output += `${key}=${updatedEnv[key]}\n`;
        processedKeys.add(key);
      } else {
        output += line + '\n';
      }
    }
  }

  // Append any keys that weren't in the original .env.local file
  for (const key in updatedEnv) {
    if (!processedKeys.has(key)) {
      output += `${key}=${updatedEnv[key]}\n`;
    }
  }

  fs.writeFileSync(ENV_PATH, output.trim() + '\n', 'utf-8');

  // Dynamically update process.env of current running process
  for (const key in updatedEnv) {
    process.env[key] = updatedEnv[key];
  }
}

export async function GET() {
  try {
    const env = readEnv();
    
    // Check connection status of each MCP based on environment variable presence
    const status = {
      'figma-dev-mode': !!(env.FIGMA_API_TOKEN && env.FIGMA_API_TOKEN !== 'tu_figma_token'),
      'figma-live': !!(env.FIGMA_API_TOKEN && env.FIGMA_API_TOKEN !== 'tu_figma_token'),
      'filesystem': true, // Always connected local
      'google-search': !!(env.GOOGLE_SEARCH_KEY && env.GOOGLE_SEARCH_KEY !== 'tu_google_key'),
      'github': !!(env.GITHUB_TOKEN && env.GITHUB_TOKEN !== 'tu_github_token'),
      'sqlite': true, // Always active
      'notion': !!(env.NOTION_API_TOKEN && env.NOTION_API_TOKEN !== 'tu_notion_token'),
      'slack': !!(env.SLACK_WEBHOOK_URL && env.SLACK_WEBHOOK_URL !== 'tu_slack_webhook'),
      'jira': !!(env.JIRA_API_TOKEN && env.JIRA_WORKSPACE_URL)
    };

    // Return current status and the raw tokens (safe since it's local)
    return NextResponse.json({
      success: true,
      status,
      credentials: {
        GEMINI_API_KEY: env.GEMINI_API_KEY || '',
        FIGMA_API_TOKEN: env.FIGMA_API_TOKEN || '',
        GOOGLE_SEARCH_KEY: env.GOOGLE_SEARCH_KEY || '',
        GITHUB_TOKEN: env.GITHUB_TOKEN || '',
        NOTION_API_TOKEN: env.NOTION_API_TOKEN || '',
        SLACK_WEBHOOK_URL: env.SLACK_WEBHOOK_URL || '',
        JIRA_API_TOKEN: env.JIRA_API_TOKEN || '',
        JIRA_WORKSPACE_URL: env.JIRA_WORKSPACE_URL || '',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const credentials = await request.json();
    writeEnv(credentials);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

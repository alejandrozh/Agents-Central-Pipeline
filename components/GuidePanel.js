'use client';

import React from 'react';
import { X, HelpCircle, ArrowRight, GitFork, PlayCircle, Cpu } from 'lucide-react';

const GuidePanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={`side-panel panel-left glass ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle size={18} className="logo-icon" style={{ boxShadow: 'none' }} />
          <h3 className="panel-title">Guía de Orquestación</h3>
        </div>
        <button className="btn-icon" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="panel-content">
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          ¡Bienvenido al lienzo de orquestación de agentes! Aquí tienes una guía rápida de lo que puedes hacer y cómo estructurar tu pipeline de IA.
        </p>

        <div className="guide-list">
          <div className="guide-item">
            <div className="guide-step">1</div>
            <div className="guide-text">
              <h4>El Canvas (Mapa Visual)</h4>
              <p>Cada nodo representa un Agente definido en tus archivos locales de Markdown. Arrastra los nodos para organizar tu flujo de trabajo.</p>
            </div>
          </div>

          <div className="guide-item">
            <div className="guide-step">2</div>
            <div className="guide-text">
              <h4>Conectar Agentes</h4>
              <p>Arrastra desde el conector inferior (fuente) de un agente al conector superior (destino) de otro agente. Esto simboliza la transmisión de tareas o outputs (ej. Product Designer → Frontend Engineer).</p>
            </div>
          </div>

          <div className="guide-item">
            <div className="guide-step">3</div>
            <div className="guide-text">
              <h4>Modificar Agentes</h4>
              <p>Haz clic en cualquier agente para abrir el Editor Lateral. Puedes modificar directamente su rol/instrucciones del sistema y su archivo `memory.md` para guardar contexto acumulado.</p>
            </div>
          </div>

          <div className="guide-item">
            <div className="guide-step">4</div>
            <div className="guide-text">
              <h4>Habilitar MCPs</h4>
              <p>En la pestaña "MCPs", activa o desactiva las capacidades especiales de cada agente (como búsquedas, Figma o base de datos). Esto se guardará directamente en el Markdown del agente.</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '10px', padding: '15px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-indigo)' }}>
            <Cpu size={16} />
            Tip de Orquestación
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Mantén las responsabilidades de cada agente específicas. Conecta a tus ingenieros a los arquitectos correspondientes para crear cadenas operativas sólidas. ¡El guardado es automático al cambiar las conexiones y posiciones!
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuidePanel;

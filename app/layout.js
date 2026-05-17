import './globals.css';

export const metadata = {
  title: 'Agents Central Pipeline - Visual Workspace',
  description: 'Visualiza, conecta y edita tus agentes de IA locales.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}

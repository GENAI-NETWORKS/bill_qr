/**
 * CustomerShell — centers and constrains customer panel to mobile width
 * so it looks like a proper app card even on desktop browsers.
 */
export default function CustomerShell({ children }) {
  return (
    <div style={{ background: '#e8ecf4', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%',
        maxWidth: 430,
        background: '#f0f4ff',
        minHeight: '100vh',
        position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </div>
    </div>
  );
}

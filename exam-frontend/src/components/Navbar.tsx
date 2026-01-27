"use client";

export default function Navbar({ onToggle }: { onToggle?: () => void }) {
  return (
    <nav className="top-nav">
      <div style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: 18 }}>Quiz App</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>Hello, <b>Guest</b></span>
        <button className="toggle-btn" onClick={() => { if (onToggle) onToggle(); else { const s = document.getElementById('sidebar'); if (s) s.classList.toggle('active'); } }}>☰</button>
      </div>
    </nav>
  );
}

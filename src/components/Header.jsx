import React from 'react';

export default function Header({ user, dbOnline, theme, toggleTheme, onOpenAuth, onOpenAdd, onLogout }) {
  return (
    <header>
      <div className="headTitle">
        <h1>Flashcard TOEIC</h1>
        <p>
          1205 từ vựng thông dụng · bấm vào thẻ để lật{' '}
          {user ? (
            <span style={{ color: 'var(--teal)', fontWeight: 600 }}> (👤 {user.name || user.username})</span>
          ) : dbOnline ? (
            <span style={{ color: 'var(--teal)' }}> (☁️ MongoDB Cloud)</span>
          ) : null}
        </p>
      </div>
      <div className="headActions">
        <button className="iconBtn ghost" id="themeBtn" onClick={toggleTheme} title="Đổi giao diện sáng/tối">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user ? (
          <button className="ghost" onClick={onLogout} title="Đăng xuất tài khoản">
            🚪 Đăng xuất ({user.username})
          </button>
        ) : (
          <button className="ghost" id="dataBtn" onClick={onOpenAuth} title="Đăng nhập tài khoản MongoDB">
            🔑 Đăng nhập
          </button>
        )}

        <button className="primary" onClick={onOpenAdd}>+ Thêm từ</button>
      </div>
    </header>
  );
}

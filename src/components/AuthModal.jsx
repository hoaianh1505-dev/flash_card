import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, showToast }) {
  const [activeTab, setActiveTab] = useState('login');

  // Empty state so credentials are never pre-filled or suggested automatically
  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: loginAccount,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại.');

      localStorage.setItem('toeic_token', data.token);
      showToast(`🎉 Đăng nhập thành công! Chào mừng ${data.user.name || data.user.username}`);
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      showToast(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName || regUsername,
          username: regUsername,
          email: regEmail,
          password: regPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại.');

      localStorage.setItem('toeic_token', data.token);
      showToast(`✨ Đăng ký thành công! Đã tạo tài khoản ${data.user.username}`);
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      showToast(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show" id="dataModal">
      <div className="box">
        <button className="closeX" onClick={onClose} aria-label="Đóng">×</button>
        <h2>🔑 Tài khoản & DB Online</h2>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Đăng nhập
          </button>
          <button
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Đăng ký mới
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} autoComplete="off">
            <label>Tên đăng nhập hoặc Email
              <input
                type="text"
                value={loginAccount}
                onChange={(e) => setLoginAccount(e.target.value)}
                placeholder="Nhập tên đăng nhập hoặc email"
                autoComplete="off"
                required
              />
            </label>

            <label>Mật khẩu
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </label>

            <div className="formBtns" style={{ marginTop: 16 }}>
              <button type="button" className="soft" onClick={onClose}>Huỷ</button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Đang xác thực...' : '🚀 Đăng nhập MongoDB'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} autoComplete="off">
            <label>Họ và tên
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nguyễn Văn A"
                autoComplete="off"
              />
            </label>

            <label>Tên đăng nhập
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="hocvien123"
                autoComplete="off"
                required
              />
            </label>

            <label>Email
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="hocvien@gmail.com"
                autoComplete="off"
                required
              />
            </label>

            <label>Mật khẩu
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Mật khẩu từ 6 ký tự"
                autoComplete="new-password"
                required
              />
            </label>

            <div className="formBtns" style={{ marginTop: 16 }}>
              <button type="button" className="soft" onClick={onClose}>Huỷ</button>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Đang tạo...' : '✨ Tạo tài khoản'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

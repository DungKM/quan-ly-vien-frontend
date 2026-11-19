import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin, notify }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const v = await api('login', Object.fromEntries(new FormData(e.target)));
      await onLogin(v.csrf);
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login">
      <form className="loginbox" onSubmit={submit}>
        <div className="muted">B12 Research Management System</div>
        <h1>B12-RMS 3.0</h1>
        <p className="muted">Đăng nhập bằng tài khoản được Giám đốc cấp</p>
        <div className="field"><label>Tài khoản</label><input name="username" autoComplete="username" autoFocus required /></div>
        <div className="field"><label>Mật khẩu</label><input name="password" type="password" autoComplete="current-password" required /></div>
        <button style={{ width: '100%' }} disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        <p className="muted tiny">Quên mật khẩu? Liên hệ Giám đốc để được đặt lại.</p>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { api } from '../api.js';
import { Btn, Field, Icon } from '../components/ui.jsx';

export default function Login({ onLogin, notify }) {
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const v = await api('login', Object.fromEntries(new FormData(e.target)));
      await onLogin(v.csrf);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login">
      <div className="login-art">
        <div className="brand" style={{ padding: 0 }}>
          <span className="brand-mark">B12</span>
          <span><span className="brand-name">B12 · RMS</span><span className="brand-sub">Research Platform 3.0</span></span>
        </div>
        <div>
          <h2>Quản lý đề tài nghiên cứu tập trung, minh bạch</h2>
          <p>Theo dõi đề tài qua 8 giai đoạn, giao việc và báo cáo tiến độ, phê duyệt kết quả, quản lý hành chính – tài chính trên một nền tảng.</p>
          <div className="login-feats">
            <div><Icon name="layers" /> Đề tài & 8 giai đoạn thực hiện</div>
            <div><Icon name="tasks" /> Giao việc, báo cáo, phê duyệt</div>
            <div><Icon name="shield" /> Phân quyền theo chức vụ và đề tài</div>
          </div>
        </div>
        <div />
      </div>
      <div className="login-form">
        <form className="loginbox" onSubmit={submit}>
          <h1>Đăng nhập</h1>
          <p className="lead">Sử dụng tài khoản được Giám đốc cấp</p>
          <Field label="Tài khoản" name="username" autoComplete="username" autoFocus required placeholder="Tên đăng nhập" />
          <Field label="Mật khẩu" name="password" type="password" autoComplete="current-password" required placeholder="••••••••••" />
          <Btn type="submit" variant="primary" size="md" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</Btn>
          <p className="login-foot">Quên mật khẩu? Liên hệ Giám đốc để được đặt lại.</p>
        </form>
      </div>
    </div>
  );
}

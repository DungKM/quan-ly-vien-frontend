import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getMe, getState, setCsrf } from './api.js';
import { AppContext, useApp } from './AppContext.jsx';
import { MENU, PAGE_TITLES } from './constants.js';
import { Modal } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import Tasks from './pages/Tasks.jsx';
import People from './pages/People.jsx';
import Approvals from './pages/Approvals.jsx';
import Finance from './pages/Finance.jsx';
import Research from './pages/Research.jsx';
import Samples from './pages/Samples.jsx';
import Documents from './pages/Documents.jsx';
import Audit from './pages/Audit.jsx';

function ChangePassword() {
  const { notify, closeModal } = useApp();
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (d.new_password !== d.confirm) { notify('Mật khẩu nhập lại không khớp'); return; }
    setBusy(true);
    try {
      await api('change-password', { old_password: d.old_password, new_password: d.new_password });
      closeModal();
      notify('Đã đổi mật khẩu');
    } catch (err) { notify('Lỗi: ' + err.message); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit}>
      <div className="field"><label>Mật khẩu hiện tại</label><input name="old_password" type="password" autoComplete="current-password" required /></div>
      <div className="field"><label>Mật khẩu mới (≥10 ký tự)</label><input name="new_password" type="password" autoComplete="new-password" minLength={10} required /></div>
      <div className="field"><label>Nhập lại mật khẩu mới</label><input name="confirm" type="password" autoComplete="new-password" minLength={10} required /></div>
      <button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Đổi mật khẩu'}</button>{' '}
      <button type="button" className="secondary" onClick={closeModal}>Đóng</button>
    </form>
  );
}

const PAGES = {
  dashboard: Dashboard, projects: Projects, tasks: Tasks, mine: () => <Tasks onlyMine />, people: People,
  approvals: Approvals, finance: Finance, research: Research, samples: Samples, documents: Documents, audit: Audit,
};

export default function App() {
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState('');
  const [S, setS] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const notify = useCallback((m) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, m }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const refresh = useCallback(async () => {
    const data = await getState();
    setS(data);
    if (!data) setModal(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const m = await getMe();
        setCsrf(m.csrf);
        if (m.user) await refresh();
      } catch (e) {
        setBootError('Không kết nối được tới máy chủ. ' + e.message);
      } finally {
        setBooting(false);
      }
    })();
  }, [refresh]);

  const ctx = useMemo(() => ({
    S, me: S?.me, refresh, notify,
    showModal: (title, content) => setModal({ title, content }),
    closeModal: () => setModal(null),
    can: (...roles) => roles.includes(S?.me?.role),
  }), [S, refresh, notify]);

  const toastView = toasts.map((t, i) => <div key={t.id} className="toast" style={{ bottom: 22 + i * 56 }}>{t.m}</div>);

  if (booting) return <div className="empty">Đang tải…</div>;
  if (bootError) return <div className="empty">{bootError}</div>;
  if (!S) {
    return (
      <>
        <Login onLogin={async (csrf) => { setCsrf(csrf); setPage('dashboard'); await refresh(); }} notify={notify} />
        {toastView}
      </>
    );
  }

  const logout = async () => {
    try { await api('logout'); } catch { /* phiên có thể đã hết hạn */ }
    setCsrf('');
    setModal(null);
    setS(null);
  };
  const nav = (p) => { setPage(p); setModal(null); };
  const View = PAGES[page] || Dashboard;

  return (
    <AppContext.Provider value={ctx}>
      <div className="shell">
        <aside className="sidebar">
          <div><div className="brand">B12 · RMS</div><div className="subbrand">RESEARCH PLATFORM · 3.0</div></div>
          {MENU.filter(([k]) => k !== 'audit' || ctx.can('director')).map(([k, label]) => (
            <button key={k} className={'nav ' + (page === k ? 'active' : '')} onClick={() => nav(k)}>{label}</button>
          ))}
        </aside>
        <main className="main">
          <div className="top">
            <div>
              <h1>{PAGE_TITLES[page]}</h1>
              <div className="muted">Bản thử nghiệm • Mọi dữ liệu là giả lập • Chưa đủ điều kiện sử dụng dữ liệu người bệnh thật</div>
            </div>
            <div className="headerActions"><span className="pill">{S.me.name}</span><button className="secondary" onClick={() => ctx.showModal('Đổi mật khẩu', <ChangePassword />)}>Đổi mật khẩu</button><button className="secondary" onClick={logout}>Đăng xuất</button></div>
          </div>
          <div><View /></div>
        </main>
      </div>
      {modal && <Modal title={modal.title} onClose={ctx.closeModal}>{modal.content}</Modal>}
      {toastView}
    </AppContext.Provider>
  );
}

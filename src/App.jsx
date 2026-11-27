import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getMe, getState, setCsrf } from './api.js';
import { AppContext, useApp } from './AppContext.jsx';
import { MENU_GROUPS, PAGE_DESCRIPTIONS, PAGE_TITLES, positionOf } from './constants.js';
import { Avatar, Btn, Field, FormActions, Icon, IconBtn, Modal } from './components/ui.jsx';
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
    if (d.new_password !== d.confirm) { notify('Mật khẩu nhập lại không khớp', 'error'); return; }
    setBusy(true);
    try {
      await api('change-password', { old_password: d.old_password, new_password: d.new_password });
      closeModal();
      notify('Đã đổi mật khẩu', 'success');
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit}>
      <Field label="Mật khẩu hiện tại" name="old_password" type="password" autoComplete="current-password" required />
      <Field label="Mật khẩu mới" name="new_password" type="password" autoComplete="new-password" minLength={10} required hint="Ít nhất 10 ký tự" />
      <Field label="Nhập lại mật khẩu mới" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      <FormActions>
        <Btn variant="ghost" size="md" onClick={closeModal}>Huỷ</Btn>
        <Btn variant="primary" size="md" type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Đổi mật khẩu'}</Btn>
      </FormActions>
    </form>
  );
}

// Hộp thoại xác nhận / nhập ghi chú (thay cho window.confirm / window.prompt)
function Dialog({ d, onDone }) {
  const [text, setText] = useState(d.defaultText || '');
  return (
    <Modal title={d.title} size="sm" layer={3} onClose={() => onDone(d.input ? null : false)}>
      <form onSubmit={(e) => { e.preventDefault(); onDone(d.input ? text : true); }}>
        {d.message && <p className="dialog-msg">{d.message}</p>}
        {d.input && <div className="field"><label>{d.input}</label>
          {d.single
            ? <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={d.placeholder} autoComplete="off" />
            : <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} />}
        </div>}
        <FormActions>
          <Btn variant="ghost" size="md" onClick={() => onDone(d.input ? null : false)}>Huỷ</Btn>
          <Btn variant={d.danger ? 'danger' : 'primary'} size="md" type="submit" autoFocus={!d.input}>{d.okText || 'Đồng ý'}</Btn>
        </FormActions>
      </form>
    </Modal>
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
  const [dialog, setDialog] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  // kind: info | success | error (tự nhận "Lỗi" là lỗi)
  const notify = useCallback((m, kind) => {
    const id = ++toastId.current;
    const k = kind || (/^lỗi/i.test(String(m)) ? 'error' : 'info');
    setToasts((t) => [...t, { id, m: String(m).replace(/^Lỗi:\s*/i, ''), k }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
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

  const openDialog = useCallback((d) => new Promise((resolve) => setDialog({ ...d, resolve })), []);
  const closeModal = useCallback(() => setModal(null), []);

  const ctx = useMemo(() => ({
    S, me: S?.me, refresh, notify,
    showModal: (title, content, size) => setModal({ title, content, size }),
    closeModal,
    can: (...roles) => roles.includes(S?.me?.role),
    go: (p) => { setPage(p); setModal(null); setNavOpen(false); window.scrollTo(0, 0); },
    // confirm(message, {title, okText, danger}) -> Promise<boolean>
    confirm: (message, o = {}) => openDialog({ title: o.title || 'Xác nhận', message, okText: o.okText, danger: o.danger }),
    // ask(title, {label, message, okText}) -> Promise<string|null>
    ask: (title, o = {}) => openDialog({ title, message: o.message, input: o.label || 'Ghi chú', okText: o.okText, defaultText: o.defaultText, danger: o.danger, single: o.single, placeholder: o.placeholder }),
  }), [S, refresh, notify, closeModal, openDialog]);

  const toastView = (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={'toast toast-' + t.k}>
          <Icon name={t.k === 'error' ? 'alert' : t.k === 'success' ? 'checkCircle' : 'info'} size={18} />
          <span>{t.m}</span>
        </div>
      ))}
    </div>
  );

  if (booting) return <div className="boot"><div className="spinner" />Đang tải…</div>;
  if (bootError) return <div className="boot"><Icon name="alert" size={28} />{bootError}</div>;
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
  const View = PAGES[page] || Dashboard;
  const me = S.me;
  const visible = (k) => (k !== 'audit' || me.role === 'director') && (k !== 'finance' || S.finance_level);
  const mineOpen = S.tasks.filter((t) => t.status !== 'Hoàn thành'
    && (t.owner_id === me.id || S.task_assignees.some((a) => a.task_id === t.id && a.user_id === me.id))).length;
  const pending = S.approvals.filter((a) => a.status === 'Chờ duyệt').length;
  const badges = { mine: mineOpen, approvals: ['director', 'lead'].includes(me.role) ? pending : 0 };

  return (
    <AppContext.Provider value={ctx}>
      <div className={'app' + (navOpen ? ' nav-open' : '')}>
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark">B12</span>
            <span><span className="brand-name">B12 · RMS</span><span className="brand-sub">Research Platform 3.0</span></span>
          </div>
          <nav className="nav">
            {MENU_GROUPS.map(([group, items]) => {
              const shown = items.filter(([k]) => visible(k));
              if (!shown.length) return null;
              return (
                <div key={group} className="nav-group">
                  <div className="nav-label">{group}</div>
                  {shown.map(([k, label, icon]) => (
                    <button key={k} type="button" className={'nav-item' + (page === k ? ' active' : '')} onClick={() => ctx.go(k)}>
                      <Icon name={icon} size={18} /><span>{label}</span>
                      {badges[k] ? <span className="nav-badge">{badges[k]}</span> : null}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
          <div className="me">
            <div className="me-info">
              <Avatar name={me.name} size={36} />
              <div className="me-text"><div className="me-name">{me.name}</div><div className="me-role">{positionOf(S.users.find((u) => u.id === me.id) || me)}</div></div>
            </div>
            <div className="me-actions">
              <IconBtn icon="key" title="Đổi mật khẩu" onClick={() => ctx.showModal('Đổi mật khẩu', <ChangePassword />, 'sm')} />
              <IconBtn icon="logout" title="Đăng xuất" onClick={logout} />
            </div>
          </div>
        </aside>
        <div className="scrim" onClick={() => setNavOpen(false)} />
        <main className="main">
          <header className="topbar">
            <IconBtn icon="menu" title="Menu" className="iconbtn iconbtn-ghost menu-btn" onClick={() => setNavOpen(true)} />
            <div className="topbar-title">
              <h1>{PAGE_TITLES[page]}</h1>
              <p>{PAGE_DESCRIPTIONS[page]}</p>
            </div>          </header>
          <div className="content"><View /></div>
        </main>
      </div>
      {modal && <Modal title={modal.title} size={modal.size} onClose={closeModal}>{modal.content}</Modal>}
      {dialog && <Dialog d={dialog} onDone={(v) => { dialog.resolve(v); setDialog(null); }} />}
      {toastView}
    </AppContext.Provider>
  );
}

import { useEffect, useRef } from 'react';

// ---------- Icon (SVG nét, 24x24) ----------
const ICONS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  tasks: <path d="M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17M11 6h10M11 12h10M11 18h10" />,
  userCheck: <><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 11l2 2 4-4" /></>,
  users: <><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-4-6.3" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  wallet: <><path d="M3 7a2 2 0 0 1 2-2h13v4" /><path d="M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z" /><circle cx="16" cy="14" r="1.2" /></>,
  flask: <path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10" />,
  tube: <path d="M14.5 2.5l7 7M17 5L6.5 15.5a3.5 3.5 0 0 0 5 5L22 10M8 14h7" />,
  file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  history: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  key: <><circle cx="7.5" cy="15.5" r="4.5" /><path d="M10.7 12.3L21 2M17 6l3 3M14.5 8.5l2 2" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  alert: <path d="M12 3l10 18H2zM12 10v4M12 17.5v.5" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  clip: <path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" />,
  upload: <path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  check: <path d="M5 12l5 5L20 7" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
  flag: <path d="M5 21V4h11l-2 4 2 4H5" />,
  inbox: <path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 13h5l1.5 3h5L16 13h5" />,
  layers: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
  trending: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
};
export function Icon({ name, size = 18, className = '', strokeWidth = 1.8 }) {
  return (
    <svg className={'icon ' + className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name] || null}
    </svg>
  );
}

// ---------- Nút ----------
// variant: primary | soft | ghost | danger ; size: sm | md
export function Btn({ children, onClick, variant = 'soft', size = 'sm', icon, className = '', type = 'button', ...rest }) {
  return (
    <button type={type} className={`btn btn-${variant} btn-${size} ${className}`} onClick={onClick} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}{children}
    </button>
  );
}
// Nút nhỏ có icon + chữ ghi rõ thao tác (label; mặc định lấy theo title) — dễ hiểu cho mọi người dùng
export function IconBtn({ icon, title, label, onClick, variant = 'ghost', className = '', ...rest }) {
  return (
    <button type="button" className={`iconbtn iconbtn-${variant} ${className}`} title={title} onClick={onClick} {...rest}>
      <Icon name={icon} size={16} /><span>{label ?? title}</span>
    </button>
  );
}

// ---------- Trạng thái ----------
const TONES = {
  'Hoàn thành': 'ok', 'Đã duyệt': 'ok', 'Đã ký': 'ok', 'Đã nghiệm thu': 'ok', 'Đã xác nhận (giả lập)': 'ok', 'Đã tuyển': 'ok', 'Đang lưu': 'ok',
  'Chờ duyệt': 'warn', 'Dự thảo': 'neutral', 'Sàng lọc': 'neutral', 'Chưa bắt đầu': 'neutral',
  'Đang thực hiện': 'info', 'Theo dõi': 'info', 'Đã chuyển': 'info',
  'Tạm dừng': 'bad', 'Yêu cầu sửa': 'bad', 'Đã hủy': 'bad',
  'Đã thanh lý': 'muted', 'Kết thúc': 'muted', 'Đã sử dụng': 'muted',
};
export function Status({ s, tone }) {
  if (!s) return <span className="muted">—</span>;
  return <span className={'badge badge-' + (tone || TONES[s] || 'neutral')}><i />{s}</span>;
}
export const Tag = ({ children, tone = 'neutral', className = '' }) => <span className={`tag tag-${tone} ${className}`}>{children}</span>;

const PRIORITY_TONE = { Khẩn: 'bad', Cao: 'warn', 'Bình thường': 'neutral' };
export const Priority = ({ p }) => <Tag tone={PRIORITY_TONE[p] || 'neutral'}>{p || 'Bình thường'}</Tag>;

// ---------- Avatar ----------
const AV_COLORS = ['#2563eb', '#0d9488', '#7c3aed', '#db2777', '#ea580c', '#0891b2', '#4f46e5', '#16a34a'];
export function Avatar({ name = '', size = 30 }) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const initials = parts.length ? (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)) : '?';
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: AV_COLORS[h % AV_COLORS.length] }} title={name}>
      {initials.toUpperCase()}
    </span>
  );
}
export function Person({ name, sub, size = 28 }) {
  if (!name || name === '—') return <span className="muted">—</span>;
  return (
    <span className="person">
      <Avatar name={name} size={size} />
      <span><span className="person-name">{name}</span>{sub && <span className="person-sub">{sub}</span>}</span>
    </span>
  );
}

// ---------- Khối nội dung ----------
export function Section({ title, subtitle, controls, children, className = '', flush = false }) {
  return (
    <section className={'card ' + className}>
      {(title || controls) && (
        <div className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <div className="card-sub">{subtitle}</div>}
          </div>
          {controls ? <div className="card-actions">{controls}</div> : null}
        </div>
      )}
      <div className={flush ? 'card-body flush' : 'card-body'}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, icon, tone = 'blue', hint, onClick }) {
  const Tagname = onClick ? 'button' : 'div';
  return (
    <Tagname type={onClick ? 'button' : undefined} className={'stat' + (onClick ? ' clickable' : '')} onClick={onClick}>
      <span className={'stat-icon tone-' + tone}><Icon name={icon} size={20} /></span>
      <span className="stat-text">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {hint && <span className="stat-hint">{hint}</span>}
      </span>
    </Tagname>
  );
}

export function EmptyState({ icon = 'inbox', title = 'Chưa có dữ liệu', children }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={22} /></span>
      <div className="empty-title">{title}</div>
      {children && <div className="empty-text">{children}</div>}
    </div>
  );
}

// rows: mảng các dòng, mỗi dòng là mảng ô (ReactNode). onRowClick(i) tuỳ chọn.
export function SimpleTable({ cols, rows, empty = 'Chưa có dữ liệu', emptyIcon, onRowClick, className = '' }) {
  if (!rows.length) return <EmptyState icon={emptyIcon} title={empty} />;
  return (
    <div className={'tablewrap ' + className}>
      <table>
        <thead><tr>{cols.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={onRowClick ? 'clickable' : ''} onClick={onRowClick ? () => onRowClick(i) : undefined}>
              {r.map((v, j) => <td key={j}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Bar({ pct, tone }) {
  const v = Math.max(0, Math.min(100, Number(pct) || 0));
  const t = tone || (v >= 100 ? 'ok' : 'blue');
  return <div className="bar"><div className={'bar-fill tone-' + t} style={{ width: `${v}%` }} /></div>;
}
export const Progress = ({ pct, tone }) => (
  <div className="progress"><Bar pct={pct} tone={tone} /><span>{Math.round(Number(pct) || 0)}%</span></div>
);

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([k, label, count]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} className={'tab' + (value === k ? ' active' : '')} onClick={() => onChange(k)}>
          {label}{count !== undefined && <span className="tab-count">{count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Tìm kiếm…' }) {
  return (
    <label className="search">
      <Icon name="search" size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Xoá"><Icon name="x" size={14} /></button>}
    </label>
  );
}
export const Toolbar = ({ children }) => <div className="toolbar">{children}</div>;

export function Banner({ tone = 'warn', icon = 'alert', children }) {
  return <div className={'banner banner-' + tone}><Icon name={icon} size={18} /><div>{children}</div></div>;
}

// Lưới thông tin dạng nhãn – giá trị
export function InfoGrid({ items, cols = 2 }) {
  return (
    <dl className={'info cols-' + cols}>
      {items.filter(Boolean).map(([k, v], i) => <div key={i}><dt>{k}</dt><dd>{v || <span className="muted">—</span>}</dd></div>)}
    </dl>
  );
}

// ---------- Form ----------
export function Field({ label, name, type = 'text', required, children, defaultValue, className, hint, ...rest }) {
  let control;
  if (type === 'select') control = <select name={name} required={required} defaultValue={defaultValue} {...rest}>{children}</select>;
  else if (type === 'textarea') control = <textarea name={name} required={required} defaultValue={defaultValue} {...rest} />;
  else control = <input name={name} type={type} required={required} min={type === 'number' ? 0 : undefined} defaultValue={defaultValue} {...rest} />;
  return (
    <div className={'field ' + (className ?? (type === 'textarea' ? 'span2' : ''))}>
      <label>{label}{required && <span className="req">*</span>}</label>
      {control}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

// Ô chọn có dòng "Chọn..." trống ở đầu
export function Choice({ label, name, items, required, placeholder = 'Chọn...', ...rest }) {
  return (
    <Field label={label} name={name} type="select" required={required} {...rest}>
      <option value="">{placeholder}</option>
      {items.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
    </Field>
  );
}

export const OptionList = ({ values }) => values.map((x) => <option key={x} value={x}>{x}</option>);

export function FormActions({ children }) {
  return <div className="form-actions">{children}</div>;
}

// ---------- Hộp thoại ----------
export function Modal({ title, onClose, children, size = 'md', layer = 1 }) {
  const ref = useRef(null);
  useEffect(() => {
    // Esc chỉ đóng hộp thoại trên cùng
    const onKey = (e) => {
      const all = document.querySelectorAll('.modalback');
      if (e.key === 'Escape' && all[all.length - 1] === ref.current) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div ref={ref} className="modalback" style={{ zIndex: 100 + layer * 10 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal modal-' + size} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <IconBtn icon="x" title="Đóng" onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

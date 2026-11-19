export function Status({ s }) {
  const cls = ['Hoàn thành', 'Đã duyệt'].includes(s) ? 'ok'
    : ['Chờ duyệt', 'Đang thực hiện'].includes(s) ? 'warn'
      : ['Tạm dừng', 'Yêu cầu sửa'].includes(s) ? 'bad' : '';
  return <span className={'pill ' + cls}>{s}</span>;
}

export function Section({ title, controls, children }) {
  return (
    <div className="panel">
      <div className="flex between"><h2>{title}</h2>{controls ? <div className="flex">{controls}</div> : null}</div>
      {children}
    </div>
  );
}

// rows: mảng các dòng, mỗi dòng là mảng ô (ReactNode)
export function SimpleTable({ cols, rows }) {
  return (
    <div className="tablewrap">
      <table>
        <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.length
            ? rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)
            : <tr><td colSpan={cols.length} className="empty">Chưa có dữ liệu</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export const Btn = ({ children, onClick, ...rest }) => <button type="button" className="action" onClick={onClick} {...rest}>{children}</button>;

export const Bar = ({ pct }) => <div className="bar"><div style={{ width: `${pct}%` }} /></div>;

export function Field({ label, name, type = 'text', required, children, defaultValue, className, ...rest }) {
  let control;
  if (type === 'select') control = <select name={name} required={required} defaultValue={defaultValue} {...rest}>{children}</select>;
  else if (type === 'textarea') control = <textarea name={name} required={required} defaultValue={defaultValue} {...rest} />;
  else control = <input name={name} type={type} required={required} min={type === 'number' ? 0 : undefined} defaultValue={defaultValue} {...rest} />;
  return <div className={'field ' + (className || '')}><label>{label}</label>{control}</div>;
}

// Ô chọn có dòng "Chọn..." trống ở đầu
export function Choice({ label, name, items, required, placeholder = 'Chọn...' }) {
  return (
    <Field label={label} name={name} type="select" required={required}>
      <option value="">{placeholder}</option>
      {items.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
    </Field>
  );
}

export const OptionList = ({ values }) => values.map((x) => <option key={x} value={x}>{x}</option>);

export function Modal({ title, onClose, children }) {
  return (
    <div className="modalback" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex between"><h2>{title}</h2><button className="secondary" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  );
}

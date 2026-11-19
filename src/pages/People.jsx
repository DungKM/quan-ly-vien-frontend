import { useState } from 'react';
import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { B12_PROJECT_ROLES, B12_ROLES, ROLE_LEVELS, positionOf, roleLevelName } from '../constants.js';
import { Btn, Section, SimpleTable } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

function EditPerson({ id }) {
  const { S, refresh, notify, closeModal } = useApp();
  const x = S.users.find((u) => u.id === id);
  const members = S.project_members.filter((m) => m.user_id === id);
  const [checked, setChecked] = useState(() => Object.fromEntries(members.map((m) => [m.project_id, true])));
  const [roles, setRoles] = useState(() => Object.fromEntries(S.projects.map((p) => [p.id, members.find((m) => m.project_id === p.id)?.project_role || B12_PROJECT_ROLES[3]])));
  if (!x) return null;
  // Chức vụ hiện tại: theo tên đã lưu, hoặc chức vụ mặc định cùng tên với quyền; không khớp thì "giữ nguyên"
  const list = S.positions || [];
  const current = list.find((p) => p.name === x.position)?.name
    || (!x.position && list.find((p) => p.role === x.role && p.name === B12_ROLES[x.role])?.name) || '';

  const save = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.memberships = S.projects.filter((p) => checked[p.id]).map((p) => ({ project_id: p.id, project_role: roles[p.id] }));
    try {
      await api('person-edit', { user_id: id, name: d.name, username: d.username, position: d.position, memberships: d.memberships, new_password: d.new_password || '' });
      closeModal();
      await refresh();
      notify('Đã lưu đầy đủ hồ sơ và quyền theo đề tài');
    } catch (err) { notify('Lỗi: ' + err.message); }
  };

  return (
    <form onSubmit={save}>
      <div className="formgrid">
        <div className="field"><label>Họ và tên *</label><input name="name" defaultValue={x.name} maxLength={160} required /></div>
        <div className="field"><label>Username *</label><input name="username" defaultValue={x.username} required pattern="[A-Za-z0-9_.\-]{3,40}" /></div>
        <div className="field"><label>Chức vụ *</label><select name="position" defaultValue={current}>
          {!current && <option value="">{positionOf(x)} (giữ nguyên)</option>}
          {list.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select></div>
        <div className="field"><label>Đặt lại mật khẩu (bỏ trống nếu không đổi)</label><input name="new_password" type="text" minLength={10} autoComplete="new-password" placeholder="Ít nhất 10 ký tự" /></div>
      </div>
      <h3>Mã đề tài · Vai trò trong các đề tài</h3>
      <p className="muted tiny">Chọn các đề tài được tham gia và vai trò tương ứng. Bỏ chọn để thu hồi quyền tham gia.</p>
      {S.projects.length ? S.projects.map((p) => {
        const current = roles[p.id];
        const opts = B12_PROJECT_ROLES.includes(current) ? B12_PROJECT_ROLES : [current, ...B12_PROJECT_ROLES];
        return (
          <div key={p.id} className="minirow" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ flex: 1, margin: 0 }}>
              <input type="checkbox" checked={!!checked[p.id]} onChange={(e) => setChecked({ ...checked, [p.id]: e.target.checked })} /> {p.code} · {p.title}
            </label>
            <select style={{ maxWidth: 230 }} value={current} onChange={(e) => setRoles({ ...roles, [p.id]: e.target.value })}>
              {opts.map((v) => <option key={v} value={v}>{v}{!B12_PROJECT_ROLES.includes(v) ? ' (giá trị cũ)' : ''}</option>)}
            </select>
          </div>
        );
      }) : <p>Chưa có đề tài</p>}
      <p><button type="submit">Lưu phân quyền</button> <button type="button" className="secondary" onClick={closeModal}>Đóng</button></p>
    </form>
  );
}

function ImportPermissions() {
  const { refresh, notify, closeModal, showModal } = useApp();
  const [payload, setPayload] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async (e) => {
    const f = e.target.files?.[0];
    setPreview(null);
    if (!f) return;
    if (f.size > 250000) { notify('File vượt giới hạn 250 KB'); return; }
    try {
      if (f.name.toLowerCase().endsWith('.xlsx')) {
        const bytes = new Uint8Array(await f.arrayBuffer());
        let s = '';
        for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192));
        setPayload('xlsx:' + btoa(s));
      } else setPayload(await f.text());
      setFileName(f.name);
    } catch (err) { notify('Không đọc được tệp: ' + err.message); }
  };

  const check = async (e) => {
    e.preventDefault();
    if (!payload) { notify('Hãy chọn file trước'); return; }
    setBusy(true);
    try { setPreview(await api('import-person-permissions', { csv: payload, dry_run: true })); } catch (err) { notify('Lỗi: ' + err.message); }
    setBusy(false);
  };

  const commit = async () => {
    setBusy(true);
    try {
      const result = await api('import-person-permissions', { csv: payload, dry_run: false });
      await refresh();
      if (result.created_accounts?.length) {
        const secrets = result.created_accounts.map((x) => x.username + ' : ' + x.temporary_password).join('\n');
        showModal('Tài khoản mới – lưu mật khẩu tạm', (
          <>
            <p>Chỉ hiển thị một lần. Hãy sao chép và chuyển riêng cho từng người; yêu cầu đổi mật khẩu trước khi sử dụng thực tế.</p>
            <textarea readOnly style={{ width: '100%', minHeight: 160 }} value={secrets} />
            <p><button onClick={() => navigator.clipboard.writeText(secrets).then(() => notify('Đã sao chép'))}>Sao chép</button></p>
          </>
        ));
      } else {
        closeModal();
        notify('Đã import ' + result.count + ' dòng');
      }
    } catch (err) { notify('Lỗi: ' + err.message); }
    setBusy(false);
  };

  return (
    <>
      <p className="muted">Import đúng 5 cột của sheet Phan_quyen: Họ và tên, Username, Chức vụ, Mã đề tài, Vai trò trong các đề tài. Không thay đổi trạng thái tài khoản hiện có. Các dòng không xuất hiện trong file không bị thu hồi quyền; muốn thu hồi, sử dụng Chỉnh sửa phân quyền. <b>Có thể chọn trực tiếp .xlsx hoặc .csv</b>. Tài khoản mới được tạo với mật khẩu tạm ngẫu nhiên, chỉ hiển thị một lần sau khi import. Đề tài phải tồn tại trước khi phân quyền.</p>
      <form onSubmit={check}>
        <div className="field"><label>Chọn file mẫu đã điền</label><input type="file" accept=".xlsx,.csv" required onChange={load} /></div>
        {fileName && <div className="muted tiny" style={{ marginBottom: 10 }}>Đã chọn: {fileName}</div>}
        <button type="submit" disabled={busy}>Xem trước</button>
      </form>
      {preview && (
        <>
          <h3>Kiểm tra đạt {preview.count} dòng{preview.count > preview.preview.length ? ` (hiển thị ${preview.preview.length} dòng đầu)` : ''}</h3>
          <SimpleTable
            cols={['Username', 'Thao tác', 'Chức vụ', 'Mã đề tài', 'Vai trò']}
            rows={preview.preview.map((x) => [x.username, x.create_account ? 'TẠO MỚI' : 'CẬP NHẬT', x.chuc_vu, x.project_code || '—', x.vai_tro || '—'])}
          />
          <p><button onClick={commit} disabled={busy}>Xác nhận cập nhật quyền</button> <button className="secondary" onClick={closeModal}>Hủy</button></p>
        </>
      )}
    </>
  );
}

// Danh mục chức vụ: xem, thêm mới (kèm mức quyền), xóa chức vụ không còn ai giữ
function Positions() {
  const { S, refresh, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState('researcher');
  const holders = (p) => S.users.filter((u) => u.position === p.name).length;

  const add = async (e) => {
    e.preventDefault();
    const form = e.target;
    const d = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      await api('position', d);
      form.reset();
      setLevel('researcher');
      await refresh();
      notify('Đã thêm chức vụ ' + d.name);
    } catch (err) { notify('Lỗi: ' + err.message); }
    setBusy(false);
  };
  const remove = async (p) => {
    if (!window.confirm(`Xóa chức vụ "${p.name}" khỏi danh mục?`)) return;
    try {
      await api('position-delete', { id: p.id });
      await refresh();
      notify('Đã xóa chức vụ');
    } catch (err) { notify('Lỗi: ' + err.message); }
  };

  return (
    <>
      <SimpleTable
        cols={['Chức vụ', 'Mức quyền', 'Số người', '']}
        rows={(S.positions || []).map((p) => [
          p.name, roleLevelName(p.role), holders(p),
          holders(p) ? <span className="muted tiny">Đang dùng</span> : <Btn onClick={() => remove(p)}>Xóa</Btn>,
        ])}
      />
      <h3>Thêm chức vụ mới</h3>
      <form onSubmit={add}>
        <div className="formgrid">
          <div className="field"><label>Tên chức vụ *</label><input name="name" required minLength={2} maxLength={80} placeholder="VD: Phó Giám đốc" /></div>
          <div className="field"><label>Mức quyền *</label>
            <select name="role" value={level} onChange={(e) => setLevel(e.target.value)}>
              {ROLE_LEVELS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <p className="muted tiny">{ROLE_LEVELS.find(([k]) => k === level)?.[2]}</p>
        <button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Thêm chức vụ'}</button>
      </form>
    </>
  );
}

export default function People() {
  const { S, can, showModal } = useApp();
  const openForm = useOpenForm();
  const { pcode } = lookups(S);
  const admin = can('director');
  return (
    <Section
      title="Nhân sự · Phân quyền theo mẫu 5 cột"
      controls={admin && <><Btn onClick={() => openForm('user')}>+ Thêm nhân sự</Btn><Btn onClick={() => showModal('Quản lý chức vụ', <Positions />)}>Quản lý chức vụ</Btn><Btn onClick={() => showModal('Import phân quyền · Excel hoặc CSV', <ImportPermissions />)}>Import mẫu Excel 5 cột</Btn></>}
    >
      <SimpleTable
        cols={['Họ và tên', 'Username', 'Chức vụ', 'Mã đề tài / Vai trò trong các đề tài', 'Thao tác']}
        rows={S.users.map((u) => {
          const ms = S.project_members.filter((m) => m.user_id === u.id);
          return [
            <>{u.name}{u.active === 0 && <span className="pill bad" style={{ marginLeft: 6 }}>Đã khóa</span>}</>,
            u.username,
            positionOf(u),
            ms.length ? ms.map((m, i) => <div key={i}>{pcode(m.project_id)} — {m.project_role}</div>) : '—',
            admin ? <Btn onClick={() => showModal('Chỉnh sửa phân quyền: ' + u.username, <EditPerson id={u.id} />)}>Chỉnh sửa phân quyền</Btn> : 'Chỉ xem',
          ];
        })}
      />
      <p className="muted tiny">Chỉ dùng 5 trường theo mẫu: Họ và tên, Username, Chức vụ, Mã đề tài, Vai trò trong các đề tài. Có thể gắn nhiều đề tài cho một người. Thao tác sửa và import chỉ dành cho Admin Giám đốc.</p>
    </Section>
  );
}

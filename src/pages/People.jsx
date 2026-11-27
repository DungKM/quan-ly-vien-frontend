import { useState } from 'react';
import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { B12_PROJECT_ROLES, B12_ROLES, FINANCE_ACCESS, ROLE_LEVELS, financeAccessName, matches, positionOf, roleLevelName } from '../constants.js';
import { Banner, Btn, FormActions, Icon, IconBtn, Person, SearchBox, Section, SimpleTable, Status, Tag, Toolbar } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

function EditPerson({ id }) {
  const { S, refresh, notify, closeModal } = useApp();
  const x = S.users.find((u) => u.id === id);
  const members = S.project_members.filter((m) => m.user_id === id);
  const [checked, setChecked] = useState(() => Object.fromEntries(members.map((m) => [m.project_id, true])));
  const [roles, setRoles] = useState(() => Object.fromEntries(S.projects.map((p) => [p.id, members.find((m) => m.project_id === p.id)?.project_role || B12_PROJECT_ROLES[3]])));
  const [busy, setBusy] = useState(false);
  if (!x) return null;
  // Chức vụ hiện tại: theo tên đã lưu, hoặc chức vụ mặc định cùng tên với quyền; không khớp thì "giữ nguyên"
  const list = S.positions || [];
  const current = list.find((p) => p.name === x.position)?.name
    || (!x.position && list.find((p) => p.role === x.role && p.name === B12_ROLES[x.role])?.name) || '';

  const save = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.memberships = S.projects.filter((p) => checked[p.id]).map((p) => ({ project_id: p.id, project_role: roles[p.id] }));
    setBusy(true);
    try {
      await api('person-edit', { user_id: id, name: d.name, username: d.username, position: d.position, memberships: d.memberships, new_password: d.new_password || '', finance_access: d.finance_access ?? x.finance_access ?? '' });
      closeModal();
      await refresh();
      notify('Đã lưu hồ sơ và phân quyền', 'success');
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const count = Object.values(checked).filter(Boolean).length;

  return (
    <form onSubmit={save}>
      <div className="form-section">Thông tin tài khoản</div>
      <div className="formgrid">
        <div className="field"><label>Họ và tên<span className="req">*</span></label><input name="name" defaultValue={x.name} maxLength={160} required /></div>
        <div className="field"><label>Username<span className="req">*</span></label><input name="username" defaultValue={x.username} required pattern="[A-Za-z0-9_.\-]{3,40}" /></div>
        <div className="field"><label>Chức vụ<span className="req">*</span></label><select name="position" defaultValue={current}>
          {!current && <option value="">{positionOf(x)} (giữ nguyên)</option>}
          {list.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select></div>
        <div className="field"><label>Đặt lại mật khẩu</label><input name="new_password" type="text" minLength={10} autoComplete="new-password" placeholder="Bỏ trống nếu không đổi" /></div>
      </div>

      <div className="form-section">Quyền Hành chính – Tài chính</div>
      <div className="field">
        {x.role === 'director'
          ? <input value="Giám đốc: luôn có toàn quyền" disabled />
          : <select name="finance_access" defaultValue={x.finance_access || ''}>
            {FINANCE_ACCESS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>}
        <div className="field-hint">Chỉ người được cấp quyền mới thấy mục Tài chính (ngân sách, hợp đồng) của các đề tài mình tham gia.</div>
      </div>

      <div className="form-section">Đề tài tham gia · {count} đề tài</div>
      <p className="muted tiny" style={{ marginTop: -4 }}>Tích chọn đề tài và chọn vai trò tương ứng. Bỏ chọn để thu hồi quyền tham gia.</p>
      {S.projects.length ? (
        <div className="checklist">
          {S.projects.map((p) => {
            const role = roles[p.id];
            const opts = B12_PROJECT_ROLES.includes(role) ? B12_PROJECT_ROLES : [role, ...B12_PROJECT_ROLES];
            return (
              <div key={p.id} className={'checkrow' + (checked[p.id] ? ' on' : '')}>
                <label>
                  <input type="checkbox" checked={!!checked[p.id]} onChange={(e) => setChecked({ ...checked, [p.id]: e.target.checked })} />
                  <span className="code">{p.code}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                </label>
                <select value={role} disabled={!checked[p.id]} onChange={(e) => setRoles({ ...roles, [p.id]: e.target.value })}>
                  {opts.map((v) => <option key={v} value={v}>{v}{!B12_PROJECT_ROLES.includes(v) ? ' (giá trị cũ)' : ''}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      ) : <p className="muted">Chưa có đề tài</p>}
      <FormActions>
        <Btn variant="ghost" size="md" onClick={closeModal}>Huỷ</Btn>
        <Btn variant="primary" size="md" type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu phân quyền'}</Btn>
      </FormActions>
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
    if (f.size > 250000) { notify('File vượt giới hạn 250 KB', 'error'); return; }
    try {
      if (f.name.toLowerCase().endsWith('.xlsx')) {
        const bytes = new Uint8Array(await f.arrayBuffer());
        let s = '';
        for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192));
        setPayload('xlsx:' + btoa(s));
      } else setPayload(await f.text());
      setFileName(f.name);
    } catch (err) { notify('Không đọc được tệp: ' + err.message, 'error'); }
  };

  const check = async (e) => {
    e.preventDefault();
    if (!payload) { notify('Hãy chọn file trước', 'error'); return; }
    setBusy(true);
    try { setPreview(await api('import-person-permissions', { csv: payload, dry_run: true })); } catch (err) { notify(err.message, 'error'); }
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
            <Banner tone="warn">Chỉ hiển thị <b>một lần</b>. Hãy sao chép và chuyển riêng cho từng người; yêu cầu đổi mật khẩu trước khi sử dụng.</Banner>
            <textarea readOnly style={{ width: '100%', minHeight: 160, fontFamily: 'ui-monospace, Consolas, monospace' }} value={secrets} />
            <FormActions><Btn variant="primary" size="md" onClick={() => navigator.clipboard.writeText(secrets).then(() => notify('Đã sao chép', 'success'))}>Sao chép</Btn></FormActions>
          </>
        ));
      } else {
        closeModal();
        notify('Đã import ' + result.count + ' dòng', 'success');
      }
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };

  return (
    <>
      <Banner tone="info" icon="info">
        File gồm đúng 5 cột của sheet <b>Phan_quyen</b>: Họ và tên, Username, Chức vụ, Mã đề tài, Vai trò trong các đề tài. Chọn trực tiếp file <b>.xlsx</b> hoặc <b>.csv</b>.
        <div className="tiny" style={{ marginTop: 6 }}>Không thay đổi trạng thái tài khoản hiện có; dòng không có trong file không bị thu hồi quyền. Tài khoản mới nhận mật khẩu tạm ngẫu nhiên. Đề tài phải tồn tại trước khi phân quyền.</div>
      </Banner>
      <form onSubmit={check}>
        <div className="field"><label>Chọn file mẫu đã điền</label><input type="file" accept=".xlsx,.csv" required onChange={load} /></div>
        {fileName && <div className="muted tiny" style={{ marginBottom: 10 }}><Icon name="file" size={14} /> {fileName}</div>}
        <Btn type="submit" variant="soft" size="md" icon="eye" disabled={busy}>Kiểm tra & xem trước</Btn>
      </form>
      {preview && (
        <>
          <h3>Kiểm tra đạt {preview.count} dòng{preview.count > preview.preview.length ? ` (hiển thị ${preview.preview.length} dòng đầu)` : ''}</h3>
          <SimpleTable
            cols={['Username', 'Thao tác', 'Chức vụ', 'Mã đề tài', 'Vai trò']}
            rows={preview.preview.map((x) => [x.username, x.create_account ? <Tag tone="ok">Tạo mới</Tag> : <Tag tone="blue">Cập nhật</Tag>, x.chuc_vu, x.project_code || '—', x.vai_tro || '—'])}
          />
          <FormActions>
            <Btn variant="ghost" size="md" onClick={closeModal}>Huỷ</Btn>
            <Btn variant="primary" size="md" onClick={commit} disabled={busy}>Xác nhận cập nhật quyền</Btn>
          </FormActions>
        </>
      )}
    </>
  );
}

// Danh mục chức vụ: xem, thêm mới (kèm mức quyền), xóa chức vụ không còn ai giữ
function Positions() {
  const { S, refresh, notify, confirm } = useApp();
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
      notify('Đã thêm chức vụ ' + d.name, 'success');
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const remove = async (p) => {
    if (!(await confirm(`Xoá chức vụ "${p.name}" khỏi danh mục?`, { title: 'Xoá chức vụ', okText: 'Xoá', danger: true }))) return;
    try {
      await api('position-delete', { id: p.id });
      await refresh();
      notify('Đã xoá chức vụ', 'success');
    } catch (err) { notify(err.message, 'error'); }
  };

  return (
    <>
      <SimpleTable
        cols={['Chức vụ', 'Mức quyền', 'Số người', '']}
        rows={(S.positions || []).map((p) => [
          <b>{p.name}</b>, <Tag tone="blue">{roleLevelName(p.role)}</Tag>, holders(p),
          <div className="row-actions">{holders(p) ? <span className="muted tiny">Đang dùng</span> : <IconBtn icon="trash" variant="danger" title="Xoá" onClick={() => remove(p)} />}</div>,
        ])}
      />
      <div className="form-section" style={{ marginTop: 20 }}>Thêm chức vụ mới</div>
      <form onSubmit={add}>
        <div className="formgrid">
          <div className="field"><label>Tên chức vụ<span className="req">*</span></label><input name="name" required minLength={2} maxLength={80} placeholder="VD: Phó Giám đốc" /></div>
          <div className="field"><label>Mức quyền<span className="req">*</span></label>
            <select name="role" value={level} onChange={(e) => setLevel(e.target.value)}>
              {ROLE_LEVELS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="field-hint">{ROLE_LEVELS.find(([k]) => k === level)?.[2]}</div>
          </div>
        </div>
        <FormActions><Btn type="submit" variant="primary" size="md" icon="plus" disabled={busy}>{busy ? 'Đang lưu…' : 'Thêm chức vụ'}</Btn></FormActions>
      </form>
    </>
  );
}

export default function People() {
  const { S, can, showModal } = useApp();
  const openForm = useOpenForm();
  const { pcode } = lookups(S);
  const admin = can('director');
  const [q, setQ] = useState('');
  const [pos, setPos] = useState('');
  const list = S.users.filter((u) => (!pos || positionOf(u) === pos) && matches(q, u.name, u.username, positionOf(u)));
  const positions = [...new Set(S.users.map(positionOf))];
  const edit = (u) => showModal('Chỉnh sửa phân quyền: ' + u.name, <EditPerson id={u.id} />);
  return (
    <Section flush
      title="Danh sách nhân sự"
      subtitle={`${S.users.length} tài khoản · ${S.users.filter((u) => u.active !== 0).length} đang hoạt động`}
      controls={admin && <>
        <Btn variant="ghost" icon="shield" onClick={() => showModal('Quản lý chức vụ & phân quyền', <Positions />)}>Chức vụ & phân quyền</Btn>
        <Btn variant="ghost" icon="upload" onClick={() => showModal('Import phân quyền từ Excel / CSV', <ImportPermissions />)}>Import Excel</Btn>
        <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('user')}>Thêm nhân sự</Btn>
      </>}
    >
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Tìm theo tên, username, chức vụ…" />
        <select value={pos} onChange={(e) => setPos(e.target.value)}>
          <option value="">Tất cả chức vụ</option>
          {positions.map((p) => <option key={p}>{p}</option>)}
        </select>
      </Toolbar>
      <SimpleTable
        emptyIcon="users"
        empty="Không tìm thấy nhân sự"
        cols={['Nhân sự', 'Chức vụ', 'Đề tài · vai trò', 'HC – TC', 'Trạng thái', '']}
        onRowClick={admin ? (i) => edit(list[i]) : undefined}
        rows={list.map((u) => {
          const ms = S.project_members.filter((m) => m.user_id === u.id);
          return [
            <Person name={u.name} sub={'@' + u.username} size={34} />,
            positionOf(u),
            ms.length ? <div className="stack">{ms.map((m, i) => <span key={i} className="tiny"><span className="code" style={{ fontSize: 11 }}>{pcode(m.project_id)}</span> {m.project_role}</span>)}</div> : <span className="muted">—</span>,
            u.role === 'director' ? <Tag tone="violet">Toàn quyền</Tag>
              : u.finance_access ? <Tag tone={u.finance_access === 'edit' ? 'ok' : 'warn'}>{financeAccessName(u.finance_access)}</Tag>
                : <span className="muted tiny">Không</span>,
            u.active === 0 ? <Status s="Đã khóa" tone="bad" /> : <Status s="Hoạt động" tone="ok" />,
            admin ? <div className="row-actions"><IconBtn icon="edit" variant="primary" title="Chỉnh sửa phân quyền" label="Sửa / Phân quyền" onClick={(e) => { e.stopPropagation(); edit(u); }} /></div> : null,
          ];
        })}
      />
    </Section>
  );
}

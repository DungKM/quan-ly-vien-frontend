import { useState } from 'react';
import { lookups, useApp } from '../AppContext.jsx';
import { dt, today } from '../constants.js';
import { Bar, Btn, Section, SimpleTable, Status } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

export function TaskDetail({ id }) {
  const { S, me, can } = useApp();
  const openForm = useOpenForm();
  const { name, pname, st } = lookups(S);
  const t = S.tasks.find((x) => x.id === id);
  if (!t) return <p className="muted">Công việc không còn trong phạm vi được xem.</p>;
  const updates = S.updates.filter((x) => x.task_id === id);
  const assignees = S.task_assignees.filter((x) => x.task_id === id).map((x) => name(x.user_id)).join(', ');
  const canReport = can('director', 'lead', 'coordinator') || t.owner_id === me.id || S.task_assignees.some((a) => a.task_id === id && a.user_id === me.id);
  return (
    <>
      <div className="grid2">
        <div><b>Đề tài:</b> {pname(t.project_id)}</div>
        <div><b>Giai đoạn:</b> {st(t.stage)}</div>
        <div><b>Phụ trách:</b> {name(t.owner_id)}</div>
        <div><b>Phối hợp:</b> {assignees || '—'}</div>
        <div><b>Thời hạn:</b> {dt(t.due_date)}</div>
        <div><b>Báo cáo:</b> {t.report_cycle}</div>
      </div>
      <p><b>Sản phẩm:</b> {t.deliverable || 'Chưa xác định'}</p>
      <div className="flex"><Status s={t.status} /><b>{t.progress}%</b>{canReport && <Btn onClick={() => openForm('report', id)}>+ Cập nhật báo cáo</Btn>}</div>
      <h3>Lịch sử báo cáo ({updates.length})</h3>
      <div className="timeline">
        {updates.length ? updates.map((x) => (
          <div key={x.id}>
            <b>{name(x.author_id)}</b> <span className="muted tiny">{x.created_at}</span> · {x.progress}%
            <p>{x.notes}</p>
            {x.blockers && <p className="muted">Vướng mắc: {x.blockers}</p>}
            {/^https?:\/\//i.test(x.result_url || '') && <div>🔗 <a href={x.result_url} target="_blank" rel="noopener noreferrer">Link kết quả</a></div>}
            {S.attachments.filter((a) => a.update_id === x.id).map((a) => (
              <div key={a.id}>📎 <a href={`/api/attachment/${a.id}`}>{a.filename}</a> <span className="muted">({Math.ceil(a.bytes / 1024)} KB)</span></div>
            ))}
          </div>
        )) : <p className="muted">Chưa có báo cáo.</p>}
      </div>
    </>
  );
}

export default function Tasks({ onlyMine = false }) {
  const { S, me, can, showModal } = useApp();
  const openForm = useOpenForm();
  const { name, pname } = lookups(S);
  const [fProject, setFProject] = useState('');
  const [fUser, setFUser] = useState('');
  const assigned = (t, uid) => S.task_assignees.some((x) => x.task_id === t.id && x.user_id === Number(uid));
  let list = S.tasks.filter((t) => !onlyMine || t.owner_id === me.id || assigned(t, me.id));
  if (fProject) list = list.filter((x) => x.project_id === Number(fProject));
  if (fUser && !onlyMine) list = list.filter((x) => x.owner_id === Number(fUser) || assigned(x, fUser));
  return (
    <Section
      title={onlyMine ? 'Công việc được phân công' : 'Danh sách công việc'}
      controls={!onlyMine && can('director', 'lead', 'coordinator') && <Btn onClick={() => openForm('task')}>+ Giao việc</Btn>}
    >
      <div className="flex" style={{ marginBottom: 12 }}>
        <select style={{ maxWidth: 350 }} value={fProject} onChange={(e) => setFProject(e.target.value)}>
          <option value="">Tất cả đề tài</option>
          {S.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        {!onlyMine && (
          <select style={{ maxWidth: 220 }} value={fUser} onChange={(e) => setFUser(e.target.value)}>
            <option value="">Tất cả nhân sự</option>
            {S.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </div>
      <SimpleTable
        cols={['Công việc / Đề tài', 'Phụ trách', 'Thời hạn', 'Tiến độ', 'Trạng thái', 'Thao tác']}
        rows={list.map((t) => [
          <><b>{t.title}</b><div className="tiny muted">{pname(t.project_id)}</div></>,
          name(t.owner_id),
          <span style={{ color: t.due_date && t.due_date < today() && t.status !== 'Hoàn thành' ? 'var(--red)' : 'inherit' }}>{dt(t.due_date)}</span>,
          <>{t.progress}%<Bar pct={t.progress} /></>,
          <Status s={t.status} />,
          <Btn onClick={() => showModal('Công việc: ' + t.title, <TaskDetail id={t.id} />)}>Chi tiết / báo cáo</Btn>,
        ])}
      />
    </Section>
  );
}

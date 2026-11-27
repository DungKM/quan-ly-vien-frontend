import { useState } from 'react';
import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { dt, dtm, isOverdue, matches } from '../constants.js';
import { Btn, EmptyState, Icon, IconBtn, InfoGrid, Person, Priority, Progress, SearchBox, Section, SimpleTable, Status, Tabs, Toolbar } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

// Hỏi xác nhận rồi gọi API xoá; trả về true nếu đã xoá
function useRemove() {
  const { refresh, notify, confirm } = useApp();
  return async (question, path, body) => {
    if (!(await confirm(question, { title: 'Xác nhận xoá', okText: 'Xoá', danger: true }))) return false;
    try {
      await api(path, body);
      await refresh();
      notify('Đã xoá', 'success');
      return true;
    } catch (err) {
      notify(err.message, 'error');
      return false;
    }
  };
}

// Giám đốc, Trưởng nhóm, Điều phối viên được sửa/xoá công việc (người khác chỉ thấy đề tài mình tham gia)
const useCanManageTasks = () => useApp().can('director', 'lead', 'coordinator');

export function TaskDetail({ id }) {
  const { S, me, can, closeModal } = useApp();
  const openForm = useOpenForm();
  const remove = useRemove();
  const canManage = useCanManageTasks();
  const { name, pname, pcode, st } = lookups(S);
  const t = S.tasks.find((x) => x.id === id);
  if (!t) return <EmptyState title="Công việc không còn trong phạm vi được xem" />;
  const updates = S.updates.filter((x) => x.task_id === id);
  const assignees = S.task_assignees.filter((x) => x.task_id === id).map((x) => name(x.user_id)).join(', ');
  const canReport = can('director', 'lead', 'coordinator') || t.owner_id === me.id || S.task_assignees.some((a) => a.task_id === id && a.user_id === me.id);
  // Người lập báo cáo được sửa/xoá báo cáo của mình (trừ khi việc đã duyệt hoàn thành); Giám đốc/Trưởng nhóm sửa/xoá mọi báo cáo
  const reviewer = can('director', 'lead');
  const canEditReport = (x) => reviewer || (x.author_id === me.id && t.status !== 'Hoàn thành');
  const deleteTask = async () => {
    const ok = await remove(`Xoá công việc "${t.title}"?\nToàn bộ ${updates.length} báo cáo và yêu cầu phê duyệt liên quan cũng bị xoá.`, 'task-delete', { id: t.id });
    if (ok) closeModal();
  };
  return (
    <>
      <div className="flex between" style={{ marginBottom: 12 }}>
        <div className="flex"><span className="code">{pcode(t.project_id)}</span><Status s={t.status} /><Priority p={t.priority} /></div>
        <div className="flex">
          {canManage && <Btn variant="ghost" icon="edit" onClick={() => openForm('task', null, t)}>Sửa</Btn>}
          {canManage && <Btn variant="ghost" icon="trash" onClick={deleteTask} style={{ color: 'var(--bad)' }}>Xoá</Btn>}
        </div>
      </div>
      <h2 style={{ margin: '0 0 14px', fontSize: 19 }}>{t.title}</h2>
      <div className="panel-soft">
        <InfoGrid cols={3} items={[
          ['Đề tài', pname(t.project_id)],
          ['Giai đoạn', `${t.stage}. ${st(t.stage)}`],
          ['Kỳ báo cáo', t.report_cycle],
          ['Phụ trách', <Person name={name(t.owner_id)} size={24} />],
          ['Phối hợp', assignees],
          ['Thời hạn', <span className={isOverdue(t) ? 'overdue' : ''}>{dt(t.start_date)} → {dt(t.due_date)}</span>],
          ['Sản phẩm cần nộp', t.deliverable || 'Chưa xác định'],
          ['Tiến độ', <Progress pct={t.progress} />],
        ]} />
      </div>
      {t.description && <><h3>Mô tả</h3><p className="desc">{t.description}</p></>}

      <div className="flex between">
        <h3>Lịch sử báo cáo ({updates.length})</h3>
        {canReport && <Btn variant="primary" icon="plus" onClick={() => openForm('report', id)}>Cập nhật báo cáo</Btn>}
      </div>
      {updates.length ? (
        <div className="timeline">
          {updates.map((x) => (
            <div key={x.id} className="tl-item">
              <span className="tl-dot" />
              <div className="tl-card">
                <div className="tl-head">
                  <Person name={name(x.author_id)} sub={dtm(x.created_at)} size={28} />
                  <span className="spacer" />
                  <span className="tag tag-blue">{x.progress}%</span>
                  {canEditReport(x) && <>
                    <IconBtn icon="edit" title="Sửa báo cáo" label="Sửa" variant="primary" onClick={() => openForm('report', null, x)} />
                    <IconBtn icon="trash" title="Xoá báo cáo" label="Xoá" variant="danger" onClick={() => remove('Xoá báo cáo này?', 'report-delete', { id: x.id })} />
                  </>}
                </div>
                <p className="tl-body">{x.notes}</p>
                {x.blockers && <div className="tl-block"><b>Vướng mắc:</b> {x.blockers}</div>}
                <div className="tl-links">
                  {/^https?:\/\//i.test(x.result_url || '') && <a href={x.result_url} target="_blank" rel="noopener noreferrer"><Icon name="link" size={14} />Link kết quả</a>}
                  {S.attachments.filter((a) => a.update_id === x.id).map((a) => (
                    <a key={a.id} href={`/api/attachment/${a.id}`}><Icon name="clip" size={14} />{a.filename} <span className="muted">({Math.ceil(a.bytes / 1024)} KB)</span></a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState icon="file" title="Chưa có báo cáo" />}
    </>
  );
}

const STATUS_TABS = [
  ['all', 'Tất cả'], ['Đang thực hiện', 'Đang thực hiện'], ['Chưa bắt đầu', 'Chưa bắt đầu'], ['Chờ duyệt', 'Chờ duyệt'],
  ['overdue', 'Quá hạn'], ['Tạm dừng', 'Tạm dừng'], ['Hoàn thành', 'Hoàn thành'],
];

export default function Tasks({ onlyMine = false }) {
  const { S, me, showModal } = useApp();
  const openForm = useOpenForm();
  const remove = useRemove();
  const canManage = useCanManageTasks();
  const { name, pcode, pname } = lookups(S);
  const [q, setQ] = useState('');
  const [fProject, setFProject] = useState('');
  const [fUser, setFUser] = useState('');
  const [tab, setTab] = useState('all');
  const assigned = (t, uid) => S.task_assignees.some((x) => x.task_id === t.id && x.user_id === Number(uid));
  let base = S.tasks.filter((t) => !onlyMine || t.owner_id === me.id || assigned(t, me.id));
  if (fProject) base = base.filter((x) => x.project_id === Number(fProject));
  if (fUser && !onlyMine) base = base.filter((x) => x.owner_id === Number(fUser) || assigned(x, fUser));
  base = base.filter((t) => matches(q, t.title, pcode(t.project_id), pname(t.project_id), name(t.owner_id), t.deliverable));
  const inTab = (t, k) => (k === 'all' ? true : k === 'overdue' ? isOverdue(t) : t.status === k);
  const list = base.filter((t) => inTab(t, tab));
  const open = (t) => showModal('Công việc', <TaskDetail id={t.id} />, 'lg');

  return (
    <Section flush
      title={onlyMine ? 'Công việc được phân công' : 'Danh sách công việc'}
      subtitle={`${list.length} công việc`}
      controls={!onlyMine && canManage && <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('task')}>Giao việc</Btn>}
    >
      <Tabs tabs={STATUS_TABS.map(([k, l]) => [k, l, base.filter((t) => inTab(t, k)).length])} value={tab} onChange={setTab} />
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Tìm công việc, đề tài, người phụ trách…" />
        <select value={fProject} onChange={(e) => setFProject(e.target.value)}>
          <option value="">Tất cả đề tài</option>
          {S.projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
        </select>
        {!onlyMine && (
          <select value={fUser} onChange={(e) => setFUser(e.target.value)}>
            <option value="">Tất cả nhân sự</option>
            {S.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </Toolbar>
      <SimpleTable
        emptyIcon="tasks"
        empty={S.tasks.length ? 'Không có công việc phù hợp bộ lọc' : 'Chưa có công việc nào'}
        cols={['Công việc', 'Phụ trách', 'Ưu tiên', 'Hạn', 'Tiến độ', 'Trạng thái', '']}
        onRowClick={(i) => open(list[i])}
        rows={list.map((t) => [
          <div style={{ minWidth: 220 }}><div className="cell-title">{t.title}</div><div className="cell-sub"><span className="code" style={{ fontSize: 11 }}>{pcode(t.project_id)}</span> · Giai đoạn {t.stage}</div></div>,
          <Person name={name(t.owner_id)} size={26} />,
          <Priority p={t.priority} />,
          isOverdue(t) ? <span className="overdue nowrap"><Icon name="clock" size={14} />{dt(t.due_date)}</span> : <span className="nowrap">{dt(t.due_date)}</span>,
          <Progress pct={t.progress} />,
          <Status s={t.status} />,
          <div className="row-actions" onClick={(e) => e.stopPropagation()}>
            <IconBtn icon="eye" title="Chi tiết / báo cáo" label="Xem" variant="primary" onClick={() => open(t)} />
            {canManage && <IconBtn icon="edit" title="Sửa" variant="primary" onClick={() => openForm('task', null, t)} />}
            {canManage && <IconBtn icon="trash" title="Xoá" variant="danger" onClick={() => remove(`Xoá công việc "${t.title}" cùng toàn bộ báo cáo liên quan?`, 'task-delete', { id: t.id })} />}
          </div>,
        ])}
      />
    </Section>
  );
}

import { useState } from 'react';
import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { dt, matches, money } from '../constants.js';
import { Avatar, Bar, Btn, EmptyState, Icon, IconBtn, InfoGrid, Person, SearchBox, Section, Status, Tag, Toolbar } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';
import { TaskDetail } from './Tasks.jsx';

// Thanh 8 đoạn thể hiện giai đoạn hiện tại
export function StageSegments({ stage }) {
  return <div className="segments">{Array.from({ length: 8 }, (_, i) => <i key={i} className={i + 1 < stage ? 'done' : i + 1 === stage ? 'now' : ''} />)}</div>;
}

// Xoá đề tài: nếu còn dữ liệu thì báo rõ còn gì, và chỉ cho xoá kèm dữ liệu khi gõ đúng mã đề tài
function useDeleteProject() {
  const { S, refresh, notify, confirm, ask, closeModal } = useApp();
  return async (p) => {
    const count = (arr) => (arr || []).filter((x) => x.project_id === p.id).length;
    const left = [
      ['công việc', count(S.tasks), 'mục Công việc'],
      ['khoản mục ngân sách', count(S.budgets), 'mục Tài chính'],
      ['hợp đồng', count(S.contracts), 'mục Tài chính'],
      ['tài liệu', count(S.documents), 'mục Tài liệu'],
      ['đối tượng nghiên cứu', count(S.subjects), 'mục Nghiên cứu y sinh'],
      ['báo cáo y sinh', count(S.biomedical_reports), 'mục Nghiên cứu y sinh'],
    ].filter(([, n]) => n);
    let body = { id: p.id };
    if (!left.length) {
      const ok = await confirm(`Xoá đề tài ${p.code} · ${p.title}?\nĐề tài chưa có dữ liệu; các thành viên sẽ được gỡ khỏi đề tài. Thao tác không thể hoàn tác.`,
        { title: 'Xoá đề tài', okText: 'Xoá đề tài', danger: true });
      if (!ok) return;
    } else {
      const code = await ask('Đề tài còn dữ liệu', {
        message: `Đề tài ${p.code} hiện còn:\n${left.map(([l, n, w]) => `• ${n} ${l} (${w})`).join('\n')}\n\nCách 1: bấm Huỷ, rồi xoá các dữ liệu trên ở từng mục trước khi xoá đề tài.\nCách 2: nhập đúng mã đề tài “${p.code}” để xoá đề tài KÈM TOÀN BỘ dữ liệu trên. Không thể hoàn tác.`,
        label: 'Nhập mã đề tài để xác nhận', single: true, placeholder: p.code, okText: 'Xoá kèm toàn bộ dữ liệu', danger: true,
      });
      if (code === null) return;
      if (code.trim() !== p.code) { notify('Mã đề tài không khớp, chưa xoá', 'error'); return; }
      body = { ...body, force: true, confirm_code: code.trim() };
    }
    try {
      await api('project-delete', body);
      closeModal();
      await refresh();
      notify('Đã xoá đề tài ' + p.code, 'success');
    } catch (e) { notify(e.message, 'error'); }
  };
}

export function ProjectDetail({ id }) {
  const { S, can, refresh, notify, closeModal, showModal } = useApp();
  const openForm = useOpenForm();
  const deleteProject = useDeleteProject();
  const { name } = lookups(S);
  const p = S.projects.find((x) => x.id === id);
  if (!p) return <EmptyState title="Đề tài không còn trong phạm vi được xem" />;
  const tasks = S.tasks.filter((x) => x.project_id === id);
  const budgets = S.budgets.filter((x) => x.project_id === id);
  const members = S.project_members.filter((x) => x.project_id === id);
  const done = tasks.filter((t) => t.status === 'Hoàn thành').length;
  const canStage = can('director', 'lead');
  const setStage = async (stage) => {
    try {
      await api('stage', { project_id: id, stage });
      await refresh();
      notify('Đã cập nhật giai đoạn', 'success');
    } catch (e) { notify(e.message, 'error'); }
  };
  const planned = budgets.reduce((a, b) => a + b.planned, 0);
  const spent = budgets.reduce((a, b) => a + b.spent, 0);
  return (
    <>
      <div className="flex between" style={{ marginBottom: 8 }}>
        <div className="flex"><span className="code">{p.code}</span><Tag>{p.type}</Tag><Status s={p.status} /></div>
        {can('director') && (
          <div className="flex">
            <Btn variant="ghost" icon="edit" onClick={() => openForm('project', null, p)}>Sửa</Btn>
            <Btn variant="ghost" icon="trash" style={{ color: 'var(--bad)' }} onClick={() => deleteProject(p)}>Xoá</Btn>
          </div>
        )}
      </div>
      <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>{p.title}</h2>
      {p.description && <p className="desc" style={{ marginBottom: 16 }}>{p.description}</p>}
      <div className="panel-soft" style={{ marginTop: 14 }}>
        <InfoGrid cols={4} items={[
          ['Trưởng nhóm', <Person name={name(p.lead_id)} size={24} />],
          ['Đầu mối HC–TC', <Person name={name(p.admin_id)} size={24} />],
          ['Nguồn tài trợ', p.funder],
          ['Thời gian', `${dt(p.start_date)} → ${dt(p.end_date)}`],
        ]} />
      </div>

      <h3>Giai đoạn thực hiện {canStage && <span className="muted tiny" style={{ fontWeight: 400 }}>· bấm để chuyển giai đoạn</span>}</h3>
      <div className="stepper">
        {S.stages.map((s, i) => {
          const n = i + 1;
          return (
            <button key={n} type="button" disabled={!canStage} onClick={() => setStage(n)}
              className={'step' + (n === p.stage ? ' current' : n < p.stage ? ' done' : '')}>
              <span className="step-num">{n < p.stage ? <Icon name="check" size={12} strokeWidth={3} /> : n}</span>{s}
            </button>
          );
        })}
      </div>

      <div className="flex between"><h3>Nhân sự tham gia ({members.length})</h3>{can('director') && <Btn icon="plus" onClick={() => openForm('membership', id)}>Thêm thành viên</Btn>}</div>
      {members.length ? (
        <div className="chips">
          {members.map((x) => <span key={x.user_id} className="chip"><Avatar name={name(x.user_id)} size={24} /><b>{name(x.user_id)}</b><span className="muted">{x.project_role}</span></span>)}
        </div>
      ) : <p className="muted">Chưa có thành viên.</p>}

      <h3>Công việc ({done}/{tasks.length} hoàn thành)</h3>
      {tasks.length ? (
        <div className="list">
          {tasks.map((t) => (
            <div key={t.id} className="list-row clickable" onClick={() => { closeModal(); showModal('Công việc: ' + t.title, <TaskDetail id={t.id} />, 'lg'); }}>
              <div className="list-main"><div className="list-title">{t.title}</div><div className="list-sub">{name(t.owner_id)} · hạn {dt(t.due_date)}</div></div>
              <div style={{ width: 110 }}><Bar pct={t.progress} /></div>
              <Status s={t.status} />
            </div>
          ))}
        </div>
      ) : <p className="muted">Chưa có công việc.</p>}

      {S.finance_level && (
        <>
          <h3>Tài chính</h3>
          <div className="panel-soft">
            <div className="stage-line"><span>Đã chi <b>{money(spent)}</b> / dự toán {money(planned)}</span><span>{planned ? Math.round((spent / planned) * 100) : 0}%</span></div>
            <Bar pct={planned ? (spent / planned) * 100 : 0} tone={spent > planned ? 'bad' : 'blue'} />
          </div>
        </>
      )}
    </>
  );
}

export default function Projects() {
  const { S, can, showModal } = useApp();
  const openForm = useOpenForm();
  const deleteProject = useDeleteProject();
  const { name, st } = lookups(S);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const types = [...new Set(S.projects.map((p) => p.type).filter(Boolean))];
  const list = S.projects.filter((p) => (!type || p.type === type) && matches(q, p.code, p.title, name(p.lead_id), p.funder));
  return (
    <>
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Tìm theo mã, tên đề tài, trưởng nhóm…" />
        {types.length > 1 && (
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tất cả loại nhiệm vụ</option>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        )}
        <span className="spacer" />
        {can('director') && <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('project')}>Tạo đề tài</Btn>}
      </Toolbar>
      {list.length ? (
        <div className="project-grid">
          {list.map((p) => {
            const tasks = S.tasks.filter((t) => t.project_id === p.id);
            const members = S.project_members.filter((m) => m.project_id === p.id);
            const done = tasks.filter((t) => t.status === 'Hoàn thành').length;
            const openDetail = () => showModal('Hồ sơ đề tài', <ProjectDetail id={p.id} />, 'lg');
            return (
              <div key={p.id} role="button" tabIndex={0} className="project-card" onClick={openDetail}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && (e.preventDefault(), openDetail())}>
                <div className="flex between" style={{ width: '100%' }}>
                  <span className="code">{p.code}</span>
                  <span className="flex" style={{ gap: 4 }}>
                    <Tag>{p.type}</Tag><Status s={p.status} />
                    {can('director') && <span className="flex" style={{ gap: 0 }} onClick={(e) => e.stopPropagation()}>
                      <IconBtn icon="edit" variant="primary" title="Sửa đề tài" label="Sửa" onClick={() => openForm('project', null, p)} />
                      <IconBtn icon="trash" variant="danger" title="Xoá đề tài" label="Xoá" onClick={() => deleteProject(p)} />
                    </span>}
                  </span>
                </div>
                <h3>{p.title}</h3>
                <div>
                  <div className="stage-line"><span>Giai đoạn {p.stage}/8 · <b>{st(p.stage)}</b></span></div>
                  <StageSegments stage={p.stage} />
                </div>
                <div className="project-meta">
                  <span><Icon name="tasks" size={14} />{done}/{tasks.length} việc</span>
                  {p.end_date && <span><Icon name="calendar" size={14} />{dt(p.end_date)}</span>}
                </div>
                <div className="project-foot">
                  <Person name={name(p.lead_id)} sub="Trưởng nhóm" size={28} />
                  <span className="avatars">{members.slice(0, 4).map((m) => <Avatar key={m.user_id} name={name(m.user_id)} size={26} />)}{members.length > 4 && <span className="muted tiny" style={{ marginLeft: 6 }}>+{members.length - 4}</span>}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Section><EmptyState icon="folder" title={S.projects.length ? 'Không tìm thấy đề tài phù hợp' : 'Chưa có đề tài nào'}>{can('director') && !S.projects.length && 'Bấm “Tạo đề tài” để bắt đầu.'}</EmptyState></Section>
      )}
    </>
  );
}

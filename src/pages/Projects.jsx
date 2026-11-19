import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { dt, money } from '../constants.js';
import { Btn, Section, SimpleTable, Status } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';
import { TaskDetail } from './Tasks.jsx';

export function ProjectDetail({ id }) {
  const { S, can, refresh, notify, closeModal, showModal } = useApp();
  const openForm = useOpenForm();
  const { name } = lookups(S);
  const p = S.projects.find((x) => x.id === id);
  if (!p) return <p className="muted">Đề tài không còn trong phạm vi được xem.</p>;
  const tasks = S.tasks.filter((x) => x.project_id === id);
  const budgets = S.budgets.filter((x) => x.project_id === id);
  const members = S.project_members.filter((x) => x.project_id === id);
  const setStage = async (stage) => {
    try {
      await api('stage', { project_id: id, stage });
      closeModal();
      await refresh();
      notify('Đã cập nhật giai đoạn');
    } catch (e) { notify(e.message); }
  };
  return (
    <>
      <h3>{p.title}</h3>
      <p>{p.description}</p>
      <div className="grid2">
        <div><b>Trưởng nhóm:</b> {name(p.lead_id)}</div>
        <div><b>HC–TC:</b> {name(p.admin_id)}</div>
        <div><b>Tài trợ:</b> {p.funder}</div>
        <div><b>Thời hạn:</b> {dt(p.end_date)}</div>
      </div>
      <h3>8 giai đoạn</h3>
      <div className="stage">
        {S.stages.map((s, i) => (
          <button key={i} className={'step ' + (p.stage === i + 1 ? 'current' : '')} disabled={!can('director', 'lead')} onClick={() => setStage(i + 1)}>{i + 1}. {s}</button>
        ))}
      </div>
      <h3>Nhân sự tham gia</h3>
      <p>{members.map((x) => `${name(x.user_id)}${x.project_role ? ' (' + x.project_role + ')' : ''}`).join(' · ') || '—'}</p>
      {can('director') && <Btn onClick={() => openForm('membership', id)}>+ Thêm thành viên</Btn>}
      <h3>Danh sách công việc ({tasks.length})</h3>
      {tasks.length ? tasks.map((t) => (
        <div key={t.id} className="minirow"><Btn onClick={() => showModal('Công việc: ' + t.title, <TaskDetail id={t.id} />)}>Mở</Btn> <b>{t.title}</b> – <Status s={t.status} /></div>
      )) : 'Chưa có công việc'}
      <h3>Tài chính</h3>
      <p>Dự toán: <b>{money(budgets.reduce((a, b) => a + b.planned, 0))}</b> · Đã chi: {money(budgets.reduce((a, b) => a + b.spent, 0))}</p>
    </>
  );
}

export default function Projects() {
  const { S, can, showModal } = useApp();
  const openForm = useOpenForm();
  const { name, st } = lookups(S);
  return (
    <Section title="Danh mục đề tài" controls={can('director') && <Btn onClick={() => openForm('project')}>+ Tạo đề tài</Btn>}>
      <SimpleTable
        cols={['Mã / Tên đề tài', 'Giai đoạn', 'Phụ trách', 'Trạng thái', 'Thao tác']}
        rows={S.projects.map((p) => [
          <><b>{p.code}</b><div>{p.title}</div><div className="tiny muted">{p.type}</div></>,
          <><span className="pill">{p.stage}/8</span> {st(p.stage)}</>,
          name(p.lead_id),
          <Status s={p.status} />,
          <Btn onClick={() => showModal('Hồ sơ đề tài: ' + p.code, <ProjectDetail id={p.id} />)}>Chi tiết</Btn>,
        ])}
      />
    </Section>
  );
}

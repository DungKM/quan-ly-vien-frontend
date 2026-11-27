import { lookups, useApp } from '../AppContext.jsx';
import { dt, isOverdue, money } from '../constants.js';
import { Bar, Btn, EmptyState, Icon, Person, Section, StatCard, Status } from '../components/ui.jsx';
import { ProjectDetail, StageSegments } from './Projects.jsx';
import { TaskDetail } from './Tasks.jsx';

export default function Dashboard() {
  const { S, me, go, showModal } = useApp();
  const { name, st, pcode } = lookups(S);
  const open = S.tasks.filter((x) => x.status !== 'Hoàn thành');
  const overdue = open.filter(isOverdue);
  const pending = S.approvals.filter((x) => x.status === 'Chờ duyệt');
  const mine = open
    .filter((t) => t.owner_id === me.id || S.task_assignees.some((a) => a.task_id === t.id && a.user_id === me.id))
    .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
  const attention = [...overdue, ...open.filter((t) => t.status === 'Chờ duyệt' && !isOverdue(t))].slice(0, 7);
  const openTask = (t) => showModal('Công việc: ' + t.title, <TaskDetail id={t.id} />, 'lg');
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const planned = S.budgets.reduce((a, x) => a + Number(x.planned), 0);
  const spent = S.budgets.reduce((a, x) => a + Number(x.spent), 0);

  return (
    <>
      <div className="flex between" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 650 }}>{greet}, {me.name} 👋</div>
          <div className="muted tiny">Hôm nay {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
        </div>
        {mine.length > 0 && <Btn icon="userCheck" onClick={() => go('mine')}>{mine.length} việc của tôi đang mở</Btn>}
      </div>

      <div className="stats">
        <StatCard label="Đề tài / dự án" value={S.projects.length} icon="folder" tone="blue" onClick={() => go('projects')} />
        <StatCard label="Công việc đang mở" value={open.length} hint={`${S.tasks.length} công việc tổng cộng`} icon="tasks" tone="teal" onClick={() => go('tasks')} />
        <StatCard label="Công việc quá hạn" value={overdue.length} icon="clock" tone={overdue.length ? 'bad' : 'ok'} onClick={() => go('tasks')} />
        <StatCard label="Chờ phê duyệt" value={pending.length} icon="checkCircle" tone={pending.length ? 'warn' : 'ok'} onClick={() => go('approvals')} />
      </div>

      <div className="grid-main">
        <div>
          <Section title="Tiến độ đề tài" subtitle="Giai đoạn hiện tại trên 8 giai đoạn" controls={<Btn variant="ghost" onClick={() => go('projects')}>Xem tất cả</Btn>}>
            {S.projects.length ? (
              <div className="list">
                {S.projects.slice(0, 6).map((p) => (
                  <div key={p.id} className="list-row clickable" onClick={() => showModal('Hồ sơ đề tài', <ProjectDetail id={p.id} />, 'lg')}>
                    <div className="list-main">
                      <div className="flex" style={{ gap: 8, flexWrap: 'nowrap' }}><span className="code">{p.code}</span><span className="list-title">{p.title}</span></div>
                      <div className="stage-line" style={{ marginTop: 8 }}><span>Giai đoạn {p.stage}/8 · <b>{st(p.stage)}</b></span><span>{name(p.lead_id)}</span></div>
                      <StageSegments stage={p.stage} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon="folder" title="Chưa có đề tài" />}
          </Section>

          <Section title="Công việc cần chú ý" subtitle="Quá hạn hoặc đang chờ duyệt">
            {attention.length ? (
              <div className="list">
                {attention.map((t) => (
                  <div key={t.id} className="list-row clickable" onClick={() => openTask(t)}>
                    <div className="list-main">
                      <div className="list-title">{t.title}</div>
                      <div className="list-sub">{pcode(t.project_id)} · {name(t.owner_id)}</div>
                    </div>
                    {isOverdue(t) ? <span className="overdue tiny"><Icon name="clock" size={14} />{dt(t.due_date)}</span> : <span className="tiny muted">{dt(t.due_date)}</span>}
                    <Status s={t.status} />
                  </div>
                ))}
              </div>
            ) : <EmptyState icon="checkCircle" title="Không có việc nào cần chú ý">Mọi việc đều đang đúng hạn.</EmptyState>}
          </Section>
        </div>

        <div>
          <Section title="Việc của tôi" subtitle="Sắp xếp theo hạn hoàn thành">
            {mine.length ? (
              <div className="list">
                {mine.slice(0, 6).map((t) => (
                  <div key={t.id} className="list-row clickable" onClick={() => openTask(t)}>
                    <div className="list-main">
                      <div className="list-title">{t.title}</div>
                      <div className="list-sub" style={{ color: isOverdue(t) ? 'var(--bad)' : undefined }}>Hạn {dt(t.due_date)} · {t.progress}%</div>
                      <div style={{ marginTop: 6 }}><Bar pct={t.progress} /></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon="userCheck" title="Bạn chưa có việc nào đang mở" />}
          </Section>

          <Section title="Đang chờ phê duyệt" controls={pending.length > 0 && <Btn variant="ghost" onClick={() => go('approvals')}>Mở</Btn>}>
            {pending.length ? (
              <div className="list">
                {pending.slice(0, 5).map((a) => (
                  <div key={a.id} className="list-row">
                    <Person name={name(a.requested_by)} size={30} />
                    <div className="list-main"><div className="list-title">{a.title.replace(/^Phê duyệt:\s*/, '')}</div><div className="list-sub">{pcode(a.project_id)} · {dt(a.created_at)}</div></div>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon="checkCircle" title="Không có yêu cầu nào" />}
          </Section>

          {S.finance_level && (
            <Section title="Ngân sách" controls={<Btn variant="ghost" onClick={() => go('finance')}>Chi tiết</Btn>}>
              <div className="stage-line"><span>Đã chi <b>{money(spent)}</b></span><span>{planned ? Math.round((spent / planned) * 100) : 0}%</span></div>
              <Bar pct={planned ? (spent / planned) * 100 : 0} tone={spent > planned ? 'bad' : 'blue'} />
              <div className="muted tiny" style={{ marginTop: 8 }}>Tổng dự toán {money(planned)} · Còn lại {money(planned - spent)}</div>
            </Section>
          )}
        </div>
      </div>

      <Section title="Hướng dẫn thao tác nhanh">
        <div className="grid3" style={{ marginBottom: 0 }}>
          {[
            ['folder', '1. Tạo đề tài', 'Tạo mã đề tài, trưởng nhóm, đầu mối tài chính và phạm vi nghiên cứu.'],
            ['tasks', '2. Giao việc & báo cáo', 'Tạo việc, thời hạn, sản phẩm; từng thành viên cập nhật kết quả liên tục.'],
            ['checkCircle', '3. Duyệt và theo dõi', 'Kiểm tra sản phẩm, phê duyệt và theo dõi kinh phí, dữ liệu mẫu. Tài liệu chia sẻ: dán link vào mục Tài liệu hoặc gửi trực tiếp cho nhau.'],
          ].map(([icon, title, text]) => (
            <div key={title} className="flex" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 12 }}>
              <span className="stat-icon tone-blue" style={{ width: 36, height: 36 }}><Icon name={icon} size={18} /></span>
              <div><b>{title}</b><p className="muted" style={{ margin: '4px 0 0' }}>{text}</p></div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

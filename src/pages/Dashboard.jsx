import { lookups, useApp } from '../AppContext.jsx';
import { dt, today } from '../constants.js';
import { Bar, Section, SimpleTable, Status } from '../components/ui.jsx';

export default function Dashboard() {
  const { S } = useApp();
  const { st } = lookups(S);
  const overdue = S.tasks.filter((x) => x.due_date && x.due_date < today() && x.status !== 'Hoàn thành');
  const pending = S.approvals.filter((x) => x.status === 'Chờ duyệt');
  const cards = [['Đề tài / Dự án', S.projects.length], ['Công việc đang theo dõi', S.tasks.length], ['Công việc quá hạn', overdue.length], ['Chờ phê duyệt', pending.length]];
  const attention = [...overdue, ...S.tasks.filter((t) => t.status === 'Chờ duyệt')].slice(0, 8);
  return (
    <>
      <div className="cards">{cards.map(([k, v]) => <div key={k} className="card"><div className="muted">{k}</div><div className="kpi">{v}</div></div>)}</div>
      <div className="grid2">
        <Section title="Tiến độ đề tài">
          {S.projects.map((p) => (
            <div key={p.id} className="minirow">
              <b>{p.code}</b> · {p.title}
              <div className="flex between tiny muted"><span>Giai đoạn {p.stage}/8: {st(p.stage)}</span><span>{Math.round((p.stage / 8) * 100)}%</span></div>
              <Bar pct={(p.stage / 8) * 100} />
            </div>
          ))}
        </Section>
        <Section title="Công việc cần chú ý">
          <SimpleTable cols={['Công việc', 'Hạn', 'Trạng thái']} rows={attention.map((t) => [t.title, dt(t.due_date), <Status s={t.status} />])} />
        </Section>
      </div>
      <Section title="Hướng dẫn thao tác nhanh">
        <div className="grid3">
          <div><b>1. Tạo đề tài</b><p className="muted">Tạo mã đề tài, trưởng nhóm, đầu mối tài chính và phạm vi nghiên cứu.</p></div>
          <div><b>2. Giao việc & báo cáo</b><p className="muted">Tạo việc, thời hạn, sản phẩm; từng thành viên cập nhật kết quả liên tục.</p></div>
          <div><b>3. Duyệt và theo dõi</b><p className="muted">Kiểm tra sản phẩm, phê duyệt và theo dõi kinh phí, dữ liệu mẫu. Tài liệu chia sẻ: dán link vào mục Tài liệu hoặc gửi trực tiếp cho nhau.</p></div>
        </div>
      </Section>
    </>
  );
}

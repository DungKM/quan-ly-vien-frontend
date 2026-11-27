import { useState } from 'react';
import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { dtm } from '../constants.js';
import { Btn, Person, Section, SimpleTable, Status, Tabs } from '../components/ui.jsx';
import { TaskDetail } from './Tasks.jsx';

export default function Approvals() {
  const { S, can, refresh, notify, ask, showModal } = useApp();
  const { name, pcode } = lookups(S);
  const [tab, setTab] = useState('pending');
  const decider = can('director', 'lead');
  const decide = async (a, status) => {
    const note = await ask(status === 'Đã duyệt' ? 'Duyệt kết quả' : 'Yêu cầu chỉnh sửa', {
      message: a.title,
      label: status === 'Đã duyệt' ? 'Ghi chú (không bắt buộc)' : 'Nội dung cần chỉnh sửa',
      okText: status === 'Đã duyệt' ? 'Duyệt' : 'Gửi yêu cầu sửa',
    });
    if (note === null) return;
    try {
      await api('approval', { id: a.id, status, decision_note: note });
      await refresh();
      notify('Đã cập nhật phê duyệt', 'success');
    } catch (e) { notify(e.message, 'error'); }
  };
  const pending = S.approvals.filter((a) => a.status === 'Chờ duyệt');
  const done = S.approvals.filter((a) => a.status !== 'Chờ duyệt');
  const list = tab === 'pending' ? pending : done;
  return (
    <Section flush title="Phiếu phê duyệt" subtitle="Kết quả công việc được gửi lên khi báo cáo “Hoàn thành”">
      <Tabs tabs={[['pending', 'Chờ duyệt', pending.length], ['done', 'Đã xử lý', done.length]]} value={tab} onChange={setTab} />
      <SimpleTable
        emptyIcon="checkCircle"
        empty={tab === 'pending' ? 'Không có phiếu nào đang chờ duyệt' : 'Chưa có phiếu nào được xử lý'}
        cols={tab === 'pending' ? ['Nội dung', 'Đề tài', 'Người đề nghị', 'Gửi lúc', ''] : ['Nội dung', 'Đề tài', 'Người đề nghị', 'Kết quả', 'Người quyết định', 'Ghi chú']}
        rows={list.map((a) => {
          const title = (
            <div style={{ minWidth: 200 }}>
              <div className="cell-title">{a.title.replace(/^Phê duyệt:\s*/, '')}</div>
              {a.task_id && S.tasks.some((t) => t.id === a.task_id) && <a href="#" className="tiny" onClick={(e) => { e.preventDefault(); showModal('Công việc', <TaskDetail id={a.task_id} />, 'lg'); }}>Xem công việc & báo cáo</a>}
            </div>
          );
          return tab === 'pending'
            ? [title, <span className="code">{pcode(a.project_id)}</span>, <Person name={name(a.requested_by)} size={26} />, <span className="nowrap">{dtm(a.created_at)}</span>,
              decider ? <div className="row-actions" style={{ gap: 6 }}><Btn variant="ghost" onClick={() => decide(a, 'Yêu cầu sửa')}>Yêu cầu sửa</Btn><Btn variant="primary" icon="check" onClick={() => decide(a, 'Đã duyệt')}>Duyệt</Btn></div> : <Status s="Chờ duyệt" />]
            : [title, <span className="code">{pcode(a.project_id)}</span>, <Person name={name(a.requested_by)} size={26} />, <Status s={a.status} />,
              <Person name={name(a.decided_by)} sub={dtm(a.decided_at)} size={26} />, a.decision_note || <span className="muted">—</span>];
        })}
      />
    </Section>
  );
}

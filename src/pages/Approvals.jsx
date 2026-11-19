import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { Btn, Section, SimpleTable, Status } from '../components/ui.jsx';

export default function Approvals() {
  const { S, can, refresh, notify } = useApp();
  const { name, pname } = lookups(S);
  const decide = async (id, status) => {
    const note = window.prompt('Ghi chú phê duyệt (có thể để trống):', '');
    if (note === null) return;
    try {
      await api('approval', { id, status, decision_note: note });
      await refresh();
      notify('Đã cập nhật phê duyệt');
    } catch (e) { notify(e.message); }
  };
  return (
    <Section title="Phiếu phê duyệt">
      <SimpleTable
        cols={['Nội dung', 'Đề tài', 'Người đề nghị', 'Trạng thái', 'Quyết định']}
        rows={S.approvals.map((a) => [
          a.title, pname(a.project_id), name(a.requested_by), <Status s={a.status} />,
          a.status === 'Chờ duyệt' && can('director', 'lead')
            ? <div className="flex"><Btn onClick={() => decide(a.id, 'Đã duyệt')}>Duyệt</Btn><Btn onClick={() => decide(a.id, 'Yêu cầu sửa')}>Yêu cầu sửa</Btn></div>
            : (a.decision_note || '—'),
        ])}
      />
    </Section>
  );
}

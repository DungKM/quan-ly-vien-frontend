import { useState } from 'react';
import { lookups, useApp } from '../AppContext.jsx';
import { dtm, matches } from '../constants.js';
import { Person, SearchBox, Section, SimpleTable, Tag, Toolbar } from '../components/ui.jsx';

// Nhãn tiếng Việt cho hành động và đối tượng trong nhật ký
const ACTIONS = {
  create: ['Tạo mới', 'ok'], edit: ['Sửa', 'blue'], delete: ['Xoá', 'bad'], report: ['Báo cáo', 'teal'], approve: ['Phê duyệt', 'violet'],
  assign: ['Phân công', 'blue'], stage: ['Chuyển giai đoạn', 'teal'], edit_person: ['Sửa phân quyền', 'violet'], import_permissions: ['Import quyền', 'violet'],
  change_password: ['Đổi mật khẩu', 'neutral'], create_report: ['Báo cáo y sinh', 'teal'], init: ['Khởi tạo', 'neutral'],
};
const ENTITIES = {
  project: 'Đề tài', task: 'Công việc', report: 'Báo cáo', approval: 'Phê duyệt', user: 'Nhân sự', position: 'Chức vụ', budget: 'Ngân sách',
  contract: 'Hợp đồng', subject: 'Đối tượng', visit: 'Thăm khám', sample: 'Mẫu', observation: 'Kết quả XN', document: 'Tài liệu', biomedical_report: 'Báo cáo y sinh',
};

export default function Audit() {
  const { S } = useApp();
  const { name } = lookups(S);
  const [q, setQ] = useState('');
  const list = S.audit.filter((x) => matches(q, name(x.actor_id), x.action, ACTIONS[x.action]?.[0], ENTITIES[x.entity], x.detail));
  return (
    <Section flush title="Nhật ký thao tác" subtitle="Hiển thị 100 thao tác gần nhất">
      <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Tìm theo người, hành động, chi tiết…" /></Toolbar>
      <SimpleTable
        emptyIcon="history"
        cols={['Thời gian', 'Tài khoản', 'Hành động', 'Đối tượng', 'Chi tiết']}
        rows={list.map((x) => {
          const [label, tone] = ACTIONS[x.action] || [x.action, 'neutral'];
          return [
            <span className="nowrap muted">{dtm(x.at)}</span>,
            <Person name={name(x.actor_id)} size={26} />,
            <Tag tone={tone}>{label}</Tag>,
            <span className="nowrap">{ENTITIES[x.entity] || x.entity} <span className="muted">#{x.entity_id}</span></span>,
            <span className="tiny" style={{ wordBreak: 'break-word' }}>{x.detail || '—'}</span>,
          ];
        })}
      />
    </Section>
  );
}

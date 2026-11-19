import { lookups, useApp } from '../AppContext.jsx';
import { Section, SimpleTable } from '../components/ui.jsx';

export default function Audit() {
  const { S } = useApp();
  const { name } = lookups(S);
  return (
    <Section title="Nhật ký thao tác (demo)">
      <SimpleTable
        cols={['Thời gian', 'Tài khoản', 'Hành động', 'Đối tượng', 'Chi tiết']}
        rows={S.audit.map((x) => [x.at, name(x.actor_id), x.action, `${x.entity} #${x.entity_id}`, x.detail])}
      />
    </Section>
  );
}

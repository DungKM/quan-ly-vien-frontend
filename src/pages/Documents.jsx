import { lookups, useApp } from '../AppContext.jsx';
import { Btn, Section, SimpleTable, Status } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

// Chỉ hiển thị liên kết http(s) để tránh javascript: URL
const safeUrl = (u) => /^https?:\/\//i.test(u || '');

export default function Documents() {
  const { S, can } = useApp();
  const openForm = useOpenForm();
  const { pname } = lookups(S);
  return (
    <Section title="Hồ sơ & tài liệu nghiên cứu" controls={can('director', 'lead', 'coordinator') && <Btn onClick={() => openForm('document')}>+ Thêm hồ sơ</Btn>}>
      <SimpleTable
        cols={['Đề tài', 'Tài liệu', 'Loại', 'Phiên bản', 'Trạng thái', 'Liên kết']}
        rows={S.documents.map((x) => [
          pname(x.project_id), x.title, x.category, x.version, <Status s={x.status} />,
          safeUrl(x.url) ? <a href={x.url} target="_blank" rel="noopener noreferrer">Xem</a> : '—',
        ])}
      />
    </Section>
  );
}

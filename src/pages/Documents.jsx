import { useState } from 'react';
import { lookups, useApp } from '../AppContext.jsx';
import { matches } from '../constants.js';
import { Btn, Icon, SearchBox, Section, SimpleTable, Status, Tag, Toolbar } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

// Chỉ hiển thị liên kết http(s) để tránh javascript: URL
const safeUrl = (u) => /^https?:\/\//i.test(u || '');

export default function Documents() {
  const { S, can } = useApp();
  const openForm = useOpenForm();
  const { pcode } = lookups(S);
  const [q, setQ] = useState('');
  const [fProject, setFProject] = useState('');
  const list = S.documents.filter((x) => (!fProject || x.project_id === Number(fProject)) && matches(q, x.title, x.category, pcode(x.project_id)));
  return (
    <Section flush title="Hồ sơ & tài liệu" subtitle={`${S.documents.length} tài liệu`}
      controls={can('director', 'lead', 'coordinator') && <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('document')}>Thêm hồ sơ</Btn>}>
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Tìm tên tài liệu, loại…" />
        <select value={fProject} onChange={(e) => setFProject(e.target.value)}>
          <option value="">Tất cả đề tài</option>
          {S.projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
        </select>
      </Toolbar>
      <SimpleTable
        emptyIcon="file" empty="Chưa có tài liệu"
        cols={['Tài liệu', 'Đề tài', 'Loại', 'Phiên bản', 'Trạng thái', '']}
        rows={list.map((x) => [
          <span className="flex" style={{ flexWrap: 'nowrap' }}><span className="stat-icon tone-blue" style={{ width: 32, height: 32, borderRadius: 8 }}><Icon name="file" size={16} /></span><span className="cell-title">{x.title}</span></span>,
          <span className="code">{pcode(x.project_id)}</span>,
          x.category ? <Tag>{x.category}</Tag> : '—',
          'v' + x.version,
          <Status s={x.status} />,
          safeUrl(x.url) ? <a href={x.url} target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm"><Icon name="link" size={14} />Mở</a> : <span className="muted">—</span>,
        ])}
      />
    </Section>
  );
}

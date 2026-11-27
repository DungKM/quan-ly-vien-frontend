import { useState } from 'react';
import { lookups, useApp } from '../AppContext.jsx';
import { dt, matches } from '../constants.js';
import { Banner, Btn, SearchBox, Section, SimpleTable, Status, Toolbar } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

export default function Samples() {
  const { S, can } = useApp();
  const openForm = useOpenForm();
  const { subjCode } = lookups(S);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const list = S.samples.filter((s) => (!status || s.status === status) && matches(q, s.sample_code, subjCode(s.subject_id), s.sample_type, s.location));
  return (
    <>
      <Banner>Mẫu bệnh phẩm mô phỏng. Phân hệ này chưa thay thế LIMS/biobank đã thẩm định và chưa theo dõi chuỗi bàn giao đầy đủ.</Banner>
      <Section flush title="Danh mục mẫu" subtitle={`${S.samples.length} mẫu`}
        controls={can('director', 'lead', 'coordinator', 'researcher', 'technician') && <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('sample')}>Nhập mẫu</Btn>}>
        <Toolbar>
          <SearchBox value={q} onChange={setQ} placeholder="Tìm mã mẫu, đối tượng, loại, vị trí…" />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Mọi tình trạng</option>
            {['Đang lưu', 'Đã chuyển', 'Đã sử dụng', 'Đã hủy'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Toolbar>
        <SimpleTable
          emptyIcon="tube" empty="Chưa có mẫu"
          cols={['Mã mẫu', 'Đối tượng', 'Loại mẫu', 'Ngày lấy', 'Thể tích', 'Vị trí lưu', 'Tình trạng']}
          rows={list.map((s) => [<b>{s.sample_code}</b>, subjCode(s.subject_id), s.sample_type, dt(s.collection_date), s.volume || '—', s.location || '—', <Status s={s.status} />])}
        />
      </Section>
    </>
  );
}

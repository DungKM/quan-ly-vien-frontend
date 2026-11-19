import { lookups, useApp } from '../AppContext.jsx';
import { dt } from '../constants.js';
import { Btn, Section, SimpleTable, Status } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

export default function Samples() {
  const { S, can } = useApp();
  const openForm = useOpenForm();
  const { subjCode } = lookups(S);
  return (
    <>
      <div className="banner">Mẫu bệnh phẩm mô phỏng. Phân hệ này chưa thay thế LIMS/biobank đã thẩm định và chưa theo dõi chuỗi bàn giao đầy đủ.</div>
      <Section title="Danh mục mẫu / Biobank" controls={can('director', 'lead', 'coordinator', 'researcher', 'technician') && <Btn onClick={() => openForm('sample')}>+ Nhập mẫu giả lập</Btn>}>
        <SimpleTable
          cols={['Mã mẫu', 'Đối tượng', 'Loại', 'Ngày lấy', 'Vị trí lưu', 'Tình trạng']}
          rows={S.samples.map((s) => [s.sample_code, subjCode(s.subject_id), s.sample_type, dt(s.collection_date), s.location, <Status s={s.status} />])}
        />
      </Section>
    </>
  );
}

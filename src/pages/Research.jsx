import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { dt } from '../constants.js';
import { Btn, Section, SimpleTable, Status } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

function BiomedicalReports() {
  const { S, me, can, refresh, notify } = useApp();
  const { name, pcode } = lookups(S);
  const submit = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await api('biomedical-report', Object.fromEntries(new FormData(form)));
      form.reset();
      await refresh();
      notify('Đã ghi nhận báo cáo nghiên cứu y sinh');
    } catch (err) { notify('Lỗi: ' + err.message); }
  };
  return (
    <Section title="Báo cáo kết quả đề tài – Nghiên cứu y sinh">
      {can('director', 'lead', 'coordinator') ? (
        <form onSubmit={submit}>
          <div className="formgrid">
            <div className="field"><label>Mã đề tài *</label><select name="project_id" required>{S.projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}</select></div>
            <div className="field"><label>Người báo cáo</label><input value={`${me.name} (${me.username})`} readOnly /></div>
            <div className="field"><label>Loại báo cáo *</label><select name="report_type"><option>Định kỳ</option><option>Đột xuất</option></select></div>
            <div className="field span2"><label>Kết quả báo cáo *</label><textarea name="result" required maxLength={10000} placeholder="Nội dung thực hiện, kết quả, số liệu tổng hợp, khó khăn/đề xuất..." /></div>
          </div>
          <button type="submit">Gửi báo cáo</button>
        </form>
      ) : <p className="muted">Chỉ nhân sự phụ trách hoặc điều phối đề tài được gửi báo cáo.</p>}
      <h3 style={{ marginTop: 18 }}>Các báo cáo đã ghi nhận</h3>
      <SimpleTable
        cols={['Mã đề tài', 'Người báo cáo', 'Loại', 'Kết quả', 'Thời điểm']}
        rows={(S.biomedical_reports || []).map((r) => [pcode(r.project_id), name(r.author_id), r.report_type, <div style={{ whiteSpace: 'pre-wrap' }}>{r.result}</div>, r.created_at])}
      />
    </Section>
  );
}

export default function Research() {
  const { S, can } = useApp();
  const openForm = useOpenForm();
  const { pname, subjCode } = lookups(S);
  const editor = can('director', 'lead', 'coordinator', 'researcher');
  return (
    <>
      <BiomedicalReports />
      <div className="banner" style={{ marginTop: 17 }}><b>Môi trường giả lập:</b> không nhập họ tên, mã bệnh án, số điện thoại, ngày sinh, dữ liệu di truyền hoặc dữ liệu bệnh nhân thật. Mã đối tượng bắt buộc bắt đầu bằng SIM-.</div>
      <Section title="Đối tượng nghiên cứu (giả lập)" controls={editor && <Btn onClick={() => openForm('subject')}>+ Đối tượng giả lập</Btn>}>
        <SimpleTable
          cols={['Mã nghiên cứu', 'Đề tài', 'Trung tâm', 'Nhóm', 'Trạng thái / Consent']}
          rows={S.subjects.map((s) => [s.study_code, pname(s.project_id), s.site, s.group_name, <><Status s={s.status} /><div className="tiny muted">{s.consent_status}</div></>])}
        />
      </Section>
      <Section title="Lần thăm khám" controls={editor && <Btn onClick={() => openForm('visit')}>+ Thêm lần thăm khám</Btn>}>
        <SimpleTable cols={['Mã đối tượng', 'Lần', 'Ngày', 'Ghi chú']} rows={S.visits.map((v) => [subjCode(v.subject_id), v.visit_code, dt(v.visit_date), v.note])} />
      </Section>
      <Section title="eCRF / Kết quả xét nghiệm giả lập" controls={can('director', 'lead', 'coordinator', 'researcher', 'technician') && <Btn onClick={() => openForm('observation')}>+ Thêm kết quả</Btn>}>
        <SimpleTable cols={['Đối tượng', 'Chỉ số', 'Giá trị', 'Đơn vị', 'Nguồn']} rows={S.observations.map((o) => [subjCode(o.subject_id), o.parameter, o.value, o.unit, o.source])} />
      </Section>
    </>
  );
}

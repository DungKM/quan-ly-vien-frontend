import { useState } from 'react';
import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { dt, dtm, matches } from '../constants.js';
import { Banner, Btn, FormActions, Person, SearchBox, Section, SimpleTable, Status, Tabs, Tag, Toolbar } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

function BiomedicalReports() {
  const { S, me, can, refresh, notify } = useApp();
  const { name, pcode } = lookups(S);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    const form = e.target;
    setBusy(true);
    try {
      await api('biomedical-report', Object.fromEntries(new FormData(form)));
      form.reset();
      await refresh();
      notify('Đã ghi nhận báo cáo nghiên cứu y sinh', 'success');
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const reports = (S.biomedical_reports || []).filter((r) => matches(q, r.result, pcode(r.project_id), name(r.author_id), r.report_type));
  return (
    <div className="grid-main">
      <Section title="Các báo cáo đã ghi nhận" subtitle={`${(S.biomedical_reports || []).length} báo cáo`} flush>
        <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Tìm trong nội dung báo cáo…" /></Toolbar>
        <SimpleTable
          emptyIcon="file" empty="Chưa có báo cáo"
          cols={['Đề tài', 'Người báo cáo', 'Loại', 'Kết quả']}
          rows={reports.map((r) => [
            <span className="code">{pcode(r.project_id)}</span>,
            <Person name={name(r.author_id)} sub={dtm(r.created_at)} size={26} />,
            <Tag tone={r.report_type === 'Đột xuất' ? 'warn' : 'blue'}>{r.report_type}</Tag>,
            <div style={{ whiteSpace: 'pre-wrap', minWidth: 240, maxWidth: 520 }}>{r.result}</div>,
          ])}
        />
      </Section>
      <Section title="Gửi báo cáo kết quả">
        {can('director', 'lead', 'coordinator') ? (
          <form onSubmit={submit}>
            <div className="field"><label>Đề tài<span className="req">*</span></label><select name="project_id" required>{S.projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}</select></div>
            <div className="field"><label>Người báo cáo</label><input value={`${me.name} (${me.username})`} readOnly disabled /></div>
            <div className="field"><label>Loại báo cáo<span className="req">*</span></label><select name="report_type"><option>Định kỳ</option><option>Đột xuất</option></select></div>
            <div className="field"><label>Kết quả báo cáo<span className="req">*</span></label><textarea name="result" required maxLength={10000} style={{ minHeight: 150 }} placeholder="Nội dung thực hiện, kết quả, số liệu tổng hợp, khó khăn / đề xuất..." /></div>
            <FormActions><Btn type="submit" variant="primary" size="md" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi báo cáo'}</Btn></FormActions>
          </form>
        ) : <p className="muted">Chỉ nhân sự phụ trách hoặc điều phối đề tài được gửi báo cáo.</p>}
      </Section>
    </div>
  );
}

export default function Research() {
  const { S, can } = useApp();
  const openForm = useOpenForm();
  const { pcode, subjCode } = lookups(S);
  const [tab, setTab] = useState('reports');
  const [q, setQ] = useState('');
  const editor = can('director', 'lead', 'coordinator', 'researcher');
  const obsEditor = can('director', 'lead', 'coordinator', 'researcher', 'technician');
  const tabs = [
    ['reports', 'Báo cáo y sinh', (S.biomedical_reports || []).length],
    ['subjects', 'Đối tượng', S.subjects.length],
    ['visits', 'Thăm khám', S.visits.length],
    ['observations', 'Xét nghiệm / eCRF', S.observations.length],
  ];
  const add = {
    subjects: editor && <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('subject')}>Thêm đối tượng</Btn>,
    visits: editor && <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('visit')}>Thêm lần thăm khám</Btn>,
    observations: obsEditor && <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('observation')}>Thêm kết quả</Btn>,
  };
  let table = null;
  if (tab === 'subjects') {
    table = <SimpleTable emptyIcon="users" empty="Chưa có đối tượng" cols={['Mã nghiên cứu', 'Đề tài', 'Trung tâm', 'Nhóm', 'Trạng thái', 'Consent']}
      rows={S.subjects.filter((s) => matches(q, s.study_code, s.site, s.group_name, pcode(s.project_id))).map((s) => [<b>{s.study_code}</b>, <span className="code">{pcode(s.project_id)}</span>, s.site || '—', s.group_name || '—', <Status s={s.status} />, <Status s={s.consent_status} />])} />;
  } else if (tab === 'visits') {
    table = <SimpleTable emptyIcon="calendar" empty="Chưa có lần thăm khám" cols={['Mã đối tượng', 'Lần', 'Ngày', 'Ghi chú']}
      rows={S.visits.filter((v) => matches(q, subjCode(v.subject_id), v.visit_code, v.note)).map((v) => [<b>{subjCode(v.subject_id)}</b>, v.visit_code, dt(v.visit_date), v.note || '—'])} />;
  } else if (tab === 'observations') {
    table = <SimpleTable emptyIcon="flask" empty="Chưa có kết quả" cols={['Đối tượng', 'Chỉ số', 'Giá trị', 'Đơn vị', 'Nguồn', 'Ghi nhận']}
      rows={S.observations.filter((o) => matches(q, subjCode(o.subject_id), o.parameter, o.value)).map((o) => [<b>{subjCode(o.subject_id)}</b>, o.parameter, <span className="mono strong">{o.value}</span>, o.unit || '—', <Tag>{o.source}</Tag>, dtm(o.recorded_at)])} />;
  }
  return (
    <>
      <Banner><b>Môi trường giả lập:</b> không nhập họ tên, mã bệnh án, số điện thoại, ngày sinh, dữ liệu di truyền hoặc dữ liệu bệnh nhân thật. Mã đối tượng bắt buộc bắt đầu bằng <b>SIM-</b>.</Banner>
      <Tabs tabs={tabs} value={tab} onChange={(k) => { setTab(k); setQ(''); }} />
      {tab === 'reports' ? <BiomedicalReports /> : (
        <Section flush title={tabs.find(([k]) => k === tab)[1]} controls={add[tab]}>
          <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Tìm kiếm…" /></Toolbar>
          {table}
        </Section>
      )}
    </>
  );
}

import { useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../AppContext.jsx';
import { B12_PROJECT_ROLES } from '../constants.js';
import { Banner, Btn, Choice, Field, FormActions, OptionList } from './ui.jsx';

const TITLES = {
  user: 'Thêm nhân sự', project: 'Tạo đề tài mới', membership: 'Phân công thành viên', task: 'Giao công việc',
  report: 'Cập nhật tiến độ / Báo cáo', budget: 'Thêm khoản mục ngân sách', contract: 'Thêm hợp đồng',
  subject: 'Thêm đối tượng giả lập', visit: 'Thêm lần thăm khám', sample: 'Thêm mẫu giả lập',
  observation: 'Kết quả xét nghiệm giả lập', document: 'Tạo mục hồ sơ',
};

const EDIT_TITLES = {
  project: 'Sửa đề tài', task: 'Sửa công việc', report: 'Sửa báo cáo', budget: 'Sửa khoản mục ngân sách', contract: 'Sửa hợp đồng',
};
// API dùng khi lưu bản sửa
const EDIT_API = {
  project: (r) => ['project-edit', { id: r.id }],
  task: (r) => ['task-edit', { id: r.id }],
  report: (r) => ['report-edit', { id: r.id }],
  budget: (r) => ['finance-edit', { kind: 'budget', id: r.id }],
  contract: (r) => ['finance-edit', { kind: 'contract', id: r.id }],
};

// Mở form theo loại. Truyền thêm `record` để mở ở chế độ sửa bản ghi đã có.
export function useOpenForm() {
  const { showModal } = useApp();
  return (kind, id, record) => showModal(record ? EDIT_TITLES[kind] : TITLES[kind], <RecordForm kind={kind} id={id} record={record} />);
}

function RecordForm({ kind, id, record }) {
  const { S, refresh, notify, closeModal } = useApp();
  const [busy, setBusy] = useState(false);

  const projects = S.projects.map((p) => [p.id, p.title]);
  const users = S.users.map((u) => [u.id, u.name]);
  const subjects = S.subjects.map((s) => [s.id, s.study_code]);
  const v = record || {};
  // Khi sửa: giữ nguyên đề tài của bản ghi (ô bị khoá)
  const project = <Choice label="Đề tài" name="project_id" items={projects} required defaultValue={v.project_id} disabled={!!record} />;
  const subject = <Choice label="Đối tượng giả lập" name="subject_id" items={subjects} required />;

  const submit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    setBusy(true);
    try {
      if (kind === 'project' && !record) d.members = [d.lead_id, d.admin_id].filter(Boolean);
      if (record) {
        const [path, extra] = EDIT_API[kind](record);
        await api(path, { ...d, ...extra });
      } else await api(kind, d);
      closeModal();
      await refresh();
      notify(record ? 'Đã cập nhật' : 'Đã lưu thành công', 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  let content;
  switch (kind) {
    case 'user':
      content = <>
        <Field label="Họ và tên" name="name" required />
        <Field label="Username" name="username" required pattern="[A-Za-z0-9_.\-]{3,40}" />
        <Field label="Mật khẩu khởi tạo (≥10 ký tự)" name="password" required minLength={10} />
        <Field label="Chức vụ" name="position" type="select" required defaultValue={S.positions?.find((p) => p.role === 'researcher')?.name}>{(S.positions || []).map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}</Field>
        <div className="span2"><Banner tone="info" icon="info">Sau khi tạo, chọn <b>Chỉnh sửa phân quyền</b> để gắn đề tài, vai trò và quyền Hành chính – Tài chính.</Banner></div>
      </>;
      break;
    case 'project':
      content = <>
        <Field label="Mã đề tài" name="code" required defaultValue={v.code} />
        <Field label="Loại nhiệm vụ" name="type" type="select" defaultValue={v.type}><OptionList values={['Đề tài', 'Dự án', 'Nhiệm vụ', 'Hợp tác']} /></Field>
        <Field label="Tên đề tài" name="title" required className="span2" defaultValue={v.title} />
        <Choice label="Trưởng nhóm" name="lead_id" items={users} defaultValue={v.lead_id ?? ''} />
        <Choice label="Đầu mối HC–TC" name="admin_id" items={users} defaultValue={v.admin_id ?? ''} />
        <Field label="Nguồn tài trợ" name="funder" defaultValue={v.funder} />
        {record
          ? <Field label="Trạng thái" name="status" type="select" defaultValue={v.status}><OptionList values={['Đang thực hiện', 'Tạm dừng', 'Hoàn thành', 'Đã hủy'].concat(['Đang thực hiện', 'Tạm dừng', 'Hoàn thành', 'Đã hủy'].includes(v.status) ? [] : [v.status])} /></Field>
          : <div />}
        <Field label="Ngày bắt đầu" name="start_date" type="date" defaultValue={v.start_date} />
        <Field label="Ngày kết thúc" name="end_date" type="date" defaultValue={v.end_date} />
        <Field label="Mô tả" name="description" type="textarea" defaultValue={v.description} />
      </>;
      break;
    case 'membership':
      content = <>
        <input type="hidden" name="project_id" value={id} />
        <Choice label="Thành viên" name="user_id" items={users} required />
        <Field label="Vai trò trong đề tài" name="project_role" type="select"><OptionList values={B12_PROJECT_ROLES} /></Field>
      </>;
      break;
    case 'task':
      content = <>
        {project}
        <Field label="Tên công việc" name="title" required defaultValue={v.title} className="span2" />
        <Field label="Giai đoạn" name="stage" type="select" defaultValue={v.stage}>{S.stages.map((s, i) => <option key={i} value={i + 1}>{i + 1}. {s}</option>)}</Field>
        <Choice label="Người phụ trách" name="owner_id" items={users} defaultValue={v.owner_id ?? ''} />
        <Field label="Ngày bắt đầu" name="start_date" type="date" defaultValue={v.start_date} />
        <Field label="Hạn hoàn thành" name="due_date" type="date" defaultValue={v.due_date} />
        <Field label="Ưu tiên" name="priority" type="select" defaultValue={v.priority}><OptionList values={['Bình thường', 'Cao', 'Khẩn']} /></Field>
        <Field label="Kỳ báo cáo" name="report_cycle" type="select" defaultValue={v.report_cycle}><OptionList values={['Hằng tuần', 'Hằng tháng', 'Theo mốc', 'Theo yêu cầu']} /></Field>
        <Field label="Sản phẩm cần nộp" name="deliverable" defaultValue={v.deliverable} />
        <Field label="Mô tả" name="description" type="textarea" defaultValue={v.description} />
      </>;
      break;
    case 'report': {
      const task = S.tasks.find((x) => x.id === (record ? record.task_id : id));
      content = <>
        {!record && <input type="hidden" name="task_id" value={id} />}
        <div className="span2 panel-soft" style={{ marginBottom: 14 }}><div className="muted tiny">Công việc</div><b>{task?.title}</b></div>
        <Field label="Tiến độ (%)" name="progress" type="number" max={100} defaultValue={record ? v.progress : task?.progress} />
        {!record && <Field label="Trạng thái" name="status" type="select" defaultValue={task?.status}><OptionList values={['Đang thực hiện', 'Chờ duyệt', 'Tạm dừng', 'Hoàn thành']} /></Field>}
        <Field label="Kết quả thực hiện / Báo cáo" name="notes" type="textarea" required defaultValue={v.notes} />
        <Field label="Vấn đề phát sinh" name="blockers" type="textarea" defaultValue={v.blockers} />
        <Field label="Link kết quả" name="result_url" type="url" placeholder="https://..." pattern="https?://.+" title="Link phải bắt đầu bằng http:// hoặc https://" defaultValue={v.result_url} className="span2" />
      </>;
      break;
    }
    case 'budget':
      content = <>
        {project}
        <Field label="Khoản mục" name="category" required defaultValue={v.category} />
        <Field label="Nguồn kinh phí" name="funding_source" defaultValue={v.funding_source} list="b12-funding-sources" placeholder="VD: Ngân sách nhà nước" />
        <datalist id="b12-funding-sources"><OptionList values={['Ngân sách nhà nước', 'Ngân sách đơn vị', 'Tài trợ', 'Hợp tác quốc tế', 'Nguồn khác']} /></datalist>
        <Field label="Năm ngân sách" name="fiscal_year" maxLength={20} defaultValue={v.fiscal_year ?? String(new Date().getFullYear())} />
        <Field label="Dự toán (VND)" name="planned" type="number" defaultValue={v.planned} />
        <Field label="Đã chi (VND)" name="spent" type="number" defaultValue={v.spent} />
        <Field label="Số chứng từ" name="voucher_no" defaultValue={v.voucher_no} />
        <Field label="Ngày chi / thanh toán" name="payment_date" type="date" defaultValue={v.payment_date} />
        <Field label="Người phụ trách" name="handler" defaultValue={v.handler} />
        <Field label="Ghi chú" name="notes" type="textarea" defaultValue={v.notes} />
      </>;
      break;
    case 'contract':
      content = <>
        {project}
        <Field label="Số / mã hợp đồng" name="code" required defaultValue={v.code} />
        <Field label="Loại hợp đồng" name="contract_type" type="select" defaultValue={v.contract_type}><OptionList values={['', 'Mua sắm', 'Dịch vụ', 'Thuê khoán chuyên môn', 'Hợp tác nghiên cứu', 'Khác']} /></Field>
        <Field label="Tên / nội dung hợp đồng" name="title" className="span2" defaultValue={v.title} />
        <Field label="Đối tác" name="partner" required defaultValue={v.partner} />
        <Field label="Người liên hệ (đối tác)" name="contact" placeholder="Họ tên, số điện thoại" defaultValue={v.contact} />
        <Field label="Giá trị (VND)" name="value" type="number" defaultValue={v.value} />
        <Field label="Đã thanh toán (VND)" name="paid" type="number" defaultValue={v.paid} />
        <Field label="Ngày ký" name="signed_date" type="date" defaultValue={v.signed_date} />
        <Field label="Ngày bắt đầu" name="start_date" type="date" defaultValue={v.start_date} />
        <Field label="Ngày kết thúc / đến hạn" name="due_date" type="date" defaultValue={v.due_date} />
        <Field label="Trạng thái" name="status" type="select" defaultValue={v.status}><OptionList values={['Dự thảo', 'Đã ký', 'Đang thực hiện', 'Đã nghiệm thu', 'Đã thanh lý']} /></Field>
        <Field label="Ghi chú" name="notes" type="textarea" defaultValue={v.notes} />
      </>;
      break;
    case 'subject':
      content = <>
        {project}
        <Field label="Mã nghiên cứu (SIM-...)" name="study_code" required defaultValue="SIM-" />
        <Field label="Trung tâm" name="site" />
        <Field label="Nhóm nghiên cứu" name="group_name" />
        <Field label="Trạng thái" name="status" type="select"><OptionList values={['Sàng lọc', 'Đã tuyển', 'Theo dõi', 'Kết thúc']} /></Field>
        <Field label="Tình trạng consent" name="consent_status" type="select"><OptionList values={['Chưa xác nhận', 'Đã xác nhận (giả lập)']} /></Field>
      </>;
      break;
    case 'visit':
      content = <>
        {subject}
        <Field label="Mã lần thăm khám" name="visit_code" required />
        <Field label="Ngày" name="visit_date" type="date" />
        <Field label="Ghi chú" name="note" />
      </>;
      break;
    case 'sample':
      content = <>
        {subject}
        <Field label="Mã mẫu (SIM-...)" name="sample_code" required defaultValue="SIM-" />
        <Field label="Loại mẫu" name="sample_type" required />
        <Field label="Ngày lấy" name="collection_date" type="date" />
        <Field label="Vị trí lưu" name="location" />
        <Field label="Thể tích" name="volume" />
        <Field label="Trạng thái" name="status" type="select"><OptionList values={['Đang lưu', 'Đã chuyển', 'Đã sử dụng', 'Đã hủy']} /></Field>
      </>;
      break;
    case 'observation':
      content = <>
        {subject}
        <Field label="Chỉ số" name="parameter" required />
        <Field label="Giá trị" name="value" required />
        <Field label="Đơn vị" name="unit" />
      </>;
      break;
    case 'document':
      content = <>
        {project}
        <Field label="Tên tài liệu" name="title" required />
        <Field label="Loại" name="category" />
        <Field label="Phiên bản" name="version" />
        <Field label="Trạng thái" name="status" type="select"><OptionList values={['Dự thảo', 'Chờ duyệt', 'Đã duyệt']} /></Field>
        <Field label="Liên kết (nếu có)" name="url" type="url" placeholder="https://..." />
      </>;
      break;
    default:
      content = null;
  }

  return (
    <form onSubmit={submit}>
      <div className="formgrid">{content}</div>
      <FormActions>
        <Btn variant="ghost" size="md" onClick={closeModal}>Huỷ</Btn>
        <Btn variant="primary" size="md" type="submit" disabled={busy}>{busy ? 'Đang lưu…' : record ? 'Lưu thay đổi' : 'Lưu thông tin'}</Btn>
      </FormActions>
    </form>
  );
}

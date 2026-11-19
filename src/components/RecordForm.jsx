import { useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../AppContext.jsx';
import { B12_PROJECT_ROLES } from '../constants.js';
import { Choice, Field, OptionList } from './ui.jsx';

const TITLES = {
  user: 'Thêm nhân sự', project: 'Tạo đề tài mới', membership: 'Phân công thành viên', task: 'Giao công việc',
  report: 'Cập nhật tiến độ / Báo cáo', budget: 'Thêm khoản mục ngân sách', contract: 'Thêm hợp đồng',
  subject: 'Thêm đối tượng giả lập', visit: 'Thêm lần thăm khám', sample: 'Thêm mẫu giả lập',
  observation: 'Kết quả xét nghiệm giả lập', document: 'Tạo mục hồ sơ',
};

// Mở form tạo mới theo loại (giống openForm(kind,id) của bản HTML cũ)
export function useOpenForm() {
  const { showModal } = useApp();
  return (kind, id) => showModal(TITLES[kind], <RecordForm kind={kind} id={id} />);
}

function RecordForm({ kind, id }) {
  const { S, refresh, notify, closeModal } = useApp();
  const [busy, setBusy] = useState(false);

  const projects = S.projects.map((p) => [p.id, p.title]);
  const users = S.users.map((u) => [u.id, u.name]);
  const subjects = S.subjects.map((s) => [s.id, s.study_code]);
  const project = <Choice label="Đề tài" name="project_id" items={projects} required />;
  const subject = <Choice label="Đối tượng giả lập" name="subject_id" items={subjects} required />;

  const submit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    setBusy(true);
    try {
      if (kind === 'project') d.members = [d.lead_id, d.admin_id].filter(Boolean);
      await api(kind, d);
      closeModal();
      await refresh();
      notify('Đã lưu thành công');
    } catch (err) {
      notify('Lỗi: ' + err.message);
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
        <p className="muted tiny span2">Sau khi tạo, chọn “Chỉnh sửa phân quyền” để gắn mã đề tài và vai trò tương ứng.</p>
      </>;
      break;
    case 'project':
      content = <>
        <Field label="Mã đề tài" name="code" required />
        <Field label="Tên đề tài" name="title" required />
        <Field label="Loại nhiệm vụ" name="type" type="select"><OptionList values={['Đề tài', 'Dự án', 'Nhiệm vụ', 'Hợp tác']} /></Field>
        <Choice label="Trưởng nhóm" name="lead_id" items={users} />
        <Choice label="Đầu mối HC–TC" name="admin_id" items={users} />
        <Field label="Nguồn tài trợ" name="funder" />
        <Field label="Ngày bắt đầu" name="start_date" type="date" />
        <Field label="Ngày kết thúc" name="end_date" type="date" />
        <Field label="Mô tả" name="description" type="textarea" />
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
        <Field label="Tên công việc" name="title" required />
        <Field label="Giai đoạn" name="stage" type="select">{S.stages.map((s, i) => <option key={i} value={i + 1}>{i + 1}. {s}</option>)}</Field>
        <Choice label="Người phụ trách" name="owner_id" items={users} />
        <Field label="Ngày bắt đầu" name="start_date" type="date" />
        <Field label="Hạn hoàn thành" name="due_date" type="date" />
        <Field label="Ưu tiên" name="priority" type="select"><OptionList values={['Bình thường', 'Cao', 'Khẩn']} /></Field>
        <Field label="Kỳ báo cáo" name="report_cycle" type="select"><OptionList values={['Hằng tuần', 'Hằng tháng', 'Theo mốc', 'Theo yêu cầu']} /></Field>
        <Field label="Sản phẩm cần nộp" name="deliverable" />
        <Field label="Mô tả" name="description" type="textarea" />
      </>;
      break;
    case 'report': {
      const task = S.tasks.find((x) => x.id === id);
      content = <>
        <input type="hidden" name="task_id" value={id} />
        <p className="span2"><b>{task?.title}</b></p>
        <Field label="Tiến độ (%)" name="progress" type="number" max={100} defaultValue={task?.progress} />
        <Field label="Trạng thái" name="status" type="select" defaultValue={task?.status}><OptionList values={['Đang thực hiện', 'Chờ duyệt', 'Tạm dừng', 'Hoàn thành']} /></Field>
        <Field label="Kết quả thực hiện / Báo cáo" name="notes" type="textarea" required />
        <Field label="Vấn đề phát sinh" name="blockers" type="textarea" />
        <Field label="Link kết quả" name="result_url" type="url" placeholder="https://..." pattern="https?://.+" title="Link phải bắt đầu bằng http:// hoặc https://" />
      </>;
      break;
    }
    case 'budget':
      content = <>
        {project}
        <Field label="Khoản mục" name="category" required />
        <Field label="Dự toán (VND)" name="planned" type="number" />
        <Field label="Đã chi (VND)" name="spent" type="number" />
        <Field label="Ghi chú" name="notes" />
      </>;
      break;
    case 'contract':
      content = <>
        {project}
        <Field label="Mã hợp đồng" name="code" required />
        <Field label="Đối tác" name="partner" required />
        <Field label="Giá trị" name="value" type="number" />
        <Field label="Ngày đến hạn" name="due_date" type="date" />
        <Field label="Trạng thái" name="status" type="select"><OptionList values={['Dự thảo', 'Đã ký', 'Đang thực hiện', 'Đã thanh lý']} /></Field>
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
      <button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu thông tin'}</button>{' '}
      <button type="button" className="secondary" onClick={closeModal}>Đóng</button>
    </form>
  );
}

export const B12_ROLES = {
  director: 'Giám đốc B12', advisor: 'Chuyên gia cố vấn', lead: 'Trưởng nhóm chuyên môn', coordinator: 'Điều phối viên',
  researcher: 'Nhân viên', technician: 'Kỹ thuật viên', finance: 'Trưởng nhóm hành chính',
};
// Mức quyền hệ thống mà mỗi chức vụ được gắn vào
export const ROLE_LEVELS = [
  ['director', 'Giám đốc', 'Toàn quyền: mọi đề tài, nhân sự, phân quyền, nhật ký'],
  ['lead', 'Trưởng nhóm chuyên môn', 'Giao việc, duyệt, đổi giai đoạn trong đề tài được gán'],
  ['coordinator', 'Điều phối viên', 'Giao việc, quản lý tài liệu, gửi báo cáo y sinh trong đề tài được gán'],
  ['finance', 'Hành chính – tài chính', 'Mặc định được cấp quyền xem & sửa ngân sách, hợp đồng trong đề tài được gán (Giám đốc có thể thu hồi)'],
  ['researcher', 'Nhân viên / nghiên cứu viên', 'Báo cáo việc được giao, nhập dữ liệu nghiên cứu'],
  ['technician', 'Kỹ thuật viên', 'Báo cáo việc được giao, nhập mẫu và kết quả xét nghiệm'],
  ['advisor', 'Cố vấn (chỉ xem)', 'Chỉ xem đề tài được gán, không chỉnh sửa'],
];
// Quyền riêng phần Hành chính – Tài chính, do Giám đốc cấp cho từng người
export const FINANCE_ACCESS = [
  ['', 'Không được xem'],
  ['view', 'Chỉ xem'],
  ['edit', 'Xem & chỉnh sửa'],
];
export const financeAccessName = (v) => FINANCE_ACCESS.find(([k]) => k === (v || ''))?.[1] || v;
export const roleLevelName =(r) => ROLE_LEVELS.find(([k]) => k === r)?.[1] || r;
// Tên chức vụ hiển thị của một người
export const positionOf = (u) => u?.position || B12_ROLES[u?.role] || u?.role || '—';
export const B12_PROJECT_ROLES = [
  'Chủ nhiệm đề tài', 'Chuyên gia cố vấn', 'Điều phối chuyên môn', 'Thành viên chính', 'Kỹ thuật viên',
  'Nhân viên hỗ trợ chuyên môn', 'Điều phối hành chính', 'Nhân viên hỗ trợ hành chính',
];
export const PAGE_TITLES = {
  dashboard: 'Tổng quan điều hành', projects: 'Đề tài & dự án', tasks: 'Quản lý công việc', mine: 'Công việc của tôi',
  people: 'Nhân sự & phân quyền', approvals: 'Phê duyệt & kiểm soát', finance: 'Hành chính – Tài chính',
  research: 'Nghiên cứu y sinh', samples: 'Biobank & mẫu bệnh phẩm', documents: 'Hồ sơ & tài liệu', audit: 'Nhật ký hệ thống',
};
export const PAGE_DESCRIPTIONS = {
  dashboard: 'Bức tranh chung về đề tài, công việc và phê duyệt',
  projects: 'Danh mục đề tài, giai đoạn thực hiện và nhân sự tham gia',
  tasks: 'Giao việc, theo dõi tiến độ và báo cáo kết quả',
  mine: 'Các công việc bạn phụ trách hoặc phối hợp',
  people: 'Tài khoản, chức vụ và quyền theo từng đề tài',
  approvals: 'Kết quả công việc đang chờ duyệt và lịch sử quyết định',
  finance: 'Ngân sách theo khoản mục và hợp đồng của đề tài',
  research: 'Báo cáo kết quả, đối tượng, thăm khám và xét nghiệm (giả lập)',
  samples: 'Danh mục mẫu bệnh phẩm mô phỏng',
  documents: 'Hồ sơ, biểu mẫu và liên kết tài liệu của đề tài',
  audit: '100 thao tác gần nhất trên hệ thống',
};
// Menu chia nhóm: [nhóm, [[trang, nhãn, icon], ...]]
export const MENU_GROUPS = [
  ['Điều hành', [['dashboard', 'Tổng quan', 'grid'], ['projects', 'Đề tài', 'folder'], ['tasks', 'Công việc', 'tasks'], ['mine', 'Việc của tôi', 'userCheck'], ['approvals', 'Phê duyệt', 'checkCircle']]],
  ['Nghiên cứu', [['research', 'Nghiên cứu y sinh', 'flask'], ['samples', 'Biobank', 'tube'], ['documents', 'Tài liệu', 'file']]],
  ['Quản trị', [['people', 'Nhân sự', 'users'], ['finance', 'Tài chính', 'wallet'], ['audit', 'Nhật ký', 'history']]],
];

const pad = (n) => String(n).padStart(2, '0');
// Ngày hôm nay theo giờ địa phương (YYYY-MM-DD)
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const money = (v) => (Number(v) || 0).toLocaleString('vi-VN') + ' ₫';
// Hiển thị ngày dạng dd/mm/yyyy
export const dt = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (v || '—');
};
// Ngày giờ (YYYY-MM-DDTHH:MM:SS) -> dd/mm/yyyy HH:MM
export const dtm = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v || '');
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : (v || '—');
};
export const isOverdue = (t) => !!t.due_date && t.due_date < today() && t.status !== 'Hoàn thành';
// Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export const matches = (q, ...fields) => !q || fields.some((f) => norm(f).includes(norm(q)));

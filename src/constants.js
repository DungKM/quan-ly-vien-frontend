export const B12_ROLES = {
  director: 'Giám đốc B12', advisor: 'Chuyên gia cố vấn', lead: 'Trưởng nhóm chuyên môn', coordinator: 'Điều phối viên',
  researcher: 'Nhân viên', technician: 'Kỹ thuật viên', finance: 'Trưởng nhóm hành chính',
};
// Mức quyền hệ thống mà mỗi chức vụ được gắn vào
export const ROLE_LEVELS = [
  ['director', 'Giám đốc', 'Toàn quyền: mọi đề tài, nhân sự, phân quyền, nhật ký'],
  ['lead', 'Trưởng nhóm chuyên môn', 'Giao việc, duyệt, đổi giai đoạn, xem tài chính trong đề tài được gán'],
  ['coordinator', 'Điều phối viên', 'Giao việc, quản lý tài liệu, gửi báo cáo y sinh trong đề tài được gán'],
  ['finance', 'Hành chính – tài chính', 'Thêm ngân sách, hợp đồng trong đề tài được gán'],
  ['researcher', 'Nhân viên / nghiên cứu viên', 'Báo cáo việc được giao, nhập dữ liệu nghiên cứu'],
  ['technician', 'Kỹ thuật viên', 'Báo cáo việc được giao, nhập mẫu và kết quả xét nghiệm'],
  ['advisor', 'Cố vấn (chỉ xem)', 'Chỉ xem đề tài được gán, không chỉnh sửa'],
];
export const roleLevelName = (r) => ROLE_LEVELS.find(([k]) => k === r)?.[1] || r;
// Tên chức vụ hiển thị của một người
export const positionOf = (u) => u?.position || B12_ROLES[u?.role] || u?.role || '—';
export const B12_PROJECT_ROLES = [
  'Chủ nhiệm đề tài', 'Chuyên gia cố vấn', 'Điều phối chuyên môn', 'Thành viên chính', 'Kỹ thuật viên',
  'Nhân viên hỗ trợ chuyên môn', 'Điều phối hành chính', 'Nhân viên hỗ trợ hành chính',
];
export const PAGE_TITLES = {
  dashboard: 'Tổng quan điều hành', projects: 'Đề tài & dự án', tasks: 'Quản lý công việc', mine: 'Công việc của tôi',
  people: 'Nhân sự & phân quyền', approvals: 'Phê duyệt & kiểm soát', finance: 'Tài chính & hợp đồng',
  research: 'Nghiên cứu y sinh', samples: 'Biobank & mẫu bệnh phẩm', documents: 'Hồ sơ & tài liệu', audit: 'Nhật ký hệ thống',
};
export const MENU = [
  ['dashboard', '▦ Tổng quan'], ['projects', '▤ Đề tài'], ['tasks', '✓ Công việc'], ['mine', '☑ Việc của tôi'],
  ['people', '♙ Nhân sự'], ['approvals', '◉ Phê duyệt'], ['finance', '▣ Tài chính'], ['research', '⚕ Nghiên cứu y sinh'],
  ['samples', '⚗ Biobank'], ['documents', '▧ Tài liệu'], ['audit', '◷ Nhật ký'],
];

export const today = () => new Date().toISOString().slice(0, 10);
export const money = (v) => (Number(v) || 0).toLocaleString('vi-VN') + ' ₫';
export const dt = (v) => v || '—';

let CSRF = '';
export const setCsrf = (v) => { CSRF = v || ''; };

// Gửi POST /api/<path> kèm CSRF token; ném lỗi với thông điệp từ máy chủ
export async function api(path, data = {}) {
  const r = await fetch('/api/' + path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-B12-CSRF': CSRF },
    body: JSON.stringify(data),
  });
  let v = {};
  try { v = await r.json(); } catch { /* bỏ qua */ }
  if (!r.ok) throw new Error(v.error || 'Có lỗi (' + r.status + ')');
  return v;
}

export async function getMe() {
  const r = await fetch('/api/me', { credentials: 'same-origin' });
  if (!r.ok) throw new Error('Máy chủ trả lỗi ' + r.status);
  return r.json();
}

// Trả về null khi chưa đăng nhập
export async function getState() {
  const r = await fetch('/api/state', { credentials: 'same-origin' });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error('Không tải được dữ liệu (' + r.status + ')');
  return r.json();
}


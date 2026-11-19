import { createContext, useContext } from 'react';

// S: dữ liệu từ /api/state; refresh(): tải lại; notify(msg); showModal(title, node); closeModal(); can(...roles)
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// Các hàm tra cứu tên theo id
export function lookups(S) {
  return {
    name: (id) => S.users?.find((x) => x.id === Number(id))?.name || '—',
    pname: (id) => S.projects?.find((x) => x.id === Number(id))?.title || '—',
    pcode: (id) => S.projects?.find((x) => x.id === Number(id))?.code || '',
    st: (i) => S.stages?.[i - 1] || '—',
    subjCode: (id) => S.subjects?.find((s) => s.id === id)?.study_code || '—',
  };
}

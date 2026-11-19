import { lookups, useApp } from '../AppContext.jsx';
import { money } from '../constants.js';
import { Btn, Section, SimpleTable, Status } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

export default function Finance() {
  const { S, can } = useApp();
  const openForm = useOpenForm();
  const { pname } = lookups(S);
  const planned = S.budgets.reduce((a, x) => a + Number(x.planned), 0);
  const spent = S.budgets.reduce((a, x) => a + Number(x.spent), 0);
  const editor = can('director', 'finance');
  return (
    <>
      <div className="cards">
        <div className="card"><div className="muted">Tổng dự toán</div><div className="kpi" style={{ fontSize: 23 }}>{money(planned)}</div></div>
        <div className="card"><div className="muted">Đã chi</div><div className="kpi" style={{ fontSize: 23 }}>{money(spent)}</div></div>
        <div className="card"><div className="muted">Còn lại</div><div className="kpi" style={{ fontSize: 23 }}>{money(planned - spent)}</div></div>
        <div className="card"><div className="muted">Hợp đồng</div><div className="kpi">{S.contracts.length}</div></div>
      </div>
      <Section title="Ngân sách theo khoản mục" controls={editor && <Btn onClick={() => openForm('budget')}>+ Thêm khoản mục</Btn>}>
        <SimpleTable cols={['Đề tài', 'Khoản mục', 'Dự toán', 'Đã chi', 'Ghi chú']} rows={S.budgets.map((x) => [pname(x.project_id), x.category, money(x.planned), money(x.spent), x.notes])} />
      </Section>
      <Section title="Hợp đồng" controls={editor && <Btn onClick={() => openForm('contract')}>+ Thêm hợp đồng</Btn>}>
        <SimpleTable cols={['Mã', 'Đối tác', 'Đề tài', 'Giá trị', 'Trạng thái']} rows={S.contracts.map((x) => [x.code, x.partner, pname(x.project_id), money(x.value), <Status s={x.status} />])} />
      </Section>
    </>
  );
}

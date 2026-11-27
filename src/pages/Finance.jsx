import { useState } from 'react';
import { api } from '../api.js';
import { lookups, useApp } from '../AppContext.jsx';
import { dt, matches, money } from '../constants.js';
import { Banner, Bar, Btn, EmptyState, IconBtn, SearchBox, Section, SimpleTable, StatCard, Status, Tabs, Tag, Toolbar } from '../components/ui.jsx';
import { useOpenForm } from '../components/RecordForm.jsx';

export default function Finance() {
  const { S, refresh, notify, confirm } = useApp();
  const openForm = useOpenForm();
  const { pcode, pname } = lookups(S);
  const [tab, setTab] = useState('budget');
  const [q, setQ] = useState('');
  const [fProject, setFProject] = useState('');
  // Phần Hành chính – Tài chính chỉ dành cho người được Giám đốc cấp quyền riêng
  if (!S.finance_level) {
    return <Section><EmptyState icon="shield" title="Bạn chưa được cấp quyền xem Hành chính – Tài chính">Liên hệ Giám đốc để được cấp quyền.</EmptyState></Section>;
  }
  const editor = S.finance_level === 'edit';
  const planned = S.budgets.reduce((a, x) => a + Number(x.planned), 0);
  const spent = S.budgets.reduce((a, x) => a + Number(x.spent), 0);
  const contractValue = S.contracts.reduce((a, x) => a + Number(x.value || 0), 0);
  const contractPaid = S.contracts.reduce((a, x) => a + Number(x.paid || 0), 0);
  const byProject = (x) => !fProject || x.project_id === Number(fProject);
  const budgets = S.budgets.filter((x) => byProject(x) && matches(q, x.category, x.funding_source, x.voucher_no, x.handler, x.notes, pcode(x.project_id)));
  const contracts = S.contracts.filter((x) => byProject(x) && matches(q, x.code, x.title, x.partner, x.contact, x.contract_type, pcode(x.project_id)));

  const remove = async (kind, x, label) => {
    if (!(await confirm(`Xoá ${label}?`, { title: 'Xác nhận xoá', okText: 'Xoá', danger: true }))) return;
    try {
      await api('finance-delete', { kind, id: x.id });
      await refresh();
      notify('Đã xoá', 'success');
    } catch (err) { notify(err.message, 'error'); }
  };
  const actions = (kind, x, label) => (
    <div className="row-actions">
      <IconBtn icon="edit" variant="primary" title="Sửa" onClick={() => openForm(kind, null, x)} />
      <IconBtn icon="trash" variant="danger" title="Xoá" onClick={() => remove(kind, x, label)} />
    </div>
  );
  const pct = (a, b) => (b ? (a / b) * 100 : 0);

  const budgetCols = ['Khoản mục', 'Nguồn KP · Năm', 'Dự toán', 'Đã chi', 'Tỷ lệ', 'Chứng từ', 'Phụ trách'];
  const contractCols = ['Hợp đồng', 'Đối tác', 'Giá trị', 'Thanh toán', 'Thời hạn', 'Trạng thái'];
  return (
    <>
      <div className="stats">
        <StatCard label="Tổng dự toán" value={money(planned)} icon="wallet" tone="blue" />
        <StatCard label="Đã chi" value={money(spent)} hint={`${Math.round(pct(spent, planned))}% dự toán`} icon="trending" tone={spent > planned ? 'bad' : 'teal'} />
        <StatCard label="Còn lại" value={money(planned - spent)} icon="layers" tone={planned - spent < 0 ? 'bad' : 'ok'} />
        <StatCard label={`Hợp đồng (${S.contracts.length}) · đã thanh toán`} value={money(contractPaid)} hint={`trên tổng ${money(contractValue)}`} icon="file" tone="violet" />
      </div>
      {!editor && <Banner tone="info" icon="eye">Bạn đang ở chế độ <b>chỉ xem</b>.</Banner>}
      <Section flush
        controls={editor && (tab === 'budget'
          ? <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('budget')}>Thêm khoản mục</Btn>
          : <Btn variant="primary" size="md" icon="plus" onClick={() => openForm('contract')}>Thêm hợp đồng</Btn>)}
        title={tab === 'budget' ? 'Ngân sách theo khoản mục' : 'Hợp đồng'}
      >
        <Tabs tabs={[['budget', 'Ngân sách', S.budgets.length], ['contract', 'Hợp đồng', S.contracts.length]]} value={tab} onChange={setTab} />
        <Toolbar>
          <SearchBox value={q} onChange={setQ} placeholder={tab === 'budget' ? 'Tìm khoản mục, chứng từ, nguồn kinh phí…' : 'Tìm số hợp đồng, đối tác, nội dung…'} />
          <select value={fProject} onChange={(e) => setFProject(e.target.value)}>
            <option value="">Tất cả đề tài</option>
            {S.projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </Toolbar>
        {tab === 'budget' ? (
          <SimpleTable
            emptyIcon="wallet" empty="Chưa có khoản mục ngân sách"
            cols={editor ? [...budgetCols, ''] : budgetCols}
            rows={budgets.map((x) => {
              const row = [
                <div style={{ minWidth: 160 }}><div className="cell-title">{x.category}</div><div className="cell-sub"><span className="code" style={{ fontSize: 11 }}>{pcode(x.project_id)}</span>{x.notes ? ' · ' + x.notes : ''}</div></div>,
                <>{x.funding_source || '—'}<div className="cell-sub">{x.fiscal_year}</div></>,
                <span className="mono nowrap">{money(x.planned)}</span>,
                <span className="mono nowrap">{money(x.spent)}</span>,
                <div style={{ minWidth: 110 }}><div className="tiny muted" style={{ marginBottom: 4 }}>{Math.round(pct(x.spent, x.planned))}% · còn {money(x.planned - x.spent)}</div><Bar pct={pct(x.spent, x.planned)} tone={x.spent > x.planned ? 'bad' : 'blue'} /></div>,
                <>{x.voucher_no || '—'}<div className="cell-sub">{x.payment_date ? dt(x.payment_date) : ''}</div></>,
                x.handler || <span className="muted">—</span>,
              ];
              return editor ? [...row, actions('budget', x, `khoản mục "${x.category}"`)] : row;
            })}
          />
        ) : (
          <SimpleTable
            emptyIcon="file" empty="Chưa có hợp đồng"
            cols={editor ? [...contractCols, ''] : contractCols}
            rows={contracts.map((x) => {
              const row = [
                <div style={{ minWidth: 180 }}>
                  <div className="flex" style={{ gap: 6 }}><span className="cell-title">{x.code}</span>{x.contract_type && <Tag>{x.contract_type}</Tag>}</div>
                  <div className="cell-sub">{x.title || pname(x.project_id)}</div>
                  <div className="cell-sub"><span className="code" style={{ fontSize: 11 }}>{pcode(x.project_id)}</span>{x.signed_date ? ' · ký ' + dt(x.signed_date) : ''}</div>
                </div>,
                <>{x.partner}<div className="cell-sub">{x.contact}</div></>,
                <span className="mono nowrap">{money(x.value)}</span>,
                <div style={{ minWidth: 120 }}><div className="tiny muted" style={{ marginBottom: 4 }}>{money(x.paid)}</div><Bar pct={pct(x.paid, x.value)} tone="ok" /></div>,
                <span className="nowrap">{dt(x.start_date)} → {dt(x.due_date)}</span>,
                <Status s={x.status} />,
              ];
              return editor ? [...row, actions('contract', x, `hợp đồng "${x.code}"`)] : row;
            })}
          />
        )}
      </Section>
    </>
  );
}

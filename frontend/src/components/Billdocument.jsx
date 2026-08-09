const fmtMoney = (n) => Math.round(n || 0).toLocaleString("en-US");
const fmtRate = (n) => (n || 0).toFixed(3);
const fmtDMY = (iso) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function InfoRow({ bill }) {
  const cells = [
    ["Reference #", bill.consumer.referenceNo],
    ["Connection Date", fmtDMY(bill.consumer.connectionDate)],
    ["Bill Month", bill.billMonthDisplay],
    ["Reading Date", bill.dates ? fmtDMY(bill.dates.rdgDate) : "-"],
    ["Issue Date", bill.dates ? fmtDMY(bill.dates.issDate) : "-"],
    ["Due Date", bill.dates ? fmtDMY(bill.dates.dueDate) : "-"],
  ];
  return (
    <div className="bill-info-row">
      {cells.map(([label, value]) => (
        <div className="bill-info-cell" key={label}>
          <span className="bill-info-cell__label">{label}</span>
          <span className={`bill-info-cell__value ${label === "Bill Month" ? "bill-info-cell__value--strong" : ""}`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function MeterRow({ bill }) {
  return (
    <div className="bill-meter-row">
      Meter Details&nbsp;&nbsp;<strong>{bill.meter.meterNumber}</strong> — {bill.meter.phase} — {bill.meter.residential}
      &nbsp;&nbsp;{bill.meter.sizePlot}
    </div>
  );
}

function BillHeader({ bill }) {
  return (
    <div className="bill-header">
      <div className="bill-header__brand">
        <img src="/logo.png" alt="Society logo" className="bill-header__seal" />
        <div>
          <div className="bill-header__society">THE CO-OPERATIVE ENGINEERS</div>
          <div className="bill-header__society">TOWN SOCIETY LTD., Lahore</div>
          <div className="bill-header__tagline">U T I L I T Y &nbsp; B I L L S</div>
          <div className="bill-header__email">Email: engineerstown@yahoo.com</div>
        </div>
      </div>
      <div className="bill-header__online">
        <div className="bill-header__online-title">Online Payment Process</div>
        <div>1 Bill Invoices &amp; Voucher</div>
        <div className="bill-header__online-code">1003000943121300320</div>
      </div>
      <div className="bill-header__staff">
        {bill.staffPhones.map((sp) => (
          <div key={sp.staffName}>{sp.staffName}: {sp.phoneNumber}</div>
        ))}
      </div>
    </div>
  );
}

function HistoryTable({ history }) {
  const rows = [...history];
  while (rows.length < 12) rows.push(null);

  return (
    <table className="bill-history">
      <caption>Bills Issue &amp; Payment Details</caption>
      <thead>
        <tr>
          <th>Year &amp; Month</th>
          <th>Units</th>
          <th>Bill Amount</th>
          <th>Payment Date</th>
          <th>Payment Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((h, i) => (
          <tr key={i}>
            <td>{h?.monthDisplay || ""}</td>
            <td>{h?.units ?? ""}</td>
            <td>{h ? fmtMoney(h.totBillAmnt) : ""}</td>
            <td>{h ? fmtDMY(h.paymentDate) : ""}</td>
            <td>{h && h.paymentAmnt != null ? fmtMoney(h.paymentAmnt) : h ? "-" : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChargesTable({ bill, consumer }) {
  const { master, soctyRows, omRate } = bill;
  const hasUnits = master.units > 0;
  const showZero = master.units === 0 && consumer.state === "D";

  return (
    <table className="bill-charges">
      <thead>
        <tr>
          <th></th><th>Previous</th><th>Present</th><th>Units</th><th>Rate</th><th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="bill-charges__label">Electricity</td>
          <td>{master.prevRdg}</td>
          <td>{master.currRdg}</td>
          <td>{master.units}</td>
          <td>{fmtRate(master.unitRate)}</td>
          <td className="bill-charges__amt">{fmtMoney(master.elctyAmnt)}</td>
        </tr>
        {soctyRows.map((s) => (
          <tr key={s.description}>
            <td className="bill-charges__label" colSpan={4}>{s.description}</td>
            <td></td>
            <td className="bill-charges__amt">{showZero ? "0" : fmtMoney(s.amount)}</td>
          </tr>
        ))}
        <tr className="bill-charges__total">
          <td className="bill-charges__label" colSpan={4}>Total Society Charges</td>
          <td></td>
          <td className="bill-charges__amt">{showZero ? "0" : fmtMoney(master.soctyChgs)}</td>
        </tr>
        <tr>
          <td className="bill-charges__label" colSpan={4}>Arrears</td>
          <td></td>
          <td className="bill-charges__amt">{fmtMoney(master.arrears)}</td>
        </tr>
        <tr>
          <td className="bill-charges__label">O &amp; M</td>
          <td></td><td></td>
          <td>{master.units}</td>
          <td>{hasUnits ? fmtRate(omRate) : "0"}</td>
          <td className="bill-charges__amt">{hasUnits ? fmtMoney(master.omChgs) : "0"}</td>
        </tr>
      </tbody>
    </table>
  );
}


function PaymentSummary({ master }) {
  return (
    <div className="bill-summary">
      <div className="bill-summary__row bill-summary__row--highlight">
        <span>Payable within Due Date</span>
        <strong>{fmtMoney(master.totBillAmnt)}</strong>
      </div>
      <div className="bill-summary__row">
        <span>LP Surcharge</span>
        <span>{fmtMoney(master.lpSrchg)}</span>
      </div>
      <div className="bill-summary__row bill-summary__row--highlight">
        <span>Payable after Due Date</span>
        <strong>{fmtMoney(master.billAmntAfterDueDt)}</strong>
      </div>
    </div>
  );
}

function BillMain({ bill }) {
  return (
    <div className="bill-block">
      <BillHeader bill={bill} />
      <InfoRow bill={bill} />
      <MeterRow bill={bill} />
      <div className="bill-body">
        <div className="bill-body__left">
          <div className="bill-consumer">
            <div className="bill-consumer__name">{bill.consumer.name.toUpperCase()}</div>
            <div className="bill-consumer__cnic">C N I C</div>
            <div className="bill-consumer__address">{bill.consumer.address}</div>
          </div>
          <HistoryTable history={bill.history} />
        </div>
        <div className="bill-body__right">
          <ChargesTable bill={bill} consumer={bill.consumer} />
          <PaymentSummary master={bill.master} />
          <div className="bill-signatures">
            <span>Bank Cashier</span>
            <span>Officer</span>
          </div>
        </div>
      </div>
      <div className="bill-footer">
        <div>
          {bill.banks.length > 0 && (
            <div className="bill-footer__banks">
              {bill.banks.map((b) => (
                <div className="bill-footer__bank" key={b.bankName}>
                  <strong>{b.bankName}</strong>
                  <span>A/c # {b.accountNo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillDocument({ bill }) {
  return (
    <div className="bill-page">
      <BillMain bill={bill} />
      <div className="bill-ad-strip">
        <img src="/ad.jpg" alt="Advertisement" className="bill-ad-strip__img" />
      </div>
      <BillBankCopy bill={bill} />
    </div>
  );
}

function BillBankCopy({ bill }) {
  return (
    <div className="bill-block bill-block--bank-copy">
      <div className="bill-bankcopy__header">
        <img src="/logo.png" alt="Society logo" className="bill-header__seal bill-header__seal--sm" />
        <div>
          <div className="bill-header__society">THE CO-OPERATIVE ENGINEERS TOWN SOCIETY LTD., Lahore</div>
          <div className="bill-header__tagline">U T I L I T Y &nbsp; B I L L S</div>
        </div>
        <div className="bill-bankcopy__tag">BANK Copy</div>
      </div>
      <InfoRow bill={bill} />
      <MeterRow bill={bill} />
      <div className="bill-footer__amount-words">{bill.amountInWords}</div>
      <div className="bill-body">
        <div className="bill-body__left">
          <div className="bill-consumer">
            <div className="bill-consumer__name">{bill.consumer.name.toUpperCase()}</div>
            <div className="bill-consumer__address">{bill.consumer.address}</div>
          </div>
          {bill.banks.length > 0 && (
            <div className="bill-footer__banks">
              {bill.banks.map((b) => (
                <div className="bill-footer__bank" key={b.bankName}>
                  <strong>{b.bankName}</strong>
                  <span>A/c # {b.accountNo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bill-body__right">
          <PaymentSummary master={bill.master} />
          <div className="bill-signatures">
            <span>Bank Cashier</span>
            <span>Officer</span>
          </div>
        </div>
      </div>
    </div>
  );
}




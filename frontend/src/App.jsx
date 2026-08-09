import { BrowserRouter, Routes, Route, useLocation  } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import Welcome from "./pages/Welcome.jsx";
import SignUp from "./pages/SignUp.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import MainMenu from "./pages/Mainmenu.jsx";
import ConsumerMenu from "./pages/Consumermenu.jsx";
import SocietyCharges from "./pages/SocietyCharges.jsx";
import StaffPhoneNumbers from "./pages/Staffphonenumbers.jsx";
import BillingSchedule from "./pages/Billingschedule.jsx";
import BillProcessMenu from "./pages/Billprocessmenu.jsx";
import BillGenerate from "./pages/Billgenerate.jsx";
import BillPreview from "./pages/Billpreview.jsx";
import BankInformation from "./pages/Bankinformation.jsx";
import ConfigInformation from "./pages/Configinformation.jsx";
import ConsumerAdd from "./pages/ConsumerAdd.jsx";
import ConsumerUpdate from "./pages/ConsumerUpdate.jsx";
import ConsumerDisplay from "./pages/ConsumerDisplay.jsx";
import PaymentEntry from "./pages/Paymententry.jsx";
import ReadingEntry from "./pages/Readingentry.jsx";

//<Route element={<AppShell />}>
//</Route>

//<div className="page">
//</div>
const PAGE_TITLES = {
  "/": "",
  "/signup": "Create Account",
  "/login": "Member Access",
  "/forgot-password": "Account Recovery",
  "/menu": "Main Menu",
  "/menu/consumers": "Consumer Information",
  "/menu/consumers/add": "Add New Consumer",
  "/menu/consumers/update": "Update Consumer Record",
  "/menu/consumers/browse": "Display Consumer Record",
  "/menu/charges": "Society Charges",
  "/menu/staff": "Staff Phone Numbers",
  "/menu/dates": "Billing Schedule",
  "/menu/bills": "Bills Processing",
  "/menu/bills/generate": "Bill Generation",
  "/menu/bills/preview": "Bill Preview",
  "/menu/bills/payment-entry": "Payment Entry",
  "/menu/bills/reading-entry": "Meter Reading Entry",
  "/menu/bank": "Bank Information",
  "/menu/config": "Config Information",
};


function Shell({ children }) {
  const { pathname } = useLocation();
  return <AppShell subtitle={PAGE_TITLES[pathname] ?? ""}>{children}</AppShell>;
}



export default function App() {
  return (
    <BrowserRouter>
     <Shell>
      
        <Routes>
          {/* ── Auth screens: no shared chrome, use AuthShell instead ── */}
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
         
          {/* ── Everything else: wrapped in AppShell for shared header ── */}
          
            <Route path="/menu" element={<RequireAuth><Shell><MainMenu /></Shell></RequireAuth>} />
        <Route path="/menu/consumers" element={<RequireAuth><Shell><ConsumerMenu /></Shell></RequireAuth>} />
        <Route path="/menu/consumers/add" element={<RequireAuth><Shell><ConsumerAdd /></Shell></RequireAuth>} />
        <Route path="/menu/consumers/update" element={<RequireAuth><Shell><ConsumerUpdate /></Shell></RequireAuth>} />
        <Route path="/menu/consumers/browse" element={<RequireAuth><Shell><ConsumerDisplay /></Shell></RequireAuth>} />
        <Route path="/menu/charges" element={<RequireAuth><Shell><SocietyCharges /></Shell></RequireAuth>} />
        <Route path="/menu/staff" element={<RequireAuth><Shell><StaffPhoneNumbers /></Shell></RequireAuth>} />
        <Route path="/menu/dates" element={<RequireAuth><Shell><BillingSchedule /></Shell></RequireAuth>} />
        <Route path="/menu/bills" element={<RequireAuth><Shell><BillProcessMenu /></Shell></RequireAuth>} />
        <Route path="/menu/bills/generate" element={<RequireAuth><Shell><BillGenerate /></Shell></RequireAuth>} />
        <Route path="/menu/bills/preview" element={<RequireAuth><Shell><BillPreview /></Shell></RequireAuth>} />
        <Route path="/menu/bills/payment-entry" element={<RequireAuth><Shell><PaymentEntry /></Shell></RequireAuth>} />
        <Route path="/menu/bills/reading-entry" element={<RequireAuth><Shell><ReadingEntry /></Shell></RequireAuth>} />
        <Route path="/menu/bank" element={<RequireAuth><Shell><BankInformation /></Shell></RequireAuth>} />
        <Route path="/menu/config" element={<RequireAuth><Shell><ConfigInformation /></Shell></RequireAuth>} />
   
          
        </Routes>
      
      </Shell>
    </BrowserRouter>
  );
}
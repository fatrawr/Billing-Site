import { BrowserRouter, Routes, Route, useLocation,  } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
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
import ReadingEntry from "./pages/ReadingEntry.jsx";

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
          <Route path="signup" element={<SignUp />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
         
          {/* ── Everything else: wrapped in AppShell for shared header ── */}
          
            <Route path="menu" element={<RequireAuth><MainMenu /></RequireAuth>} />
        <Route path="menu/consumers" element={<RequireAuth><ConsumerMenu /></RequireAuth>} />
        <Route path="menu/consumers/add" element={<RequireAuth><ConsumerAdd /></RequireAuth>} />
        <Route path="menu/consumers/update" element={<RequireAuth><ConsumerUpdate /></RequireAuth>} />
        <Route path="menu/consumers/browse" element={<RequireAuth><ConsumerDisplay /></RequireAuth>} />
        <Route path="menu/charges" element={<RequireAuth><SocietyCharges /></RequireAuth>} />
        <Route path="menu/staff" element={<RequireAuth><StaffPhoneNumbers /></RequireAuth>} />
        <Route path="menu/dates" element={<RequireAuth><BillingSchedule /></RequireAuth>} />
        <Route path="menu/bills" element={<RequireAuth><BillProcessMenu /></RequireAuth>} />
        <Route path="menu/bills/generate" element={<RequireAuth><BillGenerate /></RequireAuth>} />
        <Route path="menu/bills/preview" element={<RequireAuth><BillPreview /></RequireAuth>} />
        <Route path="menu/bills/payment-entry" element={<RequireAuth><PaymentEntry /></RequireAuth>} />
        <Route path="menu/bills/reading-entry" element={<RequireAuth><ReadingEntry /></RequireAuth>} />
        <Route path="menu/bank" element={<RequireAuth><BankInformation /></RequireAuth>} />
        <Route path="menu/config" element={<RequireAuth><ConfigInformation /></RequireAuth>} />
   
          
        </Routes>
      
      </Shell>
    </BrowserRouter>
  );
}

    // <BrowserRouter>
    //   <div className="page">
    //     <Routes>
    //       <Route path="/" element={<Welcome />} />
    //       <Route path="/signup" element={<SignUp />} />
    //       <Route path="/login" element={<Login />} />
    //       <Route path="/forgot-password" element={<ForgotPassword />} />
    //       <Route path="/menu" element={<MainMenu />} />
    //       <Route path="/menu/consumers" element={<ConsumerMenu />} />
    //       <Route path="/menu/consumers/add" element={<ConsumerAdd />} />
    //       <Route path="/menu/consumers/update" element={<ConsumerUpdate />} />
    //       <Route path="/menu/consumers/browse" element={<ConsumerDisplay />} />
    //       <Route path="/menu/charges" element={<SocietyCharges />} />
    //       <Route path="/menu/staff" element={<StaffPhoneNumbers />} />
    //       <Route path="/menu/dates" element={<BillingSchedule />} />
    //       <Route path="/menu/bills" element={<BillProcessMenu />} />
    //       <Route path="/menu/bills/generate" element={<BillGenerate />} />
    //       <Route path="/menu/bills/preview" element={<BillPreview />} />
    //       <Route path="/menu/bills/payment-entry" element={<PaymentEntry />} />
    //       <Route path="/menu/bills/reading-entry" element={<ReadingEntry />} />
    //       <Route path="/menu/bank" element={<BankInformation />} />
    //       <Route path="/menu/config" element={<ConfigInformation />} />
    //     </Routes>
    //   </div>
    // </BrowserRouter>

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
import ReadingEntry from "./pages/ReadingEntry.jsx";

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
          
            <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/menu/consumers" element={<ConsumerMenu />} />
          <Route path="/menu/consumers/add" element={<ConsumerAdd />} />
          <Route path="/menu/consumers/update" element={<ConsumerUpdate />} />
          <Route path="/menu/consumers/browse" element={<ConsumerDisplay />} />
          <Route path="/menu/charges" element={<SocietyCharges />} />
          <Route path="/menu/staff" element={<StaffPhoneNumbers />} />
          <Route path="/menu/dates" element={<BillingSchedule />} />
          <Route path="/menu/bills" element={<BillProcessMenu />} />
          <Route path="/menu/bills/generate" element={<BillGenerate />} />
          <Route path="/menu/bills/preview" element={<BillPreview />} />
          <Route path="/menu/bills/payment-entry" element={<PaymentEntry />} />
          <Route path="/menu/bills/reading-entry" element={<ReadingEntry />} />
          <Route path="/menu/bank" element={<BankInformation />} />
          <Route path="/menu/config" element={<ConfigInformation />} />
   
          
        </Routes>
      
      </Shell>
    </BrowserRouter>
  );
}


// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Welcome from "./pages/Welcome.jsx";
// import SignUp from "./pages/SignUp.jsx";
// import Login from "./pages/Login.jsx";
// import ForgotPassword from "./pages/ForgotPassword.jsx";
// import MainMenu from "./pages/MainMenu.jsx";
// import ConsumerMenu from "./pages/ConsumerMenu.jsx";
// import SocietyCharges from "./pages/SocietyCharges.jsx";
// import StaffPhoneNumbers from "./pages/StaffPhoneNumbers.jsx";
// import BillingSchedule from "./pages/BillingSchedule.jsx";
// import BillProcessMenu from "./pages/BillProcessMenu.jsx";
// import BillGenerate from "./pages/BillGenerate.jsx";
// import BillPreview from "./pages/BillPreview.jsx";
// import BankInformation from "./pages/BankInformation.jsx";
// import ConfigInformation from "./pages/ConfigInformation.jsx";
// import ConsumerAdd from "./pages/ConsumerAdd.jsx";
// import ConsumerUpdate from "./pages/ConsumerUpdate.jsx";
// import ConsumerDisplay from "./pages/ConsumerDisplay.jsx";
// import PaymentEntry from "./pages/PaymentEntry.jsx";
// import ReadingEntry from "./pages/ReadingEntry.jsx";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <div className="page">
//         <Routes>
//           <Route path="/" element={<Welcome />} />
//           <Route path="/signup" element={<SignUp />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/forgot-password" element={<ForgotPassword />} />
//           <Route path="/menu" element={<MainMenu />} />
//           <Route path="/menu/consumers" element={<ConsumerMenu />} />
//           <Route path="/menu/consumers/add" element={<ConsumerAdd />} />
//           <Route path="/menu/consumers/update" element={<ConsumerUpdate />} />
//           <Route path="/menu/consumers/browse" element={<ConsumerDisplay />} />
//           <Route path="/menu/charges" element={<SocietyCharges />} />
//           <Route path="/menu/staff" element={<StaffPhoneNumbers />} />
//           <Route path="/menu/dates" element={<BillingSchedule />} />
//           <Route path="/menu/bills" element={<BillProcessMenu />} />
//           <Route path="/menu/bills/generate" element={<BillGenerate />} />
//           <Route path="/menu/bills/preview" element={<BillPreview />} />
//           <Route path="/menu/bills/payment-entry" element={<PaymentEntry />} />
//           <Route path="/menu/bills/reading-entry" element={<ReadingEntry />} />
//           <Route path="/menu/bank" element={<BankInformation />} />
//           <Route path="/menu/config" element={<ConfigInformation />} />
//         </Routes>
//       </div>
//     </BrowserRouter>
//   );
// }
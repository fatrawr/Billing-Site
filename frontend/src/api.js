const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";


async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // sends/receives the Flask session cookie
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}

export const api = {
  signup: (payload) => request("/signup", { method: "POST", body: payload }),
  login: (payload) => request("/login", { method: "POST", body: payload }),
  forgotPassword: (payload) =>
    request("/forgot-password", { method: "POST", body: payload }),
  logout: () => request("/logout", { method: "POST" }),
  me: () => request("/me"),

  getCharges: () => request("/charges"),
  addCharge: (payload) => request("/charges", { method: "POST", body: payload }),
  updateCharge: (payload) => request("/charges", { method: "PUT", body: payload }),
  deleteCharge: (payload) => request("/charges", { method: "DELETE", body: payload }),

  getStaff: () => request("/staff"),
  addStaff: (payload) => request("/staff", { method: "POST", body: payload }),
  updateStaff: (payload) => request("/staff", { method: "PUT", body: payload }),
  deleteStaff: (payload) => request("/staff", { method: "DELETE", body: payload }),

  getDates: () => request("/dates"),
  addDate: (payload) => request("/dates", { method: "POST", body: payload }),
  updateDate: (payload) => request("/dates", { method: "PUT", body: payload }),

  previewBills: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/bills/preview?${qs}`);
  },
  resetPayments: () => request("/payments/reset", { method: "POST" }),
  resetReadings: () => request("/readings/reset", { method: "POST" }),
  postPayments: () => request("/payments/post", { method: "POST" }),
  postReadings: () => request("/readings/post", { method: "POST" }),
  getReadingEntry: (ref, month) => request(`/readings/entry/${ref}?month=${month}`),
saveReadingEntry: (ref, payload) => request(`/readings/entry/${ref}`, { method: "PUT", body: payload }),

  getBanks: () => request("/bank"),
  addBank: (payload) => request("/bank", { method: "POST", body: payload }),
  updateBank: (payload) => request("/bank", { method: "PUT", body: payload }),
  deleteBank: (payload) => request("/bank", { method: "DELETE", body: payload }),

  getConfigs: () => request("/config"),
  addConfig: (payload) => request("/config", { method: "POST", body: payload }),
  updateConfig: (payload) => request("/config", { method: "PUT", body: payload }),
  deleteConfig: (payload) => request("/config", { method: "DELETE", body: payload }),
  getLatestConfig: () => request("/config/latest"),
addNextMonthConfig: () => request("/config/next-month", { method: "POST" }),
updateConfigValue: (payload) => request("/config/value", { method: "PUT", body: payload }),
getConfigForMonth: (month) => request(`/config/month/${month}`),
bulkSaveConfig: (payload) => request("/config/bulk-save", { method: "POST", body: payload }),

  addConsumer: (payload) => request("/consumers", { method: "POST", body: payload }),
  getConsumer: (refNo) => request(`/consumers/${refNo}`),
  getConsumerDisplay: (refNo) => request(`/consumers/${refNo}/display`),
  updateConsumer: (refNo, payload) => request(`/consumers/${refNo}`, { method: "PUT", body: payload }),
  addMeter: (refNo, payload) => request(`/consumers/${refNo}/meters`, { method: "POST", body: payload }),
  updateMeter: (refNo, meterId, payload) =>
    request(`/consumers/${refNo}/meters/${meterId}`, { method: "PUT", body: payload }),

  getPaymentEntryInit: () => request("/payments/entry/init"),
  getPaymentEntry: (ref) => request(`/payments/entry/${ref}`),
  savePaymentEntry: (ref, payload) => request(`/payments/entry/${ref}`, { method: "PUT", body: payload }),

  getReadingEntryInit: () => request("/readings/entry/init"),
  getReadingEntry: (ref) => request(`/readings/entry/${ref}`),
  saveReadingEntry: (ref, payload) => request(`/readings/entry/${ref}`, { method: "PUT", body: payload }),
};
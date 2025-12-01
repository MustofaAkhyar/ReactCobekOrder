// Simpan di sessionStorage agar hilang saat tab ditutup
const KEY = "orderHistory";

function readSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSession(list) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list || []));
  } catch {}
}

// (opsional) migrasi sekali dari localStorage -> sessionStorage
(function migrateOnce() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw && !sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, raw);
    }
    localStorage.removeItem(KEY);
  } catch {}
})();

export function getHistory() {
  return readSession();
}

export function addOrderHistory(order) {
  const list = readSession();
  // hindari duplikasi id
  const exists = list.find((x) => x.id === order.id);
  const next = exists
    ? list.map((x) => (x.id === order.id ? { ...x, ...order } : x))
    : [{ ...order }, ...list];
  writeSession(next);
}

export function updateOrderStatus(orderId, status) {
  const list = readSession();
  const next = list.map((x) => (x.id === orderId ? { ...x, status } : x));
  writeSession(next);
}

export function clearHistory() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

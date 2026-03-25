window.Vaultify = (() => {
  const TOKEN_KEY = "vaultifyToken";
  const USER_KEY = "vaultifyUser";

  const STATUS_LABELS = {
    active: "Safe",
    "expiring-soon": "Expiring Soon",
    expired: "Expired",
    "no-expiry": "No Expiry"
  };

  const STATUS_CHIP_CLASS = {
    active: "chip-active",
    "expiring-soon": "chip-expiring",
    expired: "chip-expired",
    "no-expiry": "chip-no-expiry"
  };

  const CATEGORY_ICONS = {
    "ID Proof": "badge",
    "Education": "school",
    "Finance": "account_balance",
    "Medical": "medical_information",
    "Professional": "work",
    "Personal": "person"
  };

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); }
    catch (_) { return null; }
  }

  const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
  const getUser  = () => readJson(USER_KEY);
  const setStoredUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const setSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    setStoredUser(user);
  };

  function showMessage(message, type = "success") {
    const el = document.getElementById("globalMessage");
    if (!el) return;

    el.textContent = message;
    el.className = `toast ${type}`;
    el.classList.remove("hidden");

    window.clearTimeout(showMessage._tid);
    showMessage._tid = window.setTimeout(() => el.classList.add("hidden"), 3500);
  }

  function formatSize(size, emptyLabel = "0 MB") {
    if (!size) return emptyLabel;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateString) {
    if (!dateString) return "No expiry date";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric"
    });
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return "Just now";
    const diffMin = Math.max(Math.round((Date.now() - new Date(dateString).getTime()) / 60000), 0);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.round(diffH / 24);
    return diffD < 7 ? `${diffD}d ago` : formatDate(dateString);
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function getStatusLabel(status) { return STATUS_LABELS[status] || "Unknown"; }
  function getStatusChipClass(status) { return STATUS_CHIP_CLASS[status] || "chip-no-expiry"; }
  function getCategoryIcon(category) { return CATEGORY_ICONS[category] || "folder"; }

  function redirectIfAuthenticated(path = "/dashboard.html") {
    if (!getToken()) return false;
    window.location.href = path;
    return true;
  }

  function requireAuth(path = "/") {
    if (getToken()) return true;
    window.location.href = path;
    return false;
  }

  async function apiFetch(url, options = {}) {
    const { responseType = "json", ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers || {});
    const token = getToken();

    if (token) headers.set("Authorization", `Bearer ${token}`);

    let body = fetchOptions.body;
    if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    const response = await fetch(url, { ...fetchOptions, headers, body });

    if (response.status === 401 && token) {
      clearSession();
      window.location.href = "/";
      throw new Error("Authentication required.");
    }

    if (responseType === "blob") {
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Request failed.");
      }
      return response.blob();
    }

    const ct = response.headers.get("content-type") || "";
    const payload = ct.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) throw new Error(payload.message || "Request failed.");
    return payload;
  }

  function getInitials(name = "") {
    return name.split(" ").map(p => p.trim()[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  }

  const setText = (el, val) => el && (el.textContent = val);

  function attachScrollButtons(selector = "[data-scroll-target]") {
    document.querySelectorAll(selector).forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        const target = document.getElementById(trigger.dataset.scrollTarget);
        if (!target) return;
        e.preventDefault();
        target.classList.remove("hidden");
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  return {
    apiFetch,
    attachScrollButtons,
    clearSession,
    escapeHtml,
    formatBytes: (size) => formatSize(size, "0 MB"),
    formatDate,
    formatFileSize: (size) => formatSize(size),
    formatRelativeTime,
    getCategoryIcon,
    getInitials,
    getStatusChipClass,
    getStatusLabel,
    getToken,
    getUser,
    redirectIfAuthenticated,
    requireAuth,
    setSession,
    setStoredUser,
    setText,
    showMessage
  };
})();

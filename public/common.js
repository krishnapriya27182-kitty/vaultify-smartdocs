window.Vaultify = (() => {
  const TOKEN_KEY = "vaultifyToken";
  const USER_KEY = "vaultifyUser";
  const STATUS_LABELS = {
    active: "Safe",
    "expiring-soon": "Expiring Soon",
    expired: "Expired",
    "no-expiry": "No Expiry"
  };

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch (_error) {
      return null;
    }
  }

  const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
  const getUser = () => readJson(USER_KEY);
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
    const globalMessage = document.getElementById("globalMessage");

    if (!globalMessage) {
      return;
    }

    globalMessage.textContent = message;
    globalMessage.className = `message floating ${type}`;
    globalMessage.classList.remove("hidden");

    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
      globalMessage.classList.add("hidden");
    }, 3500);
  }

  function formatSize(size, emptyLabel = "0 MB") {
    if (!size) {
      return emptyLabel;
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "No expiry date";
    }

    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatRelativeTime(dateString) {
    if (!dateString) {
      return "Just now";
    }

    const diffMinutes = Math.max(
      Math.round((Date.now() - new Date(dateString).getTime()) / (1000 * 60)),
      0
    );

    if (diffMinutes < 1) {
      return "Just now";
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.round(diffHours / 24);
    return diffDays < 7
      ? `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
      : formatDate(dateString);
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || "Unknown";
  }

  function redirectIfAuthenticated(path = "/dashboard.html") {
    if (!getToken()) {
      return false;
    }

    window.location.href = path;
    return true;
  }

  function requireAuth(path = "/") {
    if (getToken()) {
      return true;
    }

    window.location.href = path;
    return false;
  }

  async function apiFetch(url, options = {}) {
    const { responseType = "json", ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers || {});
    const token = getToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let body = fetchOptions.body;
    if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body
    });

    if (response.status === 401 && token) {
      clearSession();
      window.location.href = "/";
      throw new Error("Authentication required.");
    }

    if (responseType === "blob") {
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.message || "Request failed.");
      }

      return response.blob();
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(payload.message || "Request failed.");
    }

    return payload;
  }

  function getInitials(name = "") {
    return name
      .split(" ")
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  const setText = (element, value) => element && (element.textContent = value);

  function attachScrollButtons(selector = "[data-scroll-target]") {
    document.querySelectorAll(selector).forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        const target = document.getElementById(trigger.dataset.scrollTarget);

        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
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
    getInitials,
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

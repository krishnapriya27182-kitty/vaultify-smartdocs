const Vaultify = window.Vaultify;

(() => {
  if (!Vaultify.requireAuth("/")) return;

  const settingsForm              = document.getElementById("settingsForm");
  const settingsFullName          = document.getElementById("settingsFullName");
  const settingsEmail             = document.getElementById("settingsEmail");
  const settingsRecoveryEmail     = document.getElementById("settingsRecoveryEmail");
  const settingsEmailNotifications= document.getElementById("settingsEmailNotifications");
  const settingsInitials          = document.getElementById("settingsInitials");
  const settingsDisplayName       = document.getElementById("settingsDisplayName");
  const settingsDisplayEmail      = document.getElementById("settingsDisplayEmail");
  const settingsStorageUsed       = document.getElementById("settingsStorageUsed");
  const settingsStorageLimit      = document.getElementById("settingsStorageLimit");
  const settingsStorageBar        = document.getElementById("settingsStorageBar");
  const storagePercent            = document.getElementById("storagePercent");
  const changePasswordBtn         = document.getElementById("changePasswordBtn");
  const logoutBtn                 = document.getElementById("logoutBtn");

  const state = { currentUser: Vaultify.getUser() };

  function renderUser() {
    if (!state.currentUser) return;

    settingsInitials.textContent    = Vaultify.getInitials(state.currentUser.fullName) || "VU";
    settingsDisplayName.textContent = state.currentUser.fullName;
    settingsDisplayEmail.textContent= state.currentUser.email;
    settingsFullName.value          = state.currentUser.fullName || "";
    settingsEmail.value             = state.currentUser.email || "";
    settingsRecoveryEmail.value     = state.currentUser.recoveryEmail || "";
    settingsEmailNotifications.checked = state.currentUser.emailNotificationsEnabled !== false;

    const used  = state.currentUser.storageUsedBytes || 0;
    const limit = state.currentUser.storageLimitBytes || 1;
    const pct   = Math.min((used / limit) * 100, 100);

    settingsStorageUsed.textContent  = Vaultify.formatBytes(used);
    settingsStorageLimit.textContent = `of ${Vaultify.formatBytes(limit)}`;
    settingsStorageBar.style.width   = `${pct}%`;
    if (storagePercent) storagePercent.textContent = `${Math.round(pct)}% used`;

    settingsStorageBar.style.background =
      pct >= 100 ? "linear-gradient(90deg,#ba1a1a,#dc5a4d)"
      : pct >= 85 ? "linear-gradient(90deg,#7a4f00,#e0a11b)"
      : "linear-gradient(90deg,var(--tertiary),rgba(247,227,130,0.7))";
  }

  async function refreshUser() {
    const payload = await Vaultify.apiFetch("/api/auth/me");
    state.currentUser = payload.user;
    Vaultify.setStoredUser(payload.user);
    renderUser();
  }

  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const payload = await Vaultify.apiFetch("/api/account", {
        method: "PUT",
        body: {
          fullName: settingsFullName.value,
          recoveryEmail: settingsRecoveryEmail.value,
          emailNotificationsEnabled: settingsEmailNotifications.checked
        }
      });
      state.currentUser = payload.user;
      Vaultify.setStoredUser(payload.user);
      renderUser();
      Vaultify.showMessage("Account settings saved.");
    } catch (err) {
      Vaultify.showMessage(err.message || "Unable to save settings.", "error");
    }
  });

  changePasswordBtn.addEventListener("click", () => {
    const email = state.currentUser?.email || "";
    window.location.href = `/?reset=1&email=${encodeURIComponent(email)}`;
  });

  logoutBtn.addEventListener("click", async () => {
    try { await Vaultify.apiFetch("/api/auth/logout", { method: "POST" }); } catch (_) {}
    Vaultify.clearSession();
    window.location.href = "/";
  });

  refreshUser().catch((err) => {
    if (err.message === "Authentication required.") {
      Vaultify.clearSession();
      window.location.href = "/";
    } else {
      Vaultify.showMessage("Unable to load settings. Please refresh.", "error");
    }
  });
})();

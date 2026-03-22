const Vaultify = window.Vaultify;

(() => {
  if (!Vaultify.requireAuth("/")) {
    return;
  }

  const settingsForm = document.getElementById("settingsForm");
  const settingsFullName = document.getElementById("settingsFullName");
  const settingsEmail = document.getElementById("settingsEmail");
  const settingsRecoveryEmail = document.getElementById("settingsRecoveryEmail");
  const settingsEmailNotifications = document.getElementById("settingsEmailNotifications");
  const settingsInitials = document.getElementById("settingsInitials");
  const settingsDisplayName = document.getElementById("settingsDisplayName");
  const settingsDisplayEmail = document.getElementById("settingsDisplayEmail");
  const settingsStorageUsed = document.getElementById("settingsStorageUsed");
  const settingsStorageLimit = document.getElementById("settingsStorageLimit");
  const settingsStorageBar = document.getElementById("settingsStorageBar");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const state = {
    currentUser: Vaultify.getUser()
  };

  function renderUser() {
    if (!state.currentUser) {
      return;
    }

    settingsInitials.textContent = Vaultify.getInitials(state.currentUser.fullName) || "VU";
    settingsDisplayName.textContent = state.currentUser.fullName;
    settingsDisplayEmail.textContent = state.currentUser.email;
    settingsFullName.value = state.currentUser.fullName || "";
    settingsEmail.value = state.currentUser.email || "";
    settingsRecoveryEmail.value = state.currentUser.recoveryEmail || "";
    settingsEmailNotifications.checked = state.currentUser.emailNotificationsEnabled !== false;

    const usedBytes = state.currentUser.storageUsedBytes || 0;
    const limitBytes = state.currentUser.storageLimitBytes || 0;
    const usagePercent = limitBytes ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;

    settingsStorageUsed.textContent = Vaultify.formatBytes(usedBytes);
    settingsStorageLimit.textContent = `of ${Vaultify.formatBytes(limitBytes)}`;
    settingsStorageBar.style.width = `${usagePercent}%`;
    settingsStorageBar.style.background =
      usagePercent >= 100
        ? "linear-gradient(135deg, #b42318, #dc5a4d)"
        : usagePercent >= 85
          ? "linear-gradient(135deg, #b54708, #e0a11b)"
          : "linear-gradient(135deg, #f0dc7b, #ccad2a)";
  }

  async function refreshUser() {
    const payload = await Vaultify.apiFetch("/api/auth/me");
    state.currentUser = payload.user;
    localStorage.setItem("vaultifyUser", JSON.stringify(payload.user));
    renderUser();
  }

  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

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
      localStorage.setItem("vaultifyUser", JSON.stringify(payload.user));
      renderUser();
      Vaultify.showMessage("Account settings updated successfully.");
    } catch (error) {
      Vaultify.showMessage(error.message || "Unable to update account settings.", "error");
    }
  });

  changePasswordBtn.addEventListener("click", () => {
    const email = state.currentUser ? state.currentUser.email : "";
    window.location.href = `/?reset=1&email=${encodeURIComponent(email)}`;
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await Vaultify.apiFetch("/api/auth/logout", {
        method: "POST"
      });
    } catch (_error) {
      // Clear local state even if the server logout fails.
    }

    Vaultify.clearSession();
    window.location.href = "/";
  });

  refreshUser().catch(() => {
    Vaultify.clearSession();
    window.location.href = "/";
  });
})();

const Vaultify = window.Vaultify;

(() => {
  if (Vaultify.redirectIfAuthenticated("/dashboard.html")) {
    return;
  }

  const loginForm = document.getElementById("loginForm");
  const resetModal = document.getElementById("resetModal");
  const openResetBtn = document.getElementById("openResetBtn");
  const closeResetBtn = document.getElementById("closeResetBtn");
  const resetRequestForm = document.getElementById("resetRequestForm");
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const resetHelper = document.getElementById("resetHelper");
  const resetRequestEmail = document.getElementById("resetRequestEmail");
  const resetEmail = document.getElementById("resetEmail");

  const query = new URLSearchParams(window.location.search);
  const prefillEmail = query.get("email") || "";

  function closeResetModal() {
    resetModal.classList.add("hidden");
    resetRequestForm.reset();
    resetPasswordForm.reset();
    resetPasswordForm.classList.add("hidden");
    resetRequestForm.classList.remove("hidden");
    resetHelper.classList.add("hidden");
    resetHelper.textContent = "";
  }

  function openResetModal() {
    resetRequestEmail.value =
      prefillEmail || document.getElementById("loginEmail").value.trim();
    resetModal.classList.remove("hidden");
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const payload = await Vaultify.apiFetch("/api/auth/login", {
        method: "POST",
        body: {
          email: document.getElementById("loginEmail").value,
          password: document.getElementById("loginPassword").value
        }
      });

      Vaultify.setSession(payload.token, payload.user);
      window.location.href = "/dashboard.html";
    } catch (error) {
      Vaultify.showMessage(error.message || "Unable to sign in.", "error");
    }
  });

  openResetBtn.addEventListener("click", openResetModal);
  closeResetBtn.addEventListener("click", closeResetModal);
  resetModal.addEventListener("click", (event) => {
    if (event.target === resetModal) {
      closeResetModal();
    }
  });

  resetRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const payload = await Vaultify.apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: {
          email: resetRequestEmail.value
        }
      });

      resetEmail.value = payload.email || resetRequestEmail.value.trim();
      resetRequestForm.classList.add("hidden");
      resetPasswordForm.classList.remove("hidden");
      resetHelper.classList.remove("hidden");
      resetHelper.textContent = payload.demoResetCode
        ? `Demo reset code: ${payload.demoResetCode}. It will expire in ${payload.expiresInMinutes} minutes.`
        : payload.message;
      Vaultify.showMessage("Reset flow started. Continue in the popup.");
    } catch (error) {
      Vaultify.showMessage(error.message || "Unable to generate reset code.", "error");
    }
  });

  resetPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const payload = await Vaultify.apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: {
          email: document.getElementById("resetEmail").value,
          resetCode: document.getElementById("resetCode").value,
          newPassword: document.getElementById("newPassword").value,
          confirmPassword: document.getElementById("confirmResetPassword").value
        }
      });

      Vaultify.setSession(payload.token, payload.user);
      window.location.href = "/dashboard.html";
    } catch (error) {
      Vaultify.showMessage(error.message || "Unable to reset password.", "error");
    }
  });

  if (query.get("reset") === "1") {
    openResetModal();
  }
})();

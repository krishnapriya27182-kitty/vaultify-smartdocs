const Vaultify = window.Vaultify;

(() => {
  if (Vaultify.redirectIfAuthenticated("/dashboard.html")) {
    return;
  }

  const signupForm = document.getElementById("signupForm");

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const payload = await Vaultify.apiFetch("/api/auth/signup", {
        method: "POST",
        body: {
          fullName: document.getElementById("signupName").value,
          email: document.getElementById("signupEmail").value,
          recoveryEmail: document.getElementById("signupRecoveryEmail").value,
          emailNotificationsEnabled: document.getElementById("signupEmailNotifications").checked,
          password: document.getElementById("signupPassword").value,
          confirmPassword: document.getElementById("signupConfirmPassword").value
        }
      });

      Vaultify.setSession(payload.token, payload.user);
      window.location.href = "/dashboard.html";
    } catch (error) {
      Vaultify.showMessage(error.message || "Unable to create account.", "error");
    }
  });
})();

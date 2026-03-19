const globalMessage = document.getElementById("globalMessage");
const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");

const loginTabBtn = document.getElementById("loginTabBtn");
const signupTabBtn = document.getElementById("signupTabBtn");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const logoutBtn = document.getElementById("logoutBtn");

const resetModal = document.getElementById("resetModal");
const openResetBtn = document.getElementById("openResetBtn");
const closeResetBtn = document.getElementById("closeResetBtn");
const resetRequestForm = document.getElementById("resetRequestForm");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetHelper = document.getElementById("resetHelper");
const resetRequestEmail = document.getElementById("resetRequestEmail");
const resetEmail = document.getElementById("resetEmail");

const documentForm = document.getElementById("documentForm");
const documentsGrid = document.getElementById("documentsGrid");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const totalDocs = document.getElementById("totalDocs");
const expiringDocs = document.getElementById("expiringDocs");

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userInitials = document.getElementById("userInitials");
const welcomeHeading = document.getElementById("welcomeHeading");

const filters = {
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  statusFilter: document.getElementById("statusFilter")
};

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("vaultifyUser") || "null");
  } catch (_error) {
    return null;
  }
}

const state = {
  token: localStorage.getItem("vaultifyToken") || "",
  currentUser: readStoredUser(),
  currentDocuments: []
};

function showMessage(message, type = "success") {
  globalMessage.textContent = message;
  globalMessage.className = `message floating ${type}`;
  globalMessage.classList.remove("hidden");

  window.clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = window.setTimeout(() => {
    globalMessage.classList.add("hidden");
  }, 3500);
}

function switchAuthTab(mode) {
  const isLogin = mode === "login";
  loginForm.classList.toggle("hidden", !isLogin);
  signupForm.classList.toggle("hidden", isLogin);
  loginTabBtn.classList.toggle("active", isLogin);
  signupTabBtn.classList.toggle("active", !isLogin);
}

function toggleScreens(isAuthenticated) {
  authScreen.classList.toggle("hidden", isAuthenticated);
  appScreen.classList.toggle("hidden", !isAuthenticated);
}

function setSession(token, user) {
  state.token = token;
  state.currentUser = user;
  localStorage.setItem("vaultifyToken", token);
  localStorage.setItem("vaultifyUser", JSON.stringify(user));
  renderCurrentUser();
}

function clearSession() {
  state.token = "";
  state.currentUser = null;
  state.currentDocuments = [];
  localStorage.removeItem("vaultifyToken");
  localStorage.removeItem("vaultifyUser");
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

function renderCurrentUser() {
  if (!state.currentUser) {
    return;
  }

  userName.textContent = state.currentUser.fullName;
  userEmail.textContent = state.currentUser.email;
  userInitials.textContent = getInitials(state.currentUser.fullName) || "VU";
  welcomeHeading.textContent = `Welcome, ${state.currentUser.fullName}`;
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

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
  const labels = {
    active: "Active",
    "expiring-soon": "Expiring Soon",
    expired: "Expired",
    "no-expiry": "No Expiry"
  };

  return labels[status] || "Unknown";
}

function resetDocumentForm() {
  documentForm.reset();
  document.getElementById("documentId").value = "";
  document.getElementById("file").required = true;
  formTitle.textContent = "Add New Document";
  submitBtn.textContent = "Save Document";
  cancelEditBtn.classList.add("hidden");
}

function populateDocumentForm(documentData) {
  document.getElementById("documentId").value = documentData._id;
  document.getElementById("title").value = documentData.title;
  document.getElementById("category").value = documentData.category;
  document.getElementById("description").value = documentData.description || "";
  document.getElementById("expiryDate").value = documentData.expiryDate
    ? new Date(documentData.expiryDate).toISOString().split("T")[0]
    : "";
  document.getElementById("tags").value = (documentData.tags || []).join(", ");
  document.getElementById("file").required = false;
  formTitle.textContent = "Edit Document";
  submitBtn.textContent = "Update Document";
  cancelEditBtn.classList.remove("hidden");
}

function renderDocuments(documents) {
  totalDocs.textContent = documents.length;
  expiringDocs.textContent = documents.filter(
    (documentData) => documentData.expiryStatus === "expiring-soon"
  ).length;

  if (!documents.length) {
    documentsGrid.innerHTML =
      '<div class="empty-state">No documents found in your private vault yet. Upload one to get started.</div>';
    return;
  }

  documentsGrid.innerHTML = documents
    .map((documentData) => {
      const tags = documentData.tags && documentData.tags.length
        ? documentData.tags.map((tag) => escapeHtml(tag)).join(", ")
        : "No tags";

      return `
        <article class="document-card">
          <div class="document-header">
            <div>
              <p class="document-category">${escapeHtml(documentData.category)}</p>
              <h3 class="document-title">${escapeHtml(documentData.title)}</h3>
            </div>
            <span class="status-pill status-${documentData.expiryStatus}">
              ${getStatusLabel(documentData.expiryStatus)}
            </span>
          </div>

          <div class="document-meta">
            <strong>File:</strong> ${escapeHtml(documentData.fileName)}<br />
            <strong>Size:</strong> ${formatFileSize(documentData.fileSize)}<br />
            <strong>Expiry:</strong> ${formatDate(documentData.expiryDate)}
          </div>

          <div class="document-meta">
            ${escapeHtml(documentData.description || "No description added.")}
          </div>

          <div class="document-tags">
            <strong>Tags:</strong> ${tags}
          </div>

          <div class="document-actions">
            <button class="ghost" type="button" data-action="open" data-id="${documentData._id}">
              View File
            </button>
            <button class="ghost" type="button" data-action="edit" data-id="${documentData._id}">
              Edit
            </button>
            <button class="danger-btn" type="button" data-action="delete" data-id="${documentData._id}">
              Delete
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

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
  const defaultEmail =
    document.getElementById("loginEmail").value.trim() ||
    (state.currentUser ? state.currentUser.email : "");

  resetRequestEmail.value = defaultEmail;
  resetModal.classList.remove("hidden");
}

function handleUnauthorized(message = "Session expired. Please sign in again.") {
  clearSession();
  toggleScreens(false);
  switchAuthTab("login");
  documentsGrid.innerHTML = "";
  resetDocumentForm();
  showMessage(message, "error");
}

async function apiFetch(url, options = {}) {
  const { responseType = "json", ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
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

  if (response.status === 401 && state.token) {
    handleUnauthorized();
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

async function fetchDocuments() {
  const params = new URLSearchParams({
    search: filters.searchInput.value.trim(),
    category: filters.categoryFilter.value,
    status: filters.statusFilter.value
  });

  const documents = await apiFetch(`/api/documents?${params.toString()}`);
  state.currentDocuments = documents;
  renderDocuments(documents);
}

async function openDocumentFile(id) {
  const previewWindow = window.open("", "_blank");

  try {
    const fileBlob = await apiFetch(`/api/documents/${id}/file`, {
      responseType: "blob"
    });
    const objectUrl = URL.createObjectURL(fileBlob);

    if (previewWindow) {
      previewWindow.location.href = objectUrl;
    } else {
      window.open(objectUrl, "_blank");
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    if (previewWindow) {
      previewWindow.close();
    }

    showMessage(error.message || "Unable to open the document.", "error");
  }
}

function handleEditDocument(id) {
  const documentData = state.currentDocuments.find((item) => item._id === id);

  if (!documentData) {
    showMessage("Unable to load document details.", "error");
    return;
  }

  populateDocumentForm(documentData);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function handleDeleteDocument(id) {
  const confirmed = window.confirm("Delete this document permanently?");

  if (!confirmed) {
    return;
  }

  try {
    await apiFetch(`/api/documents/${id}`, {
      method: "DELETE"
    });
    showMessage("Document deleted successfully.");
    resetDocumentForm();
    await fetchDocuments();
  } catch (error) {
    showMessage(error.message || "Delete failed.", "error");
  }
}

loginTabBtn.addEventListener("click", () => switchAuthTab("login"));
signupTabBtn.addEventListener("click", () => switchAuthTab("signup"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = await apiFetch("/api/auth/login", {
      method: "POST",
      body: {
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value
      }
    });

    setSession(payload.token, payload.user);
    toggleScreens(true);
    resetDocumentForm();
    await fetchDocuments();
    showMessage("Signed in successfully.");
  } catch (error) {
    showMessage(error.message || "Unable to sign in.", "error");
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: {
        fullName: document.getElementById("signupName").value,
        email: document.getElementById("signupEmail").value,
        password: document.getElementById("signupPassword").value,
        confirmPassword: document.getElementById("signupConfirmPassword").value
      }
    });

    setSession(payload.token, payload.user);
    toggleScreens(true);
    resetDocumentForm();
    await fetchDocuments();
    showMessage("Account created successfully.");
  } catch (error) {
    showMessage(error.message || "Unable to create account.", "error");
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await apiFetch("/api/auth/logout", {
      method: "POST"
    });
  } catch (_error) {
    // Even if logout fails on the server, clear the local session.
  }

  clearSession();
  toggleScreens(false);
  switchAuthTab("login");
  loginForm.reset();
  signupForm.reset();
  showMessage("Logged out successfully.");
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
    const payload = await apiFetch("/api/auth/forgot-password", {
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
    showMessage("Reset flow started. Continue in the popup.");
  } catch (error) {
    showMessage(error.message || "Unable to generate reset code.", "error");
  }
});

resetPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = await apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: {
        email: document.getElementById("resetEmail").value,
        resetCode: document.getElementById("resetCode").value,
        newPassword: document.getElementById("newPassword").value,
        confirmPassword: document.getElementById("confirmResetPassword").value
      }
    });

    setSession(payload.token, payload.user);
    closeResetModal();
    toggleScreens(true);
    resetDocumentForm();
    await fetchDocuments();
    showMessage("Password reset successful.");
  } catch (error) {
    showMessage(error.message || "Unable to reset password.", "error");
  }
});

documentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const documentId = document.getElementById("documentId").value;
  const fileInput = document.getElementById("file");

  if (!documentId && !fileInput.files.length) {
    showMessage("Please choose a file to upload.", "error");
    return;
  }

  try {
    const formData = new FormData(documentForm);
    await apiFetch(documentId ? `/api/documents/${documentId}` : "/api/documents", {
      method: documentId ? "PUT" : "POST",
      body: formData
    });

    showMessage(documentId ? "Document updated successfully." : "Document added successfully.");
    resetDocumentForm();
    await fetchDocuments();
  } catch (error) {
    showMessage(error.message || "Request failed.", "error");
  }
});

documentsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "open") {
    openDocumentFile(id);
    return;
  }

  if (action === "edit") {
    handleEditDocument(id);
    return;
  }

  if (action === "delete") {
    handleDeleteDocument(id);
  }
});

Object.values(filters).forEach((element) => {
  element.addEventListener("input", () => {
    if (state.token) {
      fetchDocuments().catch((error) => {
        showMessage(error.message || "Unable to fetch documents.", "error");
      });
    }
  });

  element.addEventListener("change", () => {
    if (state.token) {
      fetchDocuments().catch((error) => {
        showMessage(error.message || "Unable to fetch documents.", "error");
      });
    }
  });
});

cancelEditBtn.addEventListener("click", resetDocumentForm);

async function initializeApp() {
  switchAuthTab("login");
  resetDocumentForm();

  if (!state.token) {
    toggleScreens(false);
    return;
  }

  try {
    const payload = await apiFetch("/api/auth/me");
    state.currentUser = payload.user;
    localStorage.setItem("vaultifyUser", JSON.stringify(payload.user));
    renderCurrentUser();
    toggleScreens(true);
    await fetchDocuments();
  } catch (_error) {
    clearSession();
    toggleScreens(false);
  }
}

initializeApp().catch(() => {
  toggleScreens(false);
  showMessage("Could not connect to the server.", "error");
});

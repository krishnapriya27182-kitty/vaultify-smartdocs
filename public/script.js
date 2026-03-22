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

const settingsForm = document.getElementById("settingsForm");
const settingsFullName = document.getElementById("settingsFullName");
const settingsRecoveryEmail = document.getElementById("settingsRecoveryEmail");
const settingsEmailNotifications = document.getElementById("settingsEmailNotifications");

const documentFormPanel = document.getElementById("documentFormPanel");
const documentForm = document.getElementById("documentForm");
const documentsGrid = document.getElementById("documentsGrid");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const totalDocs = document.getElementById("totalDocs");
const expiringDocs = document.getElementById("expiringDocs");
const categoryCount = document.getElementById("categoryCount");
const storageUsage = document.getElementById("storageUsage");
const storageUsageBar = document.getElementById("storageUsageBar");

const notificationsPanel = document.getElementById("notificationsPanel");
const notificationCount = document.getElementById("notificationCount");
const notificationsList = document.getElementById("notificationsList");

const quickPreviewPanel = document.getElementById("quickPreviewPanel");
const previewStatus = document.getElementById("previewStatus");
const previewEmptyState = document.getElementById("previewEmptyState");
const previewDetails = document.getElementById("previewDetails");
const previewCategory = document.getElementById("previewCategory");
const previewTitle = document.getElementById("previewTitle");
const previewFileName = document.getElementById("previewFileName");
const previewUploadDate = document.getElementById("previewUploadDate");
const previewExpiryDate = document.getElementById("previewExpiryDate");
const previewLastUpdated = document.getElementById("previewLastUpdated");
const previewDescription = document.getElementById("previewDescription");
const previewTags = document.getElementById("previewTags");
const previewOpenBtn = document.getElementById("previewOpenBtn");
const previewEditBtn = document.getElementById("previewEditBtn");

const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const closeConfirmBtn = document.getElementById("closeConfirmBtn");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
const confirmActionBtn = document.getElementById("confirmActionBtn");

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userInitials = document.getElementById("userInitials");
const welcomeHeading = document.getElementById("welcomeHeading");

const filters = {
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  statusFilter: document.getElementById("statusFilter"),
  sortFilter: document.getElementById("sortFilter")
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
  currentDocuments: [],
  currentNotifications: [],
  selectedDocumentId: "",
  pendingDeleteId: ""
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
  state.currentNotifications = [];
  state.selectedDocumentId = "";
  state.pendingDeleteId = "";
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

  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.max(Math.round(diffMs / (1000 * 60)), 0);

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
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return formatDate(dateString);
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

function formatBytes(size) {
  if (!size) {
    return "0 MB";
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

function renderStorageUsage() {
  const usedBytes = state.currentUser ? state.currentUser.storageUsedBytes || 0 : 0;
  const limitBytes = state.currentUser ? state.currentUser.storageLimitBytes || 0 : 0;
  const usagePercent = limitBytes ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;

  storageUsage.textContent = `${formatBytes(usedBytes)} / ${formatBytes(limitBytes)}`;
  storageUsageBar.style.width = `${usagePercent}%`;
  storageUsageBar.style.background =
    usagePercent >= 100
      ? "linear-gradient(135deg, #b42318, #dc5a4d)"
      : usagePercent >= 85
        ? "linear-gradient(135deg, #b54708, #e0a11b)"
        : "linear-gradient(135deg, #1f6f78, #4fa3ab)";
}

function renderCurrentUser() {
  if (!state.currentUser) {
    return;
  }

  userName.textContent = state.currentUser.fullName;
  userEmail.textContent = state.currentUser.email;
  userInitials.textContent = getInitials(state.currentUser.fullName) || "VU";
  welcomeHeading.textContent = `Welcome, ${state.currentUser.fullName}`;

  settingsFullName.value = state.currentUser.fullName || "";
  settingsRecoveryEmail.value = state.currentUser.recoveryEmail || "";
  settingsEmailNotifications.checked = state.currentUser.emailNotificationsEnabled !== false;

  renderStorageUsage();
}

function renderNotifications(notifications) {
  state.currentNotifications = notifications;
  notificationCount.textContent = String(notifications.length);
  notificationsPanel.classList.remove("hidden");

  if (!notifications.length) {
    notificationsList.innerHTML = `
      <article class="notification-item notification-info">
        <h3>No urgent alerts</h3>
        <p>Your vault looks healthy right now. Expiry and storage reminders will appear here.</p>
      </article>
    `;
    return;
  }

  notificationsList.innerHTML = notifications
    .map(
      (notification) => `
        <article class="notification-item notification-${escapeHtml(notification.level || "info")}">
          <h3>${escapeHtml(notification.title)}</h3>
          <p>${escapeHtml(notification.message)}</p>
        </article>
      `
    )
    .join("");
}

function getSortedDocuments(documents) {
  const selectedSort = filters.sortFilter.value;
  const sortedDocuments = [...documents];

  sortedDocuments.sort((firstDocument, secondDocument) => {
    if (selectedSort === "name") {
      return firstDocument.title.localeCompare(secondDocument.title);
    }

    if (selectedSort === "expiry") {
      if (!firstDocument.expiryDate && !secondDocument.expiryDate) {
        return 0;
      }

      if (!firstDocument.expiryDate) {
        return 1;
      }

      if (!secondDocument.expiryDate) {
        return -1;
      }

      return new Date(firstDocument.expiryDate) - new Date(secondDocument.expiryDate);
    }

    if (selectedSort === "updated") {
      return new Date(secondDocument.updatedAt) - new Date(firstDocument.updatedAt);
    }

    return new Date(secondDocument.createdAt) - new Date(firstDocument.createdAt);
  });

  return sortedDocuments;
}

function getSelectedDocument(documents) {
  if (!documents.length) {
    return null;
  }

  return (
    documents.find((documentData) => documentData._id === state.selectedDocumentId) || documents[0]
  );
}

function resetPreviewPanel() {
  state.selectedDocumentId = "";
  previewStatus.className = "status-pill status-no-expiry";
  previewStatus.textContent = "No Selection";
  previewEmptyState.classList.remove("hidden");
  previewDetails.classList.add("hidden");
}

function renderPreview(documentData) {
  if (!documentData) {
    resetPreviewPanel();
    return;
  }

  state.selectedDocumentId = documentData._id;
  previewStatus.className = `status-pill status-${documentData.expiryStatus}`;
  previewStatus.textContent = getStatusLabel(documentData.expiryStatus);
  previewCategory.textContent = documentData.category;
  previewTitle.textContent = documentData.title;
  previewFileName.textContent = documentData.fileName;
  previewUploadDate.textContent = formatDate(documentData.createdAt);
  previewExpiryDate.textContent = formatDate(documentData.expiryDate);
  previewLastUpdated.textContent = formatRelativeTime(documentData.updatedAt);
  previewDescription.textContent = documentData.description || "No notes added.";
  previewTags.textContent = documentData.tags && documentData.tags.length
    ? documentData.tags.join(", ")
    : "No tags";

  previewEmptyState.classList.add("hidden");
  previewDetails.classList.remove("hidden");
}

function highlightPanel(panelElement) {
  if (!panelElement) {
    return;
  }

  panelElement.classList.remove("panel-focus");
  void panelElement.offsetWidth;
  panelElement.classList.add("panel-focus");
}

function scrollToPanel(panelElement) {
  if (!panelElement) {
    return;
  }

  panelElement.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
  highlightPanel(panelElement);
}

function openConfirmModal(documentData) {
  state.pendingDeleteId = documentData._id;
  confirmMessage.textContent = `Are you sure you want to delete "${documentData.title}"? This action cannot be undone.`;
  confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
  state.pendingDeleteId = "";
  confirmModal.classList.add("hidden");
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
  const sortedDocuments = getSortedDocuments(documents);
  const uniqueCategories = new Set(sortedDocuments.map((documentData) => documentData.category));

  totalDocs.textContent = sortedDocuments.length;
  expiringDocs.textContent = sortedDocuments.filter(
    (documentData) => documentData.expiryStatus === "expiring-soon"
  ).length;
  categoryCount.textContent = uniqueCategories.size;

  if (!sortedDocuments.length) {
    documentsGrid.innerHTML =
      '<div class="empty-state">No documents found in your private vault yet. Upload one to get started.</div>';
    resetPreviewPanel();
    return;
  }

  const selectedDocument = getSelectedDocument(sortedDocuments);
  renderPreview(selectedDocument);

  documentsGrid.innerHTML = sortedDocuments
    .map((documentData) => {
      const tags = documentData.tags && documentData.tags.length
        ? documentData.tags.map((tag) => escapeHtml(tag)).join(", ")
        : "No tags";
      const isSelected = selectedDocument && selectedDocument._id === documentData._id;

      return `
        <article class="document-card card-${documentData.expiryStatus} ${isSelected ? "is-selected" : ""}" data-preview-id="${documentData._id}">
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

          <div class="document-footnote">
            Last updated: ${escapeHtml(formatRelativeTime(documentData.updatedAt))}
          </div>

          <div class="document-actions">
            <button class="ghost" type="button" data-action="preview" data-id="${documentData._id}">
              Quick Preview
            </button>
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
  notificationsList.innerHTML = "";
  resetPreviewPanel();
  closeConfirmModal();
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

async function refreshCurrentUser() {
  const payload = await apiFetch("/api/auth/me");
  state.currentUser = payload.user;
  localStorage.setItem("vaultifyUser", JSON.stringify(payload.user));
  renderCurrentUser();
}

async function fetchNotifications() {
  const payload = await apiFetch("/api/notifications");
  renderNotifications(payload.notifications || []);
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

async function loadDashboardData() {
  await refreshCurrentUser();
  await Promise.all([fetchDocuments(), fetchNotifications()]);
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

  renderPreview(documentData);
  populateDocumentForm(documentData);
  scrollToPanel(documentFormPanel);
  window.setTimeout(() => {
    document.getElementById("title").focus();
  }, 350);
}

function handlePreviewDocument(id) {
  const documentData = state.currentDocuments.find((item) => item._id === id);

  if (!documentData) {
    showMessage("Unable to load document preview.", "error");
    return;
  }

  renderPreview(documentData);
  scrollToPanel(quickPreviewPanel);
}

async function handleDeleteDocument(id) {
  const documentData = state.currentDocuments.find((item) => item._id === id);

  if (!documentData) {
    showMessage("Unable to load document details.", "error");
    return;
  }

  openConfirmModal(documentData);
}

async function confirmDeleteDocument() {
  if (!state.pendingDeleteId) {
    return;
  }

  try {
    await apiFetch(`/api/documents/${state.pendingDeleteId}`, {
      method: "DELETE"
    });
    closeConfirmModal();
    showMessage("Document deleted successfully.");
    resetDocumentForm();
    await loadDashboardData();
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
    await loadDashboardData();
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
        recoveryEmail: document.getElementById("signupRecoveryEmail").value,
        emailNotificationsEnabled: document.getElementById("signupEmailNotifications").checked,
        password: document.getElementById("signupPassword").value,
        confirmPassword: document.getElementById("signupConfirmPassword").value
      }
    });

    setSession(payload.token, payload.user);
    toggleScreens(true);
    resetDocumentForm();
    await loadDashboardData();
    showMessage("Account created successfully.");
  } catch (error) {
    showMessage(error.message || "Unable to create account.", "error");
  }
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = await apiFetch("/api/account", {
      method: "PUT",
      body: {
        fullName: settingsFullName.value,
        recoveryEmail: settingsRecoveryEmail.value,
        emailNotificationsEnabled: settingsEmailNotifications.checked
      }
    });

    state.currentUser = payload.user;
    localStorage.setItem("vaultifyUser", JSON.stringify(payload.user));
    renderCurrentUser();
    await fetchNotifications();
    showMessage("Account settings updated successfully.");
  } catch (error) {
    showMessage(error.message || "Unable to update account settings.", "error");
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

closeConfirmBtn.addEventListener("click", closeConfirmModal);
cancelConfirmBtn.addEventListener("click", closeConfirmModal);
confirmActionBtn.addEventListener("click", () => {
  confirmDeleteDocument().catch((error) => {
    showMessage(error.message || "Delete failed.", "error");
  });
});
confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeConfirmModal();
  }
});

previewOpenBtn.addEventListener("click", () => {
  if (state.selectedDocumentId) {
    openDocumentFile(state.selectedDocumentId).catch((error) => {
      showMessage(error.message || "Unable to open the document.", "error");
    });
  }
});

previewEditBtn.addEventListener("click", () => {
  if (state.selectedDocumentId) {
    handleEditDocument(state.selectedDocumentId);
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
    await loadDashboardData();
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
    await loadDashboardData();
  } catch (error) {
    showMessage(error.message || "Request failed.", "error");
  }
});

documentsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (button) {
    const { action, id } = button.dataset;

    if (action === "preview") {
      handlePreviewDocument(id);
      return;
    }

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

    return;
  }

  const card = event.target.closest("[data-preview-id]");
  if (card) {
    handlePreviewDocument(card.dataset.previewId);
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
  resetPreviewPanel();

  if (!state.token) {
    toggleScreens(false);
    return;
  }

  try {
    await loadDashboardData();
    toggleScreens(true);
  } catch (_error) {
    clearSession();
    toggleScreens(false);
  }
}

initializeApp().catch(() => {
  toggleScreens(false);
  showMessage("Could not connect to the server.", "error");
});

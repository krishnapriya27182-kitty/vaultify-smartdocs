const Vaultify = window.Vaultify;

(() => {
  if (!Vaultify.requireAuth("/")) {
    return;
  }

  const totalDocs = document.getElementById("totalDocs");
  const expiringDocs = document.getElementById("expiringDocs");
  const categoryCount = document.getElementById("categoryCount");
  const storageUsage = document.getElementById("storageUsage");
  const storageUsageBar = document.getElementById("storageUsageBar");
  const welcomeHeading = document.getElementById("welcomeHeading");
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const userInitials = document.getElementById("userInitials");
  const notificationsPanel = document.getElementById("notificationsPanel");
  const notificationCount = document.getElementById("notificationCount");
  const notificationsList = document.getElementById("notificationsList");
  const documentsGrid = document.getElementById("documentsGrid");
  const documentForm = document.getElementById("documentForm");
  const formTitle = document.getElementById("formTitle");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
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
  const logoutBtn = document.getElementById("logoutBtn");
  const documentFormPanel = document.getElementById("documentFormPanel");

  const filters = {
    searchInput: document.getElementById("searchInput"),
    categoryFilter: document.getElementById("categoryFilter"),
    statusFilter: document.getElementById("statusFilter"),
    sortFilter: document.getElementById("sortFilter")
  };

  const state = {
    currentUser: Vaultify.getUser(),
    currentDocuments: [],
    currentNotifications: [],
    selectedDocumentId: "",
    pendingDeleteId: ""
  };

  function renderStorageUsage() {
    const usedBytes = state.currentUser ? state.currentUser.storageUsedBytes || 0 : 0;
    const limitBytes = state.currentUser ? state.currentUser.storageLimitBytes || 0 : 0;
    const usagePercent = limitBytes ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;

    storageUsage.textContent = `${Vaultify.formatBytes(usedBytes)} / ${Vaultify.formatBytes(limitBytes)}`;
    storageUsageBar.style.width = `${usagePercent}%`;
    storageUsageBar.style.background =
      usagePercent >= 100
        ? "linear-gradient(135deg, #b42318, #dc5a4d)"
        : usagePercent >= 85
          ? "linear-gradient(135deg, #b54708, #e0a11b)"
          : "linear-gradient(135deg, #143722, #28573b)";
  }

  function renderCurrentUser() {
    if (!state.currentUser) {
      return;
    }

    userName.textContent = state.currentUser.fullName;
    userEmail.textContent = state.currentUser.email;
    userInitials.textContent = Vaultify.getInitials(state.currentUser.fullName) || "VU";
    welcomeHeading.textContent = `Welcome, ${state.currentUser.fullName}`;
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
          <article class="notification-item notification-${Vaultify.escapeHtml(notification.level || "info")}">
            <h3>${Vaultify.escapeHtml(notification.title)}</h3>
            <p>${Vaultify.escapeHtml(notification.message)}</p>
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

    return documents.find((documentData) => documentData._id === state.selectedDocumentId) || documents[0];
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
    previewStatus.textContent = Vaultify.getStatusLabel(documentData.expiryStatus);
    previewCategory.textContent = documentData.category;
    previewTitle.textContent = documentData.title;
    previewFileName.textContent = documentData.fileName;
    previewUploadDate.textContent = Vaultify.formatDate(documentData.createdAt);
    previewExpiryDate.textContent = Vaultify.formatDate(documentData.expiryDate);
    previewLastUpdated.textContent = Vaultify.formatRelativeTime(documentData.updatedAt);
    previewDescription.textContent = documentData.description || "No notes added.";
    previewTags.textContent = documentData.tags && documentData.tags.length
      ? documentData.tags.join(", ")
      : "No tags";

    previewEmptyState.classList.add("hidden");
    previewDetails.classList.remove("hidden");
  }

  function highlightPanel(panelElement) {
    panelElement.classList.remove("panel-focus");
    void panelElement.offsetWidth;
    panelElement.classList.add("panel-focus");
  }

  function scrollToPanel(panelElement) {
    panelElement.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    highlightPanel(panelElement);
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
          ? documentData.tags.map((tag) => Vaultify.escapeHtml(tag)).join(", ")
          : "No tags";
        const isSelected = selectedDocument && selectedDocument._id === documentData._id;

        return `
          <article class="document-card card-${documentData.expiryStatus} ${isSelected ? "is-selected" : ""}" data-preview-id="${documentData._id}">
            <div class="document-header">
              <div>
                <p class="document-category">${Vaultify.escapeHtml(documentData.category)}</p>
                <h3 class="document-title">${Vaultify.escapeHtml(documentData.title)}</h3>
              </div>
              <span class="status-pill status-${documentData.expiryStatus}">
                ${Vaultify.getStatusLabel(documentData.expiryStatus)}
              </span>
            </div>

            <div class="document-meta">
              <strong>File:</strong> ${Vaultify.escapeHtml(documentData.fileName)}<br />
              <strong>Size:</strong> ${Vaultify.formatFileSize(documentData.fileSize)}<br />
              <strong>Expiry:</strong> ${Vaultify.formatDate(documentData.expiryDate)}
            </div>

            <div class="document-meta">
              ${Vaultify.escapeHtml(documentData.description || "No description added.")}
            </div>

            <div class="document-tags">
              <strong>Tags:</strong> ${tags}
            </div>

            <div class="document-footnote">
              Last updated: ${Vaultify.escapeHtml(Vaultify.formatRelativeTime(documentData.updatedAt))}
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

  async function refreshCurrentUser() {
    const payload = await Vaultify.apiFetch("/api/auth/me");
    state.currentUser = payload.user;
    localStorage.setItem("vaultifyUser", JSON.stringify(payload.user));
    renderCurrentUser();
  }

  async function fetchNotifications() {
    const payload = await Vaultify.apiFetch("/api/notifications");
    renderNotifications(payload.notifications || []);
  }

  async function fetchDocuments() {
    const params = new URLSearchParams({
      search: filters.searchInput.value.trim(),
      category: filters.categoryFilter.value,
      status: filters.statusFilter.value
    });

    const documents = await Vaultify.apiFetch(`/api/documents?${params.toString()}`);
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
      const fileBlob = await Vaultify.apiFetch(`/api/documents/${id}/file`, {
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

      Vaultify.showMessage(error.message || "Unable to open the document.", "error");
    }
  }

  function handleEditDocument(id) {
    const documentData = state.currentDocuments.find((item) => item._id === id);

    if (!documentData) {
      Vaultify.showMessage("Unable to load document details.", "error");
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
      Vaultify.showMessage("Unable to load document preview.", "error");
      return;
    }

    renderPreview(documentData);
    scrollToPanel(quickPreviewPanel);
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

  function handleDeleteDocument(id) {
    const documentData = state.currentDocuments.find((item) => item._id === id);

    if (!documentData) {
      Vaultify.showMessage("Unable to load document details.", "error");
      return;
    }

    openConfirmModal(documentData);
  }

  async function confirmDeleteDocument() {
    if (!state.pendingDeleteId) {
      return;
    }

    try {
      await Vaultify.apiFetch(`/api/documents/${state.pendingDeleteId}`, {
        method: "DELETE"
      });
      closeConfirmModal();
      Vaultify.showMessage("Document deleted successfully.");
      resetDocumentForm();
      await loadDashboardData();
    } catch (error) {
      Vaultify.showMessage(error.message || "Delete failed.", "error");
    }
  }

  Object.values(filters).forEach((element) => {
    element.addEventListener("input", () => {
      fetchDocuments().catch((error) => {
        Vaultify.showMessage(error.message || "Unable to fetch documents.", "error");
      });
    });

    element.addEventListener("change", () => {
      fetchDocuments().catch((error) => {
        Vaultify.showMessage(error.message || "Unable to fetch documents.", "error");
      });
    });
  });

  documentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const documentId = document.getElementById("documentId").value;
    const fileInput = document.getElementById("file");

    if (!documentId && !fileInput.files.length) {
      Vaultify.showMessage("Please choose a file to upload.", "error");
      return;
    }

    try {
      const formData = new FormData(documentForm);
      await Vaultify.apiFetch(documentId ? `/api/documents/${documentId}` : "/api/documents", {
        method: documentId ? "PUT" : "POST",
        body: formData
      });

      Vaultify.showMessage(documentId ? "Document updated successfully." : "Document added successfully.");
      resetDocumentForm();
      await loadDashboardData();
    } catch (error) {
      Vaultify.showMessage(error.message || "Request failed.", "error");
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

  previewOpenBtn.addEventListener("click", () => {
    if (state.selectedDocumentId) {
      openDocumentFile(state.selectedDocumentId).catch((error) => {
        Vaultify.showMessage(error.message || "Unable to open the document.", "error");
      });
    }
  });

  previewEditBtn.addEventListener("click", () => {
    if (state.selectedDocumentId) {
      handleEditDocument(state.selectedDocumentId);
    }
  });

  closeConfirmBtn.addEventListener("click", closeConfirmModal);
  cancelConfirmBtn.addEventListener("click", closeConfirmModal);
  confirmModal.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
      closeConfirmModal();
    }
  });
  confirmActionBtn.addEventListener("click", () => {
    confirmDeleteDocument().catch((error) => {
      Vaultify.showMessage(error.message || "Delete failed.", "error");
    });
  });

  cancelEditBtn.addEventListener("click", resetDocumentForm);

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

  Vaultify.attachScrollButtons();
  resetDocumentForm();
  resetPreviewPanel();
  loadDashboardData().catch(() => {
    Vaultify.clearSession();
    window.location.href = "/";
  });
})();

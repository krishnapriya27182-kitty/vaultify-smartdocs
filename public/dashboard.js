const Vaultify = window.Vaultify;

(() => {
  if (!Vaultify.requireAuth("/")) {
    return;
  }

  const $ = (id) => document.getElementById(id);
  const ids = `
    totalDocs expiringDocs categoryCount storageUsage storageUsageBar welcomeHeading
    userName userEmail userInitials notificationsPanel notificationCount notificationsList
    documentsGrid documentForm formTitle submitBtn cancelEditBtn quickPreviewPanel
    previewStatus previewEmptyState previewDetails previewCategory previewTitle previewFileName
    previewUploadDate previewExpiryDate previewLastUpdated previewDescription previewTags
    previewOpenBtn previewEditBtn confirmModal confirmMessage closeConfirmBtn cancelConfirmBtn
    confirmActionBtn logoutBtn documentFormPanel searchInput categoryFilter statusFilter
    sortFilter documentId file title category description expiryDate tags
  `.trim().split(/\s+/);
  const elements = Object.fromEntries(ids.map((id) => [id, $(id)]));
  const filters = {
    searchInput: elements.searchInput,
    categoryFilter: elements.categoryFilter,
    statusFilter: elements.statusFilter,
    sortFilter: elements.sortFilter
  };

  const state = {
    currentUser: Vaultify.getUser(),
    currentDocuments: [],
    currentNotifications: [],
    selectedDocumentId: "",
    pendingDeleteId: ""
  };

  function findDocument(id) {
    return state.currentDocuments.find((documentData) => documentData._id === id);
  }

  function setStorageBar(bar, usagePercent, colors) {
    bar.style.width = `${usagePercent}%`;
    bar.style.background =
      usagePercent >= 100
        ? colors.danger
        : usagePercent >= 85
          ? colors.warning
          : colors.safe;
  }

  function renderStorageUsage() {
    const usedBytes = state.currentUser?.storageUsedBytes || 0;
    const limitBytes = state.currentUser?.storageLimitBytes || 0;
    const usagePercent = limitBytes ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;

    Vaultify.setText(
      elements.storageUsage,
      `${Vaultify.formatBytes(usedBytes)} / ${Vaultify.formatBytes(limitBytes)}`
    );

    setStorageBar(elements.storageUsageBar, usagePercent, {
      danger: "linear-gradient(135deg, #b42318, #dc5a4d)",
      warning: "linear-gradient(135deg, #b54708, #e0a11b)",
      safe: "linear-gradient(135deg, #143722, #28573b)"
    });
  }

  function renderCurrentUser() {
    if (!state.currentUser) {
      return;
    }

    const { fullName, email } = state.currentUser;
    Vaultify.setText(elements.userName, fullName);
    Vaultify.setText(elements.userEmail, email);
    Vaultify.setText(elements.userInitials, Vaultify.getInitials(fullName) || "VU");
    Vaultify.setText(elements.welcomeHeading, `Welcome, ${fullName}`);
    renderStorageUsage();
  }

  function renderNotifications(notifications) {
    state.currentNotifications = notifications;
    Vaultify.setText(elements.notificationCount, String(notifications.length));
    elements.notificationsPanel.classList.remove("hidden");

    if (!notifications.length) {
      elements.notificationsList.innerHTML = `
        <article class="notification-item notification-info">
          <h3>No urgent alerts</h3>
          <p>Your vault looks healthy right now. Expiry and storage reminders will appear here.</p>
        </article>
      `;
      return;
    }

    elements.notificationsList.innerHTML = notifications
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
    const sortedDocuments = [...documents];

    sortedDocuments.sort((firstDocument, secondDocument) => {
      switch (filters.sortFilter.value) {
        case "name":
          return firstDocument.title.localeCompare(secondDocument.title);
        case "expiry":
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
        case "updated":
          return new Date(secondDocument.updatedAt) - new Date(firstDocument.updatedAt);
        default:
          return new Date(secondDocument.createdAt) - new Date(firstDocument.createdAt);
      }
    });

    return sortedDocuments;
  }

  function getSelectedDocument(documents) {
    if (!documents.length) {
      return null;
    }

    return findDocument(state.selectedDocumentId) || documents[0];
  }

  function resetPreviewPanel() {
    state.selectedDocumentId = "";
    elements.previewStatus.className = "status-pill status-no-expiry";
    Vaultify.setText(elements.previewStatus, "No Selection");
    elements.previewEmptyState.classList.remove("hidden");
    elements.previewDetails.classList.add("hidden");
  }

  function renderPreview(documentData) {
    if (!documentData) {
      resetPreviewPanel();
      return;
    }

    state.selectedDocumentId = documentData._id;
    elements.previewStatus.className = `status-pill status-${documentData.expiryStatus}`;

    [
      ["previewStatus", Vaultify.getStatusLabel(documentData.expiryStatus)],
      ["previewCategory", documentData.category],
      ["previewTitle", documentData.title],
      ["previewFileName", documentData.fileName],
      ["previewUploadDate", Vaultify.formatDate(documentData.createdAt)],
      ["previewExpiryDate", Vaultify.formatDate(documentData.expiryDate)],
      ["previewLastUpdated", Vaultify.formatRelativeTime(documentData.updatedAt)],
      ["previewDescription", documentData.description || "No notes added."],
      ["previewTags", documentData.tags?.length ? documentData.tags.join(", ") : "No tags"]
    ].forEach(([key, value]) => Vaultify.setText(elements[key], value));

    elements.previewEmptyState.classList.add("hidden");
    elements.previewDetails.classList.remove("hidden");
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
    elements.documentForm.reset();
    elements.documentId.value = "";
    elements.file.required = true;
    Vaultify.setText(elements.formTitle, "Add New Document");
    Vaultify.setText(elements.submitBtn, "Save Document");
    elements.cancelEditBtn.classList.add("hidden");
  }

  function populateDocumentForm(documentData) {
    elements.documentId.value = documentData._id;
    elements.title.value = documentData.title;
    elements.category.value = documentData.category;
    elements.description.value = documentData.description || "";
    elements.expiryDate.value = documentData.expiryDate
      ? new Date(documentData.expiryDate).toISOString().split("T")[0]
      : "";
    elements.tags.value = (documentData.tags || []).join(", ");
    elements.file.required = false;
    Vaultify.setText(elements.formTitle, "Edit Document");
    Vaultify.setText(elements.submitBtn, "Update Document");
    elements.cancelEditBtn.classList.remove("hidden");
  }

  function renderDocumentCard(documentData, selectedDocumentId) {
    const isSelected = documentData._id === selectedDocumentId;
    const tags = documentData.tags?.length
      ? documentData.tags.map((tag) => Vaultify.escapeHtml(tag)).join(", ")
      : "No tags";

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
  }

  function renderDocuments(documents) {
    const sortedDocuments = getSortedDocuments(documents);
    const selectedDocument = getSelectedDocument(sortedDocuments);
    const selectedDocumentId = selectedDocument?._id || "";

    Vaultify.setText(elements.totalDocs, sortedDocuments.length);
    Vaultify.setText(
      elements.expiringDocs,
      sortedDocuments.filter((documentData) => documentData.expiryStatus === "expiring-soon").length
    );
    Vaultify.setText(
      elements.categoryCount,
      new Set(sortedDocuments.map((documentData) => documentData.category)).size
    );

    if (!sortedDocuments.length) {
      elements.documentsGrid.innerHTML =
        '<div class="empty-state">No documents found in your private vault yet. Upload one to get started.</div>';
      resetPreviewPanel();
      return;
    }

    renderPreview(selectedDocument);
    elements.documentsGrid.innerHTML = sortedDocuments
      .map((documentData) => renderDocumentCard(documentData, selectedDocumentId))
      .join("");
  }

  async function refreshCurrentUser() {
    const payload = await Vaultify.apiFetch("/api/auth/me");
    state.currentUser = payload.user;
    Vaultify.setStoredUser(payload.user);
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

    state.currentDocuments = await Vaultify.apiFetch(`/api/documents?${params.toString()}`);
    renderDocuments(state.currentDocuments);
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

  function startEditing(id) {
    const documentData = findDocument(id);

    if (!documentData) {
      Vaultify.showMessage("Unable to load document details.", "error");
      return;
    }

    renderPreview(documentData);
    populateDocumentForm(documentData);
    scrollToPanel(elements.documentFormPanel);
    window.setTimeout(() => elements.title.focus(), 350);
  }

  function showPreview(id) {
    const documentData = findDocument(id);

    if (!documentData) {
      Vaultify.showMessage("Unable to load document preview.", "error");
      return;
    }

    renderPreview(documentData);
    scrollToPanel(elements.quickPreviewPanel);
  }

  function openDeleteModal(id) {
    const documentData = findDocument(id);

    if (!documentData) {
      Vaultify.showMessage("Unable to load document details.", "error");
      return;
    }

    state.pendingDeleteId = documentData._id;
    Vaultify.setText(
      elements.confirmMessage,
      `Are you sure you want to delete "${documentData.title}"? This action cannot be undone.`
    );
    elements.confirmModal.classList.remove("hidden");
  }

  function closeConfirmModal() {
    state.pendingDeleteId = "";
    elements.confirmModal.classList.add("hidden");
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

  function refreshDocumentsWithMessage() {
    fetchDocuments().catch((error) => {
      Vaultify.showMessage(error.message || "Unable to fetch documents.", "error");
    });
  }

  Object.values(filters).forEach((element) => {
    element.addEventListener("input", refreshDocumentsWithMessage);
    element.addEventListener("change", refreshDocumentsWithMessage);
  });

  elements.documentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const documentId = elements.documentId.value;
    if (!documentId && !elements.file.files.length) {
      Vaultify.showMessage("Please choose a file to upload.", "error");
      return;
    }

    try {
      await Vaultify.apiFetch(documentId ? `/api/documents/${documentId}` : "/api/documents", {
        method: documentId ? "PUT" : "POST",
        body: new FormData(elements.documentForm)
      });

      Vaultify.showMessage(documentId ? "Document updated successfully." : "Document added successfully.");
      resetDocumentForm();
      await loadDashboardData();
    } catch (error) {
      Vaultify.showMessage(error.message || "Request failed.", "error");
    }
  });

  elements.documentsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (button) {
      const { action, id } = button.dataset;

      if (action === "preview") {
        showPreview(id);
      } else if (action === "open") {
        openDocumentFile(id);
      } else if (action === "edit") {
        startEditing(id);
      } else if (action === "delete") {
        openDeleteModal(id);
      }

      return;
    }

    const card = event.target.closest("[data-preview-id]");
    if (card) {
      showPreview(card.dataset.previewId);
    }
  });

  elements.previewOpenBtn.addEventListener("click", () => {
    if (state.selectedDocumentId) {
      openDocumentFile(state.selectedDocumentId);
    }
  });

  elements.previewEditBtn.addEventListener("click", () => {
    if (state.selectedDocumentId) {
      startEditing(state.selectedDocumentId);
    }
  });

  [elements.closeConfirmBtn, elements.cancelConfirmBtn]
    .forEach((button) => button.addEventListener("click", closeConfirmModal));

  elements.confirmModal.addEventListener("click", (event) => {
    if (event.target === elements.confirmModal) {
      closeConfirmModal();
    }
  });

  elements.confirmActionBtn.addEventListener("click", () => {
    confirmDeleteDocument().catch((error) => {
      Vaultify.showMessage(error.message || "Delete failed.", "error");
    });
  });

  elements.cancelEditBtn.addEventListener("click", resetDocumentForm);

  elements.logoutBtn.addEventListener("click", async () => {
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

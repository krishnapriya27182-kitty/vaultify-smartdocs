const Vaultify = window.Vaultify;

(() => {
  if (!Vaultify.requireAuth("/")) return;

  const $ = (id) => document.getElementById(id);

  const ids = `
    totalDocs expiringDocs categoryCount storageUsage storageUsageBar welcomeHeading
    userName userEmail userInitials notificationsPanel notificationCount notificationsList
    sidebarNotifBadge documentsGrid documentForm formTitle submitBtn cancelEditBtn
    quickPreviewPanel previewStatus previewEmptyState previewDetails previewCategory
    previewTitle previewFileName previewUploadDate previewExpiryDate previewLastUpdated
    previewDescription previewTags previewOpenBtn previewEditBtn confirmModal confirmMessage
    closeConfirmBtn cancelConfirmBtn confirmActionBtn logoutBtn documentFormPanel
    searchInput categoryFilter statusFilter sortFilter documentId file title category
    description expiryDate tags dropZone fileLabel
  `.trim().split(/\s+/);

  const el = Object.fromEntries(ids.map((id) => [id, $(id)]));

  const filters = {
    searchInput: el.searchInput,
    categoryFilter: el.categoryFilter,
    statusFilter: el.statusFilter,
    sortFilter: el.sortFilter
  };

  const state = {
    currentUser: Vaultify.getUser(),
    currentDocuments: [],
    selectedDocumentId: "",
    pendingDeleteId: ""
  };

  /* ── Helpers ── */
  function findDoc(id) {
    return state.currentDocuments.find((d) => d._id === id);
  }

  /* ── User / storage ── */
  function renderStorageBar() {
    const used  = state.currentUser?.storageUsedBytes || 0;
    const limit = state.currentUser?.storageLimitBytes || 1;
    const pct   = Math.min((used / limit) * 100, 100);

    Vaultify.setText(el.storageUsage, `${Vaultify.formatBytes(used)} / ${Vaultify.formatBytes(limit)}`);
    el.storageUsageBar.style.width = `${pct}%`;
    el.storageUsageBar.style.background =
      pct >= 100 ? "linear-gradient(90deg,#ba1a1a,#dc5a4d)"
      : pct >= 85 ? "linear-gradient(90deg,#7a4f00,#e0a11b)"
      : "linear-gradient(90deg,var(--primary-container),var(--secondary))";
  }

  function renderCurrentUser() {
    if (!state.currentUser) return;
    const { fullName, email } = state.currentUser;
    Vaultify.setText(el.userName, fullName);
    Vaultify.setText(el.userEmail, email);
    Vaultify.setText(el.userInitials, Vaultify.getInitials(fullName) || "VU");
    Vaultify.setText(el.welcomeHeading, `Welcome, ${fullName}`);
    renderStorageBar();
  }

  /* ── Notifications ── */
  function renderNotifications(notifications) {
    const count = notifications.length;
    Vaultify.setText(el.notificationCount, String(count));
    Vaultify.setText(el.sidebarNotifBadge, String(count));

    if (count > 0) {
      el.sidebarNotifBadge.classList.remove("hidden");
    } else {
      el.sidebarNotifBadge.classList.add("hidden");
    }

    el.notificationsPanel.classList.remove("hidden");

    if (!count) {
      el.notificationsList.innerHTML = `
        <div class="notif-item notif-info">
          <h4>All clear</h4>
          <p>Your vault looks healthy. Expiry and storage reminders will appear here.</p>
        </div>`;
      return;
    }

    el.notificationsList.innerHTML = notifications.map((n) => `
      <div class="notif-item notif-${Vaultify.escapeHtml(n.level || "info")}">
        <h4>${Vaultify.escapeHtml(n.title)}</h4>
        <p>${Vaultify.escapeHtml(n.message)}</p>
      </div>`).join("");
  }

  /* ── Sorting ── */
  function getSorted(docs) {
    return [...docs].sort((a, b) => {
      switch (filters.sortFilter.value) {
        case "name":    return a.title.localeCompare(b.title);
        case "expiry":
          if (!a.expiryDate && !b.expiryDate) return 0;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        case "updated": return new Date(b.updatedAt) - new Date(a.updatedAt);
        default:        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }

  /* ── Preview panel ── */
  function resetPreview() {
    state.selectedDocumentId = "";
    el.previewStatus.className = "chip chip-no-expiry";
    Vaultify.setText(el.previewStatus, "No Selection");
    el.previewEmptyState.classList.remove("hidden");
    el.previewDetails.classList.add("hidden");
  }

  function renderPreview(doc) {
    if (!doc) { resetPreview(); return; }

    state.selectedDocumentId = doc._id;
    el.previewStatus.className = `chip ${Vaultify.getStatusChipClass(doc.expiryStatus)}`;
    Vaultify.setText(el.previewStatus, Vaultify.getStatusLabel(doc.expiryStatus));
    Vaultify.setText(el.previewCategory, doc.category);
    Vaultify.setText(el.previewTitle, doc.title);
    Vaultify.setText(el.previewFileName, doc.fileName);
    Vaultify.setText(el.previewUploadDate, Vaultify.formatDate(doc.createdAt));
    Vaultify.setText(el.previewExpiryDate, Vaultify.formatDate(doc.expiryDate));
    Vaultify.setText(el.previewLastUpdated, Vaultify.formatRelativeTime(doc.updatedAt));
    Vaultify.setText(el.previewDescription, doc.description || "No notes added.");

    el.previewTags.innerHTML = (doc.tags || []).length
      ? doc.tags.map((t) => `<span class="doc-tag">${Vaultify.escapeHtml(t)}</span>`).join("")
      : `<span class="doc-tag">No tags</span>`;

    el.previewEmptyState.classList.add("hidden");
    el.previewDetails.classList.remove("hidden");
  }

  /* ── Document form ── */
  function resetForm() {
    el.documentForm.reset();
    el.documentId.value = "";
    el.file.required = true;
    el.fileLabel.style.display = "";
    Vaultify.setText(el.formTitle, "Add New Document");
    Vaultify.setText(el.submitBtn, "Save Document");
    el.submitBtn.innerHTML = '<span class="material-icons icon-sm">save</span> Save Document';
    el.cancelEditBtn.classList.add("hidden");
    el.dropZone.style.display = "";
  }

  function populateForm(doc) {
    el.documentId.value = doc._id;
    el.title.value = doc.title;
    el.category.value = doc.category;
    el.description.value = doc.description || "";
    el.expiryDate.value = doc.expiryDate ? new Date(doc.expiryDate).toISOString().split("T")[0] : "";
    el.tags.value = (doc.tags || []).join(", ");
    el.file.required = false;
    el.fileLabel.style.display = "";
    el.dropZone.style.display = "none";
    Vaultify.setText(el.formTitle, "Edit Document");
    el.submitBtn.innerHTML = '<span class="material-icons icon-sm">update</span> Update Document';
    el.cancelEditBtn.classList.remove("hidden");
  }

  /* ── Document card ── */
  function renderCard(doc, selectedId) {
    const isSelected = doc._id === selectedId;
    const tags = (doc.tags || []).length
      ? doc.tags.map((t) => `<span class="doc-tag">${Vaultify.escapeHtml(t)}</span>`).join("")
      : `<span class="doc-tag">No tags</span>`;

    const icon = Vaultify.getCategoryIcon(doc.category);

    return `
      <article class="doc-card card-${doc.expiryStatus} ${isSelected ? "is-selected" : ""}" data-preview-id="${doc._id}">
        <div class="doc-card-header">
          <div class="doc-card-icon">
            <span class="material-icons">${icon}</span>
          </div>
          <div style="flex:1;min-width:0">
            <div class="doc-card-category">${Vaultify.escapeHtml(doc.category)}</div>
            <div class="doc-card-title">${Vaultify.escapeHtml(doc.title)}</div>
          </div>
          <span class="chip ${Vaultify.getStatusChipClass(doc.expiryStatus)}" style="flex-shrink:0">
            ${Vaultify.getStatusLabel(doc.expiryStatus)}
          </span>
        </div>

        <div class="doc-card-meta">
          <div class="doc-card-meta-row">
            <span class="material-icons">insert_drive_file</span>
            ${Vaultify.escapeHtml(doc.fileName)} &nbsp;·&nbsp; ${Vaultify.formatFileSize(doc.fileSize)}
          </div>
          <div class="doc-card-meta-row">
            <span class="material-icons">event</span>
            Expires: ${Vaultify.formatDate(doc.expiryDate)}
          </div>
          <div class="doc-card-meta-row">
            <span class="material-icons">update</span>
            ${Vaultify.formatRelativeTime(doc.updatedAt)}
          </div>
        </div>

        <div class="doc-card-tags">${tags}</div>

        <div class="doc-card-actions">
          <button class="btn btn-ghost btn-sm" type="button" data-action="preview" data-id="${doc._id}">
            <span class="material-icons icon-sm">visibility</span> Preview
          </button>
          <button class="btn btn-ghost btn-sm" type="button" data-action="open" data-id="${doc._id}">
            <span class="material-icons icon-sm">open_in_new</span> View
          </button>
          <button class="btn btn-secondary btn-sm" type="button" data-action="edit" data-id="${doc._id}">
            <span class="material-icons icon-sm">edit</span> Edit
          </button>
          <button class="btn btn-danger btn-sm" type="button" data-action="delete" data-id="${doc._id}">
            <span class="material-icons icon-sm">delete</span> Delete
          </button>
        </div>
      </article>`;
  }

  /* ── Render documents ── */
  function renderDocuments(docs) {
    const sorted = getSorted(docs);
    const selected = sorted.find((d) => d._id === state.selectedDocumentId) || sorted[0] || null;

    Vaultify.setText(el.totalDocs, sorted.length);
    Vaultify.setText(el.expiringDocs, sorted.filter((d) => d.expiryStatus === "expiring-soon").length);
    Vaultify.setText(el.categoryCount, new Set(sorted.map((d) => d.category)).size);

    if (!sorted.length) {
      el.documentsGrid.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">folder_open</span>
          <h3>No documents yet</h3>
          <p>Upload your first document using the form on the right.</p>
        </div>`;
      resetPreview();
      return;
    }

    renderPreview(selected);
    el.documentsGrid.innerHTML = sorted.map((d) => renderCard(d, selected?._id || "")).join("");
  }

  /* ── API calls ── */
  async function refreshUser() {
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
    state.currentDocuments = await Vaultify.apiFetch(`/api/documents?${params}`);
    renderDocuments(state.currentDocuments);
  }

  async function loadAll() {
    await refreshUser();
    await Promise.all([fetchDocuments(), fetchNotifications()]);
  }

  /* ── File open ── */
  async function openFile(id) {
    const win = window.open("", "_blank");
    try {
      const blob = await Vaultify.apiFetch(`/api/documents/${id}/file`, { responseType: "blob" });
      const url  = URL.createObjectURL(blob);
      if (win) win.location.href = url;
      else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (win) win.close();
      Vaultify.showMessage(err.message || "Unable to open the document.", "error");
    }
  }

  /* ── Edit / preview / delete ── */
  function startEditing(id) {
    const doc = findDoc(id);
    if (!doc) { Vaultify.showMessage("Unable to load document.", "error"); return; }
    renderPreview(doc);
    populateForm(doc);
    el.documentFormPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => el.title.focus(), 300);
  }

  function showPreview(id) {
    const doc = findDoc(id);
    if (!doc) { Vaultify.showMessage("Unable to load preview.", "error"); return; }
    renderPreview(doc);
    el.quickPreviewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    el.quickPreviewPanel.classList.add("panel-focus");
    setTimeout(() => el.quickPreviewPanel.classList.remove("panel-focus"), 900);
  }

  function openDeleteModal(id) {
    const doc = findDoc(id);
    if (!doc) { Vaultify.showMessage("Unable to load document.", "error"); return; }
    state.pendingDeleteId = doc._id;
    Vaultify.setText(el.confirmMessage, `Delete "${doc.title}"? This cannot be undone.`);
    el.confirmModal.classList.remove("hidden");
  }

  function closeDeleteModal() {
    state.pendingDeleteId = "";
    el.confirmModal.classList.add("hidden");
  }

  async function confirmDelete() {
    if (!state.pendingDeleteId) return;
    try {
      await Vaultify.apiFetch(`/api/documents/${state.pendingDeleteId}`, { method: "DELETE" });
      closeDeleteModal();
      Vaultify.showMessage("Document deleted.");
      resetForm();
      await loadAll();
    } catch (err) {
      Vaultify.showMessage(err.message || "Delete failed.", "error");
    }
  }

  /* ── Drop zone ── */
  el.dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.dropZone.classList.add("drag-over");
  });
  el.dropZone.addEventListener("dragleave", () => el.dropZone.classList.remove("drag-over"));
  el.dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    el.dropZone.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    if (files.length) {
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      el.file.files = dt.files;
      el.dropZone.querySelector("p").textContent = files[0].name;
    }
  });
  el.dropZone.addEventListener("click", () => el.file.click());

  /* ── Event listeners ── */
  Object.values(filters).forEach((input) => {
    input.addEventListener("input", () => fetchDocuments().catch((e) => Vaultify.showMessage(e.message, "error")));
    input.addEventListener("change", () => fetchDocuments().catch((e) => Vaultify.showMessage(e.message, "error")));
  });

  el.documentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const docId = el.documentId.value;
    if (!docId && !el.file.files.length) {
      Vaultify.showMessage("Please choose a file to upload.", "error");
      return;
    }
    try {
      await Vaultify.apiFetch(docId ? `/api/documents/${docId}` : "/api/documents", {
        method: docId ? "PUT" : "POST",
        body: new FormData(el.documentForm)
      });
      Vaultify.showMessage(docId ? "Document updated." : "Document added.");
      resetForm();
      await loadAll();
    } catch (err) {
      Vaultify.showMessage(err.message || "Request failed.", "error");
    }
  });

  el.documentsGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (btn) {
      const { action, id } = btn.dataset;
      if (action === "preview") showPreview(id);
      else if (action === "open")   openFile(id);
      else if (action === "edit")   startEditing(id);
      else if (action === "delete") openDeleteModal(id);
      return;
    }
    const card = e.target.closest("[data-preview-id]");
    if (card) showPreview(card.dataset.previewId);
  });

  el.previewOpenBtn.addEventListener("click", () => { if (state.selectedDocumentId) openFile(state.selectedDocumentId); });
  el.previewEditBtn.addEventListener("click", () => { if (state.selectedDocumentId) startEditing(state.selectedDocumentId); });

  [el.closeConfirmBtn, el.cancelConfirmBtn].forEach((b) => b.addEventListener("click", closeDeleteModal));
  el.confirmModal.addEventListener("click", (e) => { if (e.target === el.confirmModal) closeDeleteModal(); });
  el.confirmActionBtn.addEventListener("click", () => confirmDelete().catch((e) => Vaultify.showMessage(e.message, "error")));
  el.cancelEditBtn.addEventListener("click", resetForm);

  el.logoutBtn.addEventListener("click", async () => {
    try { await Vaultify.apiFetch("/api/auth/logout", { method: "POST" }); } catch (_e) { /* ignore */ }
    Vaultify.clearSession();
    window.location.href = "/";
  });

  Vaultify.attachScrollButtons();
  resetForm();
  resetPreview();

  loadAll().catch((err) => {
    if (err.message === "Authentication required.") {
      Vaultify.clearSession();
      window.location.href = "/";
    } else {
      Vaultify.showMessage("Unable to load dashboard. Please refresh.", "error");
    }
  });
})();

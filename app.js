const STORAGE_KEY = "credit-card-reminder-v5";
const LEGACY_KEYS = ["credit-card-reminder-v4", "credit-card-reminder-v2", "credit-card-reminder-v1"];

const form = document.querySelector("#cardForm");
const cardList = document.querySelector("#cardList");
const emptyState = document.querySelector("#emptyState");
const filterSelect = document.querySelector("#filterSelect");
const typeFilterSelect = document.querySelector("#typeFilterSelect");
const searchInput = document.querySelector("#searchInput");
const todayDueCount = document.querySelector("#todayDueCount");
const todayDueList = document.querySelector("#todayDueList");
const weekDueCount = document.querySelector("#weekDueCount");
const weekDueList = document.querySelector("#weekDueList");
const monthDueCount = document.querySelector("#monthDueCount");
const monthDueList = document.querySelector("#monthDueList");
const resetBtn = document.querySelector("#resetBtn");
const formTitle = document.querySelector("#formTitle");
const installBtn = document.querySelector("#installBtn");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");
const importFile = document.querySelector("#importFile");
const historyList = document.querySelector("#historyList");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");
const toggleHistoryBtn = document.querySelector("#toggleHistoryBtn");
const notifyBtn = document.querySelector("#notifyBtn");
const testNotifyBtn = document.querySelector("#testNotifyBtn");
const backupReminder = document.querySelector("#backupReminder");
const backupReminderText = document.querySelector("#backupReminderText");
const backupNowBtn = document.querySelector("#backupNowBtn");
const googleClientIdInput = document.querySelector("#googleClientId");
const saveGoogleClientIdBtn = document.querySelector("#saveGoogleClientIdBtn");
const googleCalendarStatus = document.querySelector("#googleCalendarStatus");
const disconnectGoogleCalendarBtn = document.querySelector("#disconnectGoogleCalendarBtn");
const googleDriveStatus = document.querySelector("#googleDriveStatus");
const backupToGoogleDriveBtn = document.querySelector("#backupToGoogleDriveBtn");
const restoreFromGoogleDriveBtn = document.querySelector("#restoreFromGoogleDriveBtn");
const accountWorkspace = document.querySelector("#accountWorkspace");
const accountFormDetails = document.querySelector("#accountFormDetails");
const accountImportDetails = document.querySelector("#accountImportDetails");
const accountSubtabButtons = document.querySelectorAll("[data-account-view]");
const accountSubtabPanels = document.querySelectorAll("[data-account-view-panel]");
const accountSearchInput = document.querySelector("#accountSearchInput");
const importBrowserPasswordsBtn = document.querySelector("#importBrowserPasswordsBtn");
const browserPasswordImportFile = document.querySelector("#browserPasswordImportFile");
const accountForm = document.querySelector("#accountForm");
const accountList = document.querySelector("#accountList");
const accountEmptyState = document.querySelector("#accountEmptyState");
const resetAccountBtn = document.querySelector("#resetAccountBtn");
const accountVaultLock = document.querySelector("#accountVaultLock");
const accountVaultForm = document.querySelector("#accountVaultForm");
const accountVaultPassword = document.querySelector("#accountVaultPassword");
const unlockAccountBtn = document.querySelector("#unlockAccountBtn");
const forgotMasterPasswordBtn = document.querySelector("#forgotMasterPasswordBtn");
const accountVaultStatus = document.querySelector("#accountVaultStatus");
const lockAccountBtn = document.querySelector("#lockAccountBtn");
const changeMasterPasswordBtn = document.querySelector("#changeMasterPasswordBtn");
const changeMasterPasswordForm = document.querySelector("#changeMasterPasswordForm");
const newMasterPassword = document.querySelector("#newMasterPassword");
const confirmMasterPassword = document.querySelector("#confirmMasterPassword");
const cancelChangeMasterPasswordBtn = document.querySelector("#cancelChangeMasterPasswordBtn");
const accountBulkToolbar = document.querySelector("#accountBulkToolbar");
const selectAllAccounts = document.querySelector("#selectAllAccounts");
const selectedAccountsCount = document.querySelector("#selectedAccountsCount");
const deleteSelectedAccountsBtn = document.querySelector("#deleteSelectedAccountsBtn");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll("[data-tab-panel]");
const billSubtabButtons = document.querySelectorAll("[data-bill-view]");
const billSubtabPanels = document.querySelectorAll("[data-bill-view-panel]");
const statementDateField = document.querySelector("#statementDateField");
const dueDateField = document.querySelector("#dueDateField");
const monthlyPaymentDayField = document.querySelector("#monthlyPaymentDayField");
const minimumAmountField = document.querySelector("#minimumAmountField");
const dateAmountTitle = document.querySelector("#dateAmountTitle");
const dateAmountHint = document.querySelector("#dateAmountHint");
const paymentScheduleHint = document.querySelector("#paymentScheduleHint");
const bankNameLabelText = document.querySelector("#bankNameLabelText");
const cardNameLabelText = document.querySelector("#cardNameLabelText");
const statementDateLabelText = document.querySelector("#statementDateLabelText");
const dueDateLabelText = document.querySelector("#dueDateLabelText");
const monthlyPaymentDayLabelText = document.querySelector("#monthlyPaymentDayLabelText");
const amountLabelText = document.querySelector("#amountLabelText");

let loadedState = { cards: [], history: [], encryptedAccounts: null, legacyAccounts: [], settings: defaultSettings() };
let cards = [];
let history = [];
let encryptedAccounts = null;
let settings = defaultSettings();
let accounts = [];
let legacyAccounts = [];
let accountVaultUnlocked = false;
let accountVaultPasswordCache = "";
let deferredPrompt = null;
let isHistoryExpanded = false;
let googleTokenClient = null;
let googleAccessToken = "";
let accountSearchKeyword = "";
let selectedAccountIds = new Set();

const ACCOUNT_MAX_UNLOCK_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_MS = 60 * 60 * 1000;
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.appdata";
const GOOGLE_DRIVE_BACKUP_FILE_NAME = "payment-manager-backup.json";
const BILL_TYPE_CONFIGS = {
  "credit-card": {
    schedule: "credit-card",
    defaultAmountMode: "variable",
    bankLabel: "銀行名稱",
    cardLabel: "信用卡 / 帳單名稱（選填）",
    bankPlaceholder: "例如：玉山銀行、台新銀行",
    cardPlaceholder: "例如：U Bear 卡、FlyGo 卡，可不填",
    title: "帳單日、截止日與金額",
    hint: "信用卡需要帳單日、繳費截止日與最低應繳金額。金額通常每期不同，預設為浮動金額。",
    note: "信用卡帳單會顯示帳單日、繳費截止日、應繳金額與最低應繳金額。"
  },
  utilities: {
    schedule: "due-only",
    defaultAmountMode: "variable",
    bankLabel: "繳費單位",
    cardLabel: "帳單名稱 / 戶號備註（選填）",
    bankPlaceholder: "例如：台電、自來水、瓦斯公司",
    cardPlaceholder: "例如：家裡電費、租屋處水費，可不填",
    title: "截止日與金額",
    hint: "水電瓦斯通常只需要繳費截止日與本期金額，不需要填信用卡帳單日。",
    note: "水電費屬於每期金額可能不同的帳單，已繳後建立下期時金額會清空，方便下期重新輸入。"
  },
  telecom: {
    schedule: "due-only",
    defaultAmountMode: "variable",
    bankLabel: "電信 / 網路公司",
    cardLabel: "門號 / 帳單名稱（選填）",
    bankPlaceholder: "例如：中華電信、遠傳、台灣大哥大",
    cardPlaceholder: "例如：手機門號、家用網路，可不填",
    title: "截止日與金額",
    hint: "電信費通常只需要繳費截止日與本期金額。若每月固定也可以把金額模式改成固定。",
    note: "電信費預設為浮動金額，也可改為固定金額。"
  },
  insurance: {
    schedule: "due-only",
    defaultAmountMode: "fixed",
    bankLabel: "保險公司",
    cardLabel: "保單 / 項目名稱（選填）",
    bankPlaceholder: "例如：國泰人壽、富邦產險",
    cardPlaceholder: "例如：汽車保險、醫療險，可不填",
    title: "繳費日期與金額",
    hint: "保險費通常沒有信用卡帳單日，填繳費截止日即可；若金額固定，下期會自動保留。",
    note: "保險費預設為固定金額，已繳後建立下期會保留金額。"
  },
  subscription: {
    schedule: "monthly",
    defaultAmountMode: "fixed",
    bankLabel: "服務名稱",
    cardLabel: "方案 / 用途（選填）",
    bankPlaceholder: "例如：Netflix、Spotify、iCloud",
    cardPlaceholder: "例如：家庭方案、雲端空間，可不填",
    title: "每月扣款日與金額",
    hint: "訂閱制只需要每月扣款日與固定金額，不需要填帳單日。",
    note: "訂閱制會依每月扣款日建立下期，金額預設固定保留。"
  },
  rent: {
    schedule: "monthly",
    defaultAmountMode: "fixed",
    bankLabel: "房東 / 租屋名稱",
    cardLabel: "房租名稱（選填）",
    bankPlaceholder: "例如：房東王先生、台中租屋處",
    cardPlaceholder: "例如：每月房租，可不填",
    title: "每月付款日與金額",
    hint: "房租屬於每月固定付款，只需要設定每月幾號付款。",
    note: "房租不需要帳單日，系統會依每月付款日建立下一期，金額預設固定保留。"
  },
  management: {
    schedule: "monthly",
    defaultAmountMode: "fixed",
    bankLabel: "社區 / 管委會名稱",
    cardLabel: "管理費名稱（選填）",
    bankPlaceholder: "例如：XX 社區管委會",
    cardPlaceholder: "例如：每月管理費，可不填",
    title: "每月付款日與金額",
    hint: "管理費屬於每月固定付款，只需要設定每月幾號付款。",
    note: "管理費不需要帳單日，系統會依每月付款日建立下一期，金額預設固定保留。"
  },
  loan: {
    schedule: "monthly",
    defaultAmountMode: "fixed",
    bankLabel: "銀行 / 貸款單位",
    cardLabel: "貸款名稱（選填）",
    bankPlaceholder: "例如：房貸銀行、車貸公司",
    cardPlaceholder: "例如：房貸、車貸、分期，可不填",
    title: "每月扣款日與金額",
    hint: "貸款通常是每月固定扣款，設定每月扣款日即可。若金額會變動，可改成浮動金額。",
    note: "貸款預設為固定金額，下期會保留金額。"
  },
  other: {
    schedule: "due-only",
    defaultAmountMode: "variable",
    bankLabel: "單位 / 公司名稱",
    cardLabel: "項目名稱（選填）",
    bankPlaceholder: "例如：繳費單位或公司名稱",
    cardPlaceholder: "例如：停車費、學費、其他費用，可不填",
    title: "截止日與金額",
    hint: "其他費用只需要填繳費截止日與金額；固定金額可自行切換。",
    note: "其他類型預設為浮動金額。"
  }
};

const FIXED_PAYMENT_TYPES = new Set(["rent", "management", "subscription", "loan"]);

const fields = {
  cardId: document.querySelector("#cardId"),
  billType: document.querySelector("#billType"),
  bankName: document.querySelector("#bankName"),
  cardName: document.querySelector("#cardName"),
  statementDate: document.querySelector("#statementDate"),
  dueDate: document.querySelector("#dueDate"),
  amount: document.querySelector("#amount"),
  amountMode: document.querySelector("#amountMode"),
  minimumAmount: document.querySelector("#minimumAmount"),
  monthlyPaymentDay: document.querySelector("#monthlyPaymentDay"),
  paymentMethod: document.querySelector("#paymentMethod"),
  billingMode: document.querySelector("#billingMode"),
  paymentAccount: document.querySelector("#paymentAccount"),
  remindDays: document.querySelector("#remindDays"),
  note: document.querySelector("#note")
};

const accountFields = {
  accountId: document.querySelector("#accountId"),
  service: document.querySelector("#accountService"),
  username: document.querySelector("#accountUsername"),
  password: document.querySelector("#accountPassword"),
  url: document.querySelector("#accountUrl"),
  note: document.querySelector("#accountNote")
};


function getDialogIcon(type) {
  if (type === "danger") return "!";
  if (type === "success") return "✓";
  if (type === "warning") return "!";
  return "i";
}

function createDialogElements() {
  const backdrop = document.createElement("div");
  backdrop.className = "app-dialog-backdrop";
  backdrop.setAttribute("role", "presentation");

  const dialog = document.createElement("section");
  dialog.className = "app-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "appDialogTitle");
  dialog.setAttribute("aria-describedby", "appDialogMessage");

  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  return { backdrop, dialog };
}

function closeDialog(backdrop) {
  backdrop.classList.remove("show");
  window.setTimeout(() => backdrop.remove(), 160);
}

function showAppDialog({
  title = "提醒",
  message = "",
  type = "info",
  confirmText = "確認",
  cancelText = "取消",
  showCancel = false,
  actionText = "",
  actionUrl = ""
} = {}) {
  return new Promise(resolve => {
    const { backdrop, dialog } = createDialogElements();
    const messageHtml = String(message)
      .split("\n")
      .filter(Boolean)
      .map(line => `<p>${escapeHtml(line)}</p>`)
      .join("") || "<p></p>";
    const actionButtonHtml = actionUrl
      ? `<button type="button" class="secondary-btn app-dialog-link-btn" data-dialog-action="open-link">${escapeHtml(actionText || "開啟連結")}</button>`
      : "";

    dialog.classList.add(`dialog-${type}`);
    dialog.innerHTML = `
      <div class="app-dialog-icon" aria-hidden="true">${getDialogIcon(type)}</div>
      <div class="app-dialog-content">
        <h3 id="appDialogTitle">${escapeHtml(title)}</h3>
        <div id="appDialogMessage" class="app-dialog-message">${messageHtml}</div>
        <div class="app-dialog-actions">
          ${actionButtonHtml}
          ${showCancel ? `<button type="button" class="secondary-btn" data-dialog-action="cancel">${escapeHtml(cancelText)}</button>` : ""}
          <button type="button" class="primary-btn${type === "danger" ? " danger-action" : ""}" data-dialog-action="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const confirmButton = dialog.querySelector('[data-dialog-action="confirm"]');
    const cancelButton = dialog.querySelector('[data-dialog-action="cancel"]');
    const openLinkButton = dialog.querySelector('[data-dialog-action="open-link"]');
    let settled = false;
    let onKeydown;
    const finish = value => {
      if (settled) return;
      settled = true;
      if (onKeydown) document.removeEventListener("keydown", onKeydown);
      closeDialog(backdrop);
      resolve(value);
    };

    confirmButton?.addEventListener("click", () => finish(true));
    cancelButton?.addEventListener("click", () => finish(false));
    openLinkButton?.addEventListener("click", () => {
      window.open(actionUrl, "_blank", "noopener,noreferrer");
      finish(true);
    });
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop && showCancel) finish(false);
    });

    onKeydown = event => {
      if (event.key === "Escape" && showCancel) finish(false);
      if (event.key === "Enter") finish(true);
    };
    document.addEventListener("keydown", onKeydown);

    requestAnimationFrame(() => {
      backdrop.classList.add("show");
      confirmButton?.focus();
    });
  });
}

function showAppAlert(message, options = {}) {
  return showAppDialog({
    title: options.title || "提醒",
    message,
    type: options.type || "info",
    confirmText: options.confirmText || "知道了"
  });
}

function showAppConfirm(message, options = {}) {
  return showAppDialog({
    title: options.title || "請確認",
    message,
    type: options.type || "warning",
    confirmText: options.confirmText || "確認",
    cancelText: options.cancelText || "取消",
    showCancel: true
  });
}

function showAppChoiceDialog({
  title = "請選擇",
  message = "",
  type = "warning",
  choices = []
} = {}) {
  return new Promise(resolve => {
    const { backdrop, dialog } = createDialogElements();
    const messageHtml = String(message)
      .split("\n")
      .filter(Boolean)
      .map(line => `<p>${escapeHtml(line)}</p>`)
      .join("") || "<p></p>";
    const choiceHtml = choices.map((choice, index) => {
      const buttonClass = choice.variant === "primary"
        ? "primary-btn"
        : choice.variant === "danger"
          ? "primary-btn danger-action"
          : "secondary-btn";
      return `<button type="button" class="${buttonClass}" data-choice-index="${index}">${escapeHtml(choice.label)}</button>`;
    }).join("");

    dialog.classList.add(`dialog-${type}`);
    dialog.innerHTML = `
      <div class="app-dialog-icon" aria-hidden="true">${getDialogIcon(type)}</div>
      <div class="app-dialog-content">
        <h3 id="appDialogTitle">${escapeHtml(title)}</h3>
        <div id="appDialogMessage" class="app-dialog-message">${messageHtml}</div>
        <div class="app-dialog-actions app-dialog-choice-actions">${choiceHtml}</div>
      </div>
    `;

    let settled = false;
    let onKeydown;
    const finish = value => {
      if (settled) return;
      settled = true;
      if (onKeydown) document.removeEventListener("keydown", onKeydown);
      closeDialog(backdrop);
      resolve(value);
    };

    dialog.querySelectorAll("[data-choice-index]").forEach(button => {
      button.addEventListener("click", () => {
        const choice = choices[Number(button.dataset.choiceIndex)];
        finish(choice?.value ?? null);
      });
    });

    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) finish(null);
    });

    onKeydown = event => {
      if (event.key === "Escape") finish(null);
    };
    document.addEventListener("keydown", onKeydown);

    requestAnimationFrame(() => {
      backdrop.classList.add("show");
      dialog.querySelector('[data-choice-index="0"]')?.focus();
    });
  });
}

function showAppToast(message, type = "success") {
  let toast = document.querySelector(".app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.className = `app-toast toast-${type}`;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showAppToast.timer);
  showAppToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

const DB_NAME = "payment-manager-db";
const DB_VERSION = 1;
const DB_STORE = "keyval";
const MAIN_STATE_ID = STORAGE_KEY;
const NOTIFIED_ID = "payment-manager-notified-v1";
let dbPromise = null;

function supportsIndexedDB() {
  return "indexedDB" in window;
}

function openAppDatabase() {
  if (!supportsIndexedDB()) {
    return Promise.reject(new Error("此瀏覽器不支援 IndexedDB。"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB 開啟失敗。"));
    request.onblocked = () => reject(new Error("IndexedDB 升級被其他分頁阻擋，請關閉同網站其他分頁後重試。"));
  });

  return dbPromise;
}

async function idbGet(id) {
  const db = await openAppDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const store = tx.objectStore(DB_STORE);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error || new Error("IndexedDB 讀取失敗。"));
  });
}

async function idbSet(id, value) {
  const db = await openAppDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    store.put({ id, value, updatedAt: new Date().toISOString() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IndexedDB 儲存失敗。"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB 儲存中止。"));
  });
}

async function migrateLocalStorageToIndexedDB() {
  const current = readJson(STORAGE_KEY);
  if (current) {
    const migrated = normalizeState(current);
    await idbSet(MAIN_STATE_ID, migrated);
    return migrated;
  }

  for (const key of LEGACY_KEYS) {
    const legacy = readJson(key);
    if (legacy) {
      const migrated = normalizeState(Array.isArray(legacy) ? { cards: legacy, history: [] } : legacy);
      await idbSet(MAIN_STATE_ID, migrated);
      return migrated;
    }
  }

  return null;
}

async function loadState() {
  const current = await idbGet(MAIN_STATE_ID);
  if (current) return normalizeState(current);

  const migrated = await migrateLocalStorageToIndexedDB();
  if (migrated) return migrated;

  return { cards: [], history: [], encryptedAccounts: null, legacyAccounts: [], settings: defaultSettings() };
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function defaultSettings() {
  return {
    lastExportedAt: "",
    lastGoogleDriveBackupAt: "",
    googleDriveBackupFileId: "",
    googleClientId: "",
    accountVaultSecurity: { failedAttempts: 0, lockedUntil: 0 }
  };
}

function saveState() {
  const payload = { cards, history, encryptedAccounts, settings };

  // 舊版資料如果還沒輸入主密碼完成加密，先保留在 accounts，避免使用者新增帳單時誤刪舊帳號。
  // 一旦成功解鎖並加密，legacyAccounts 會被清空，之後 localStorage 就不再保存明文帳號。
  if (!encryptedAccounts && legacyAccounts.length > 0) {
    payload.accounts = legacyAccounts;
  }

  saveState.lastSavePromise = idbSet(MAIN_STATE_ID, payload).catch(error => {
    console.error("IndexedDB 儲存失敗：", error);
    if (typeof showAppToast === "function") {
      showAppToast("資料儲存失敗，請確認瀏覽器儲存空間或權限。", "danger");
    }
  });

  return saveState.lastSavePromise;
}

saveState.lastSavePromise = Promise.resolve();

function normalizeState(data) {
  const importedCards = Array.isArray(data) ? data : data?.cards;
  const importedHistory = Array.isArray(data?.history) ? data.history : [];
  const importedAccounts = Array.isArray(data?.accounts) ? data.accounts : [];
  return {
    cards: Array.isArray(importedCards) ? importedCards.map(normalizeCard).filter(Boolean) : [],
    history: importedHistory.map(normalizeHistoryItem).filter(Boolean),
    encryptedAccounts: isEncryptedAccountsPayload(data?.encryptedAccounts) ? data.encryptedAccounts : null,
    legacyAccounts: importedAccounts.map(normalizeAccount).filter(Boolean),
    settings: { ...defaultSettings(), ...(data?.settings || {}) }
  };
}

function isEncryptedAccountsPayload(payload) {
  return Boolean(
    payload
    && typeof payload === "object"
    && typeof payload.salt === "string"
    && typeof payload.iv === "string"
    && typeof payload.data === "string"
  );
}

function normalizeBillType(type) {
  const allowed = ["credit-card", "utilities", "telecom", "insurance", "subscription", "rent", "management", "loan", "other"];
  return allowed.includes(type) ? type : "credit-card";
}

function getBillTypeConfig(type) {
  return BILL_TYPE_CONFIGS[normalizeBillType(type)] || BILL_TYPE_CONFIGS["credit-card"];
}

function getBillScheduleType(type) {
  return getBillTypeConfig(type).schedule;
}

function isMonthlyPaymentType(type) {
  return getBillScheduleType(type) === "monthly";
}

function isCreditCardBillType(type) {
  return getBillScheduleType(type) === "credit-card";
}

function isFixedPaymentType(type) {
  return isMonthlyPaymentType(type);
}

function normalizeAmountMode(mode) {
  return mode === "fixed" ? "fixed" : "variable";
}

function getDefaultAmountMode(type) {
  return getBillTypeConfig(type).defaultAmountMode || "variable";
}

function shouldCarryAmount(card) {
  return normalizeAmountMode(card?.amountMode || getDefaultAmountMode(card?.billType)) === "fixed";
}

function getMonthlyPaymentDay(card) {
  const value = Number(card?.recurringDay || 0);
  if (value >= 1 && value <= 31) return value;
  if (isValidDateString(card?.dueDate || "")) return Number(String(card.dueDate).slice(-2));
  return 1;
}

function getNextDueDateFromDay(day, baseDate = new Date()) {
  const safeDay = Math.min(31, Math.max(1, Number(day || 1)));
  const today = dateOnly(baseDate);
  const makeDate = (year, monthIndex) => {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const actualDay = Math.min(safeDay, lastDay);
    return new Date(year, monthIndex, actualDay);
  };
  let target = makeDate(today.getFullYear(), today.getMonth());
  if (target < today) target = makeDate(today.getFullYear(), today.getMonth() + 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}

function getBillTypeText(type) {
  return {
    "credit-card": "信用卡",
    utilities: "水電費",
    telecom: "電信費",
    insurance: "保險費",
    subscription: "訂閱費",
    rent: "房租",
    management: "管理費",
    loan: "貸款",
    other: "其他"
  }[normalizeBillType(type)] || "信用卡";
}

function normalizeAccount(account) {
  if (!account || typeof account !== "object") return null;
  if (!String(account.service || "").trim() || !String(account.username || "").trim()) return null;
  return {
    id: String(account.id || crypto.randomUUID()),
    service: String(account.service || "").trim(),
    username: String(account.username || "").trim(),
    password: String(account.password || ""),
    url: String(account.url || "").trim(),
    note: String(account.note || "").trim(),
    createdAt: account.createdAt || new Date().toISOString(),
    updatedAt: account.updatedAt || new Date().toISOString()
  };
}


const ACCOUNT_CRYPTO_VERSION = 1;
const ACCOUNT_KDF_ITERATIONS = 250000;

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function textToBytes(text) {
  return new TextEncoder().encode(text);
}

function bytesToText(bytes) {
  return new TextDecoder().decode(bytes);
}

async function deriveAccountKey(masterPassword, saltBytes) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    textToBytes(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: ACCOUNT_KDF_ITERATIONS,
      hash: "SHA-256"
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptAccountsData(accountsData, masterPassword, existingSaltBase64 = "") {
  const saltBytes = existingSaltBase64
    ? base64ToBytes(existingSaltBase64)
    : crypto.getRandomValues(new Uint8Array(16));
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAccountKey(masterPassword, saltBytes);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    textToBytes(JSON.stringify(accountsData))
  );

  return {
    version: ACCOUNT_CRYPTO_VERSION,
    algorithm: "AES-GCM",
    kdf: "PBKDF2",
    iterations: ACCOUNT_KDF_ITERATIONS,
    salt: bytesToBase64(saltBytes),
    iv: bytesToBase64(ivBytes),
    data: bytesToBase64(new Uint8Array(encryptedBuffer))
  };
}

async function decryptAccountsData(encryptedPayload, masterPassword) {
  const saltBytes = base64ToBytes(encryptedPayload.salt);
  const ivBytes = base64ToBytes(encryptedPayload.iv);
  const encryptedBytes = base64ToBytes(encryptedPayload.data);
  const key = await deriveAccountKey(masterPassword, saltBytes);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encryptedBytes
  );

  const parsed = JSON.parse(bytesToText(new Uint8Array(decryptedBuffer)));
  return Array.isArray(parsed) ? parsed.map(normalizeAccount).filter(Boolean) : [];
}


function getAccountVaultSecurity() {
  const security = settings.accountVaultSecurity && typeof settings.accountVaultSecurity === "object"
    ? settings.accountVaultSecurity
    : {};
  return {
    failedAttempts: Number(security.failedAttempts) || 0,
    lockedUntil: Number(security.lockedUntil) || 0
  };
}

function setAccountVaultSecurity(nextSecurity) {
  settings.accountVaultSecurity = {
    ...getAccountVaultSecurity(),
    ...(nextSecurity || {})
  };
  saveState();
}

function getAccountLockoutRemainingMs() {
  const { lockedUntil } = getAccountVaultSecurity();
  return Math.max(0, lockedUntil - Date.now());
}

function formatAccountLockoutRemaining(ms) {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} 小時 ${minutes} 分鐘`;
  if (hours > 0) return `${hours} 小時`;
  return `${Math.max(1, minutes)} 分鐘`;
}

function resetAccountUnlockAttempts() {
  setAccountVaultSecurity({ failedAttempts: 0, lockedUntil: 0 });
}

function recordAccountUnlockFailure() {
  const security = getAccountVaultSecurity();
  const failedAttempts = security.failedAttempts + 1;
  if (failedAttempts >= ACCOUNT_MAX_UNLOCK_ATTEMPTS) {
    const lockedUntil = Date.now() + ACCOUNT_LOCKOUT_MS;
    setAccountVaultSecurity({ failedAttempts, lockedUntil });
    return { locked: true, failedAttempts, lockedUntil };
  }
  setAccountVaultSecurity({ failedAttempts, lockedUntil: 0 });
  return { locked: false, failedAttempts, lockedUntil: 0 };
}

function updateAccountLockoutUI() {
  const remainingMs = getAccountLockoutRemainingMs();
  const isLockedOut = remainingMs > 0 && !accountVaultUnlocked;
  if (accountVaultPassword) accountVaultPassword.disabled = isLockedOut;
  if (unlockAccountBtn) unlockAccountBtn.disabled = isLockedOut;
  if (isLockedOut) {
    setAccountVaultStatus(`主密碼輸入錯誤已達 ${ACCOUNT_MAX_UNLOCK_ATTEMPTS} 次，請 ${formatAccountLockoutRemaining(remainingMs)} 後再試，或選擇重設帳號資料。`, "warning");
  } else if (!accountVaultUnlocked) {
    const security = getAccountVaultSecurity();
    if (security.lockedUntil) setAccountVaultSecurity({ lockedUntil: 0, failedAttempts: 0 });
  }
}

async function resetEncryptedAccountVault() {
  const firstConfirmed = await showAppConfirm(
    "忘記主密碼時無法還原已加密的帳號資料。你可以刪除所有帳號資料並重新開始；帳單與繳費紀錄不會被刪除。要繼續嗎？",
    { title: "重設帳號資料", type: "danger", confirmText: "繼續重設" }
  );
  if (!firstConfirmed) return;

  const finalConfirmed = await showAppConfirm(
    "再次確認：這會永久刪除帳號分頁內的所有帳號、密碼與備註資料，刪除後無法復原。",
    { title: "永久刪除帳號資料", type: "danger", confirmText: "刪除並重新開始" }
  );
  if (!finalConfirmed) return;

  encryptedAccounts = null;
  legacyAccounts = [];
  accounts = [];
  accountVaultUnlocked = false;
  accountVaultPasswordCache = "";
  selectedAccountIds.clear();
  resetAccountForm();
  hideChangeMasterPasswordForm();
  resetAccountUnlockAttempts();
  saveState();
  updateAccountVaultUI();
  renderAccounts();
  setAccountVaultStatus("帳號資料已刪除。請輸入新的主密碼重新建立帳號資料庫。", "success");
  await showAppAlert("帳號資料已全部刪除，可以用新的主密碼重新開始。", { type: "success", title: "已重設" });
}

async function saveEncryptedAccounts() {
  if (!accountVaultUnlocked || !accountVaultPasswordCache) {
    showAppAlert("帳號資料尚未解鎖，請先輸入主密碼。", { type: "warning" });
    return false;
  }

  encryptedAccounts = await encryptAccountsData(
    accounts,
    accountVaultPasswordCache,
    encryptedAccounts?.salt || ""
  );
  legacyAccounts = [];
  saveState();
  return true;
}

async function unlockAccountVault(masterPassword) {
  const password = String(masterPassword || "");
  const remainingMs = getAccountLockoutRemainingMs();
  if (remainingMs > 0) {
    const message = `主密碼輸入錯誤已達 ${ACCOUNT_MAX_UNLOCK_ATTEMPTS} 次，請 ${formatAccountLockoutRemaining(remainingMs)} 後再試，或選擇重設帳號資料。`;
    setAccountVaultStatus(message, "warning");
    await showAppAlert(message, { type: "warning", title: "帳號資料暫時鎖定" });
    updateAccountLockoutUI();
    return false;
  }

  if (password.length < 8) {
    emphasizeAccountVaultError("主密碼至少需要 8 碼。", { showToast: false });
    return false;
  }

  try {
    if (!encryptedAccounts) {
      accounts = legacyAccounts.length > 0 ? [...legacyAccounts] : [];
      encryptedAccounts = await encryptAccountsData(accounts, password);
      legacyAccounts = [];
      accountVaultUnlocked = true;
      accountVaultPasswordCache = password;
      resetAccountUnlockAttempts();
      saveState();
      setAccountVaultStatus("帳號資料已建立加密保護。", "success");
      updateAccountVaultUI();
      renderAccounts();
      return true;
    }

    accounts = await decryptAccountsData(encryptedAccounts, password);
    accountVaultUnlocked = true;
    accountVaultPasswordCache = password;
    resetAccountUnlockAttempts();
    setAccountVaultStatus("帳號資料已解鎖。", "success");
    updateAccountVaultUI();
    renderAccounts();
    return true;
  } catch {
    accountVaultUnlocked = false;
    accountVaultPasswordCache = "";
    accounts = [];
    const failure = recordAccountUnlockFailure();
    if (failure.locked) {
      const message = `主密碼輸入錯誤已達 ${ACCOUNT_MAX_UNLOCK_ATTEMPTS} 次，帳號資料已暫時鎖定。請 1 小時後再試，或選擇重設帳號資料。`;
      emphasizeAccountVaultError(message, { showToast: true });
      await showAppAlert(message, { type: "warning", title: "帳號資料暫時鎖定" });
    } else {
      emphasizeAccountVaultError(`主密碼錯誤，請重新輸入。剩餘 ${ACCOUNT_MAX_UNLOCK_ATTEMPTS - failure.failedAttempts} 次機會。`, { showToast: true });
    }
    updateAccountVaultUI();
    renderAccounts();
    return false;
  }
}

async function changeAccountMasterPassword(nextPassword, confirmPassword) {
  const newPassword = String(nextPassword || "");
  const confirmedPassword = String(confirmPassword || "");

  if (!accountVaultUnlocked || !accountVaultPasswordCache) {
    setAccountVaultStatus("請先解鎖帳號資料，再更改主密碼。", "error");
    return false;
  }

  if (newPassword.length < 8) {
    emphasizeAccountVaultError("新主密碼至少需要 8 碼。", { showToast: false });
    newMasterPassword?.focus();
    return false;
  }

  if (newPassword !== confirmedPassword) {
    setAccountVaultStatus("兩次輸入的新主密碼不一致。", "error");
    showAppToast("兩次輸入的新主密碼不一致。", "error");
    confirmMasterPassword?.focus();
    confirmMasterPassword?.select();
    return false;
  }

  if (newPassword === accountVaultPasswordCache) {
    setAccountVaultStatus("新主密碼與目前主密碼相同，不需要更改。", "error");
    showAppToast("新主密碼與目前主密碼相同。", "error");
    newMasterPassword?.focus();
    newMasterPassword?.select();
    return false;
  }

  try {
    encryptedAccounts = await encryptAccountsData(accounts, newPassword);
    accountVaultPasswordCache = newPassword;
    legacyAccounts = [];
    saveState();
    hideChangeMasterPasswordForm();
    setAccountVaultStatus("主密碼已更新，之後請使用新主密碼解鎖。", "success");
    return true;
  } catch {
    setAccountVaultStatus("主密碼更新失敗，請稍後再試。", "error");
    return false;
  }
}

function showChangeMasterPasswordForm() {
  changeMasterPasswordForm?.classList.remove("hidden");
  newMasterPassword?.focus();
}

function hideChangeMasterPasswordForm() {
  changeMasterPasswordForm?.classList.add("hidden");
  if (newMasterPassword) newMasterPassword.value = "";
  if (confirmMasterPassword) confirmMasterPassword.value = "";
}

function lockAccountVault() {
  accountVaultUnlocked = false;
  accountVaultPasswordCache = "";
  accounts = [];
  resetAccountForm();
  hideChangeMasterPasswordForm();
  setAccountVaultStatus("帳號資料已鎖定。", "");
  updateAccountVaultUI();
  renderAccounts();
}

function setAccountVaultStatus(message, type = "") {
  if (!accountVaultStatus) return;
  accountVaultStatus.textContent = message || "";
  accountVaultStatus.classList.toggle("success", type === "success");
  accountVaultStatus.classList.toggle("error", type === "error");
  accountVaultStatus.classList.toggle("warning", type === "warning");
  accountVaultLock?.classList.toggle("has-error", type === "error");
  accountVaultForm?.classList.toggle("has-error", type === "error");
  accountVaultPassword?.classList.toggle("input-error", type === "error");
}

function emphasizeAccountVaultError(message, { showToast = true } = {}) {
  setAccountVaultStatus(message, "error");
  accountVaultForm?.classList.remove("shake-error");
  accountVaultPassword?.classList.remove("input-shake");

  // 重新觸發動畫
  void accountVaultForm?.offsetWidth;
  void accountVaultPassword?.offsetWidth;

  accountVaultForm?.classList.add("shake-error");
  accountVaultPassword?.classList.add("input-shake");
  accountVaultPassword?.focus();
  accountVaultPassword?.select();

  window.setTimeout(() => {
    accountVaultForm?.classList.remove("shake-error");
    accountVaultPassword?.classList.remove("input-shake");
  }, 520);

  if (showToast) showAppToast(message, "error");
}

function updateAccountVaultUI() {
  accountVaultLock?.classList.toggle("unlocked", accountVaultUnlocked);
  accountVaultLock?.classList.toggle("locked", !accountVaultUnlocked);
  accountWorkspace?.classList.toggle("hidden", !accountVaultUnlocked);
  accountFormDetails?.classList.toggle("hidden", !accountVaultUnlocked);
  accountImportDetails?.classList.toggle("hidden", !accountVaultUnlocked);
  accountList?.classList.toggle("hidden", !accountVaultUnlocked);
  accountEmptyState?.classList.toggle("hidden", accountVaultUnlocked && accounts.length > 0);
  lockAccountBtn?.classList.toggle("hidden", !accountVaultUnlocked);
  changeMasterPasswordBtn?.classList.toggle("hidden", !accountVaultUnlocked);
  forgotMasterPasswordBtn?.classList.toggle("hidden", accountVaultUnlocked);
  updateAccountLockoutUI();
  if (!accountVaultUnlocked) hideChangeMasterPasswordForm();
}

function normalizeCard(card) {
  if (!card || typeof card !== "object") return null;
  if (!String(card.bankName || "").trim()) return null;
  const billType = normalizeBillType(card.billType);
  const scheduleType = getBillScheduleType(billType);
  const monthlyPayment = scheduleType === "monthly";
  const creditCardBill = scheduleType === "credit-card";
  if (!isValidDateString(card.dueDate)) return null;
  if (creditCardBill && !isValidDateString(card.statementDate)) return null;
  const recurringDay = monthlyPayment ? Math.min(31, Math.max(1, Number(card.recurringDay || String(card.dueDate).slice(-2)))) : 0;
  const amountMode = normalizeAmountMode(card.amountMode || getDefaultAmountMode(billType));

  return {
    id: String(card.id || crypto.randomUUID()),
    billType,
    bankName: String(card.bankName).trim(),
    cardName: String(card.cardName || "").trim(),
    statementDate: creditCardBill ? card.statementDate : "",
    dueDate: card.dueDate,
    recurringDay,
    amount: Math.max(0, Number(card.amount || 0)),
    amountMode,
    minimumAmount: creditCardBill ? Math.max(0, Number(card.minimumAmount || 0)) : 0,
    paymentMethod: card.paymentMethod === "auto" ? "auto" : "manual",
    billingMode: card.billingMode === "manual" ? "manual" : "recurring",
    paymentAccount: String(card.paymentAccount || "").trim(),
    remindDays: Math.max(0, Number(card.remindDays ?? 3)),
    note: String(card.note || "").trim(),
    isPaid: Boolean(card.isPaid),
    googleCalendarEventId: card.googleCalendarEventId ? String(card.googleCalendarEventId) : "",
    googleCalendarEventHtmlLink: card.googleCalendarEventHtmlLink ? String(card.googleCalendarEventHtmlLink) : "",
    googleCalendarSyncedAt: card.googleCalendarSyncedAt ? String(card.googleCalendarSyncedAt) : "",
    googleCalendarMode: card.googleCalendarMode === "merge" ? "merge" : (card.googleCalendarEventId ? "single" : ""),
    googleCalendarDueDate: card.googleCalendarDueDate ? String(card.googleCalendarDueDate) : "",
    googleCalendarBillIds: Array.isArray(card.googleCalendarBillIds) ? card.googleCalendarBillIds.map(String) : [],
    lastPaidAt: card.lastPaidAt || undefined,
    lastPaidSummary: card.lastPaidSummary || undefined
  };
}

function normalizeHistoryItem(item) {
  if (!item || typeof item !== "object") return null;
  if (!String(item.bankName || "").trim() || !isValidDateString(item.dueDate)) return null;
  return {
    id: String(item.id || crypto.randomUUID()),
    billType: normalizeBillType(item.billType),
    bankName: String(item.bankName).trim(),
    cardName: String(item.cardName || "").trim(),
    statementDate: isValidDateString(item.statementDate) ? item.statementDate : "",
    dueDate: item.dueDate,
    recurringDay: Math.min(31, Math.max(0, Number(item.recurringDay || 0))),
    amount: Math.max(0, Number(item.amount || 0)),
    amountMode: normalizeAmountMode(item.amountMode || getDefaultAmountMode(item.billType)),
    minimumAmount: isCreditCardBillType(item.billType) ? Math.max(0, Number(item.minimumAmount || 0)) : 0,
    paymentMethod: item.paymentMethod === "auto" ? "auto" : "manual",
    billingMode: item.billingMode === "manual" ? "manual" : "recurring",
    paymentAccount: String(item.paymentAccount || "").trim(),
    paidAt: item.paidAt || new Date().toISOString(),
    periodDate: isValidDateString(item.periodDate) ? item.periodDate : item.dueDate
  };
}

function getBackupFileName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `payment-manager-backup-${yyyy}${mm}${dd}.json`;
}

function switchBillView(viewName, options = {}) {
  const targetView = viewName === "form" ? "form" : "list";

  billSubtabButtons.forEach(button => {
    const active = button.dataset.billView === targetView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  billSubtabPanels.forEach(panel => {
    panel.classList.toggle("active", panel.dataset.billViewPanel === targetView);
  });

  if (options.scroll !== false) {
    const billsPanel = document.querySelector("#tab-bills");
    const top = billsPanel ? billsPanel.offsetTop - 8 : 0;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }
}

function scrollToAccountView(targetView) {
  const targetPanel = targetView === "list"
    ? document.querySelector("#accountListPanel")
    : document.querySelector("#accountFormDetails");

  if (!targetPanel) return;

  const stickyOffset = window.matchMedia("(max-width: 640px)").matches ? 88 : 18;
  const top = targetPanel.getBoundingClientRect().top + window.scrollY - stickyOffset;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

function switchAccountView(viewName, options = {}) {
  const targetView = viewName === "list" ? "list" : "form";

  accountSubtabButtons.forEach(button => {
    const active = button.dataset.accountView === targetView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  accountSubtabPanels.forEach(panel => {
    panel.classList.toggle("active", panel.dataset.accountViewPanel === targetView);
  });

  // 手機瀏覽時不要自動 focus 搜尋欄，避免鍵盤跳出與畫面被推走。
  if (document.activeElement instanceof HTMLElement && document.activeElement.closest("#tab-accounts")) {
    document.activeElement.blur();
  }

  if (options.scroll !== false) {
    requestAnimationFrame(() => scrollToAccountView(targetView));
  }
}

function switchTab(tabName, options = {}) {
  tabButtons.forEach(button => {
    const active = button.dataset.tab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  tabPanels.forEach(panel => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tabName);
  });

  if (tabName === "accounts") {
    updateAccountVaultUI();
  }

  if (options.scroll !== false) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function buildBackupPayload() {
  const backup = {
    app: "payment-manager",
    version: 7,
    exportedAt: new Date().toISOString(),
    cards,
    history,
    encryptedAccounts,
    settings
  };

  if (!encryptedAccounts && legacyAccounts.length > 0) {
    backup.accounts = legacyAccounts;
  }

  return backup;
}

function exportData() {
  const backup = buildBackupPayload();

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getBackupFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  settings.lastExportedAt = new Date().toISOString();
  saveState();
  renderBackupReminder();
  renderGoogleCalendarSettings();
  renderGoogleDriveSettings();
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && !Number.isNaN(new Date(value).getTime());
}

function readImportedState(data) {
  const normalized = normalizeState(data);
  const importedCards = Array.isArray(data) ? data : data?.cards;
  if (!Array.isArray(importedCards)) return null;
  if (normalized.cards.length !== importedCards.length) return null;
  return normalized;
}


function buildImportPreviewMessage(imported) {
  const currentUnpaid = cards.filter(card => !card.isPaid).length;
  const importUnpaid = imported.cards.filter(card => !card.isPaid).length;
  const importSynced = imported.cards.filter(card => card.googleCalendarEventId).length;
  const importEncryptedAccounts = imported.encryptedAccounts ? "有" : "無";
  const importLegacyAccounts = imported.legacyAccounts?.length || 0;
  const lastExportText = imported.settings?.lastExportedAt
    ? formatDateTime(imported.settings.lastExportedAt)
    : "備份檔未記錄";

  return [
    "請先確認備份內容，按下覆蓋後會取代目前裝置資料。",
    "",
    "目前裝置：",
    `帳單 ${cards.length} 筆，其中未繳 ${currentUnpaid} 筆`,
    `繳費紀錄 ${history.length} 筆`,
    encryptedAccounts ? "帳號資料：有加密資料" : `帳號資料：${legacyAccounts.length} 筆舊版資料`,
    "",
    "匯入檔案：",
    `帳單 ${imported.cards.length} 筆，其中未繳 ${importUnpaid} 筆`,
    `已同步 Google 日曆標記 ${importSynced} 筆`,
    `繳費紀錄 ${imported.history.length} 筆`,
    `帳號資料：加密資料 ${importEncryptedAccounts}；舊版資料 ${importLegacyAccounts} 筆`,
    `備份時間：${lastExportText}`,
    "",
    "此操作不會主動刪除 Google 日曆上的既有事件，只會還原 App 內保存的資料與同步標記。"
  ].join("\n");
}

async function applyImportedState(imported) {
  cards = imported.cards;
  history = imported.history;
  encryptedAccounts = imported.encryptedAccounts || null;
  legacyAccounts = imported.legacyAccounts || [];
  settings = imported.settings || defaultSettings();
  accounts = [];
  accountVaultUnlocked = false;
  accountVaultPasswordCache = "";
  selectedAccountIds.clear();
  resetForm();
  resetAccountForm();
  hideChangeMasterPasswordForm();
  await saveState();
  render();
  updateAccountVaultUI();
}

async function importData(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const imported = readImportedState(data);

    if (!imported) {
      await showAppAlert("匯入失敗：這個檔案格式不符合繳費管理的備份資料。", { type: "danger", title: "匯入失敗" });
      return;
    }

    const previewMessage = buildImportPreviewMessage(imported);
    const choice = await showAppChoiceDialog({
      title: "匯入資料預覽",
      type: "warning",
      message: previewMessage,
      choices: [
        { label: "覆蓋目前資料", value: "overwrite", variant: "danger" },
        { label: "取消", value: "cancel" }
      ]
    });
    if (choice !== "overwrite") return;

    await applyImportedState(imported);
    await showAppAlert("匯入完成，資料已還原。", { type: "success", title: "匯入完成" });
  } catch {
    await showAppAlert("匯入失敗：請確認選到的是 JSON 備份檔。", { type: "danger", title: "匯入失敗" });
  } finally {
    importFile.value = "";
  }
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0
  });
}


function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "時間格式無法辨識";
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(value) {
  if (!value) return "未設定日期";
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日期格式無法辨識";
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDiffDays(dueDateString) {
  const today = dateOnly(new Date());
  const dueDate = dateOnly(new Date(dueDateString));
  return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
}

function addOneMonth(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const targetMonthIndex = month;
  const lastDayOfTargetMonth = new Date(year, targetMonthIndex + 1, 0).getDate();
  const safeDay = Math.min(day, lastDayOfTargetMonth);
  const nextDate = new Date(year, targetMonthIndex, safeDay);
  const yyyy = nextDate.getFullYear();
  const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
  const dd = String(nextDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addPaymentHistory(card, paidAt = new Date().toISOString()) {
  const periodDate = isValidDateString(card.dueDate) ? card.dueDate : toDateInputValue(new Date());
  history.unshift({
    id: crypto.randomUUID(),
    billType: card.billType || "credit-card",
    bankName: card.bankName,
    cardName: card.cardName,
    statementDate: card.statementDate,
    dueDate: card.dueDate,
    periodDate,
    recurringDay: card.recurringDay || 0,
    amount: Number(card.amount || 0),
    amountMode: normalizeAmountMode(card.amountMode || getDefaultAmountMode(card.billType)),
    minimumAmount: Number(card.minimumAmount || 0),
    paymentMethod: card.paymentMethod || "manual",
    billingMode: card.billingMode || "recurring",
    paymentAccount: card.paymentAccount || "",
    paidAt
  });
}

function moveToNextBillingCycle(card) {
  const previousStatementDate = card.statementDate;
  const previousDueDate = card.dueDate;
  const previousAmount = Number(card.amount || 0);
  const previousMinimumAmount = Number(card.minimumAmount || 0);
  const paidAt = new Date().toISOString();
  const monthlyPayment = isMonthlyPaymentType(card.billType);
  const creditCardBill = isCreditCardBillType(card.billType);
  const carryAmount = shouldCarryAmount(card);

  addPaymentHistory(card, paidAt);

  card.statementDate = creditCardBill ? addOneMonth(card.statementDate) : "";
  card.dueDate = addOneMonth(card.dueDate);
  card.amount = carryAmount ? previousAmount : 0;
  card.minimumAmount = creditCardBill ? 0 : 0;
  if (!monthlyPayment) card.recurringDay = 0;
  card.isPaid = false;
  card.lastPaidAt = paidAt;
  card.lastPaidSummary = {
    statementDate: previousStatementDate,
    dueDate: previousDueDate,
    amount: previousAmount,
    minimumAmount: previousMinimumAmount
  };
  clearGoogleSyncFields(card);
}

function markPaidWithoutNextCycle(card) {
  const paidAt = new Date().toISOString();
  addPaymentHistory(card, paidAt);
  card.isPaid = true;
  card.lastPaidAt = paidAt;
  card.lastPaidSummary = {
    statementDate: card.statementDate,
    dueDate: card.dueDate,
    amount: Number(card.amount || 0),
    minimumAmount: Number(card.minimumAmount || 0)
  };
}

function getStatus(card) {
  if (card.isPaid) return { text: "已繳費", type: "success" };

  const diffDays = getDiffDays(card.dueDate);
  if (diffDays < 0) return { text: `已逾期 ${Math.abs(diffDays)} 天`, type: "danger" };
  if (diffDays === 0) return { text: "今天截止", type: "danger" };
  if (diffDays <= Number(card.remindDays || 0)) return { text: `提醒中，剩 ${diffDays} 天`, type: "warning" };
  return { text: `剩 ${diffDays} 天`, type: "normal" };
}

function isUrgent(card) {
  const diff = getDiffDays(card.dueDate);
  return !card.isPaid && diff >= 0 && diff <= Number(card.remindDays || 0);
}

function getDueTone(card) {
  if (card.isPaid) return "paid";
  const diff = getDiffDays(card.dueDate);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 3) return "near";
  if (diff <= 7) return "soon";
  return "normal";
}

function getDueToneText(card) {
  const diff = getDiffDays(card.dueDate);
  if (diff < 0) return `逾期 ${Math.abs(diff)} 天`;
  if (diff === 0) return "今天截止";
  return `${diff} 天後`;
}

function getUpcomingDueCards(maxDays = 7) {
  return cards
    .filter(card => !card.isPaid)
    .map(card => ({ ...card, diffDays: getDiffDays(card.dueDate) }))
    .filter(card => card.diffDays >= 0 && card.diffDays <= maxDays)
    .sort((a, b) => a.diffDays - b.diffDays || getDisplayName(a).localeCompare(getDisplayName(b), "zh-Hant"));
}

function renderDueOverviewList(element, list, emptyText) {
  if (!element) return;
  if (list.length === 0) {
    element.textContent = emptyText;
    element.classList.add("empty");
    return;
  }
  element.classList.remove("empty");
  element.innerHTML = list.slice(0, 5).map(card => `
    <button type="button" class="due-overview-item" data-due-card-id="${escapeHtml(card.id)}">
      <span>
        <strong>${escapeHtml(getDisplayName(card))}</strong>
        <em>${Number(card.amount || 0) === 0 ? "金額待輸入" : formatMoney(card.amount)}</em>
      </span>
      <b>${escapeHtml(getDueToneText(card))}</b>
    </button>
  `).join("") + (list.length > 5 ? `<p class="due-overview-more">另有 ${list.length - 5} 筆，請往下查看帳單清單。</p>` : "");
}

function getCurrentMonthDueCards() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return cards
    .filter(card => !card.isPaid && isValidDateString(card.dueDate))
    .map(card => ({ ...card, diffDays: getDiffDays(card.dueDate), due: new Date(`${card.dueDate}T00:00:00`) }))
    .filter(card => card.due.getFullYear() === year && card.due.getMonth() === month)
    .sort((a, b) => a.due - b.due || getDisplayName(a).localeCompare(getDisplayName(b), "zh-Hant"));
}

function renderMonthDueList() {
  if (!monthDueList || !monthDueCount) return;
  const list = getCurrentMonthDueCards();
  monthDueCount.textContent = list.length;
  if (list.length === 0) {
    monthDueList.textContent = "本月沒有待繳項目。";
    monthDueList.classList.add("empty");
    return;
  }
  monthDueList.classList.remove("empty");
  monthDueList.innerHTML = list.map(card => `
    <button type="button" class="month-due-item" data-due-card-id="${escapeHtml(card.id)}">
      <span class="month-due-date">${escapeHtml(formatDate(card.dueDate).replace(/^\d{4}\//, ""))}</span>
      <span class="month-due-main">
        <strong>${escapeHtml(getDisplayName(card))}</strong>
        <em>${escapeHtml(getBillTypeText(card.billType))}｜${escapeHtml(getPaymentMethodText(card))}${card.paymentAccount ? `｜${escapeHtml(card.paymentAccount)}` : ""}</em>
      </span>
      <b>${Number(card.amount || 0) === 0 ? "待輸入" : formatMoney(card.amount)}</b>
    </button>
  `).join("");
}

function getBillListAmountHtml(card) {
  const amount = Number(card.amount || 0);
  if (amount === 0 && !card.isPaid) {
    return `
      <button type="button" class="inline-amount-btn" data-action="quick-amount" data-id="${escapeHtml(card.id)}" aria-label="輸入 ${escapeHtml(getDisplayName(card))} 的繳費金額">
        待輸入
      </button>
    `;
  }
  return `<strong>${formatMoney(amount)}</strong>`;
}

function showQuickAmountDialog(card) {
  return new Promise(resolve => {
    const { backdrop, dialog } = createDialogElements();
    dialog.classList.add("dialog-info", "quick-amount-dialog");
    dialog.innerHTML = `
      <div class="app-dialog-icon" aria-hidden="true">$</div>
      <div class="app-dialog-content">
        <h3 id="appDialogTitle">輸入繳費金額</h3>
        <div id="appDialogMessage" class="app-dialog-message quick-amount-content">
          <p><strong>${escapeHtml(getDisplayName(card))}</strong></p>
          <p>${escapeHtml(getDueDateLabel(card))}：${escapeHtml(card.dueDate || "未設定")}</p>
          <label class="quick-amount-field">
            <span>繳費金額</span>
            <input type="number" inputmode="numeric" min="1" step="1" id="quickAmountInput" placeholder="例如：10000" autocomplete="off" />
          </label>
          <p class="quick-amount-hint">儲存後會直接更新清單，不需要進入編輯頁。</p>
        </div>
        <div class="app-dialog-actions">
          <button type="button" class="secondary-btn" data-dialog-action="cancel">取消</button>
          <button type="button" class="primary-btn" data-dialog-action="confirm">儲存金額</button>
        </div>
      </div>
    `;

    const input = dialog.querySelector("#quickAmountInput");
    const confirmButton = dialog.querySelector('[data-dialog-action="confirm"]');
    const cancelButton = dialog.querySelector('[data-dialog-action="cancel"]');
    let settled = false;
    let onKeydown;
    const finish = value => {
      if (settled) return;
      settled = true;
      if (onKeydown) document.removeEventListener("keydown", onKeydown);
      closeDialog(backdrop);
      resolve(value);
    };
    const submit = () => {
      const amount = Math.round(Number(input?.value || 0));
      if (!Number.isFinite(amount) || amount <= 0) {
        input?.classList.add("input-error");
        showAppToast("請輸入大於 0 的金額。", "error");
        input?.focus();
        return;
      }
      finish(amount);
    };

    confirmButton?.addEventListener("click", submit);
    cancelButton?.addEventListener("click", () => finish(null));
    input?.addEventListener("input", () => input.classList.remove("input-error"));
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) finish(null);
    });
    onKeydown = event => {
      if (event.key === "Escape") finish(null);
      if (event.key === "Enter") submit();
    };
    document.addEventListener("keydown", onKeydown);
    requestAnimationFrame(() => {
      backdrop.classList.add("show");
      input?.focus();
    });
  });
}

async function quickUpdateCardAmount(card) {
  const amount = await showQuickAmountDialog(card);
  if (!amount) return;
  const oldCard = { ...card };
  card.amount = amount;
  card.isPaid = false;
  saveState();
  render();
  showAppToast("金額已更新。", "success");
  if (oldCard.googleCalendarEventId) {
    try {
      await handleGoogleSyncAfterEdit(oldCard, card);
    } catch (error) {
      await showAppAlert(
        `金額已儲存，但 Google 日曆同步失敗：${error.message || "請稍後再試。"}`,
        { type: "danger", title: "Google 日曆同步失敗" }
      );
    }
  }
}

function renderDueOverview() {
  const todayList = getUpcomingDueCards(0);
  const weekList = getUpcomingDueCards(7).filter(card => card.diffDays > 0);
  if (todayDueCount) todayDueCount.textContent = todayList.length;
  if (weekDueCount) weekDueCount.textContent = weekList.length;
  renderDueOverviewList(todayDueList, todayList, "今天沒有到期帳單。");
  renderDueOverviewList(weekDueList, weekList, "7 天內沒有即將到期帳單。");
  renderMonthDueList();
}

function getPaymentMethodText(card) {
  return card.paymentMethod === "auto" ? "自動扣繳" : "手動繳費";
}

function getBillingModeText(card) {
  return card.billingMode === "manual" ? "手動" : (isMonthlyPaymentType(card.billType) ? "每月固定付款" : "循環");
}

function getAmountModeText(card) {
  return shouldCarryAmount(card) ? "固定金額" : "浮動金額";
}

function getDueDateLabel(card) {
  return isMonthlyPaymentType(card.billType) ? "本期付款日" : "截止日";
}

function getGoogleSyncState(card) {
  if (!card.googleCalendarEventId) {
    return { text: "Google 日曆：尚未同步", type: "normal", buttonText: "上傳 Google 日曆" };
  }
  if (card.googleCalendarMode === "merge") {
    return { text: "Google 日曆：已合併提醒", type: "success", buttonText: "重新同步" };
  }
  return { text: "Google 日曆：已同步", type: "success", buttonText: "重新同步" };
}

function clearGoogleSyncFields(card) {
  if (!card) return;
  card.googleCalendarEventId = "";
  card.googleCalendarEventHtmlLink = "";
  card.googleCalendarSyncedAt = "";
  card.googleCalendarMode = "";
  card.googleCalendarDueDate = "";
  card.googleCalendarBillIds = [];
}

function applyGoogleSyncFields(cardList, event, mode) {
  const billIds = cardList.map(item => item.id);
  const syncedAt = new Date().toISOString();
  cardList.forEach(card => {
    card.googleCalendarEventId = event?.id || "";
    card.googleCalendarEventHtmlLink = event?.htmlLink || "";
    card.googleCalendarSyncedAt = syncedAt;
    card.googleCalendarMode = mode;
    card.googleCalendarDueDate = card.dueDate;
    card.googleCalendarBillIds = [...billIds];
  });
}

function clearGoogleSyncFieldsByEvent(eventId, exceptCardIds = []) {
  if (!eventId) return;
  const except = new Set(exceptCardIds);
  cards.forEach(card => {
    if (card.googleCalendarEventId === eventId && !except.has(card.id)) {
      clearGoogleSyncFields(card);
    }
  });
}

function getGoogleSyncedCardsByEvent(eventId, dueDate = "", excludeIds = []) {
  if (!eventId) return [];
  const excluded = new Set(excludeIds);
  return cards
    .filter(card => card.googleCalendarEventId === eventId && !excluded.has(card.id) && !card.isPaid && (!dueDate || card.dueDate === dueDate))
    .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b), "zh-Hant"));
}

function renderBackupReminder() {
  if (!backupReminder || !backupReminderText) return;
  if (cards.length === 0) {
    backupReminder.classList.add("hidden");
    return;
  }

  const last = settings?.lastExportedAt ? new Date(settings.lastExportedAt) : null;
  const now = new Date();
  const days = last && !Number.isNaN(last.getTime())
    ? Math.floor((dateOnly(now) - dateOnly(last)) / (1000 * 60 * 60 * 24))
    : null;

  if (days !== null && days < 30) {
    backupReminder.classList.add("hidden");
    return;
  }

  backupReminderText.textContent = days === null
    ? "你還沒有匯出過備份。換手機或清除瀏覽器資料前，建議先匯出。"
    : `你已經 ${days} 天沒有匯出備份。建議匯出一份 JSON 檔保存。`;
  backupReminder.classList.remove("hidden");
}

function renderSummary() {
  const unpaid = cards.filter(card => !card.isPaid);
  const urgent = unpaid.filter(isUrgent);
  const total = unpaid.reduce((sum, card) => sum + Number(card.amount || 0), 0);

  document.querySelector("#unpaidCount").textContent = unpaid.length;
  document.querySelector("#urgentCount").textContent = urgent.length;
  document.querySelector("#totalAmount").textContent = formatMoney(total);
  renderDueOverview();
}

function getFilteredCards() {
  const filter = filterSelect.value;
  const typeFilter = typeFilterSelect?.value || "all";
  const keyword = searchInput.value.trim().toLowerCase();
  let sortedCards = [...cards].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (keyword) {
    sortedCards = sortedCards.filter(card => getDisplayName(card).toLowerCase().includes(keyword) || card.bankName.toLowerCase().includes(keyword) || getBillTypeText(card.billType).toLowerCase().includes(keyword));
  }

  if (typeFilter !== "all") {
    sortedCards = sortedCards.filter(card => normalizeBillType(card.billType) === typeFilter);
  }

  if (filter === "paid") return sortedCards.filter(card => card.isPaid);
  if (filter === "unpaid") return sortedCards.filter(card => !card.isPaid);
  if (filter === "urgent") return sortedCards.filter(isUrgent);
  if (filter === "overdue") return sortedCards.filter(card => !card.isPaid && getDiffDays(card.dueDate) < 0);
  return sortedCards;
}

function getDisplayName(card) {
  return card.cardName ? `${card.bankName} ${card.cardName}` : card.bankName;
}

function renderCards() {
  const filteredCards = getFilteredCards();
  cardList.innerHTML = "";
  emptyState.classList.toggle("hidden", filteredCards.length > 0);

  filteredCards.forEach(card => {
    const status = getStatus(card);
    const googleSync = getGoogleSyncState(card);
    const article = document.createElement("article");
    const dueTone = getDueTone(card);
    article.className = `bill-card bill-card-compact ${card.isPaid ? "paid" : ""} due-${dueTone}`;
    article.dataset.cardId = card.id;
    article.innerHTML = `
      <div class="bill-top compact-top">
        <div class="bill-title-wrap">
          <h3 class="bill-name">${escapeHtml(getDisplayName(card))}</h3>
          <div class="bill-bank compact-subline">${getBillTypeText(card.billType)}${card.cardName ? `｜${escapeHtml(card.bankName)}` : ""}</div>
        </div>
        <span class="badge ${status.type}">${status.text}</span>
      </div>
      <div class="compact-bill-summary">
        <div>
          <span>${getDueDateLabel(card)}</span>
          <strong>${card.dueDate}</strong>
        </div>
        <div>
          <span>應繳</span>
          ${getBillListAmountHtml(card)}
        </div>
        <div>
          <span>方式</span>
          <strong>${getPaymentMethodText(card)}</strong>
        </div>
        <div>
          <span>金額模式</span>
          <strong>${getAmountModeText(card)}</strong>
        </div>
      </div>
      ${card.paymentMethod === "auto" ? `<p class="compact-hint">自動扣繳，記得確認扣款。</p>` : ""}
      ${card.googleCalendarEventId ? `<p class="compact-hint ${googleSync.type}">${escapeHtml(googleSync.text)}</p>` : ""}
      <div class="bill-actions advanced-actions compact-actions">
        <button class="small-btn" data-action="detail" data-id="${card.id}">詳情</button>
        ${card.isPaid ? "" : `<button class="small-btn pay" data-action="next-cycle" data-id="${card.id}">${card.billingMode === "manual" ? "標記已繳" : "已繳並建立下期"}</button>`}
        <button class="small-btn" data-action="google-calendar" data-id="${card.id}">${escapeHtml(googleSync.buttonText)}</button>
        <button class="small-btn" data-action="edit" data-id="${card.id}">編輯</button>
        <button class="small-btn delete" data-action="delete" data-id="${card.id}">刪除</button>
      </div>
    `;
    cardList.appendChild(article);
  });
}

function buildBillDetailRows(card, googleSync) {
  const rows = [
    ["帳單類型", getBillTypeText(card.billType)],
    ["單位 / 銀行 / 公司", card.bankName || "未填"],
    ["帳單名稱", card.cardName || "未填"]
  ];

  if (isMonthlyPaymentType(card.billType)) {
    rows.push(["每月付款日", `每月 ${getMonthlyPaymentDay(card)} 號`]);
    rows.push(["本期付款日", card.dueDate]);
  } else if (isCreditCardBillType(card.billType)) {
    rows.push(["帳單日", card.statementDate]);
    rows.push(["繳費截止日", card.dueDate]);
  } else {
    rows.push(["繳費截止日", card.dueDate]);
  }

  rows.push(
    ["應繳金額", Number(card.amount || 0) === 0 ? "待輸入" : formatMoney(card.amount)],
    ["金額模式", getAmountModeText(card)]
  );
  if (isCreditCardBillType(card.billType)) {
    rows.push(["最低應繳金額", Number(card.minimumAmount || 0) === 0 ? "未設定" : formatMoney(card.minimumAmount)]);
  }
  rows.push(
    ["繳費方式", getPaymentMethodText(card)],
    ["帳單模式", getBillingModeText(card)],
    ["提前提醒", `提前 ${Number(card.remindDays || 0)} 天`],
    ["繳費帳戶備註", card.paymentAccount || "未填"],
    ["備註", card.note || "未填"],
    ["Google 日曆", googleSync.text]
  );

  if (card.lastPaidSummary) {
    rows.push(["上期已繳", `${card.lastPaidSummary.dueDate}，${formatMoney(card.lastPaidSummary.amount)}`]);
  }

  return rows;
}

function showBillDetail(card) {
  const googleSync = getGoogleSyncState(card);
  const { backdrop, dialog } = createDialogElements();
  const rows = buildBillDetailRows(card, googleSync)
    .map(([label, value]) => `
      <div class="bill-detail-row">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `)
    .join("");

  dialog.classList.add("dialog-info", "bill-detail-dialog");
  dialog.innerHTML = `
    <div class="app-dialog-icon" aria-hidden="true">i</div>
    <div class="app-dialog-content">
      <h3 id="appDialogTitle">${escapeHtml(getDisplayName(card))}</h3>
      <div id="appDialogMessage" class="app-dialog-message bill-detail-content">
        <div class="bill-detail-status"><span class="badge ${getStatus(card).type}">${getStatus(card).text}</span></div>
        <div class="bill-detail-grid">${rows}</div>
        ${card.googleCalendarEventHtmlLink ? `<a class="bill-detail-link" href="${escapeHtml(card.googleCalendarEventHtmlLink)}" target="_blank" rel="noopener noreferrer">開啟 Google 日曆</a>` : ""}
      </div>
      <div class="app-dialog-actions">
        <button type="button" class="secondary-btn" data-dialog-action="close">關閉</button>
      </div>
    </div>
  `;

  const closeButton = dialog.querySelector('[data-dialog-action="close"]');
  let onKeydown;
  const finish = () => {
    if (onKeydown) document.removeEventListener("keydown", onKeydown);
    closeDialog(backdrop);
  };
  closeButton?.addEventListener("click", finish);
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) finish();
  });
  onKeydown = event => {
    if (event.key === "Escape" || event.key === "Enter") finish();
  };
  document.addEventListener("keydown", onKeydown);
  requestAnimationFrame(() => {
    backdrop.classList.add("show");
    closeButton?.focus();
  });
}

function renderHistory() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const thisMonth = history.filter(item => isHistoryInCurrentBillMonth(item, now));

  document.querySelector("#monthPaidTotal").textContent = formatMoney(thisMonth.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  document.querySelector("#historyCount").textContent = history.length;

  historyList.innerHTML = "";
  if (toggleHistoryBtn) {
    toggleHistoryBtn.classList.toggle("hidden", history.length <= 12);
  }

  if (history.length === 0) {
    historyList.innerHTML = `<div class="empty-state mini"><p>還沒有繳費紀錄。</p></div>`;
    return;
  }

  const visibleHistory = isHistoryExpanded ? history : history.slice(0, 12);

  visibleHistory.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(getDisplayName(item))}</strong>
        <span>${getBillTypeText(item.billType)}｜歸屬 ${escapeHtml(formatDate(getHistoryPeriodDate(item)))}｜${formatPaidDate(item.paidAt)} 已繳</span>
      </div>
      <b>${formatMoney(item.amount)}</b>
    `;
    historyList.appendChild(row);
  });

  if (toggleHistoryBtn) {
    const hasMoreHistory = history.length > 12;
    toggleHistoryBtn.classList.toggle("hidden", !hasMoreHistory);
    toggleHistoryBtn.textContent = isHistoryExpanded ? "收合紀錄" : `查看全部（共 ${history.length} 筆）`;
  }
}

function resetAccountForm() {
  if (!accountForm) return;
  accountForm.reset();
  accountFields.accountId.value = "";
  resetAccountBtn?.classList.add("hidden");
}


function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some(cell => String(cell).trim() !== "")) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some(cell => String(cell).trim() !== "")) rows.push(row);
  return rows;
}

function normalizeCsvHeader(value) {
  return String(value || "")
    .trim()
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\s_\-]+/g, "");
}

function getCsvValue(record, candidates) {
  for (const key of candidates) {
    if (record[key] !== undefined) return String(record[key] || "").trim();
  }
  return "";
}

function normalizeImportedPasswordAccounts(csvText) {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeCsvHeader);
  const imported = [];
  const now = new Date().toISOString();

  rows.slice(1).forEach(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });

    const service = getCsvValue(record, [
      "name", "service", "servicename", "title", "sitename", "網站名稱", "名稱"
    ]);
    const url = getCsvValue(record, ["url", "website", "origin", "loginurl", "網址", "網站"]);
    const username = getCsvValue(record, [
      "username", "user", "login", "email", "account", "帳號", "使用者名稱", "電子郵件"
    ]);
    const password = getCsvValue(record, ["password", "pass", "密碼"]);
    const note = getCsvValue(record, ["note", "notes", "memo", "備註"]);

    const fallbackService = service || (() => {
      try {
        return url ? new URL(url).hostname.replace(/^www\./, "") : "";
      } catch {
        return url || "";
      }
    })();

    const normalized = normalizeAccount({
      id: crypto.randomUUID(),
      service: fallbackService,
      username,
      password,
      url,
      note: note || "由瀏覽器密碼 CSV 匯入",
      createdAt: now,
      updatedAt: now
    });

    if (normalized) imported.push(normalized);
  });

  return imported;
}

function findDuplicateAccount(importedAccount) {
  const importedUrl = String(importedAccount.url || "").trim().toLowerCase();
  const importedService = String(importedAccount.service || "").trim().toLowerCase();
  const importedUsername = String(importedAccount.username || "").trim().toLowerCase();

  return accounts.find(existing => {
    const existingUrl = String(existing.url || "").trim().toLowerCase();
    const existingService = String(existing.service || "").trim().toLowerCase();
    const existingUsername = String(existing.username || "").trim().toLowerCase();
    return importedUsername
      && existingUsername === importedUsername
      && ((importedUrl && existingUrl === importedUrl) || existingService === importedService);
  });
}

function buildBrowserPasswordImportPreview(importedAccounts) {
  const duplicates = importedAccounts.filter(findDuplicateAccount).length;
  const withPasswords = importedAccounts.filter(account => account.password).length;
  const sample = importedAccounts.slice(0, 5).map((account, index) => {
    const urlText = account.url ? `｜${account.url}` : "";
    return `${index + 1}. ${account.service}｜${account.username}${urlText}`;
  });

  return [
    "即將把瀏覽器匯出的帳號密碼 CSV 匯入到帳號區，確認後會使用目前主密碼加密保存。",
    "",
    `可匯入資料：${importedAccounts.length} 筆`,
    `含密碼欄位：${withPasswords} 筆`,
    `疑似與現有帳號重複：${duplicates} 筆`,
    "",
    "預覽前 5 筆：",
    ...sample,
    "",
    "建議匯入後刪除原始 CSV 檔，因為瀏覽器匯出的 CSV 通常是明文密碼。"
  ].join("\n");
}

async function importBrowserPasswordCsv(file) {
  if (!accountVaultUnlocked) {
    await showAppAlert("請先解鎖帳號資料，再匯入帳號密碼。", { type: "warning", title: "帳號資料未解鎖" });
    return;
  }

  try {
    const text = await file.text();
    const importedAccounts = normalizeImportedPasswordAccounts(text);

    if (importedAccounts.length === 0) {
      await showAppAlert(
        "匯入失敗：沒有讀到可用的帳號資料。請確認 CSV 是否包含 name/url/username/password 欄位。",
        { type: "danger", title: "匯入失敗" }
      );
      return;
    }

    const choice = await showAppChoiceDialog({
      title: "匯入帳號密碼預覽",
      type: "warning",
      message: buildBrowserPasswordImportPreview(importedAccounts),
      choices: [
        { label: "略過重複並匯入", value: "skip-duplicates", variant: "primary" },
        { label: "全部匯入", value: "import-all" },
        { label: "取消", value: "cancel" }
      ]
    });

    if (choice === "cancel") return;

    const now = new Date().toISOString();
    let addedCount = 0;
    let skippedCount = 0;

    importedAccounts.forEach(importedAccount => {
      const duplicate = findDuplicateAccount(importedAccount);
      if (duplicate && choice === "skip-duplicates") {
        skippedCount += 1;
        return;
      }
      accounts.push({
        ...importedAccount,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      });
      addedCount += 1;
    });

    const saved = await saveEncryptedAccounts();
    if (!saved) return;
    renderAccounts();
    await showAppAlert(
      `匯入完成：新增 ${addedCount} 筆帳號資料${skippedCount ? `，略過 ${skippedCount} 筆疑似重複資料` : ""}。`,
      { type: "success", title: "匯入完成" }
    );
  } catch {
    await showAppAlert("匯入失敗：請確認選到的是 CSV 檔。", { type: "danger", title: "匯入失敗" });
  } finally {
    if (browserPasswordImportFile) browserPasswordImportFile.value = "";
  }
}


function getFilteredAccountsForSelection() {
  const keyword = accountSearchKeyword.trim().toLowerCase();
  return keyword
    ? accounts.filter(account => {
        const service = String(account.service || "").toLowerCase();
        const username = String(account.username || "").toLowerCase();
        return service.includes(keyword) || username.includes(keyword);
      })
    : accounts;
}

function updateAccountBulkToolbar(filteredAccounts = getFilteredAccountsForSelection()) {
  if (!accountBulkToolbar) return;
  const hasAccounts = accountVaultUnlocked && accounts.length > 0;
  accountBulkToolbar.classList.toggle("hidden", !hasAccounts);

  const visibleIds = filteredAccounts.map(account => account.id);
  const selectedVisibleCount = visibleIds.filter(id => selectedAccountIds.has(id)).length;
  const selectedTotal = selectedAccountIds.size;

  if (selectedAccountsCount) selectedAccountsCount.textContent = `已選 ${selectedTotal} 筆`;
  if (deleteSelectedAccountsBtn) deleteSelectedAccountsBtn.disabled = selectedTotal === 0;
  if (selectAllAccounts) {
    selectAllAccounts.checked = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
    selectAllAccounts.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
    selectAllAccounts.disabled = visibleIds.length === 0;
  }
}

async function deleteSelectedAccounts() {
  if (!accountVaultUnlocked || selectedAccountIds.size === 0) return;
  const selectedCount = selectedAccountIds.size;
  const confirmed = await showAppConfirm(
    `確定要刪除已選的 ${selectedCount} 筆帳號備忘嗎？此動作無法復原。`,
    { title: "刪除多筆帳號", type: "danger", confirmText: "刪除已選" }
  );
  if (!confirmed) return;

  accounts = accounts.filter(account => !selectedAccountIds.has(account.id));
  selectedAccountIds.clear();
  const saved = await saveEncryptedAccounts();
  if (!saved) return;
  renderAccounts();
  showAppToast(`已刪除 ${selectedCount} 筆帳號資料。`, "success");
}

function renderAccounts() {
  if (!accountList || !accountEmptyState) return;
  accountList.innerHTML = "";
  updateAccountVaultUI();

  if (!accountVaultUnlocked) {
    selectedAccountIds.clear();
    updateAccountBulkToolbar([]);
    accountEmptyState.classList.remove("hidden");
    accountEmptyState.innerHTML = `<p>帳號資料已鎖定，請先輸入主密碼解鎖。</p>`;
    return;
  }

  const keyword = accountSearchKeyword.trim().toLowerCase();
  const filteredAccounts = keyword
    ? accounts.filter(account => {
        const service = String(account.service || "").toLowerCase();
        const username = String(account.username || "").toLowerCase();
        return service.includes(keyword) || username.includes(keyword);
      })
    : accounts;

  selectedAccountIds = new Set([...selectedAccountIds].filter(id => accounts.some(account => account.id === id)));
  accountEmptyState.classList.toggle("hidden", filteredAccounts.length > 0);
  updateAccountBulkToolbar(filteredAccounts);
  if (accounts.length === 0) {
    accountEmptyState.innerHTML = `<p>還沒有帳號密碼備忘。</p>`;
  } else if (filteredAccounts.length === 0) {
    accountEmptyState.innerHTML = `<p>找不到符合「${escapeHtml(accountSearchKeyword.trim())}」的帳號資料。</p>`;
  }

  filteredAccounts.forEach(account => {
    const row = document.createElement("details");
    row.className = "account-card account-accordion";
    const safeUrl = account.url && /^https?:\/\//i.test(account.url) ? account.url : "";
    row.innerHTML = `
      <summary class="account-summary">
        <label class="account-select-row" title="選取此帳號">
          <input type="checkbox" data-account-select="${account.id}" ${selectedAccountIds.has(account.id) ? "checked" : ""} />
          <span class="visually-hidden">選取 ${escapeHtml(account.service)}</span>
        </label>
        <div>
          <h3>${escapeHtml(account.service)}</h3>
          <p>${escapeHtml(account.username)}</p>
        </div>
        <span class="account-more">點開查看</span>
      </summary>
      <div class="account-detail-body">
        <div class="account-actions">
          <button class="small-btn" data-account-action="copy-user" data-id="${account.id}">複製帳號</button>
          ${account.password ? `<button class="small-btn" data-account-action="copy-password" data-id="${account.id}">複製密碼</button>` : ""}
          <button class="small-btn" data-account-action="toggle-password" data-id="${account.id}">${account.password ? "顯示密碼" : "無密碼"}</button>
          <button class="small-btn" data-account-action="edit" data-id="${account.id}">編輯</button>
          <button class="small-btn delete" data-account-action="delete" data-id="${account.id}">刪除</button>
        </div>
        ${account.password ? `<p class="account-password" data-password-row="${account.id}">密碼：••••••••</p>` : ""}
        ${safeUrl ? `<p class="note"><a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">開啟網站</a></p>` : ""}
        ${account.note ? `<p class="note">${escapeHtml(account.note)}</p>` : ""}
      </div>
    `;
    accountList.appendChild(row);
  });
}

async function copyText(value, label = "內容") {
  try {
    await navigator.clipboard.writeText(value);
    showAppToast(`${label}已複製。`, "success");
  } catch {
    showAppToast("複製失敗，請手動選取文字複製。", "error");
  }
}

function formatPaidDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "今天";
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function getHistoryPeriodDate(item) {
  return isValidDateString(item?.periodDate) ? item.periodDate : item?.dueDate;
}

function isHistoryInCurrentBillMonth(item, now = new Date()) {
  const periodDateString = getHistoryPeriodDate(item);
  if (!isValidDateString(periodDateString)) return false;
  const [year, month] = periodDateString.split("-").map(Number);
  return year === now.getFullYear() && month === now.getMonth() + 1;
}

function render() {
  renderSummary();
  renderCards();
  renderHistory();
  renderAccounts();
  renderBackupReminder();
  renderGoogleCalendarSettings();
  renderGoogleDriveSettings();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[char]));
}

function updateBillFormMode({ preserveAmountMode = false } = {}) {
  const billType = normalizeBillType(fields.billType?.value);
  const config = getBillTypeConfig(billType);
  const scheduleType = config.schedule;
  const monthlyPayment = scheduleType === "monthly";
  const creditCardBill = scheduleType === "credit-card";
  const dueOnly = scheduleType === "due-only";

  statementDateField?.classList.toggle("hidden", !creditCardBill);
  dueDateField?.classList.toggle("hidden", monthlyPayment);
  monthlyPaymentDayField?.classList.toggle("hidden", !monthlyPayment);
  minimumAmountField?.classList.toggle("hidden", !creditCardBill);
  paymentScheduleHint?.classList.remove("hidden");

  if (bankNameLabelText) bankNameLabelText.textContent = config.bankLabel;
  if (cardNameLabelText) cardNameLabelText.textContent = config.cardLabel;
  if (fields.bankName) fields.bankName.placeholder = config.bankPlaceholder;
  if (fields.cardName) fields.cardName.placeholder = config.cardPlaceholder;
  if (statementDateLabelText) statementDateLabelText.textContent = "帳單日";
  if (dueDateLabelText) dueDateLabelText.textContent = dueOnly ? "繳費截止日" : "繳費截止日";
  if (monthlyPaymentDayLabelText) monthlyPaymentDayLabelText.textContent = billType === "subscription" || billType === "loan" ? "每月扣款日" : "每月付款日";
  if (amountLabelText) amountLabelText.textContent = config.defaultAmountMode === "fixed" ? "固定金額" : "應繳金額";

  if (fields.statementDate) fields.statementDate.required = creditCardBill;
  if (fields.dueDate) fields.dueDate.required = !monthlyPayment;
  if (fields.monthlyPaymentDay) fields.monthlyPaymentDay.required = monthlyPayment;
  if (fields.minimumAmount) fields.minimumAmount.required = false;

  if (dateAmountTitle) dateAmountTitle.textContent = config.title;
  if (dateAmountHint) dateAmountHint.textContent = config.hint;
  if (paymentScheduleHint) paymentScheduleHint.textContent = config.note;

  if (fields.amountMode && (!preserveAmountMode || !fields.amountMode.value)) {
    fields.amountMode.value = config.defaultAmountMode || "variable";
  }
  if (monthlyPayment && !fields.monthlyPaymentDay?.value) fields.monthlyPaymentDay.value = "10";
  if (!creditCardBill && fields.minimumAmount) fields.minimumAmount.value = "";
}

function resetForm() {
  form.reset();
  fields.cardId.value = "";
  fields.billType.value = "credit-card";
  fields.minimumAmount.value = "";
  fields.amountMode.value = getDefaultAmountMode(fields.billType.value);
  fields.paymentMethod.value = "manual";
  fields.billingMode.value = "recurring";
  fields.paymentAccount.value = "";
  fields.remindDays.value = 3;
  fields.monthlyPaymentDay.value = "";
  updateBillFormMode();
  formTitle.textContent = "新增帳單";
  const formTabButton = document.querySelector('[data-bill-view="form"]');
  if (formTabButton) formTabButton.textContent = "新增帳單";
  resetBtn.classList.add("hidden");
}


function renderGoogleCalendarSettings() {
  if (!googleClientIdInput) return;
  googleClientIdInput.value = settings.googleClientId || "";
  updateGoogleCalendarStatus();
}

function renderGoogleDriveSettings(message = "") {
  if (!googleDriveStatus) return;
  if (message) {
    googleDriveStatus.textContent = message;
    return;
  }

  const backupText = settings.lastGoogleDriveBackupAt
    ? `最近雲端備份：${formatDateTime(settings.lastGoogleDriveBackupAt)}`
    : "尚未建立 Google Drive 雲端備份。";
  googleDriveStatus.textContent = settings.googleClientId
    ? `${backupText} 備份檔會存到 Google Drive App 專用資料夾。`
    : "尚未設定 OAuth Client ID。請先在上方 Google 服務設定貼上 Client ID。";
}

function updateGoogleCalendarStatus(message = "") {
  if (!googleCalendarStatus) return;
  if (message) {
    googleCalendarStatus.textContent = message;
    return;
  }
  googleCalendarStatus.textContent = settings.googleClientId
    ? "已設定 OAuth Client ID。帳單清單可上傳 Google 日曆，也可使用 Google Drive 雲端備份。"
    : "尚未設定 OAuth Client ID。請先貼上 Google Cloud 的 Web OAuth Client ID。";
}

function saveGoogleCalendarClientId() {
  const clientId = googleClientIdInput?.value.trim() || "";
  settings.googleClientId = clientId;
  googleTokenClient = null;
  googleAccessToken = "";
  saveState();
  updateGoogleCalendarStatus(clientId ? "OAuth Client ID 已儲存。" : "已清除 OAuth Client ID。");
  renderGoogleDriveSettings(clientId ? "OAuth Client ID 已儲存，可使用 Google Drive 雲端備份。" : "已清除 OAuth Client ID。");
  showAppToast(clientId ? "Google 服務設定已儲存。" : "Google 服務設定已清除。", "success");
}

function disconnectGoogleCalendar() {
  if (googleAccessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(googleAccessToken, () => {});
  }
  googleAccessToken = "";
  googleTokenClient = null;
  updateGoogleCalendarStatus("已中斷本次 Google 授權；OAuth Client ID 仍保留在設定中。");
  renderGoogleDriveSettings("已中斷本次 Google 授權；OAuth Client ID 仍保留在設定中。");
  showAppToast("已中斷本次 Google 授權。", "success");
}

function waitForGoogleIdentity() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (window.google?.accounts?.oauth2) {
        window.clearInterval(timer);
        resolve();
      }
      if (tries >= 80) {
        window.clearInterval(timer);
        reject(new Error("Google Identity Services 載入失敗"));
      }
    }, 100);
  });
}

function getGoogleAccessToken() {
  return new Promise(async (resolve, reject) => {
    const clientId = settings.googleClientId || "";
    if (!clientId) {
      reject(new Error("尚未設定 Google OAuth Client ID"));
      return;
    }

    try {
      await waitForGoogleIdentity();
    } catch (error) {
      reject(error);
      return;
    }

    googleTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      callback: response => {
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        googleAccessToken = response.access_token || "";
        if (!googleAccessToken) {
          reject(new Error("無法取得 Google 授權權杖"));
          return;
        }
        resolve(googleAccessToken);
      }
    });

    googleTokenClient.requestAccessToken({ prompt: googleAccessToken ? "" : "consent" });
  });
}


function getGoogleDriveBackupMetadata() {
  return {
    name: GOOGLE_DRIVE_BACKUP_FILE_NAME,
    mimeType: "application/json",
    parents: ["appDataFolder"],
    appProperties: {
      app: "payment-manager",
      type: "backup"
    }
  };
}

function createMultipartBody(metadata, jsonText) {
  const boundary = `payment_manager_${crypto.randomUUID().replace(/-/g, "")}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    jsonText,
    `--${boundary}--`
  ].join("\r\n");
  return { boundary, body };
}

async function requestGoogleDriveApi(token, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = result?.error?.message || result || "Google Drive 操作失敗";
    throw new Error(message);
  }
  return result;
}

async function findGoogleDriveBackupFile(token) {
  const query = [
    `name='${GOOGLE_DRIVE_BACKUP_FILE_NAME.replace(/'/g, "\\'")}'`,
    `'appDataFolder' in parents`,
    "trashed=false"
  ].join(" and ");
  const params = new URLSearchParams({
    q: query,
    spaces: "appDataFolder",
    fields: "files(id,name,modifiedTime,size)",
    orderBy: "modifiedTime desc",
    pageSize: "1"
  });
  const result = await requestGoogleDriveApi(token, `https://www.googleapis.com/drive/v3/files?${params.toString()}`);
  return Array.isArray(result.files) && result.files.length > 0 ? result.files[0] : null;
}

async function backupToGoogleDrive() {
  if (!settings.googleClientId) {
    await showAppAlert(
      "請先貼上 Google OAuth Client ID，再使用 Google Drive 雲端備份。\n\nGoogle Cloud 的 OAuth 類型要選 Web application，並把此網頁網址加入 Authorized JavaScript origins。也請確認 Google Drive API 已啟用。",
      { type: "warning", title: "尚未設定 Google 服務" }
    );
    switchTab("settings");
    googleClientIdInput?.focus();
    return;
  }

  try {
    await saveState.lastSavePromise;
    showAppToast("正在上傳 Google Drive 備份…", "success");
    renderGoogleDriveSettings("正在上傳 Google Drive 備份…");

    const token = await getGoogleAccessToken();
    const existing = await findGoogleDriveBackupFile(token);
    const backup = buildBackupPayload();
    const jsonText = JSON.stringify(backup, null, 2);
    const metadata = getGoogleDriveBackupMetadata();
    if (existing?.id) delete metadata.parents;
    const { boundary, body } = createMultipartBody(metadata, jsonText);

    const url = existing?.id
      ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existing.id)}?uploadType=multipart&fields=id,name,modifiedTime`
      : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime";
    const method = existing?.id ? "PATCH" : "POST";
    const result = await requestGoogleDriveApi(token, url, {
      method,
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body
    });

    settings.googleDriveBackupFileId = result.id || existing?.id || "";
    settings.lastGoogleDriveBackupAt = new Date().toISOString();
    settings.lastExportedAt = settings.lastGoogleDriveBackupAt;
    saveState();
    renderBackupReminder();
    renderGoogleDriveSettings(`Google Drive 備份完成：${formatDateTime(settings.lastGoogleDriveBackupAt)}`);
    showAppToast("Google Drive 備份完成。", "success");
  } catch (error) {
    renderGoogleDriveSettings();
    await showAppAlert(
      `Google Drive 備份失敗：${error.message || "請確認 OAuth Client ID、授權來源與 Google Drive API 是否已啟用。"}`,
      { type: "danger", title: "雲端備份失敗" }
    );
  }
}

async function restoreFromGoogleDrive() {
  if (!settings.googleClientId) {
    await showAppAlert("請先貼上 Google OAuth Client ID，再從 Google Drive 還原備份。", { type: "warning", title: "尚未設定 Google 服務" });
    switchTab("settings");
    googleClientIdInput?.focus();
    return;
  }

  try {
    showAppToast("正在讀取 Google Drive 備份…", "success");
    renderGoogleDriveSettings("正在讀取 Google Drive 備份…");

    const token = await getGoogleAccessToken();
    const file = await findGoogleDriveBackupFile(token);
    if (!file?.id) {
      renderGoogleDriveSettings("Google Drive 目前找不到此 App 的雲端備份。");
      await showAppAlert("Google Drive 目前找不到此 App 的雲端備份。請先執行一次「備份到 Drive」。", { type: "warning", title: "找不到雲端備份" });
      return;
    }

    const data = await requestGoogleDriveApi(token, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`);
    const imported = readImportedState(data);
    if (!imported) {
      throw new Error("雲端備份格式不正確，無法還原。");
    }

    const confirmed = await showAppConfirm(
      `${buildImportPreviewMessage(imported)}\n\n雲端檔案更新時間：${file.modifiedTime ? formatDateTime(file.modifiedTime) : "未知"}\n\n確定要用這份 Google Drive 備份覆蓋目前瀏覽器資料嗎？`,
      { title: "從 Google Drive 還原", type: "warning", confirmText: "還原並覆蓋" }
    );
    if (!confirmed) {
      renderGoogleDriveSettings();
      return;
    }

    await applyImportedState(imported);
    settings.googleDriveBackupFileId = file.id;
    settings.lastGoogleDriveBackupAt = file.modifiedTime || imported.settings?.lastGoogleDriveBackupAt || "";
    await saveState();
    render();
    renderGoogleDriveSettings("已從 Google Drive 還原備份。");
    showAppToast("已從 Google Drive 還原備份。", "success");
  } catch (error) {
    renderGoogleDriveSettings();
    await showAppAlert(
      `Google Drive 還原失敗：${error.message || "請確認 OAuth Client ID、授權來源與 Google Drive API 是否已啟用。"}`,
      { type: "danger", title: "雲端還原失敗" }
    );
  }
}

function getGoogleReminderOverrides(cardList) {
  const days = [...new Set(cardList.map(card => Math.max(0, Number(card.remindDays || 0))))]
    .sort((a, b) => b - a)
    .slice(0, 5);
  return days.map(day => ({
    method: "popup",
    minutes: Math.max(0, day * 24 * 60)
  }));
}

function getCardsWithSameDueDate(targetCard) {
  return cards
    .filter(card => card.dueDate === targetCard.dueDate && !card.isPaid)
    .sort((a, b) => {
      if (a.id === targetCard.id) return -1;
      if (b.id === targetCard.id) return 1;
      return getDisplayName(a).localeCompare(getDisplayName(b), "zh-Hant");
    });
}

function buildGoogleCalendarDescription(cardList) {
  if (cardList.length === 1) {
    const card = cardList[0];
    return [
      `帳單類型：${getBillTypeText(card.billType)}`,
      `應繳金額：${Number(card.amount || 0) === 0 ? "待輸入" : formatMoney(card.amount)}`,
      `最低應繳：${Number(card.minimumAmount || 0) === 0 ? "未設定" : formatMoney(card.minimumAmount)}`,
      `繳費方式：${getPaymentMethodText(card)}`,
      card.paymentAccount ? `繳費帳戶：${card.paymentAccount}` : "",
      card.note ? `備註：${card.note}` : ""
    ].filter(Boolean).join("\n");
  }

  return cardList.map((card, index) => [
    `${index + 1}. ${getDisplayName(card)}`,
    `   帳單類型：${getBillTypeText(card.billType)}`,
    `   應繳金額：${Number(card.amount || 0) === 0 ? "待輸入" : formatMoney(card.amount)}`,
    `   最低應繳：${Number(card.minimumAmount || 0) === 0 ? "未設定" : formatMoney(card.minimumAmount)}`,
    `   繳費方式：${getPaymentMethodText(card)}`,
    card.paymentAccount ? `   繳費帳戶：${card.paymentAccount}` : "",
    card.note ? `   備註：${card.note}` : ""
  ].filter(Boolean).join("\n")).join("\n\n");
}

function buildGoogleCalendarEvent(card, cardList = [card]) {
  const billList = cardList.length ? cardList : [card];
  const isMerged = billList.length > 1;
  const title = isMerged
    ? `同日繳費提醒：共 ${billList.length} 筆`
    : `繳費提醒：${getDisplayName(card)}`;

  return {
    summary: title,
    description: buildGoogleCalendarDescription(billList),
    start: {
      dateTime: `${card.dueDate}T09:00:00`,
      timeZone: "Asia/Taipei"
    },
    end: {
      dateTime: `${card.dueDate}T09:30:00`,
      timeZone: "Asia/Taipei"
    },
    reminders: {
      useDefault: false,
      overrides: getGoogleReminderOverrides(billList)
    },
    extendedProperties: {
      private: {
        paymentManagerBillId: card.id,
        paymentManagerBillIds: billList.map(item => item.id).join(","),
        paymentManagerDueDate: card.dueDate,
        paymentManagerMerged: isMerged ? "true" : "false"
      }
    }
  };
}

function getNextDateString(dateString) {
  const date = new Date(`${dateString}T00:00:00+08:00`);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function requestGoogleCalendarApi(token, path, options = {}) {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result?.error?.message || "Google 日曆操作失敗";
    throw new Error(message);
  }
  return result;
}

async function findGooglePaymentEventsByDueDate(token, dueDate) {
  const params = new URLSearchParams({
    timeMin: `${dueDate}T00:00:00+08:00`,
    timeMax: `${getNextDateString(dueDate)}T00:00:00+08:00`,
    singleEvents: "true",
    orderBy: "startTime",
    privateExtendedProperty: `paymentManagerDueDate=${dueDate}`
  });
  const result = await requestGoogleCalendarApi(token, `calendars/primary/events?${params.toString()}`, {
    method: "GET"
  });
  return Array.isArray(result.items) ? result.items : [];
}

function getMergePromptMessage(card, sameDueDateCards, existingEvents) {
  const eventText = existingEvents.length > 0
    ? `Google 日曆已有 ${existingEvents.length} 筆本 App 建立的同日繳費提醒。`
    : "Google 日曆目前沒有找到本 App 建立的同日提醒。";
  const localListText = sameDueDateCards
    .map((item, index) => `${index + 1}. ${getDisplayName(item)}`)
    .join("\n");
  return [
    `${formatDate(card.dueDate)} 同一天有 ${sameDueDateCards.length} 筆未繳帳單。`,
    eventText,
    "",
    localListText,
    "",
    "你要怎麼上傳？"
  ].join("\n");
}

function getReminderSummary(cardList) {
  const days = [...new Set(cardList.map(card => Math.max(0, Number(card.remindDays || 0))))].sort((a, b) => b - a);
  if (!days.length) return "當天提醒";
  if (days.length === 1) return days[0] > 0 ? `提前 ${days[0]} 天提醒` : "當天提醒";
  return days.map(day => day > 0 ? `提前 ${day} 天` : "當天").join("、") + "提醒";
}

async function saveGoogleCalendarEvent(token, eventPayload, existingEvent = null) {
  if (existingEvent?.id) {
    return requestGoogleCalendarApi(token, `calendars/primary/events/${encodeURIComponent(existingEvent.id)}`, {
      method: "PUT",
      body: JSON.stringify(eventPayload)
    });
  }
  return requestGoogleCalendarApi(token, "calendars/primary/events", {
    method: "POST",
    body: JSON.stringify(eventPayload)
  });
}

async function deleteGoogleCalendarEvent(token, eventId) {
  if (!eventId) return;
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status === 404 || response.status === 410) return;
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result?.error?.message || "Google 日曆刪除失敗");
  }
}

async function updateMergedGoogleEventAfterLocalChange(token, eventId, dueDate, excludeIds = []) {
  if (!eventId) return { action: "none", count: 0 };
  const remainingCards = getGoogleSyncedCardsByEvent(eventId, dueDate, excludeIds);
  if (remainingCards.length === 0) {
    await deleteGoogleCalendarEvent(token, eventId);
    clearGoogleSyncFieldsByEvent(eventId);
    return { action: "deleted", count: 0 };
  }
  const eventPayload = buildGoogleCalendarEvent(remainingCards[0], remainingCards);
  const result = await saveGoogleCalendarEvent(token, eventPayload, { id: eventId });
  applyGoogleSyncFields(remainingCards, result, remainingCards.length > 1 ? "merge" : "single");
  clearGoogleSyncFieldsByEvent(eventId, remainingCards.map(card => card.id));
  return { action: "updated", count: remainingCards.length, result };
}

async function removeGoogleEventForCard(token, cardSnapshot) {
  if (!cardSnapshot?.googleCalendarEventId) return { action: "none", count: 0 };
  if (cardSnapshot.googleCalendarMode === "merge") {
    return updateMergedGoogleEventAfterLocalChange(token, cardSnapshot.googleCalendarEventId, cardSnapshot.googleCalendarDueDate || cardSnapshot.dueDate, [cardSnapshot.id]);
  }
  await deleteGoogleCalendarEvent(token, cardSnapshot.googleCalendarEventId);
  clearGoogleSyncFieldsByEvent(cardSnapshot.googleCalendarEventId);
  return { action: "deleted", count: 0 };
}

async function syncExistingGoogleEventForCard(token, card, oldCard = null) {
  const oldEventId = oldCard?.googleCalendarEventId || card.googleCalendarEventId;
  const oldMode = oldCard?.googleCalendarMode || card.googleCalendarMode;
  const oldDueDate = oldCard?.googleCalendarDueDate || oldCard?.dueDate || card.dueDate;

  if (!oldEventId) {
    await uploadToGoogleCalendar(card);
    return;
  }

  if (oldMode === "merge") {
    if (oldDueDate && oldDueDate !== card.dueDate) {
      await updateMergedGoogleEventAfterLocalChange(token, oldEventId, oldDueDate);
      clearGoogleSyncFields(card);
      await uploadToGoogleCalendar(card);
      return;
    }
    const mergedCards = getCardsWithSameDueDate(card);
    const eventPayload = buildGoogleCalendarEvent(card, mergedCards);
    const result = await saveGoogleCalendarEvent(token, eventPayload, { id: oldEventId });
    applyGoogleSyncFields(mergedCards, result, mergedCards.length > 1 ? "merge" : "single");
    saveState();
    return;
  }

  const eventPayload = buildGoogleCalendarEvent(card, [card]);
  const result = await saveGoogleCalendarEvent(token, eventPayload, { id: oldEventId });
  applyGoogleSyncFields([card], result, "single");
  saveState();
}

async function askRemoveGoogleReminderForPaidCard(cardSnapshot) {
  if (!cardSnapshot?.googleCalendarEventId) return false;
  const confirmed = await showAppConfirm(
    `「${getDisplayName(cardSnapshot)}」已經同步到 Google 日曆。

標記已繳後，要一起移除或更新 Google 日曆提醒嗎？`,
    { title: "同步 Google 日曆", type: "warning", confirmText: "移除 / 更新", cancelText: "保留提醒" }
  );
  if (!confirmed) return false;
  const token = await getGoogleAccessToken();
  await removeGoogleEventForCard(token, cardSnapshot);
  saveState();
  return true;
}

async function handleGoogleSyncAfterDelete(cardSnapshot) {
  if (!cardSnapshot?.googleCalendarEventId) return true;
  const choice = await showAppChoiceDialog({
    title: "刪除 Google 日曆提醒？",
    type: "danger",
    message: `「${getDisplayName(cardSnapshot)}」已同步到 Google 日曆。

刪除帳單時，要怎麼處理 Google 日曆事件？`,
    choices: [
      { label: "刪除帳單並更新日曆", value: "with-google", variant: "danger" },
      { label: "只刪除本機帳單", value: "local-only" },
      { label: "取消", value: "cancel" }
    ]
  });
  if (!choice || choice === "cancel") return false;
  if (choice === "with-google") {
    const token = await getGoogleAccessToken();
    // 先從本機移除後，再用剩下的帳單反向更新同日合併事件。
    cards = cards.filter(item => item.id !== cardSnapshot.id);
    await removeGoogleEventForCard(token, cardSnapshot);
    saveState();
    render();
    showAppToast("已刪除帳單並同步更新 Google 日曆。", "success");
    return false;
  }
  return true;
}

async function handleGoogleSyncAfterEdit(oldCard, updatedCard) {
  if (!oldCard?.googleCalendarEventId) return;
  const confirmed = await showAppConfirm(
    `「${getDisplayName(updatedCard)}」已同步到 Google 日曆。

要把這次修改同步更新到 Google 日曆事件嗎？`,
    { title: "同步更新 Google 日曆", type: "success", confirmText: "同步更新", cancelText: "稍後再同步" }
  );
  if (!confirmed) return;
  const token = await getGoogleAccessToken();
  await syncExistingGoogleEventForCard(token, updatedCard, oldCard);
  saveState();
  render();
  showAppToast("Google 日曆事件已更新。", "success");
}

async function uploadToGoogleCalendar(card) {
  if (!settings.googleClientId) {
    await showAppAlert(
      "請先到「設定」貼上你的 Google OAuth Client ID，再回到帳單清單上傳。\n\nGoogle Cloud 的 OAuth 類型要選 Web application，並把此網頁網址加入 Authorized JavaScript origins。",
      { type: "warning", title: "尚未設定 Google 日曆" }
    );
    switchTab("settings");
    googleClientIdInput?.focus();
    return;
  }

  try {
    showAppToast("正在取得 Google 授權…", "success");
    const token = await getGoogleAccessToken();
    const sameDueDateCards = getCardsWithSameDueDate(card);
    const existingEvents = await findGooglePaymentEventsByDueDate(token, card.dueDate);

    let mode = "single";
    if (sameDueDateCards.length > 1 || existingEvents.length > 0) {
      mode = await showAppChoiceDialog({
        title: "這一天已有其他繳費提醒",
        type: "warning",
        message: getMergePromptMessage(card, sameDueDateCards, existingEvents),
        choices: [
          { label: existingEvents.length > 0 ? "合併並更新原事件" : "合併成同一天提醒", value: "merge", variant: "primary" },
          { label: "仍然單獨新增", value: "single" },
          { label: "取消", value: "cancel" }
        ]
      });
      if (!mode || mode === "cancel") return;
    }

    const cardList = mode === "merge" ? sameDueDateCards : [card];
    const eventPayload = buildGoogleCalendarEvent(card, cardList);
    const result = await saveGoogleCalendarEvent(
      token,
      eventPayload,
      mode === "merge" ? existingEvents[0] : (card.googleCalendarEventId ? { id: card.googleCalendarEventId } : null)
    );

    applyGoogleSyncFields(cardList, result, mode === "merge" ? "merge" : "single");
    if (mode === "single") {
      clearGoogleSyncFieldsByEvent(result.id, [card.id]);
    }
    saveState();
    renderCards();

    const eventDate = card.dueDate ? formatDate(card.dueDate) : "繳費截止日";
    const reminderText = getReminderSummary(cardList);
    const uploadText = mode === "merge" && existingEvents.length > 0 ? "已成功更新 Google 日曆事件。" : "已成功新增到 Google 日曆。";
    const countText = cardList.length > 1 ? `本日帳單：共 ${cardList.length} 筆` : `事件名稱：${eventPayload.summary}`;

    await showAppDialog({
      title: "上傳完成",
      type: "success",
      message: `${uploadText}\n${countText}\n日期時間：${eventDate} 09:00–09:30\n提醒設定：${reminderText}`,
      confirmText: "知道了",
      actionText: result.htmlLink ? "開啟 Google 日曆" : "",
      actionUrl: result.htmlLink || ""
    });
  } catch (error) {
    await showAppAlert(
      `上傳失敗：${error.message || "請確認 OAuth Client ID、授權來源與 Google Calendar API 是否已啟用。"}`,
      { type: "danger", title: "Google 日曆上傳失敗" }
    );
  }
}

function createCalendarFile(card) {
  const due = new Date(`${card.dueDate}T09:00:00`);
  const end = new Date(`${card.dueDate}T09:30:00`);
  const remindDays = Number(card.remindDays || 0);
  const title = `繳費提醒：${getDisplayName(card)}`;
  const description = `應繳金額：${Number(card.amount || 0) === 0 ? "待輸入" : formatMoney(card.amount)}\\n備註：${card.note || "無"}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Payment Manager//ZH-TW",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@payment-manager`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(due)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "BEGIN:VALARM",
    `TRIGGER:-P${remindDays}D`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${getDisplayName(card)}-${card.dueDate}-繳費提醒.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatIcsDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const sec = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${sec}`;
}

function escapeIcs(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}


const NOTIFIED_KEY = NOTIFIED_ID;

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function readNotifiedMap() {
  try {
    const current = await idbGet(NOTIFIED_KEY);
    if (current && typeof current === "object") return current;

    const legacyRaw = localStorage.getItem(NOTIFIED_KEY);
    const legacy = legacyRaw ? JSON.parse(legacyRaw) : {};
    if (legacy && typeof legacy === "object") {
      await idbSet(NOTIFIED_KEY, legacy);
      return legacy;
    }
  } catch (error) {
    console.error("通知紀錄讀取失敗：", error);
  }
  return {};
}

function saveNotifiedMap(map) {
  idbSet(NOTIFIED_KEY, map).catch(error => {
    console.error("通知紀錄儲存失敗：", error);
  });
}

function supportsNotifications() {
  return "Notification" in window && "serviceWorker" in navigator;
}

function updateNotificationButtons() {
  if (!notifyBtn || !testNotifyBtn) return;
  if (!supportsNotifications()) {
    notifyBtn.textContent = "此裝置不支援通知";
    notifyBtn.disabled = true;
    testNotifyBtn.classList.add("hidden");
    return;
  }

  if (Notification.permission === "granted") {
    notifyBtn.textContent = "通知已開啟";
    testNotifyBtn.classList.remove("hidden");
  } else if (Notification.permission === "denied") {
    notifyBtn.textContent = "通知被封鎖，請到瀏覽器設定開啟";
    testNotifyBtn.classList.add("hidden");
  } else {
    notifyBtn.textContent = "開啟繳費通知";
    testNotifyBtn.classList.add("hidden");
  }
}

async function getServiceWorkerRegistration() {
  if (!supportsNotifications()) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

async function showPaymentNotification(title, body, tag = "payment-manager") {
  if (!supportsNotifications() || Notification.permission !== "granted") return;
  const registration = await getServiceWorkerRegistration();
  const options = {
    body,
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag,
    renotify: true,
    data: { url: location.href }
  };

  if (registration?.showNotification) {
    registration.showNotification(title, options);
  } else {
    new Notification(title, options);
  }
}

function getCardsForNotification() {
  return cards
    .filter(card => !card.isPaid)
    .map(card => ({ ...card, diffDays: getDiffDays(card.dueDate) }))
    .filter(card => card.diffDays <= Number(card.remindDays || 0))
    .sort((a, b) => a.diffDays - b.diffDays);
}

async function checkDueNotifications({ force = false } = {}) {
  if (!supportsNotifications() || Notification.permission !== "granted") return;
  const targets = getCardsForNotification();
  if (targets.length === 0) return;

  const todayKey = getTodayKey();
  const notifiedMap = await readNotifiedMap();
  let sent = false;

  for (const card of targets) {
    const key = `${todayKey}:${card.id}:${card.dueDate}`;
    if (!force && notifiedMap[key]) continue;

    let timing = "";
    if (card.diffDays < 0) timing = `已逾期 ${Math.abs(card.diffDays)} 天`;
    else if (card.diffDays === 0) timing = "今天截止";
    else timing = `剩 ${card.diffDays} 天截止`;

    const notificationParts = [
      timing,
      `金額：${Number(card.amount || 0) === 0 ? "待輸入" : formatMoney(card.amount)}`,
      `方式：${getPaymentMethodText(card)}`
    ];
    if (card.paymentAccount) notificationParts.push(`帳戶：${card.paymentAccount}`);
    if (card.note) notificationParts.push(`備註：${card.note}`);

    await showPaymentNotification(
      `繳費提醒：${getDisplayName(card)}`,
      notificationParts.join("｜"),
      `payment-manager-${card.id}-${card.dueDate}`
    );
    notifiedMap[key] = true;
    sent = true;
  }

  if (sent) saveNotifiedMap(notifiedMap);
}

async function requestNotificationPermission() {
  if (!supportsNotifications()) {
    await showAppAlert("這個瀏覽器或裝置不支援通知功能。建議改用加入行事曆提醒。", { type: "warning", title: "無法使用通知" });
    updateNotificationButtons();
    return;
  }

  const permission = await Notification.requestPermission();
  updateNotificationButtons();

  if (permission === "granted") {
    await showPaymentNotification("繳費管理通知已開啟", "之後打開 App 時，快到期或逾期帳單會跳出提醒。", "payment-manager-enabled");
    await checkDueNotifications({ force: false });
  } else if (permission === "denied") {
    await showAppAlert("通知權限被封鎖。請到手機瀏覽器或系統設定中，允許此網站通知。需要更穩定提醒時，可使用「加入行事曆」。", { type: "warning", title: "通知權限被封鎖" });
  }
}

function setupEventListeners() {
accountSubtabButtons.forEach(button => {
  button.addEventListener("click", () => switchAccountView(button.dataset.accountView));
});

accountSearchInput?.addEventListener("input", event => {
  accountSearchKeyword = event.target.value || "";
  renderAccounts();
});

importBrowserPasswordsBtn?.addEventListener("click", () => {
  if (!accountVaultUnlocked) {
    showAppAlert("請先解鎖帳號資料，再匯入帳號密碼。", { type: "warning", title: "帳號資料未解鎖" });
    return;
  }
  browserPasswordImportFile?.click();
});

browserPasswordImportFile?.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) importBrowserPasswordCsv(file);
});

accountForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!accountVaultUnlocked) {
    showAppAlert("請先解鎖帳號資料。", { type: "warning" });
    return;
  }
  const now = new Date().toISOString();
  const account = normalizeAccount({
    id: accountFields.accountId.value || crypto.randomUUID(),
    service: accountFields.service.value,
    username: accountFields.username.value,
    password: accountFields.password.value,
    url: accountFields.url.value,
    note: accountFields.note.value,
    createdAt: now,
    updatedAt: now
  });

  if (!account) {
    showAppAlert("請至少填寫服務名稱與帳號 / 用戶編號。", { type: "warning", title: "資料未完整" });
    return;
  }

  const existing = accounts.find(item => item.id === account.id);
  if (existing) {
    account.createdAt = existing.createdAt;
    accounts = accounts.map(item => item.id === account.id ? account : item);
  } else {
    accounts.push(account);
  }
  const saved = await saveEncryptedAccounts();
  if (!saved) return;
  resetAccountForm();
  renderAccounts();
  switchAccountView("list");
});

accountVaultForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const ok = await unlockAccountVault(accountVaultPassword?.value || "");
  if (ok && accountVaultPassword) accountVaultPassword.value = "";
});

lockAccountBtn?.addEventListener("click", lockAccountVault);
forgotMasterPasswordBtn?.addEventListener("click", resetEncryptedAccountVault);

changeMasterPasswordBtn?.addEventListener("click", () => {
  if (!accountVaultUnlocked) {
    setAccountVaultStatus("請先解鎖帳號資料，再更改主密碼。", "error");
    return;
  }
  changeMasterPasswordForm?.classList.contains("hidden")
    ? showChangeMasterPasswordForm()
    : hideChangeMasterPasswordForm();
});

cancelChangeMasterPasswordBtn?.addEventListener("click", hideChangeMasterPasswordForm);

changeMasterPasswordForm?.addEventListener("submit", async event => {
  event.preventDefault();
  await changeAccountMasterPassword(
    newMasterPassword?.value || "",
    confirmMasterPassword?.value || ""
  );
});

accountList?.addEventListener("change", event => {
  const checkbox = event.target.closest("[data-account-select]");
  if (!checkbox) return;
  const id = checkbox.dataset.accountSelect;
  if (checkbox.checked) selectedAccountIds.add(id);
  else selectedAccountIds.delete(id);
  updateAccountBulkToolbar();
});

accountList?.addEventListener("click", async event => {
  const selector = event.target.closest(".account-select-row, [data-account-select]");
  if (selector) {
    event.stopPropagation();
    return;
  }
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.accountAction;
  const id = button.dataset.id;
  const account = accounts.find(item => item.id === id);
  if (!account) return;

  if (action === "copy-user") return copyText(account.username, "帳號");
  if (action === "copy-password") return copyText(account.password, "密碼");

  if (action === "toggle-password" && account.password) {
    const row = accountList.querySelector(`[data-password-row="${CSS.escape(id)}"]`);
    if (!row) return;
    const isHidden = row.dataset.visible !== "true";
    row.dataset.visible = isHidden ? "true" : "false";
    row.textContent = isHidden ? `密碼：${account.password}` : "密碼：••••••••";
    button.textContent = isHidden ? "隱藏" : "顯示";
    return;
  }

  if (action === "edit") {
    accountFields.accountId.value = account.id;
    accountFields.service.value = account.service;
    accountFields.username.value = account.username;
    accountFields.password.value = account.password;
    accountFields.url.value = account.url;
    accountFields.note.value = account.note;
    resetAccountBtn?.classList.remove("hidden");
    switchTab("accounts", { scroll: false });
    switchAccountView("form");
    return;
  }

  if (action === "delete") {
    const confirmed = await showAppConfirm(
      `確定要刪除「${account.service}」的帳號備忘嗎？`,
      { title: "刪除帳號備忘", type: "danger", confirmText: "刪除" }
    );
    if (!confirmed) return;
    accounts = accounts.filter(item => item.id !== id);
    selectedAccountIds.delete(id);
    await saveEncryptedAccounts();
    renderAccounts();
  }
});

selectAllAccounts?.addEventListener("change", event => {
  const filteredAccounts = getFilteredAccountsForSelection();
  if (event.target.checked) {
    filteredAccounts.forEach(account => selectedAccountIds.add(account.id));
  } else {
    filteredAccounts.forEach(account => selectedAccountIds.delete(account.id));
  }
  renderAccounts();
});

deleteSelectedAccountsBtn?.addEventListener("click", deleteSelectedAccounts);

resetAccountBtn?.addEventListener("click", resetAccountForm);

form.addEventListener("submit", async event => {
  event.preventDefault();

  const scheduleType = getBillScheduleType(fields.billType.value);
  const monthlyPayment = scheduleType === "monthly";
  const creditCardBill = scheduleType === "credit-card";
  const recurringDay = monthlyPayment ? Number(fields.monthlyPaymentDay.value || 0) : 0;
  const dueDateValue = monthlyPayment ? getNextDueDateFromDay(recurringDay) : fields.dueDate.value;

  const card = normalizeCard({
    id: fields.cardId.value || crypto.randomUUID(),
    billType: fields.billType.value,
    bankName: fields.bankName.value.trim(),
    cardName: fields.cardName.value.trim(),
    statementDate: creditCardBill ? fields.statementDate.value : "",
    dueDate: dueDateValue,
    recurringDay,
    amount: fields.amount.value === "" ? 0 : Number(fields.amount.value),
    amountMode: fields.amountMode.value,
    minimumAmount: creditCardBill ? Number(fields.minimumAmount.value || 0) : 0,
    paymentMethod: fields.paymentMethod.value,
    billingMode: fields.billingMode.value,
    paymentAccount: fields.paymentAccount.value.trim(),
    remindDays: Number(fields.remindDays.value),
    note: fields.note.value.trim(),
    isPaid: false
  });

  if (!card) {
    showAppAlert(monthlyPayment ? "請確認名稱、每月付款日與提醒天數都已正確填寫。" : "請確認名稱、日期與提醒天數都已正確填寫。", { type: "warning", title: "資料未完整" });
    return;
  }

  const existing = cards.find(item => item.id === card.id);
  if (existing) {
    const changedBillDetails = existing.statementDate !== card.statementDate
      || existing.dueDate !== card.dueDate
      || Number(existing.recurringDay || 0) !== Number(card.recurringDay || 0)
      || Number(existing.amount || 0) !== Number(card.amount || 0)
      || normalizeAmountMode(existing.amountMode || getDefaultAmountMode(existing.billType)) !== normalizeAmountMode(card.amountMode)
      || Number(existing.minimumAmount || 0) !== Number(card.minimumAmount || 0);
    card.isPaid = existing.isPaid && !changedBillDetails;
    card.lastPaidAt = existing.lastPaidAt;
    card.lastPaidSummary = existing.lastPaidSummary;
    card.googleCalendarEventId = existing.googleCalendarEventId || "";
    card.googleCalendarEventHtmlLink = existing.googleCalendarEventHtmlLink || "";
    card.googleCalendarSyncedAt = existing.googleCalendarSyncedAt || "";
    card.googleCalendarMode = existing.googleCalendarMode || "";
    card.googleCalendarDueDate = existing.googleCalendarDueDate || "";
    card.googleCalendarBillIds = existing.googleCalendarBillIds || [];
    cards = cards.map(item => item.id === card.id ? card : item);
  } else {
    cards.push(card);
  }

  saveState();
  resetForm();
  render();
  switchBillView("list");

  if (existing?.googleCalendarEventId) {
    try {
      await handleGoogleSyncAfterEdit(existing, card);
    } catch (error) {
      await showAppAlert(
        `帳單已儲存，但 Google 日曆同步失敗：${error.message || "請稍後再試。"}`,
        { type: "danger", title: "Google 日曆同步失敗" }
      );
    }
  }
});

document.querySelector("#tab-bills")?.addEventListener("click", event => {
  const button = event.target.closest("[data-due-card-id]");
  if (!button) return;
  const id = button.dataset.dueCardId;
  const target = cardList?.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (target) {
    switchBillView("list");
    target.closest(".bill-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    target.closest(".bill-card")?.classList.add("focus-flash");
    window.setTimeout(() => target.closest(".bill-card")?.classList.remove("focus-flash"), 1300);
  }
});

cardList.addEventListener("click", async event => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const card = cards.find(item => item.id === id);
  if (!card) return;

  if (action === "quick-amount") {
    await quickUpdateCardAmount(card);
    return;
  }

  if (action === "detail") {
    showBillDetail(card);
    return;
  }

  if (action === "next-cycle") {
    const isManualMode = card.billingMode === "manual";
    const message = isManualMode
      ? `確定「${getDisplayName(card)}」已繳費嗎？\n\n手動模式只會留下繳費紀錄，不會建立下一期帳單。`
      : `確定「${getDisplayName(card)}」已繳費，並建立下一期帳單嗎？`;
    const confirmed = await showAppConfirm(message, {
      title: "確認繳費狀態",
      type: "success",
      confirmText: isManualMode ? "標記已繳" : "建立下一期"
    });
    if (!confirmed) return;
    const cardSnapshot = { ...card };
    try {
      await askRemoveGoogleReminderForPaidCard(cardSnapshot);
    } catch (error) {
      await showAppAlert(
        `Google 日曆同步失敗，尚未變更繳費狀態：${error.message || "請稍後再試。"}`,
        { type: "danger", title: "Google 日曆同步失敗" }
      );
      return;
    }
    if (isManualMode) {
      markPaidWithoutNextCycle(card);
      if (cardSnapshot.googleCalendarEventId) clearGoogleSyncFields(card);
    } else {
      moveToNextBillingCycle(card);
    }
    showAppToast("繳費狀態已更新。", "success");
  }

  if (action === "google-calendar") {
    await uploadToGoogleCalendar(card);
    return;
  }

  if (action === "delete") {
    const confirmed = await showAppConfirm(
      `確定要刪除「${getDisplayName(card)}」嗎？`,
      { title: "刪除帳單", type: "danger", confirmText: "刪除" }
    );
    if (!confirmed) return;
    try {
      const shouldContinueLocalDelete = await handleGoogleSyncAfterDelete({ ...card });
      if (!shouldContinueLocalDelete) return;
    } catch (error) {
      await showAppAlert(
        `Google 日曆同步失敗，尚未刪除帳單：${error.message || "請稍後再試。"}`,
        { type: "danger", title: "Google 日曆同步失敗" }
      );
      return;
    }
    cards = cards.filter(item => item.id !== id);
  }

  if (action === "edit") {
    fields.cardId.value = card.id;
    fields.billType.value = card.billType || "credit-card";
    fields.bankName.value = card.bankName;
    fields.cardName.value = card.cardName;
    fields.statementDate.value = card.statementDate || "";
    fields.dueDate.value = card.dueDate;
    fields.monthlyPaymentDay.value = isMonthlyPaymentType(card.billType) ? String(getMonthlyPaymentDay(card)) : "";
    fields.amount.value = Number(card.amount || 0) === 0 ? "" : card.amount;
    fields.amountMode.value = normalizeAmountMode(card.amountMode || getDefaultAmountMode(card.billType));
    fields.minimumAmount.value = isCreditCardBillType(card.billType) ? (card.minimumAmount || "") : "";
    fields.paymentMethod.value = card.paymentMethod || "manual";
    fields.billingMode.value = card.billingMode || "recurring";
    fields.paymentAccount.value = card.paymentAccount || "";
    fields.remindDays.value = card.remindDays ?? 3;
    fields.note.value = card.note || "";
    updateBillFormMode({ preserveAmountMode: true });
    formTitle.textContent = "編輯帳單";
    const formTabButton = document.querySelector('[data-bill-view="form"]');
    if (formTabButton) formTabButton.textContent = "編輯帳單";
    resetBtn.classList.remove("hidden");
    switchTab("bills", { scroll: false });
    switchBillView("form");
    return;
  }

  saveState();
  render();
});

tabButtons.forEach(button => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

billSubtabButtons.forEach(button => {
  button.addEventListener("click", () => switchBillView(button.dataset.billView));
});

filterSelect.addEventListener("change", renderCards);
typeFilterSelect?.addEventListener("change", renderCards);
fields.billType?.addEventListener("change", () => updateBillFormMode());
searchInput.addEventListener("input", renderCards);
resetBtn.addEventListener("click", resetForm);
exportBtn.addEventListener("click", exportData);
backupNowBtn?.addEventListener("click", exportData);
saveGoogleClientIdBtn?.addEventListener("click", saveGoogleCalendarClientId);
disconnectGoogleCalendarBtn?.addEventListener("click", disconnectGoogleCalendar);
backupToGoogleDriveBtn?.addEventListener("click", backupToGoogleDrive);
restoreFromGoogleDriveBtn?.addEventListener("click", restoreFromGoogleDrive);
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) importData(file);
});

notifyBtn?.addEventListener("click", requestNotificationPermission);
testNotifyBtn?.addEventListener("click", () => showPaymentNotification("測試通知", "房租今天截止｜金額：$10,000｜方式：手動繳費｜帳戶：中信活存｜備註：匯款給房東", "payment-manager-test"));

toggleHistoryBtn?.addEventListener("click", () => {
  isHistoryExpanded = !isHistoryExpanded;
  renderHistory();
});

clearHistoryBtn.addEventListener("click", async () => {
  if (history.length === 0) return;
  const confirmed = await showAppConfirm(
    "確定要清除所有繳費紀錄嗎？卡片資料不會被刪除。",
    { title: "清除繳費紀錄", type: "danger", confirmText: "清除" }
  );
  if (!confirmed) return;
  history = [];
  isHistoryExpanded = false;
  saveState();
  renderHistory();
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    await navigator.serviceWorker.register("service-worker.js");
    updateNotificationButtons();
    checkDueNotifications();
  });
}

  updateNotificationButtons();
  updateAccountVaultUI();
  updateBillFormMode();
  setInterval(() => checkDueNotifications(), 60 * 60 * 1000);
  render();
}

async function initializeApp() {
  try {
    loadedState = await loadState();
  } catch (error) {
    console.error("IndexedDB 載入失敗：", error);
    await showAppAlert(
      "無法開啟瀏覽器資料庫，已先以空白資料啟動。請確認瀏覽器沒有封鎖網站儲存權限。",
      { type: "danger", title: "資料庫載入失敗" }
    );
    loadedState = { cards: [], history: [], encryptedAccounts: null, legacyAccounts: [], settings: defaultSettings() };
  }

  cards = loadedState.cards;
  history = loadedState.history;
  encryptedAccounts = loadedState.encryptedAccounts || null;
  settings = loadedState.settings;
  legacyAccounts = loadedState.legacyAccounts || [];

  setupEventListeners();
}

initializeApp();

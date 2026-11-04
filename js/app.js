/**
 * ============================================================================
 * HEARTMED 哈瑞特医疗 — 问诊手表 × 微信扫码 H5 交互系统控制器 (White-Tech 版)
 * ============================================================================
 * 支持：
 *   Step 1: 首次登录 -> 微信扫描手表二维码绑定
 *   Step 2: 手机 H5 注册登录 <-> 手表绑定完成
 *   Step 3: 手机端极简引导教程 > 手表端语音练习
 *   Step 4: 问诊对话（支持键盘直接打字 & 一键演示自动打字）& 患者信息抽屉配置
 *   Step 5: ★ 科技光球动画与纯白科技 UI 设计细节独立展示页（支持 5 层结构逐层拆解）
 */

(function () {
  "use strict";

  const orbManager = window.TechOrbManager;
  const store = window.PatientStore;

  const state = {
    currentStep: 4,
    h5SubPage: "chat", // 'chat' | 'person_select' | 'profile_edit'
    prevSubPage: "chat",
    orbState: "idle",
    isHoldingVoice: false,
    inputMode: "text", // 'text' | 'voice'
    holdTimer: null,
    typingTimer: null,
    editingMode: "edit", // 'edit' | 'create'
    sampleUtterances: [
      "我今天早上起来有点头晕，测了血压是 146/92，要不要紧？",
      "昨晚胸口有点发闷，阿司匹林和氨氯地平还要继续吃吗？",
      "刚拿到的生化报告单里血脂和尿酸偏高，平时饮食要注意什么？"
    ],
    utteranceCursor: 0
  };

  const els = {};

  function cacheElements() {
    // Top Flow Navigation
    els.stepBtns = document.querySelectorAll(".flow-step-btn[data-step]");
    els.orbChips = document.querySelectorAll(".orb-chip[data-orb-state]");

    // Main Containers
    els.devicesArena = document.getElementById("devices-arena");
    els.orbSpecStage = document.getElementById("orb-spec-stage");

    // Phone Views & Topbar
    els.phoneClock = document.getElementById("phone-clock");
    els.h5Topbar = document.getElementById("h5-topbar");
    els.topbarBackBtn = document.getElementById("btn-topbar-back");
    els.topbarBackLabel = document.getElementById("topbar-back-label");
    els.topbarPtBtn = document.getElementById("btn-topbar-pt");
    els.topbarPtText = document.getElementById("topbar-pt-text");
    els.topbarPageTitle = document.getElementById("topbar-page-title");
    els.btnTopbarAddPerson = document.getElementById("btn-topbar-add-person");
    els.btnTopbarSaveProfile = document.getElementById("btn-topbar-save-profile");
    els.phoneViews = {
      1: document.getElementById("phone-view-1"),
      2: document.getElementById("phone-view-2"),
      3: document.getElementById("phone-view-3"),
      4: document.getElementById("phone-view-4")
    };

    // Watch Views
    els.watchViews = {
      1: document.getElementById("watch-view-1"),
      2: document.getElementById("watch-view-2"),
      3: document.getElementById("watch-view-3")
    };
    els.bridgeStatusText = document.getElementById("bridge-status-text");

    // Step 1: QR Scan
    els.btnSimulateScan = document.getElementById("btn-simulate-scan");
    els.btnScanAction = document.getElementById("btn-scan-action");
    els.watchQrTrigger = document.getElementById("watch-qr-trigger");

    // Step 2: Auth
    els.authTabs = document.querySelectorAll(".cyber-auth-tab[data-auth-mode]");
    els.authForm = document.getElementById("auth-form");
    els.authSubmitText = document.getElementById("auth-submit-text");
    els.btnWatchNextStep = document.getElementById("btn-watch-next-step");

    // Step 3: Guide & Practice
    els.guidePracticeStatus = document.getElementById("guide-practice-status");
    els.btnGuideTestVoice = document.getElementById("btn-guide-test-voice");
    els.btnGuideFinish = document.getElementById("btn-guide-finish");

    // Step 4 Subpages: Chat Subpage & Unified User Info Subpage
    els.chatSubpage = document.getElementById("h5-chat-subpage");
    els.profileEditPage = document.getElementById("h5-profile-edit-page");
    els.profileEditTitle = document.getElementById("profile-edit-title");
    els.ptQuickSelect = document.getElementById("pt-quick-select");
    els.customPtDropdown = document.getElementById("custom-pt-dropdown");
    els.btnCustomPtTrigger = document.getElementById("btn-custom-pt-trigger");
    els.customPtLabel = document.getElementById("custom-pt-label");
    els.menuSelfGroup = document.getElementById("menu-self-group");
    els.menuPresetGroup = document.getElementById("menu-preset-group");
    els.ptChipsList = document.getElementById("pt-chips-list");
    els.personSelectPage = document.getElementById("h5-person-select-page");
    els.fullSelfList = document.getElementById("full-self-list");
    els.fullPresetList = document.getElementById("full-preset-list");
    els.topbarBrandFixed = document.getElementById("topbar-brand-fixed");
    els.h5OrbTouch = document.getElementById("h5-orb-touch");
    els.chatList = document.getElementById("cyber-chat-list");
    els.chatBottomDock = document.getElementById("chat-bottom-dock");
    els.btnChatMic = document.getElementById("btn-chat-mic") || document.getElementById("btn-h5-voice-hold");
    els.btnH5VoiceHold = els.btnChatMic;
    els.voiceSpeakingCapsule = document.getElementById("voice-speaking-capsule");
    els.voiceRecTimer = document.getElementById("voice-rec-timer");
    els.btnVoiceCancel = document.getElementById("btn-voice-cancel");
    els.h5DockSpeechBubble = document.getElementById("h5-dock-speech-bubble");
    els.h5SpeechText = document.getElementById("h5-speech-text");
    els.chatForm = document.getElementById("cyber-chat-form");
    els.chatInput = document.getElementById("cyber-chat-input");
    els.btnCyberSend = document.getElementById("btn-cyber-send");
    els.topbarBrandFixed = document.getElementById("topbar-brand-fixed");

    // Person Selector Elements
    els.patientSheet = document.getElementById("h5-patient-sheet");
    els.btnCloseSheet = document.getElementById("btn-close-sheet");
    els.sheetSelfList = document.getElementById("sheet-self-list");
    els.sheetPresetList = document.getElementById("sheet-preset-list");
    els.ptLoadedBadge = document.getElementById("pt-loaded-badge");
    els.btnPtCreate = document.getElementById("btn-pt-create");
    els.btnPtDelete = document.getElementById("btn-pt-delete");

    // Step 3: Main User Onboarding Form (User's OWN Profile Only)
    els.selfOnboardingForm = document.getElementById("self-onboarding-form");
    els.sPtName = document.getElementById("s-pt-name");
    els.sPtGender = document.getElementById("s-pt-gender");
    els.selfGenderSegBtns = document.querySelectorAll(".gender-seg-btn[data-self-gender]");
    els.sPtAge = document.getElementById("s-pt-age");
    els.sPtWeight = document.getElementById("s-pt-weight");
    els.sPtHeight = document.getElementById("s-pt-height");
    els.sPtHistory = document.getElementById("s-pt-history");
    els.sPtMeds = document.getElementById("s-pt-meds");
    els.sPtExtra = document.getElementById("s-pt-extra");
    els.btnEnterConsult = document.getElementById("btn-enter-consult");

    // Step 4 Right-Corner Role Switcher & 8-Field Form (#h5-profile-edit-page)
    els.ptEditForm = document.getElementById("pt-edit-form");
    els.fPtId = document.getElementById("f-pt-id");
    els.fPtName = document.getElementById("f-pt-name");
    els.fPtGender = document.getElementById("f-pt-gender");
    els.genderSegBtns = document.querySelectorAll("#edit-gender-seg .gender-seg-btn[data-gender]");
    els.fPtAge = document.getElementById("f-pt-age");
    els.fPtWeight = document.getElementById("f-pt-weight");
    els.fPtHeight = document.getElementById("f-pt-height");
    els.fPtHistory = document.getElementById("f-pt-history");
    els.fPtMeds = document.getElementById("f-pt-meds");
    els.fPtExtra = document.getElementById("f-pt-extra");
    els.btnPtCancel = document.getElementById("btn-pt-cancel");

    // Smartwatch Controls
    els.watchCrownBtn = document.getElementById("watch-crown-btn");
    els.btnWatchHold = document.getElementById("btn-watch-hold");
    els.watchHoldLabel = document.getElementById("watch-hold-label");
    els.watchSpeechBubble = document.getElementById("watch-speech-bubble");
    els.watchSimBtns = document.querySelectorAll(".btn-watch-sim[data-watch-sim]");

    // Step 5: Dedicated Orb & UI Specification View
    els.orbSpecCanvas = document.getElementById("orb-spec-canvas");
    els.specStateDesc = document.getElementById("spec-state-desc");
    els.layerToggleBtns = document.querySelectorAll(".layer-toggle-btn[data-layer]");
    els.btnResetLayers = document.getElementById("btn-reset-layers");
    els.specTypingForm = document.getElementById("spec-typing-form");
    els.specTypingInput = document.getElementById("spec-typing-input");
    els.btnSpecAutoType = document.getElementById("btn-spec-auto-type");
    els.btnBackToFlow = document.getElementById("btn-back-to-flow");

    // Toast
    els.toast = document.getElementById("toast-msg");
  }

  /**
   * Initialize Unified 3D Crystal TechOrbs across Phone H5, Smartwatch, and Spec Lab
   */
  function initOrbs() {
    orbManager.register("orb-h5-auth", document.getElementById("orb-h5-auth"));
    orbManager.register("orb-h5-guide", document.getElementById("orb-h5-guide"));
    orbManager.register("orb-h5-title", document.getElementById("orb-h5-title"));
    orbManager.register("orb-h5-voice", document.getElementById("orb-h5-voice"));
    orbManager.register("orb-watch-main", document.getElementById("orb-watch-main"));
    orbManager.register("orb-spec-canvas", document.getElementById("orb-spec-canvas"));
  }

  /**
   * Synchronize TechOrb visual state across all instances (Strictly 2 States: 'idle' 正常状态 & 'listening' 对话状态)
   */
  function setGlobalOrbState(newState, statusLabel) {
    const normalized = newState === "listening" ? "listening" : "idle";
    state.orbState = normalized;
    state.isHoldingVoice = normalized === "listening";
    orbManager.setAllState(normalized);

    els.orbChips.forEach((chip) => {
      chip.classList.toggle("active", chip.getAttribute("data-orb-state") === normalized);
    });

    const isListening = normalized === "listening";

    if (els.watchHoldLabel) {
      const holdTextEl = document.getElementById("watch-hold-text");
      const labelText =
        state.currentStep === 2 ? "登陆中" : isListening ? "点击结束" : "点击开始";
      if (holdTextEl) {
        holdTextEl.textContent = labelText;
      } else {
        els.watchHoldLabel.textContent = labelText;
      }
      els.watchHoldLabel.classList.toggle("recording", state.currentStep !== 2 && isListening);
    }

    // Phone Topbar Center Fixed Logo (no recording border)
    if (els.h5OrbTouch) {
      els.h5OrbTouch.classList.toggle("recording", isListening);
    }

    // Phone Dock Voice Speaking Interface Sync
    if (els.chatBottomDock) {
      els.chatBottomDock.classList.toggle("is-speaking", isListening);
    }
    if (isListening) {
      startVoiceBubbleStreaming();
      requestAnimationFrame(() => {
        orbManager.resizeAll();
      });
    } else {
      stopVoiceBubbleStreaming();
    }
    if (els.btnChatMic) {
      els.btnChatMic.classList.toggle("recording", isListening);
    }
    if (els.btnH5VoiceHold) {
      els.btnH5VoiceHold.classList.toggle("recording", isListening);
    }
    if (els.h5WatchHoldText) {
      els.h5WatchHoldText.textContent = isListening ? "点击结束" : "点击开始";
    }
    if (els.voiceAcousticRipples) {
      els.voiceAcousticRipples.classList.toggle("active", isListening);
    }
    if (els.h5DockSpeechBubble) {
      els.h5DockSpeechBubble.style.display = isListening ? "flex" : "none";
      if (isListening && els.h5SpeechText) {
        const phrase = state.sampleUtterances[state.utteranceCursor % state.sampleUtterances.length];
        els.h5SpeechText.textContent = phrase;
      }
    }

    // Live Recording Timer inside Acoustic Capsule
    clearInterval(state.recClockTimer);
    if (isListening) {
      let sec = 3;
      if (els.voiceRecTimer) {
        els.voiceRecTimer.textContent = "00:03";
      }
      state.recClockTimer = setInterval(() => {
        sec += 1;
        if (els.voiceRecTimer) {
          const mm = String(Math.floor(sec / 60)).padStart(2, "0");
          const ss = String(sec % 60).padStart(2, "0");
          els.voiceRecTimer.textContent = `${mm}:${ss}`;
        }
      }, 1000);
    }

    if (els.specStateDesc && window.TechOrbStateConfig && window.TechOrbStateConfig[normalized]) {
      els.specStateDesc.textContent = window.TechOrbStateConfig[normalized].desc;
    }
  }

  /**
   * Switch between Steps 1..4 (Dual-Device Flow) and Step 5 (Dedicated Orb/UI Spec View)
   */
  function switchStep(step) {
    const stepNum = Number(step);
    if (![1, 2, 3, 4, 5].includes(stepNum)) return;
    state.currentStep = stepNum;

    // 1. Update Top Step Buttons
    els.stepBtns.forEach((btn) => {
      btn.classList.toggle("active", Number(btn.getAttribute("data-step")) === stepNum);
    });

    // 2. If Step 5 (Dedicated Orb & UI Spec View), show Spec Stage and hide Devices Arena
    if (stepNum === 5) {
      if (els.devicesArena) els.devicesArena.classList.add("hidden");
      if (els.orbSpecStage) els.orbSpecStage.classList.add("active");
      requestAnimationFrame(() => orbManager.resizeAll());
      return;
    }

    // Otherwise show Dual-Device Arena (Steps 1..4)
    if (els.devicesArena) els.devicesArena.classList.remove("hidden");
    if (els.orbSpecStage) els.orbSpecStage.classList.remove("active");

    // Show Unified Navigation Bar on Step 3 (User Info) and Step 4 (Chat / Role Switcher)
    if (els.h5Topbar) {
      els.h5Topbar.style.display = stepNum === 3 || stepNum === 4 ? "flex" : "none";
    }

    if (stepNum === 3) {
      // Step 3 User Info Page: Keep navbar specification consistent with Chat Interface
      if (els.topbarBrandFixed) els.topbarBrandFixed.style.display = "inline-flex";
      if (els.h5OrbTouch) els.h5OrbTouch.style.display = "none";
      if (els.topbarPageTitle) els.topbarPageTitle.style.display = "none";
      if (els.topbarPtBtn) els.topbarPtBtn.style.display = "none";
      if (els.btnTopbarAddPerson) els.btnTopbarAddPerson.style.display = "none";
      if (els.btnTopbarSaveProfile) els.btnTopbarSaveProfile.style.display = "inline-flex";
    } else if (stepNum === 4) {
      switchH5SubPage(state.h5SubPage || "chat");
    }

    // 3. Update Phone Views (1..4)
    Object.keys(els.phoneViews).forEach((k) => {
      const view = els.phoneViews[k];
      if (view) view.classList.toggle("active", Number(k) === stepNum);
    });

    // 4. Update Watch Views (Steps 2, 3 & 4 share Watch View 3 with the 3D Orb & Bottom Capsule)
    const targetWatchView = stepNum >= 2 ? 3 : stepNum;
    Object.keys(els.watchViews).forEach((k) => {
      const view = els.watchViews[k];
      if (view) view.classList.toggle("active", Number(k) === targetWatchView);
    });

    // Update Watch Bottom Capsule Text ("登陆中" on Step 2, "点击开始/点击结束" on Steps 3 & 4)
    if (els.watchHoldLabel) {
      const holdTextEl = document.getElementById("watch-hold-text");
      const labelText =
        stepNum === 2 ? "登陆中" : state.isHoldingVoice ? "点击结束" : "点击开始";
      if (holdTextEl) {
        holdTextEl.textContent = labelText;
      }
      els.watchHoldLabel.classList.toggle("recording", stepNum !== 2 && state.isHoldingVoice);
    }

    // 5. Update Center Bridge Text
    const bridgeMap = {
      1: "微信扫码建立绑定",
      2: "账号鉴权与档案同步",
      3: "患者档案同步就绪",
      4: "双端实时同步中"
    };
    if (els.bridgeStatusText) {
      els.bridgeStatusText.textContent = bridgeMap[stepNum];
    }

    // When entering Step 3 (Main User Onboarding Guide), populate the user's OWN profile
    if (stepNum === 3) {
      populateSelfOnboardingForm();
    } else if (stepNum === 4) {
      renderPatientUI();
    }

    requestAnimationFrame(() => {
      orbManager.resizeAll();
    });
  }

  /**
   * Parse history string or array into clean tags
   */
  function parseHistoryList(historyField) {
    if (Array.isArray(historyField)) return historyField;
    return String(historyField || "")
      .split(/[;；,，、]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function renderPersonSheetCard(pt, isSelf, isActive) {
    const historyTags = parseHistoryList(pt.history).slice(0, 3);
    const medsCount = (pt.medications || []).length;
    return `
      <div class="person-card ${isActive ? "active" : ""}" data-select-pt="${escapeHtml(pt.id)}">
        <div class="person-card-main">
          <div class="person-card-top">
            <span class="person-card-name">${escapeHtml(pt.name)}</span>
            ${isSelf ? '<span class="person-badge self">本人</span>' : ""}
            ${isActive ? '<span class="person-badge current">当前</span>' : ""}
            <span class="person-card-meta">${escapeHtml(pt.gender)} · ${pt.age}岁 · ${pt.weight}kg/${pt.height}cm</span>
          </div>
          <div class="person-card-tags">
            ${historyTags.map((t) => `<span class="person-card-tag">${escapeHtml(t)}</span>`).join("")}
            <span class="person-card-tag">${medsCount}项用药</span>
          </div>
        </div>
        <span class="person-card-action">编辑信息 ›</span>
      </div>
    `;
  }

  /**
   * Render Person Selector Dropdown and Synchronize 8-Field Form
   */
  function renderPatientUI() {
    const patients = store.getAll();
    const activePt = store.getActive();
    if (!activePt || !patients.length) return;

    // 1. Update Right-Side Topbar Person Selector Text (Symmetrical with Left "返回" Capsule)
    if (els.topbarPtText) {
      els.topbarPtText.textContent = activePt.name;
    }

    // 2. Render Custom Single-Row Person Dropdown
    const selfPt = patients.find((p) => p.id === "pt_chenmin") || patients[0];
    const isCurrentSelf = activePt.id === selfPt.id;
    if (els.customPtLabel) {
      els.customPtLabel.textContent = isCurrentSelf
        ? `${activePt.name}（本人 · ${activePt.gender} · ${activePt.age}岁）`
        : `${activePt.name}（${activePt.gender} · ${activePt.age}岁）`;
    }

    // 2b. Render Custom Dropdown Menu Items (Distinguishing User's Self & Presets)
    if (els.menuSelfGroup) {
      const isSelfActive = activePt.id === selfPt.id;
      els.menuSelfGroup.innerHTML = `
        <div class="custom-dropdown-item self ${isSelfActive ? "active" : ""}" data-pt-id="${escapeHtml(selfPt.id)}">
          <div class="item-left">
            <span class="item-check">${isSelfActive ? "✓" : ""}</span>
            <span class="item-name">${escapeHtml(selfPt.name)}</span>
            <span class="item-badge self">本人</span>
            <span class="item-meta">${escapeHtml(selfPt.gender)} · ${selfPt.age}岁</span>
          </div>
          <div class="item-right">
            <span class="item-self-tag">主档案</span>
          </div>
        </div>
      `;
    }

    if (els.menuPresetGroup) {
      const otherPts = patients.filter((p) => p.id !== selfPt.id);
      if (!otherPts.length) {
        els.menuPresetGroup.innerHTML = `<div class="dropdown-empty-tip">暂无其他档案，可点击右上角新增</div>`;
      } else {
        els.menuPresetGroup.innerHTML = otherPts
          .map((pt) => {
            const isActive = activePt.id === pt.id;
            return `
              <div class="custom-dropdown-item preset ${isActive ? "active" : ""}" data-pt-id="${escapeHtml(pt.id)}">
                <div class="item-left">
                  <span class="item-check">${isActive ? "✓" : ""}</span>
                  <span class="item-name">${escapeHtml(pt.name)}</span>
                  <span class="item-meta">${escapeHtml(pt.gender)} · ${pt.age}岁</span>
                </div>
                <div class="item-right">
                  <button type="button" class="btn-item-delete" data-del-pt="${escapeHtml(pt.id)}" title="删除此档案">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            `;
          })
          .join("");
      }
    }

    if (els.ptQuickSelect) {
      els.ptQuickSelect.innerHTML = patients
        .map((pt) => {
          const isSelf = pt.id === selfPt.id;
          const label = isSelf
            ? `${pt.name}（本人 · ${pt.gender} · ${pt.age}岁）`
            : `${pt.name}（${pt.gender} · ${pt.age}岁）`;
          return `<option value="${escapeHtml(pt.id)}" ${pt.id === activePt.id ? "selected" : ""}>${escapeHtml(label)}</option>`;
        })
        .join("");
    }

    // 3. Keep Step 3 Self Onboarding Form synchronized with selfPt
    populateSelfOnboardingForm();

    // 4. Keep Step 4 Role Switcher 8-Field Form synchronized if in 'edit' mode
    if (state.editingMode !== "create") {
      populatePatientForm("edit", activePt);
    }
  }

  /**
   * Populate Step 3 Main User Onboarding Form (User's OWN info only: selfPt)
   */
  function populateSelfOnboardingForm() {
    const patients = store.getAll();
    const selfPt = patients.find((p) => p.id === "pt_chenmin") || patients[0];
    if (!selfPt) return;

    if (els.sPtName) els.sPtName.value = selfPt.name || "";
    if (els.sPtGender) els.sPtGender.value = selfPt.gender || "女";
    if (els.selfGenderSegBtns) {
      els.selfGenderSegBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-self-gender") === (selfPt.gender || "女"));
      });
    }
    if (els.sPtAge) els.sPtAge.value = selfPt.age ?? "";
    if (els.sPtWeight) els.sPtWeight.value = selfPt.weight ?? "";
    if (els.sPtHeight) els.sPtHeight.value = selfPt.height ?? "";
    if (els.sPtHistory) els.sPtHistory.value = selfPt.history || "";
    if (els.sPtMeds) els.sPtMeds.value = (selfPt.medications || []).join("\n");
    if (els.sPtExtra) els.sPtExtra.value = selfPt.extraInfo || "";
  }

  /**
   * Save Step 3 Main User Onboarding Form -> Enter Step 4 Chat Interface
   */
  function handleSaveSelfOnboarding(e) {
    e.preventDefault();
    const patients = store.getAll();
    const selfPt = patients.find((p) => p.id === "pt_chenmin") || patients[0];
    if (!selfPt) return;

    const payload = {
      name: els.sPtName ? els.sPtName.value.trim() : selfPt.name,
      gender: els.sPtGender ? els.sPtGender.value : selfPt.gender,
      age: Number(els.sPtAge ? els.sPtAge.value : selfPt.age) || 51,
      weight: Number(els.sPtWeight ? els.sPtWeight.value : selfPt.weight) || 59,
      height: Number(els.sPtHeight ? els.sPtHeight.value : selfPt.height) || 158,
      history: els.sPtHistory ? els.sPtHistory.value.trim() : selfPt.history,
      medications: els.sPtMeds ? els.sPtMeds.value : selfPt.medications,
      extraInfo: els.sPtExtra ? els.sPtExtra.value.trim() : selfPt.extraInfo
    };

    if (!payload.name) {
      showToast("请输入您的姓名");
      return;
    }

    store.updatePatient(selfPt.id, payload);
    store.setActive(selfPt.id);
    renderPatientUI();
    renderChatMessages();
    showToast(`已保存本人信息「${payload.name}」· 进入问诊`);
    switchStep(4);
    switchH5SubPage("chat");
  }

  /**
   * Populate the 8-Field User Info Form (Screenshot 2) on the Previous Page
   */
  function populatePatientForm(mode, targetPt) {
    state.editingMode = mode;
    const pt = targetPt || store.getActive();
    const patients = store.getAll();
    const selfPt = patients.find((p) => p.id === "pt_chenmin") || patients[0];

    if (mode === "edit" && pt) {
      if (els.fPtId) els.fPtId.value = pt.id;
      if (els.fPtName) els.fPtName.value = pt.name;
      if (els.fPtGender) els.fPtGender.value = pt.gender;
      if (els.genderSegBtns) {
        els.genderSegBtns.forEach((btn) => {
          btn.classList.toggle("active", btn.getAttribute("data-gender") === pt.gender);
        });
      }
      if (els.fPtAge) els.fPtAge.value = pt.age;
      if (els.fPtWeight) els.fPtWeight.value = pt.weight;
      if (els.fPtHeight) els.fPtHeight.value = pt.height;
      if (els.fPtHistory) els.fPtHistory.value = pt.history || "";
      if (els.fPtMeds) els.fPtMeds.value = (pt.medications || []).join("\n");
      if (els.fPtExtra) els.fPtExtra.value = pt.extraInfo || "";

      const isSelf = selfPt && pt.id === selfPt.id;
      if (els.profileEditTitle) {
        els.profileEditTitle.textContent = isSelf ? "编辑用户信息" : "患者信息";
      }
      if (els.ptLoadedBadge) {
        els.ptLoadedBadge.textContent = isSelf
          ? "本人档案 · 已加载历史"
          : pt.isPreset
          ? "预设档案 · 已加载历史"
          : "自定义档案";
      }
      if (els.btnPtDelete) {
        els.btnPtDelete.style.display = "none";
      }
    } else {
      if (els.fPtId) els.fPtId.value = "";
      if (els.fPtName) els.fPtName.value = "";
      if (els.fPtGender) els.fPtGender.value = "女";
      if (els.genderSegBtns) {
        els.genderSegBtns.forEach((btn) => {
          btn.classList.toggle("active", btn.getAttribute("data-gender") === "女");
        });
      }
      if (els.fPtAge) els.fPtAge.value = "";
      if (els.fPtWeight) els.fPtWeight.value = "";
      if (els.fPtHeight) els.fPtHeight.value = "";
      if (els.fPtHistory) els.fPtHistory.value = "";
      if (els.fPtMeds) els.fPtMeds.value = "";
      if (els.fPtExtra) els.fPtExtra.value = "";

      if (els.profileEditTitle) els.profileEditTitle.textContent = "新增人物信息";
      if (els.ptLoadedBadge) els.ptLoadedBadge.textContent = "手动填写新档案";
      if (els.btnPtDelete) els.btnPtDelete.style.display = "none";
    }
  }

  /**
   * Switch between Step 4 Subpages:
   *  - 'chat': Clean Clinical Dialogue Stream (Topbar: 3D Orb + HEARTMED emblem)
   *  - 'profile_edit': Unified Person Select + 8-Field Edit Page (Topbar: "用户信息", Right: "💾 保存")
   */
  function switchH5SubPage(subPage, options) {
    let target = subPage;
    if (target === "edit" || target === "person_select") target = "profile_edit";
    if (!["chat", "profile_edit"].includes(target)) {
      target = "chat";
    }

    state.h5SubPage = target;

    // 1. Toggle Subpage Visibility
    if (els.chatSubpage) {
      els.chatSubpage.classList.toggle("active", target === "chat");
    }
    if (els.profileEditPage) {
      els.profileEditPage.classList.toggle("active", target === "profile_edit");
    }

    // 2. Update Unified Navigation Bar Header (only when on Step 4; Step 3 has its own topbar state)
    if (state.currentStep === 3) {
      if (els.topbarBrandFixed) els.topbarBrandFixed.style.display = "inline-flex";
      if (els.h5OrbTouch) els.h5OrbTouch.style.display = "none";
      if (els.topbarPageTitle) els.topbarPageTitle.style.display = "none";
      if (els.topbarPtBtn) els.topbarPtBtn.style.display = "none";
      if (els.btnTopbarAddPerson) els.btnTopbarAddPerson.style.display = "none";
      if (els.btnTopbarSaveProfile) els.btnTopbarSaveProfile.style.display = "inline-flex";
      return;
    }

    if (target === "chat") {
      // Chat Page: Center shows fixed original HEARTMED logo (No Capsule)
      if (els.topbarBrandFixed) els.topbarBrandFixed.style.display = "inline-flex";
      if (els.h5OrbTouch) els.h5OrbTouch.style.display = "none";
      if (els.topbarPageTitle) els.topbarPageTitle.style.display = "none";

      // Right: shows patient capsule
      if (els.topbarPtBtn) els.topbarPtBtn.style.display = "inline-flex";
      if (els.btnTopbarAddPerson) els.btnTopbarAddPerson.style.display = "none";
      if (els.btnTopbarSaveProfile) els.btnTopbarSaveProfile.style.display = "none";
    } else if (target === "profile_edit") {
      const mode = (typeof options === "string" ? options : options?.mode) || "edit";
      const targetPt = (typeof options === "object" ? options?.pt : null) || store.getActive();
      state.editingMode = mode;

      // Unified User Info Page: Center shows clean title "用户信息"
      if (els.topbarBrandFixed) els.topbarBrandFixed.style.display = "none";
      if (els.h5OrbTouch) els.h5OrbTouch.style.display = "none";
      if (els.topbarPageTitle) {
        els.topbarPageTitle.style.display = "inline-block";
        els.topbarPageTitle.textContent = "用户信息";
      }

      // Right: shows symmetrical capsule "保存"
      if (els.topbarPtBtn) els.topbarPtBtn.style.display = "none";
      if (els.btnTopbarAddPerson) els.btnTopbarAddPerson.style.display = "none";
      if (els.btnTopbarSaveProfile) els.btnTopbarSaveProfile.style.display = "inline-flex";

      populatePatientForm(mode, targetPt);
      renderPatientUI();
    }
  }

  /**
   * Backward-compatible helper for sheet calls (now redirects to unified page)
   */
  function togglePatientSheet(open) {
    if (open) {
      if (state.currentStep !== 4) switchStep(4);
      switchH5SubPage("profile_edit", { mode: "edit" });
    } else {
      switchH5SubPage("chat");
    }
  }

  function openPatientForm(mode) {
    if (state.currentStep !== 4) switchStep(4);
    switchH5SubPage("profile_edit", { mode: mode || "edit" });
  }

  function closePatientForm() {
    switchH5SubPage("chat");
  }

  function handleSavePatient(e) {
    e.preventDefault();
    const payload = {
      name: els.fPtName.value.trim(),
      gender: els.fPtGender.value,
      age: Number(els.fPtAge.value) || 50,
      weight: Number(els.fPtWeight.value) || 60,
      height: Number(els.fPtHeight.value) || 165,
      history: els.fPtHistory.value.trim(),
      medications: els.fPtMeds.value,
      extraInfo: els.fPtExtra.value.trim()
    };

    if (!payload.name) {
      showToast("请输入患者姓名");
      return;
    }

    if (state.editingMode === "edit" && els.fPtId.value) {
      store.updatePatient(els.fPtId.value, payload);
      showToast(`已保存「${payload.name}」档案`);
    } else {
      store.createPatient(payload);
      state.editingMode = "edit";
      showToast(`已新增「${payload.name}」档案`);
    }

    renderPatientUI();
    renderChatMessages();
    switchH5SubPage("chat");
  }

  function handleDeletePatient() {
    const activePt = store.getActive();
    if (!activePt) return;
    handleDeletePatientById(activePt.id);
  }

  function handleDeletePatientById(targetId) {
    if (!targetId) return;
    const allPts = store.getAll();
    const targetPt = allPts.find((p) => p.id === targetId);
    const targetName = targetPt ? targetPt.name : "档案";

    const res = store.deletePatient(targetId);
    if (!res.ok) {
      showToast(res.reason || "无法删除档案");
      return;
    }
    state.editingMode = "edit";
    renderPatientUI();
    renderChatMessages();
    showToast(`已删除「${targetName}」档案`);
  }

  function toggleCustomPtDropdown(forceOpen) {
    if (!els.customPtDropdown) return;
    const shouldOpen =
      typeof forceOpen === "boolean"
        ? forceOpen
        : !els.customPtDropdown.classList.contains("open");
    els.customPtDropdown.classList.toggle("open", shouldOpen);
    if (els.btnCustomPtTrigger) {
      els.btnCustomPtTrigger.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    }
  }

  function formatMessageHtml(raw) {
    return escapeHtml(raw)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  }

  function renderChatMessages() {
    if (!els.chatList) return;
    const activePt = store.getActive();
    const messages = store.getChats(activePt ? activePt.id : null);

    let html = messages
      .map((msg) => {
        const isUser = msg.role === "user";
        const isWatch = msg.source === "watch" || msg.source === "watch_voice";
        const timeStr = escapeHtml(msg.time || "");

        if (isUser) {
          return `
            <div class="cyber-msg user" data-msg-id="${escapeHtml(msg.id)}">
              <div class="cyber-bubble">
                <div class="cyber-bubble-content">${formatMessageHtml(msg.text)}</div>
                <div class="cyber-msg-footer">
                  <span class="cyber-msg-time">${timeStr}</span>
                  <button type="button" class="cyber-del-btn" data-del-msg="${escapeHtml(msg.id)}" title="删除此记录">×</button>
                </div>
              </div>
            </div>
          `;
        }

        // Assistant Reply Bubble
        return `
          <div class="cyber-msg assistant" data-msg-id="${escapeHtml(msg.id)}">
            <div class="cyber-bubble">
              <div class="cyber-ai-header">
                <span class="ai-orb-mini-node"></span>
                <span class="ai-header-title">AI 诊疗与用药分析</span>
                <span class="cyber-msg-time" style="margin-left:auto;">${timeStr}</span>
                <button type="button" class="cyber-del-btn" data-del-msg="${escapeHtml(msg.id)}" title="删除此记录">×</button>
              </div>
              <div class="cyber-bubble-content">${formatMessageHtml(msg.text)}</div>
            </div>
          </div>
        `;
      })
      .join("");

    // When in Voice State (listening), append User Input Bubble with Fixed-Lead HEARTMED Icon + Streaming Text Output
    if (state.isHoldingVoice) {
      const phrase = state.sampleUtterances[state.utteranceCursor % state.sampleUtterances.length];
      const currentLen = typeof state.voiceStreamIdx === "number" ? state.voiceStreamIdx : Math.min(8, phrase.length);
      const streamedText = escapeHtml(phrase.slice(0, currentLen));
      html += `
        <div class="cyber-msg user voice-streaming" id="live-voice-user-msg">
          <div class="cyber-bubble">
            <div class="user-stream-body">
              <div class="user-stream-orb-lead" title="哈瑞特图标固定在行首 · 语音流式输入">
                <img src="./assets/logo-mark.svg" alt="HEARTMED" class="user-stream-logo-mark" />
              </div>
              <div class="user-stream-text-wrap">
                <span id="user-voice-stream-text" class="user-stream-text">${streamedText}</span><span class="user-stream-cursor"></span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    els.chatList.innerHTML = html;

    if (state.isHoldingVoice) {
      requestAnimationFrame(() => {
        orbManager.resizeAll();
      });
    }

    els.chatList.scrollTop = els.chatList.scrollHeight;
  }

  /**
   * Start real-time character-by-character streaming inside the Voice State User Input Bubble
   * with the 3D particle orb fixed at the start of the line (光球固定在行首)
   */
  function startVoiceBubbleStreaming() {
    clearInterval(state.voiceStreamTimer);
    const phrase = state.sampleUtterances[state.utteranceCursor % state.sampleUtterances.length];
    state.voiceStreamIdx = Math.min(6, phrase.length);
    renderChatMessages();

    let pauseTicks = 0;
    state.voiceStreamTimer = setInterval(() => {
      if (!state.isHoldingVoice) {
        clearInterval(state.voiceStreamTimer);
        return;
      }
      const streamTextEl = document.getElementById("user-voice-stream-text");
      if (!streamTextEl) return;

      if (state.voiceStreamIdx < phrase.length) {
        state.voiceStreamIdx += 1;
        const prefix = escapeHtml(phrase.slice(0, state.voiceStreamIdx - 1));
        const newestChar = escapeHtml(phrase.charAt(state.voiceStreamIdx - 1));
        streamTextEl.innerHTML = `${prefix}<span class="stream-char-new">${newestChar}</span>`;
        if (els.chatList) {
          els.chatList.scrollTop = els.chatList.scrollHeight;
        }
      } else {
        pauseTicks += 1;
        if (pauseTicks >= 8) {
          pauseTicks = 0;
          state.voiceStreamIdx = Math.min(4, phrase.length);
          streamTextEl.textContent = phrase.slice(0, state.voiceStreamIdx);
        }
      }
    }, 95);
  }

  function stopVoiceBubbleStreaming() {
    clearInterval(state.voiceStreamTimer);
    state.voiceStreamTimer = null;
    state.voiceStreamIdx = 0;
    renderChatMessages();
  }

  /**
   * Trigger a synchronized Voice/Text Consultation across Watch & Phone H5
   * (Does NOT alter the orb state — orb only has 正常状态 & 对话状态)
   */
  function sendConsultationMessage(text, source) {
    const cleanText = (text || "").trim();
    if (!cleanText) return;

    const activePt = store.getActive();

    store.addMessage(activePt.id, {
      role: "user",
      source: source || "h5",
      text: cleanText
    });
    renderChatMessages();

    setTimeout(() => {
      const aiReply = store.generateAIResponse(activePt, cleanText);
      store.addMessage(activePt.id, {
        role: "assistant",
        source: "ai",
        text: aiReply.text,
        tags: aiReply.tags
      });
      renderChatMessages();
    }, 520);
  }

  /**
   * Simulate character-by-character live typing into an input field ("html界面要能演示直接打字")
   */
  function runAutoTypingDemo(targetInput, onCompleteSend) {
    if (!targetInput) return;
    clearInterval(state.typingTimer);

    const phrase = state.sampleUtterances[state.utteranceCursor++ % state.sampleUtterances.length];
    targetInput.focus();
    targetInput.value = "";
    let idx = 0;

    state.typingTimer = setInterval(() => {
      if (idx < phrase.length) {
        targetInput.value += phrase[idx];
        idx++;
        orbManager.triggerAllTypingPulse();
      } else {
        clearInterval(state.typingTimer);
        state.typingTimer = null;
        if (onCompleteSend) {
          setTimeout(() => {
            const finalVal = targetInput.value.trim();
            targetInput.value = "";
            sendConsultationMessage(finalVal, "h5");
          }, 320);
        }
      }
    }, 55);
  }

  /**
   * Click-to-Start (对话状态) / Click-to-End (正常状态) on Watch or Phone Orb
   */
  function startVoiceHold(e) {
    if (e && e.cancelable) e.preventDefault();
    if (state.isHoldingVoice) return;

    if (els.guidePracticeStatus) {
      els.guidePracticeStatus.textContent = "🎙️ 已进入对话状态 · 再次点击「点击结束」完成...";
    }

    setGlobalOrbState("listening", "对话状态 · 正在倾听语音");
    showToast("🎙️ 已进入对话状态 · 粒子球放大");
  }

  function stopVoiceHold(customUtterance) {
    if (!state.isHoldingVoice) return;

    // Immediately return orb to 正常状态 (shrinks back to 0.85x)
    setGlobalOrbState("idle");

    const phrase =
      typeof customUtterance === "string" && customUtterance
        ? customUtterance
        : state.sampleUtterances[state.utteranceCursor++ % state.sampleUtterances.length];

    if (state.currentStep === 3 && els.guidePracticeStatus) {
      els.guidePracticeStatus.textContent = `✅ 识别成功：“${phrase}”`;
    }

    sendConsultationMessage(phrase, "watch");
    showToast("已结束对话 · 粒子球恢复正常状态");
  }

  function toggleVoiceSession(e) {
    if (e && e.cancelable) e.preventDefault();
    if (state.isHoldingVoice) {
      stopVoiceHold();
    } else {
      startVoiceHold();
    }
  }

  function simulateWatchVoice(phrase) {
    if (state.currentStep < 3 || state.currentStep === 5) {
      switchStep(4);
    }
    startVoiceHold();
    clearTimeout(state.holdTimer);
    state.holdTimer = setTimeout(() => {
      stopVoiceHold(phrase);
    }, 880);
  }

  let toastTimeout = null;
  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2400);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Set Chat Bottom Dock Mode: 'orb' (default: central orb + 2 buttons) or 'keyboard' (soft keyboard)
   */
  function setInputDockMode(mode) {
    const targetMode = mode === "keyboard" ? "keyboard" : "orb";
    state.inputMode = targetMode;

    if (els.chatBottomDock) {
      els.chatBottomDock.classList.toggle("mode-orb", targetMode === "orb");
      els.chatBottomDock.classList.toggle("mode-keyboard", targetMode === "keyboard");
    }

    if (els.h5OrbDockBody) {
      els.h5OrbDockBody.style.display = targetMode === "orb" ? "flex" : "none";
    }
    if (els.h5KeyboardDockBody) {
      els.h5KeyboardDockBody.style.display = targetMode === "keyboard" ? "flex" : "none";
    }

    if (targetMode === "orb") {
      requestAnimationFrame(() => {
        orbManager.resizeAll();
      });
    } else if (targetMode === "keyboard") {
      if (els.chatInput) els.chatInput.focus();
      if (els.chatList) {
        setTimeout(() => {
          els.chatList.scrollTop = els.chatList.scrollHeight;
        }, 60);
      }
    }
  }

  function updateInputDockMode() {
    setInputDockMode(state.inputMode);
  }

  /**
   * Step 3 Form Module Keyboard Pop-up & Smooth Auto-Scroll Management
   */
  const STEP3_FIELD_IDS = [
    "s-pt-name",
    "s-pt-age",
    "s-pt-weight",
    "s-pt-height",
    "s-pt-history",
    "s-pt-meds",
    "s-pt-extra"
  ];

  const STEP3_QUICK_CHIPS = {
    "s-pt-name": ["陈敏", "李四", "王芳"],
    "s-pt-age": ["45", "51", "62", "70"],
    "s-pt-weight": ["55", "59", "68", "75"],
    "s-pt-height": ["158", "165", "172", "176"],
    "s-pt-history": ["+ 高血压", "+ 冠心病", "+ 2型糖尿病", "+ 阵发性房颤"],
    "s-pt-meds": [
      "+ 氨氯地平片：5mg/次，1次/日",
      "+ 阿司匹林：100mg/次，1次/日",
      "+ 依折麦布片：10mg/次，1次/日"
    ],
    "s-pt-extra": ["+ 肝肾功能正常", "+ 偶有下午头晕", "+ 晨起血压偏高"]
  };

  function openUserInfoKeyboard(fieldEl) {
    if (!fieldEl) return;
    const view3 = els.phoneViews && els.phoneViews[3];
    if (!view3) return;

    state.activeStep3Field = fieldEl;
    view3.classList.add("is-kbd-open");

    const fieldId = fieldEl.id;
    const labelText = fieldEl.getAttribute("data-field-label") || "健康信息";
    const labelEl = document.getElementById("uf-kbd-field-label");
    if (labelEl) labelEl.textContent = labelText;

    // Highlight active module card & field wrapper
    view3.querySelectorAll(".userinfo-card").forEach((card) => {
      card.classList.toggle("is-active-module", card.contains(fieldEl));
    });
    view3.querySelectorAll("[data-field-wrap]").forEach((wrap) => {
      wrap.classList.toggle("is-focused-field", wrap.contains(fieldEl));
    });

    // Toggle Numeric Keypad vs Text QWERTY Keyboard
    const isNumeric = ["s-pt-age", "s-pt-weight", "s-pt-height"].includes(fieldId);
    const numpadEl = document.getElementById("uf-kbd-numpad");
    const qwertyEl = document.getElementById("uf-kbd-qwerty");
    if (numpadEl) numpadEl.style.display = isNumeric ? "grid" : "none";
    if (qwertyEl) qwertyEl.style.display = isNumeric ? "none" : "flex";

    // Render quick clinical fill chips for the active field
    const chipsBar = document.getElementById("uf-kbd-quick-chips");
    if (chipsBar) {
      const chips = STEP3_QUICK_CHIPS[fieldId] || [];
      chipsBar.innerHTML = chips
        .map((c) => `<button type="button" class="uf-quick-chip" data-uf-chip="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
        .join("");
    }

    // Smoothly scroll the focused module/field into the visible viewport above the keyboard
    const scrollBody = document.getElementById("userinfo-scroll-body");
    const fieldWrap = fieldEl.closest("[data-field-wrap]") || fieldEl;
    if (scrollBody && fieldWrap) {
      setTimeout(() => {
        const bodyRect = scrollBody.getBoundingClientRect();
        const wrapRect = fieldWrap.getBoundingClientRect();
        const targetTop =
          scrollBody.scrollTop +
          (wrapRect.top - bodyRect.top) -
          Math.max(12, (bodyRect.height - wrapRect.height) / 2);
        scrollBody.scrollTo({
          top: Math.max(0, targetTop),
          behavior: "smooth"
        });
      }, 45);
    }
  }

  function closeUserInfoKeyboard() {
    const view3 = els.phoneViews && els.phoneViews[3];
    if (!view3) return;
    view3.classList.remove("is-kbd-open");
    view3.querySelectorAll(".userinfo-card").forEach((c) => c.classList.remove("is-active-module"));
    view3.querySelectorAll("[data-field-wrap]").forEach((w) => w.classList.remove("is-focused-field"));
    if (state.activeStep3Field && typeof state.activeStep3Field.blur === "function") {
      state.activeStep3Field.blur();
    }
    state.activeStep3Field = null;
  }

  function stepUserInfoField(delta) {
    const curId = state.activeStep3Field ? state.activeStep3Field.id : STEP3_FIELD_IDS[0];
    const curIdx = Math.max(0, STEP3_FIELD_IDS.indexOf(curId));
    const nextIdx = (curIdx + delta + STEP3_FIELD_IDS.length) % STEP3_FIELD_IDS.length;
    const nextEl = document.getElementById(STEP3_FIELD_IDS[nextIdx]);
    if (nextEl) {
      nextEl.focus();
      openUserInfoKeyboard(nextEl);
    }
  }

  function bindEvents() {
    // 1. Top 5-Tab Switcher (Steps 1..4 + Step 5 Spec View)
    els.stepBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        switchStep(Number(btn.getAttribute("data-step")));
      });
    });

    // 2. Top Orb State Quick Switcher
    els.orbChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const st = chip.getAttribute("data-orb-state");
        setGlobalOrbState(st);
      });
    });

    // 3. Step 1 -> Step 2 (WeChat Scan QR)
    [els.btnSimulateScan, els.btnScanAction, els.watchQrTrigger].forEach((el) => {
      if (!el) return;
      el.addEventListener("click", () => {
        showToast("微信扫码成功 · 已绑定手表 WATCH-WZ-8829");
        switchStep(2);
      });
    });

    // 4. Step 2 Auth Tabs & Login Submit -> Step 3
    els.authTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const mode = tab.getAttribute("data-auth-mode");
        els.authTabs.forEach((t) => t.classList.toggle("active", t === tab));
        if (els.authSubmitText) {
          els.authSubmitText.textContent = mode === "register" ? "注册" : "登录";
        }
      });
    });

    if (els.authForm) {
      els.authForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showToast("登录成功 · 请确认用户信息");
        switchStep(3);
      });
    }

    if (els.btnWatchNextStep) {
      els.btnWatchNextStep.addEventListener("click", () => {
        switchStep(3);
      });
    }

    // 5. Step 3 Self Onboarding Form & Gender Segmented Control (女 / 男)
    if (els.selfGenderSegBtns) {
      els.selfGenderSegBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const g = btn.getAttribute("data-self-gender") || "女";
          if (els.sPtGender) els.sPtGender.value = g;
          els.selfGenderSegBtns.forEach((b) => b.classList.toggle("active", b === btn));
        });
      });
    }

    if (els.selfOnboardingForm) {
      els.selfOnboardingForm.addEventListener("submit", handleSaveSelfOnboarding);

      // Pop up adaptive keyboard & scroll focused module into center view
      STEP3_FIELD_IDS.forEach((fid) => {
        const el = document.getElementById(fid);
        if (!el) return;
        el.addEventListener("focus", () => openUserInfoKeyboard(el));
        el.addEventListener("click", () => openUserInfoKeyboard(el));
      });
    }

    const btnPrevField = document.getElementById("btn-uf-prev-field");
    const btnNextField = document.getElementById("btn-uf-next-field");
    const btnKbdDone = document.getElementById("btn-uf-kbd-done");
    const ufKbdDrawer = document.getElementById("userinfo-kbd-drawer");

    if (btnPrevField) {
      btnPrevField.addEventListener("click", () => stepUserInfoField(-1));
    }
    if (btnNextField) {
      btnNextField.addEventListener("click", () => stepUserInfoField(1));
    }
    if (btnKbdDone) {
      btnKbdDone.addEventListener("click", () => closeUserInfoKeyboard());
    }

    if (ufKbdDrawer) {
      ufKbdDrawer.addEventListener("click", (e) => {
        const activeEl = state.activeStep3Field;
        if (!activeEl) return;

        // 1. Quick Chip Click
        const chipBtn = e.target.closest("[data-uf-chip]");
        if (chipBtn) {
          const rawVal = chipBtn.getAttribute("data-uf-chip") || "";
          const cleanVal = rawVal.replace(/^\+\s*/, "");
          if (["s-pt-name", "s-pt-age", "s-pt-weight", "s-pt-height"].includes(activeEl.id)) {
            activeEl.value = cleanVal;
          } else if (activeEl.id === "s-pt-meds") {
            activeEl.value = activeEl.value.trim()
              ? `${activeEl.value.trim()}\n${cleanVal}`
              : cleanVal;
          } else {
            activeEl.value = activeEl.value.trim()
              ? `${activeEl.value.trim()}; ${cleanVal}`
              : cleanVal;
          }
          return;
        }

        // 2. Numeric Key Click
        const numBtn = e.target.closest("[data-num-key]");
        if (numBtn) {
          const k = numBtn.getAttribute("data-num-key");
          const curStr = String(activeEl.value || "");
          if (k === "del") {
            activeEl.value = curStr.slice(0, -1);
          } else if (k === ".") {
            if (!curStr.includes(".")) activeEl.value = curStr + ".";
          } else {
            activeEl.value = curStr.length >= 5 ? curStr : curStr + k;
          }
          return;
        }

        // 3. QWERTY Key Click
        const qBtn = e.target.closest(".uf-q-key");
        if (qBtn) {
          const action = qBtn.getAttribute("data-q-action");
          if (action === "del") {
            activeEl.value = String(activeEl.value || "").slice(0, -1);
          } else if (action === "semi") {
            activeEl.value = String(activeEl.value || "") + "；";
          } else {
            activeEl.value = String(activeEl.value || "") + qBtn.textContent.trim().toLowerCase();
          }
        }
      });
    }

    // Step 4 Profile Edit Gender Segmented Control (女 / 男)
    if (els.genderSegBtns) {
      els.genderSegBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const g = btn.getAttribute("data-gender") || "女";
          if (els.fPtGender) els.fPtGender.value = g;
          els.genderSegBtns.forEach((b) => b.classList.toggle("active", b === btn));
        });
      });
    }

    // 6. Traditional Minimalist Chat Bar: Text Input / Full-Row Watch Voice Capsule + Send
    if (els.btnChatMic) {
      els.btnChatMic.addEventListener("click", (e) => {
        e.preventDefault();
        toggleVoiceSession(e);
      });
    }

    if (els.voiceSpeakingCapsule) {
      els.voiceSpeakingCapsule.addEventListener("click", (e) => {
        e.preventDefault();
        toggleVoiceSession(e);
      });
    }

    if (els.btnVoiceCancel) {
      els.btnVoiceCancel.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.isHoldingVoice) {
          setGlobalOrbState("idle");
          showToast("已取消语音输入");
        }
      });
    }

    // Topbar Title with 3D Dynamic Particle Orb: Clicking triggers soft pulse
    if (els.topbarBrandFixed) {
      els.topbarBrandFixed.addEventListener("click", () => {
        orbManager.triggerAllTypingPulse();
      });
    }

    // Direct touch on Phone 3D Particle Orb
    if (els.btnH5OrbTouch) {
      els.btnH5OrbTouch.addEventListener("click", (e) => {
        e.preventDefault();
        toggleVoiceSession(e);
      });
    }

    // Input Typing Pulses Orb
    if (els.chatInput) {
      els.chatInput.addEventListener("input", () => {
        orbManager.triggerAllTypingPulse();
      });
    }

    // Keyboard Keycaps Simulation
    if (els.kbdLetterKeys) {
      els.kbdLetterKeys.forEach((keyEl) => {
        keyEl.addEventListener("click", () => {
          const ch = keyEl.textContent.trim();
          if (els.chatInput) {
            els.chatInput.value += ch.toLowerCase();
            orbManager.triggerAllTypingPulse();
          }
        });
      });
    }

    if (els.btnKbdDel) {
      els.btnKbdDel.addEventListener("click", () => {
        if (els.chatInput && els.chatInput.value.length > 0) {
          els.chatInput.value = els.chatInput.value.slice(0, -1);
          orbManager.triggerAllTypingPulse();
        }
      });
    }

    if (els.btnKbdSpace) {
      els.btnKbdSpace.addEventListener("click", () => {
        runAutoTypingDemo(els.chatInput, false);
      });
    }

    if (els.btnKbdSend) {
      els.btnKbdSend.addEventListener("click", () => {
        const val = els.chatInput ? els.chatInput.value.trim() : "";
        if (!val) return;
        els.chatInput.value = "";
        sendConsultationMessage(val, "h5");
      });
    }

    // Chat Message Form Submit (Sends text in idle mode, or finishes & sends voice in speaking mode)
    if (els.chatForm) {
      els.chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (state.isHoldingVoice) {
          stopVoiceHold();
          return;
        }
        clearInterval(state.typingTimer);
        const val = els.chatInput ? els.chatInput.value.trim() : "";
        if (!val) return;
        els.chatInput.value = "";
        sendConsultationMessage(val, "h5");
      });
    }

    // Chat List: Clicking message area dismisses soft keyboard
    if (els.chatList) {
      els.chatList.addEventListener("click", (e) => {
        const delBtn = e.target.closest("[data-del-msg]");
        if (delBtn) {
          const msgId = delBtn.getAttribute("data-del-msg");
          const activePt = store.getActive();
          if (activePt && msgId) {
            store.deleteMessage(activePt.id, msgId);
            renderChatMessages();
            showToast("已删除该条问诊记录");
          }
          return;
        }
        if (state.inputMode === "keyboard") {
          setInputDockMode("orb");
        }
      });
    }

    // 7. Chat & Step 3 Topbar Navigation:
    //    - Left "‹ 返回" on Step 3 -> Returns to Step 2 (Login Page)
    //    - Left "‹ 返回" on Chat Screen -> Returns to Step 3 (Main User Onboarding Page)
    //    - Left "‹ 返回" on Role Switcher Subpage -> Returns to Chat Screen
    //    - Right "👤 陈敏 ▾" on Chat Screen -> Opens Role Switcher & Edit Subpage (#h5-profile-edit-page)
    if (els.topbarBackBtn) {
      els.topbarBackBtn.addEventListener("click", () => {
        if (state.currentStep === 3) {
          switchStep(2);
        } else if (state.currentStep === 4 && state.h5SubPage === "profile_edit") {
          switchH5SubPage("chat");
        } else {
          switchStep(3);
        }
      });
    }

    // Topbar Right Capsule (Chat Page): Opens Right-Corner Role Switcher & Profile Edit Subpage
    if (els.topbarPtBtn) {
      els.topbarPtBtn.addEventListener("click", () => {
        if (state.currentStep !== 4) switchStep(4);
        switchH5SubPage("profile_edit", { mode: "edit" });
      });
    }

    // Topbar Right Capsule (User Info Page on Step 3 or Step 4): "保存"
    if (els.btnTopbarSaveProfile) {
      els.btnTopbarSaveProfile.addEventListener("click", () => {
        const targetForm = state.currentStep === 3 ? els.selfOnboardingForm : els.ptEditForm;
        if (targetForm) {
          if (typeof targetForm.requestSubmit === "function") {
            targetForm.requestSubmit();
          } else {
            targetForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
          }
        }
      });
    }

    // Unified User Info Page: Selecting a person from dropdown immediately switches & populates 8-field form
    if (els.ptQuickSelect) {
      els.ptQuickSelect.addEventListener("change", (e) => {
        const selectedId = e.target.value;
        state.editingMode = "edit";
        const pt = store.setActive(selectedId);
        populatePatientForm("edit", pt);
        renderPatientUI();
        renderChatMessages();
      });
    }

    // Custom Styled Dropdown Interactions (Distinguish Self & Presets, Item Deletion)
    if (els.btnCustomPtTrigger) {
      els.btnCustomPtTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleCustomPtDropdown();
      });
    }

    if (els.customPtDropdown) {
      els.customPtDropdown.addEventListener("click", (e) => {
        const delBtn = e.target.closest("[data-del-pt]");
        if (delBtn) {
          e.stopPropagation();
          const ptId = delBtn.getAttribute("data-del-pt");
          handleDeletePatientById(ptId);
          return;
        }

        const item = e.target.closest(".custom-dropdown-item[data-pt-id]");
        if (item) {
          const ptId = item.getAttribute("data-pt-id");
          state.editingMode = "edit";
          const pt = store.setActive(ptId);
          populatePatientForm("edit", pt);
          renderPatientUI();
          renderChatMessages();
          toggleCustomPtDropdown(false);
        }
      });
    }

    // Click outside closes custom dropdown
    document.addEventListener("click", (e) => {
      if (els.customPtDropdown && els.customPtDropdown.classList.contains("open")) {
        if (!els.customPtDropdown.contains(e.target)) {
          toggleCustomPtDropdown(false);
        }
      }
    });

    if (els.btnPtCreate) {
      els.btnPtCreate.addEventListener("click", () => {
        state.editingMode = "create";
        populatePatientForm("create");
        if (els.fPtName) els.fPtName.focus();
      });
    }

    if (els.btnPtCancel) {
      els.btnPtCancel.addEventListener("click", () => closePatientForm());
    }
    if (els.ptEditForm) {
      els.ptEditForm.addEventListener("submit", handleSavePatient);
    }
    if (els.btnPtDelete) {
      els.btnPtDelete.addEventListener("click", () => handleDeletePatient());
    }

    // 8. Watch Click-to-Start / Click-to-End & Phone Orb Click Interaction
    [els.btnWatchHold, els.watchHoldLabel, els.h5OrbTouch, els.orbSpecCanvas].forEach((trigger) => {
      if (!trigger) return;
      trigger.addEventListener("click", (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        toggleVoiceSession(e);
      });
    });

    els.watchSimBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const phrase = btn.getAttribute("data-watch-sim");
        simulateWatchVoice(phrase);
      });
    });

    if (els.watchCrownBtn) {
      els.watchCrownBtn.addEventListener("click", () => {
        const next = (state.currentStep % 5) + 1;
        switchStep(next);
      });
    }

    // 9. Step 5: Dedicated Orb & UI Specification Interactive Controls
    els.layerToggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const layerKey = btn.getAttribute("data-layer");
        const isActive = !btn.classList.contains("active");
        btn.classList.toggle("active", isActive);
        orbManager.instances.forEach((inst) => {
          if (inst.layers && layerKey in inst.layers) {
            inst.layers[layerKey] = isActive;
          }
        });
      });
    });

    if (els.btnResetLayers) {
      els.btnResetLayers.addEventListener("click", () => {
        els.layerToggleBtns.forEach((btn) => btn.classList.add("active"));
        orbManager.instances.forEach((inst) => {
          Object.keys(inst.layers).forEach((k) => {
            inst.layers[k] = true;
          });
        });
        showToast("已开启全部 5 层光球渲染结构");
      });
    }

    if (els.specTypingInput) {
      els.specTypingInput.addEventListener("input", () => {
        orbManager.triggerAllTypingPulse();
      });
    }

    if (els.btnSpecAutoType) {
      els.btnSpecAutoType.addEventListener("click", () => {
        runAutoTypingDemo(els.specTypingInput, false);
      });
    }

    if (els.specTypingForm) {
      els.specTypingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = els.specTypingInput.value.trim();
        if (!val) return;
        els.specTypingInput.value = "";
        switchStep(4);
        sendConsultationMessage(val, "h5");
      });
    }

    if (els.btnBackToFlow) {
      els.btnBackToFlow.addEventListener("click", () => {
        switchStep(4);
      });
    }
  }

  /**
   * Apply URL query params for direct state inspection (?step=1..5&sheet=1&edit=1&listening=1&typing=1)
   */
  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const stepParam = Number(params.get("step"));
    if ([1, 2, 3, 4, 5].includes(stepParam)) {
      switchStep(stepParam);
    } else {
      switchStep(4);
    }

    const ptParam = params.get("pt") || params.get("patient");
    if (ptParam) {
      const allPts = store.getAll();
      const match = allPts.find((p) => p.id === ptParam || p.id === `pt_${ptParam}` || p.name === ptParam);
      if (match) {
        store.setActive(match.id);
        renderPatientUI();
        populatePatientForm("edit", match);
      }
    }

    const subpageParam = params.get("subpage");
    if (
      subpageParam === "person_select" ||
      subpageParam === "profile_edit" ||
      params.get("sheet") === "1" ||
      params.get("edit") === "1"
    ) {
      switchH5SubPage("profile_edit", { mode: "edit" });
    } else {
      switchH5SubPage("chat");
    }

    const modeParam = params.get("mode") || (params.get("kbd") === "1" ? "keyboard" : "orb");
    setInputDockMode(modeParam === "keyboard" ? "keyboard" : "orb");

    if (params.get("listening") === "1") {
      state.isHoldingVoice = true;
      setGlobalOrbState("listening", "对话状态 · 正在倾听语音");
    }

    if (params.get("typing") === "1" && els.chatInput) {
      els.chatInput.value = "我今天早上测了血压 146/92，有点头晕，氨氯地平还要吃吗？";
      orbManager.triggerAllTypingPulse();
    }

    if (params.get("dropdown") === "1" || params.get("menu") === "1") {
      setTimeout(() => {
        toggleCustomPtDropdown(true);
      }, 120);
    }

    const focusParam = params.get("focus");
    if (focusParam) {
      setTimeout(() => {
        const targetField = document.getElementById(focusParam);
        if (targetField) {
          targetField.focus();
          openUserInfoKeyboard(targetField);
        }
      }, 120);
    }
  }

  function init() {
    cacheElements();
    initOrbs();
    renderPatientUI();
    renderChatMessages();
    bindEvents();
    applyUrlParams();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

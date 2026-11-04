/**
 * Wenzhen — 前后端解耦接口适配层 (API & WebSocket Adapter)
 * 当前状态：默认开启本地离线模式 (USE_MOCK = true)，所有数据持久化于手机浏览器 localStorage，开箱即用。
 * 对接后端时：只需将 USE_MOCK 改为 false，并填入真实的 API_BASE_URL 与 WS_BASE_URL。
 */
(function (global) {
  'use strict';

  const CONFIG = {
    USE_MOCK: true,
    API_BASE_URL: 'https://api.your-domain.com/api/v1',
    WS_BASE_URL: 'wss://api.your-domain.com/ws/watch-sync',
    // 微信扫码进入 H5 时 URL 自动携带的手表设备号，例如: h5.html?sn=HRT-W2026-8842
    WATCH_SN: new URLSearchParams(window.location.search).get('sn') || 'HRT-W2026-8842'
  };

  const WenzhenAPI = {
    config: CONFIG,
    ws: null,
    onWatchVoiceCallback: null,

    /**
     * 1. 登录并绑定手表接口
     * POST /api/v1/auth/bind-login
     * Body: { username, password, watchSn, wxOpenId }
     */
    async loginAndBind({ username, password }) {
      if (CONFIG.USE_MOCK) {
        localStorage.setItem('wenzhen_user', JSON.stringify({ username, watchSn: CONFIG.WATCH_SN }));
        return { ok: true, token: 'mock_jwt_token', watchSn: CONFIG.WATCH_SN, username };
      }
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/bind-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, watchSn: CONFIG.WATCH_SN })
      });
      return res.json();
    },

    /**
     * 2. 获取患者列表 / 切换预设患者
     * GET /api/v1/patients?watchSn=xxx
     */
    async fetchPatients() {
      if (CONFIG.USE_MOCK) {
        return { ok: true, data: global.PatientStore.getAll(), active: global.PatientStore.getActive() };
      }
      const res = await fetch(`${CONFIG.API_BASE_URL}/patients?watchSn=${encodeURIComponent(CONFIG.WATCH_SN)}`);
      return res.json();
    },

    /**
     * 3. 新增或修改患者档案（保存后后端通过长连接同步给手表）
     * POST / PUT /api/v1/patients
     * Fields: { name, gender, age, weight, height, history, medications, extraInfo }
     */
    async savePatient(mode, id, payload) {
      if (CONFIG.USE_MOCK) {
        const pt =
          mode === 'edit'
            ? global.PatientStore.updatePatient(id, payload)
            : global.PatientStore.createPatient(payload);
        return { ok: true, data: pt };
      }
      const url = mode === 'edit' ? `${CONFIG.API_BASE_URL}/patients/${id}` : `${CONFIG.API_BASE_URL}/patients`;
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, watchSn: CONFIG.WATCH_SN })
      });
      return res.json();
    },

    /**
     * 4. 删除患者档案
     * DELETE /api/v1/patients/:id
     */
    async removePatient(id) {
      if (CONFIG.USE_MOCK) {
        return global.PatientStore.deletePatient(id);
      }
      const res = await fetch(`${CONFIG.API_BASE_URL}/patients/${id}`, { method: 'DELETE' });
      return res.json();
    },

    /**
     * 5. 发送问诊消息并获取 AI 医生回复
     * POST /api/v1/chat/ask
     * Body: { patientId, watchSn, source: 'watch'|'h5', text, patientSnapshot }
     */
    async askDoctor({ patient, text, source = 'h5', duration = '04"' }) {
      if (CONFIG.USE_MOCK) {
        const userMsg = global.PatientStore.addMessage(patient.id, {
          role: 'user',
          source,
          duration,
          text
        });
        const aiReply = global.PatientStore.generateAIResponse(patient, text);
        return new Promise((resolve) => {
          setTimeout(() => {
            const aiMsg = global.PatientStore.addMessage(patient.id, {
              role: 'assistant',
              source: 'ai',
              text: aiReply.text,
              tags: aiReply.tags
            });
            resolve({ ok: true, userMsg, aiMsg, watchBrief: aiReply.watchBrief });
          }, 750);
        });
      }
      const res = await fetch(`${CONFIG.API_BASE_URL}/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          watchSn: CONFIG.WATCH_SN,
          source,
          text,
          patientSnapshot: patient
        })
      });
      return res.json();
    },

    /**
     * 6. 建立手表端与手机 H5 的实时 WebSocket 通道
     * 接收手表端「按住说话」推送过来的流式 ASR 文本与状态，使手机光球与手表光球同步动画
     */
    connectWatchStream(onEvent) {
      this.onWatchVoiceCallback = onEvent;
      if (CONFIG.USE_MOCK) return;

      try {
        this.ws = new WebSocket(`${CONFIG.WS_BASE_URL}?watchSn=${encodeURIComponent(CONFIG.WATCH_SN)}`);
        this.ws.onmessage = (evt) => {
          const data = JSON.parse(evt.data);
          // Expected payload: { type: 'orb_state' | 'watch_asr_partial' | 'watch_asr_final' | 'ai_reply', ... }
          if (this.onWatchVoiceCallback) this.onWatchVoiceCallback(data);
        };
      } catch (e) {
        console.warn('WebSocket connection error:', e);
      }
    }
  };

  global.WenzhenAPI = WenzhenAPI;
})(window);

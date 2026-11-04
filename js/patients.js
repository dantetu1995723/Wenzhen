/**
 * 哈瑞特医疗 (Harriet Medical) — 患者档案与极简智能问诊数据中心
 * 包含：
 * 1. PPT 10 位预设慢病患者（严禁包含“工作室”字段）
 * 2. 8 大核心字段：姓名、性别、年龄、体重(kg)、身高(cm)、既往病史、当前用药、其他信息(纯文字)
 * 3. 精炼版科技感问诊对话流（去除冗长说教，直接给出精准结论）
 */
(function (global) {
  'use strict';

  const STORAGE_KEY_PATIENTS = 'wenzhen_patients_v2';
  const STORAGE_KEY_ACTIVE_ID = 'wenzhen_active_patient_id_v2';
  const STORAGE_KEY_CHATS = 'wenzhen_chats_v2';

  const DEFAULT_PATIENTS = [
    {
      id: 'pt_chenmin',
      name: '陈敏',
      gender: '女',
      age: 51,
      weight: 59,
      height: 158,
      isPreset: true,
      history: '二级原发性高血压; 心功能分级WHO III; 高血脂; PCI术后',
      medications: [
        '氨氯地平片：5mg/次，1次/日，口服，长期',
        '依折麦布片：10mg/次，1次/日，口服，长期',
        '氯吡格雷片：75mg/次，1次/日，口服，连用12个月',
        '地奥司明片：0.9g/次，2次/日，口服，连用5~7天'
      ],
      extraInfo:
        '生化报告单：LDL-C 2.12 mmol/L，血钾 4.2 mmol/L，肌酐 68 μmol/L，NT-proBNP 310 pg/mL。偶有下午轻度头晕及下肢轻度水肿。'
    },
    {
      id: 'pt_zhangsan',
      name: '张三',
      gender: '男',
      age: 45,
      weight: 72,
      height: 172,
      isPreset: true,
      history: '高血压; 糖尿病; PCI术后',
      medications: [
        '氨氯地平片：5mg/次，1次/日，口服，长期',
        '二甲双胍片：0.5g/次，3次/日，口服，长期',
        '阿司匹林肠溶片：100mg/次，1次/日，口服，长期',
        '氯吡格雷片：75mg/次，1次/日，口服，连用12个月',
        '阿托伐他汀钙片：20mg/次，1次/晚，口服，长期'
      ],
      extraInfo:
        '生化报告单：空腹血糖 6.9 mmol/L，HbA1c 6.6%，LDL-C 1.58 mmol/L，肝肾功能正常。'
    },
    {
      id: 'pt_lisi',
      name: '李四',
      gender: '男',
      age: 62,
      weight: 76,
      height: 170,
      isPreset: true,
      history: '冠心病; 阵发性房颤; 高血压2级',
      medications: [
        '利伐沙班片：15mg/次，1次/日，口服，长期',
        '琥珀酸美托洛尔缓释片：47.5mg/次，1次/日，口服，长期',
        '缬沙坦胶囊：80mg/次，1次/日，口服，长期',
        '瑞舒伐他汀钙片：10mg/次，1次/晚，口服，长期'
      ],
      extraInfo:
        '生化报告单：INR 1.08，肌酐清除率 74 mL/min，24h动态心电图示阵发性房颤2次，平均心率 68 bpm。'
    },
    {
      id: 'pt_wangfang',
      name: '王芳',
      gender: '女',
      age: 56,
      weight: 61,
      height: 160,
      isPreset: true,
      history: '2型糖尿病; 高脂血症; 颈动脉斑块',
      medications: [
        '达格列净片：10mg/次，1次/日，口服，长期',
        '二甲双胍缓释片：0.5g/次，2次/日，口服，长期',
        '阿托伐他汀钙片：20mg/次，1次/晚，口服，长期'
      ],
      extraInfo:
        '生化报告单：空腹血糖 6.3 mmol/L，HbA1c 6.4%，右侧颈动脉球部斑块 4.2×1.6mm。'
    },
    {
      id: 'pt_zhaojianguo',
      name: '赵建国',
      gender: '男',
      age: 70,
      weight: 68,
      height: 168,
      isPreset: true,
      history: '慢性心力衰竭(心功能II-III级); 陈旧性心梗; 高血压',
      medications: [
        '沙库巴曲缬沙坦钠片：100mg/次，2次/日，口服，长期',
        '呋塞米片：20mg/次，1次/日，口服，按需调整',
        '螺内酯片：20mg/次，1次/日，口服，长期',
        '阿司匹林肠溶片：100mg/次，1次/日，口服，长期'
      ],
      extraInfo:
        '生化报告单：NT-proBNP 860 pg/mL，血钾 4.4 mmol/L，eGFR 62 mL/min。需每日晨起监测体重。'
    },
    {
      id: 'pt_liuxiaoyu',
      name: '刘小雨',
      gender: '女',
      age: 28,
      weight: 50,
      height: 163,
      isPreset: true,
      history: '窦性心动过速; 室性早搏; 睡眠障碍',
      medications: [
        '富马酸比索洛尔片：2.5mg/次，1次/日，口服，短期',
        '辅酶Q10胶囊：10mg/次，3次/日，口服，连用1个月'
      ],
      extraInfo: '生化报告单：甲功五项正常，心肌酶正常，室早 840 次/24h。'
    },
    {
      id: 'pt_zhouming',
      name: '周明',
      gender: '男',
      age: 38,
      weight: 84,
      height: 176,
      isPreset: true,
      history: '原发性高血压1级; 高尿酸血症; 中度脂肪肝',
      medications: [
        '奥美沙坦酯片：20mg/次，1次/日，口服，长期',
        '非布司他片：20mg/次，1次/日，口服，连用3个月'
      ],
      extraInfo: '生化报告单：血尿酸 495 μmol/L，ALT 48 U/L，甘油三酯 2.65 mmol/L。'
    },
    {
      id: 'pt_wuguilan',
      name: '吴桂兰',
      gender: '女',
      age: 78,
      weight: 54,
      height: 155,
      isPreset: true,
      history: '高血压3级(很高危); 骨质疏松; 腔隙性脑梗死',
      medications: [
        '硝苯地平控释片：30mg/次，1次/日，口服，长期',
        '硫酸氢氯吡格雷片：75mg/次，1次/日，口服，长期',
        '骨化三醇胶丸：0.25μg/次，1次/日，口服，长期',
        '碳酸钙D3片：600mg/次，1次/日，口服，长期'
      ],
      extraInfo: '生化报告单：血钙 2.28 mmol/L，同型半胱氨酸 15.8 μmol/L。防体位性低血压。'
    },
    {
      id: 'pt_sunhaoran',
      name: '孙浩然',
      gender: '男',
      age: 52,
      weight: 75,
      height: 174,
      isPreset: true,
      history: '稳定性心绞痛; 高血压; 混合型高脂血症',
      medications: [
        '单硝酸异山梨酯缓释片：40mg/次，1次/日，口服，长期',
        '阿司匹林肠溶片：100mg/次，1次/日，口服，长期',
        '阿托伐他汀钙片：20mg/次，1次/晚，口服，长期',
        '培哚普利叔丁胺片：4mg/次，1次/日，口服，长期'
      ],
      extraInfo: '生化报告单：LDL-C 1.92 mmol/L，冠脉CTA示右冠中段狭窄约50%。'
    },
    {
      id: 'pt_huanglihua',
      name: '黄丽华',
      gender: '女',
      age: 42,
      weight: 57,
      height: 162,
      isPreset: true,
      history: '高血压; 偏头痛; 轻度缺铁性贫血',
      medications: [
        '左氨氯地平片：2.5mg/次，1次/日，口服，长期',
        '琥珀酸亚铁片：0.1g/次，2次/日，口服，连用2个月'
      ],
      extraInfo: '生化报告单：Hb 104 g/L，血清铁蛋白 11.2 ng/mL，血压晨峰 142/90 mmHg。'
    }
  ];

  function createInitialChats() {
    return {
      pt_chenmin: [
        {
          id: 'msg_cm_1',
          role: 'assistant',
          source: 'system',
          time: '09:15',
          text: '陈敏女士，已同步您的慢病档案与 4 项在用药物。请点击手表开始说话或直接打字提问。',
          tags: ['档案已同步', '心功能WHO III']
        },
        {
          id: 'msg_cm_2',
          role: 'user',
          source: 'watch',
          duration: '05"',
          time: '09:18',
          text: '早上有点头晕，刚测血压 146/92，地奥司明片快吃完了还要吃吗？'
        },
        {
          id: 'msg_cm_3',
          role: 'assistant',
          source: 'ai',
          time: '09:18',
          text: '1. **血压 146/92** 略偏高，请确认今日 **氨氯地平片(5mg)** 是否已服，静坐15分钟后复测。\n2. **地奥司明片** 处方为 5~7 天短期疗程，水肿消退即可停药。\n3. **氯吡格雷** 与 **依折麦布** 需继续每日按时服用。',
          tags: ['血压预警', '用药指导']
        }
      ],
      pt_zhangsan: [
        {
          id: 'msg_zs_1',
          role: 'assistant',
          source: 'system',
          time: '10:00',
          text: '张三先生，已加载您的高血压、糖尿病及 PCI 术后档案，今日有何不适？',
          tags: ['档案已同步']
        }
      ]
    };
  }

  const PatientStore = {
    patients: [],
    activeId: 'pt_chenmin',
    chats: {},

    init() {
      try {
        const rawPatients = localStorage.getItem(STORAGE_KEY_PATIENTS);
        if (rawPatients) {
          this.patients = JSON.parse(rawPatients);
        } else {
          this.patients = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
          this.savePatients();
        }

        const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
        if (savedActive && this.patients.some((p) => p.id === savedActive)) {
          this.activeId = savedActive;
        } else if (this.patients.length > 0) {
          this.activeId = this.patients[0].id;
        }

        const rawChats = localStorage.getItem(STORAGE_KEY_CHATS);
        if (rawChats) {
          this.chats = JSON.parse(rawChats);
        } else {
          this.chats = createInitialChats();
          this.saveChats();
        }
      } catch (e) {
        this.patients = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
        this.activeId = 'pt_chenmin';
        this.chats = createInitialChats();
      }
    },

    savePatients() {
      try {
        localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(this.patients));
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, this.activeId);
      } catch (e) {}
    },

    saveChats() {
      try {
        localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(this.chats));
      } catch (e) {}
    },

    getAll() {
      return this.patients;
    },

    getActive() {
      return this.patients.find((p) => p.id === this.activeId) || this.patients[0] || null;
    },

    setActive(id) {
      const found = this.patients.find((p) => p.id === id);
      if (found) {
        this.activeId = found.id;
        this.savePatients();
        this.ensureWelcomeMessage(found);
      }
      return found;
    },

    ensureWelcomeMessage(patient) {
      if (!patient) return;
      if (!this.chats[patient.id] || this.chats[patient.id].length === 0) {
        const medsCount = (patient.medications || []).length;
        const now = new Date();
        const timeStr =
          String(now.getHours()).padStart(2, '0') +
          ':' +
          String(now.getMinutes()).padStart(2, '0');
        this.chats[patient.id] = [
          {
            id: 'msg_init_' + Date.now(),
            role: 'assistant',
            source: 'system',
            time: timeStr,
            text: `${patient.name}（${patient.gender}·${patient.age}岁），已同步病史（${patient.history || '无'}）与 ${medsCount} 项用药。请直接语音或文字提问。`,
            tags: ['档案已同步', `${medsCount}项用药`]
          }
        ];
        this.saveChats();
      }
    },

    updatePatient(id, data) {
      const idx = this.patients.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const updated = {
        ...this.patients[idx],
        name: String(data.name || '').trim() || this.patients[idx].name,
        gender: data.gender || '女',
        age: Number(data.age) || 50,
        weight: Number(data.weight) || 60,
        height: Number(data.height) || 165,
        history: String(data.history || '').trim(),
        medications: Array.isArray(data.medications)
          ? data.medications.filter((m) => m.trim())
          : String(data.medications || '')
              .split(/\n+/)
              .map((s) => s.trim())
              .filter(Boolean),
        extraInfo: String(data.extraInfo || '').trim()
      };
      this.patients[idx] = updated;
      this.savePatients();
      return updated;
    },

    createPatient(data) {
      const newPatient = {
        id: 'pt_custom_' + Date.now(),
        name: String(data.name || '').trim() || '新患者',
        gender: data.gender || '女',
        age: Number(data.age) || 50,
        weight: Number(data.weight) || 60,
        height: Number(data.height) || 165,
        isPreset: false,
        history: String(data.history || '').trim() || '暂无特殊病史',
        medications: Array.isArray(data.medications)
          ? data.medications.filter((m) => m.trim())
          : String(data.medications || '')
              .split(/\n+/)
              .map((s) => s.trim())
              .filter(Boolean),
        extraInfo: String(data.extraInfo || '').trim()
      };
      this.patients.unshift(newPatient);
      this.activeId = newPatient.id;
      this.savePatients();
      this.ensureWelcomeMessage(newPatient);
      return newPatient;
    },

    deletePatient(id) {
      if (this.patients.length <= 1) {
        return { ok: false, reason: '至少保留一位患者档案' };
      }
      const idx = this.patients.findIndex((p) => p.id === id);
      if (idx === -1) return { ok: false, reason: '未找到该患者' };
      const removed = this.patients.splice(idx, 1)[0];
      if (this.activeId === id) {
        this.activeId = this.patients[0].id;
      }
      this.savePatients();
      return { ok: true, removed, active: this.getActive() };
    },

    resetDefaults() {
      this.patients = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
      this.activeId = 'pt_chenmin';
      this.chats = createInitialChats();
      this.savePatients();
      this.saveChats();
      return this.getActive();
    },

    getChats(patientId) {
      const id = patientId || this.activeId;
      const pt = this.patients.find((p) => p.id === id);
      if (pt) this.ensureWelcomeMessage(pt);
      return this.chats[id] || [];
    },

    addMessage(patientId, msg) {
      const id = patientId || this.activeId;
      if (!this.chats[id]) this.chats[id] = [];
      const now = new Date();
      const timeStr =
        String(now.getHours()).padStart(2, '0') +
        ':' +
        String(now.getMinutes()).padStart(2, '0');
      const fullMsg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        time: timeStr,
        ...msg
      };
      this.chats[id].push(fullMsg);
      this.saveChats();
      return fullMsg;
    },

    deleteMessage(patientId, msgId) {
      const id = patientId || this.activeId;
      if (!this.chats[id]) return;
      this.chats[id] = this.chats[id].filter((m) => m.id !== msgId);
      this.saveChats();
    },

    clearChats(patientId) {
      const id = patientId || this.activeId;
      this.chats[id] = [];
      const pt = this.patients.find((p) => p.id === id);
      if (pt) this.ensureWelcomeMessage(pt);
      this.saveChats();
    },

    generateAIResponse(patient, userText) {
      const name = patient.name;
      const meds = patient.medications || [];
      const firstMed = meds[0] ? meds[0].split('：')[0] : '常规降压药';
      const q = userText.trim();

      if (q.includes('头晕') || q.includes('血压') || q.includes('高')) {
        return {
          text: `• **处置建议**：先静坐休息 15 分钟复测血压，防跌倒。\n• **用药核对**：确认今日 **${firstMed}** 是否已服，切勿临时加倍。\n• **就医红线**：若复测仍 ≥160/100 或伴视物模糊，请及时就医。`,
          tags: ['血压评估', '防跌倒'],
          watchBrief: '请静坐15分钟复测血压，确认今日降压药已服，切勿加倍服药。'
        };
      }

      if (q.includes('胸闷') || q.includes('胸痛') || q.includes('心慌') || q.includes('喘')) {
        return {
          text: `• **立即制动**：原地半卧位静息，保持呼吸平稳。\n• **重点监测**：留意手表实时心率，规律服用抗血小板/护心药物。\n• **急救警示**：若胸痛胸闷持续 >15 分钟伴冷汗，立即拨打 120。`,
          tags: ['心血管预警', '静息观察'],
          watchBrief: '请立即静坐休息！若胸闷超15分钟不缓解，请立即呼叫家属或就医。'
        };
      }

      if (q.includes('药') || q.includes('吃') || q.includes('地奥司明') || q.includes('氨氯地平') || q.includes('氯吡格雷')) {
        const medLines = meds.length
          ? meds.map((m, i) => `${i + 1}. ${m}`).join('\n')
          : '暂无在用药物记录';
        return {
          text: `**${name} 当前用药清单**：\n${medLines}\n\n• 标注「长期」药物请每日定时服用；「短期/连用」药物满疗程后评估停用。`,
          tags: ['处方核对', '疗程提醒'],
          watchBrief: `已核对您当前 ${meds.length} 项用药，长期药请按时服用，短期药满疗程停用。`
        };
      }

      if (q.includes('化验') || q.includes('报告') || q.includes('生化') || q.includes('指标')) {
        return {
          text: `**档案补充/生化指标**：\n${patient.extraInfo || '暂未录入生化报告单'}\n\n• 建议低盐低脂饮食（盐 <5g/日），每 3~6 个月复查血脂与肝肾功能。`,
          tags: ['生化解读', '随访建议'],
          watchBrief: '已结合生化报告生成解读，请保持低盐低脂饮食并定期复查。'
        };
      }

      return {
        text: `已记录症状「${q}」。\n结合您 **${patient.history || '既往档案'}**，请保持规律作息、早晚监测血压心率，当前 **${meds.length} 项药物** 请按医嘱坚持服用。`,
        tags: ['问诊归档', '体征监测'],
        watchBrief: '已记录症状并同步档案，请按时服药并监测早晚血压心率。'
      };
    }
  };

  PatientStore.init();
  global.PatientStore = PatientStore;
})(window);

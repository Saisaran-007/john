const STORAGE_KEY = 'john_v1_5_state';

const constitution = [
  { title: 'Truth Over Agreement', body: 'John seeks accuracy, not approval. He does not automatically agree with the user.' },
  { title: 'Reason Before Conclusion', body: 'John explains the reasoning behind important conclusions whenever useful.' },
  { title: 'Challenge Weak Assumptions', body: 'John respectfully questions unsupported claims, biases, and flawed reasoning.' },
  { title: 'Remember Important Context', body: 'John remembers goals, projects, preferences, important dates, and recurring patterns.' },
  { title: 'Promote Independence', body: 'John helps the user become a better thinker rather than becoming dependent on John.' },
  { title: 'Track Long-Term Goals', body: 'John monitors progress toward goals and helps maintain consistency over time.' },
  { title: 'Intellectual Honesty', body: 'John distinguishes between facts, assumptions, uncertainty, and opinions.' },
  { title: 'Continuous Self-Improvement', body: 'John periodically reviews memories, verifies accuracy, and updates understanding.' },
  { title: 'Transparency', body: 'John can explain reasoning, memories, assumptions, and evidence behind conclusions.' }
];

const defaultState = {
  page: 'dashboard',
  memoryFilter: 'all',
  memories: [],
  goals: [
    { id: cryptoId(), title: 'Improve English', progress: 30, nextAction: 'Practice a 10-minute conversation', notes: 'Speaking feels more useful than app-based drills.' },
    { id: cryptoId(), title: 'Build John', progress: 15, nextAction: 'Upgrade UI and memory system', notes: 'Focus on practical assistant behavior.' }
  ],
  insights: [],
  conversations: [],
  settings: {
    voiceEnabled: true,
    voiceName: '',
    showWhyOnReply: true,
    autoSaveInsights: true,
    autoClassifyMemory: true,
    apiBaseUrl: '',
    apiKey: '',
    apiModel: ''
  }
};

let state = loadState();
let voices = [];
let thinking = false;

const els = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
  bindElements();
  attachEvents();
  ensureStateShape();
  setupSpeech();
  renderAll();
  addWelcomeIfNeeded();
}

function bindElements() {
  const ids = ['statusPill', 'intelligence', 'todayFocus', 'todaySummary', 'memoryCount', 'goalCount', 'insightCount', 'chatCount', 'dashFocus', 'dashFocusText', 'dashNextAction', 'dashInsight', 'dashMemorySnapshot', 'dashMemoryDetail', 'recentGoalsLabel', 'recentGoals', 'recentInsights', 'chatLog', 'thinkingRow', 'messageInput', 'sendBtn', 'micBtn', 'testVoiceBtn', 'clearChatBtn', 'memoryFilters', 'memoryText', 'memoryType', 'addMemoryBtn', 'memoryList', 'goalTitle', 'goalNextAction', 'goalNotes', 'goalProgress', 'goalProgressValue', 'addGoalBtn', 'goalList', 'constitutionList', 'miniConstitution', 'voiceSelect', 'voiceEnabled', 'refreshVoices', 'showWhyOnReply', 'autoSaveInsights', 'autoClassifyMemory', 'apiBaseUrl', 'apiKey', 'apiModel', 'saveSettingsBtn', 'clearDataBtn', 'exportBtn', 'importInput', 'refreshDashboard'];
  ids.forEach(id => els[id] = document.getElementById(id));
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => setPage(btn.dataset.page)));
}

function attachEvents() {
  els.sendBtn.addEventListener('click', sendMessage);
  els.messageInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
  els.micBtn.addEventListener('click', startVoiceInput);
  els.testVoiceBtn.addEventListener('click', () => speak('John is ready.'));
  els.clearChatBtn.addEventListener('click', clearChat);
  els.addMemoryBtn.addEventListener('click', addManualMemory);
  els.goalProgress.addEventListener('input', () => els.goalProgressValue.textContent = `${els.goalProgress.value}%`);
  els.addGoalBtn.addEventListener('click', addGoal);
  els.memoryFilters.addEventListener('click', handleMemoryFilterClick);
  els.refreshVoices.addEventListener('click', setupSpeech);
  els.saveSettingsBtn.addEventListener('click', saveSettingsFromForm);
  els.clearDataBtn.addEventListener('click', clearAllData);
  els.exportBtn.addEventListener('click', exportData);
  els.importInput.addEventListener('change', importData);
  els.refreshDashboard.addEventListener('click', renderAll);
  ['voiceEnabled', 'showWhyOnReply', 'autoSaveInsights', 'autoClassifyMemory', 'apiBaseUrl', 'apiKey', 'apiModel', 'voiceSelect'].forEach(id => els[id].addEventListener('change', saveSettingsFromForm));
  els.goalProgressValue.textContent = `${els.goalProgress.value}%`;
}

function ensureStateShape() {
  state = {
    ...defaultState,
    ...state,
    settings: { ...defaultState.settings, ...(state.settings || {}) },
    memories: Array.isArray(state.memories) ? state.memories : [],
    goals: Array.isArray(state.goals) ? state.goals : [],
    insights: Array.isArray(state.insights) ? state.insights : [],
    conversations: Array.isArray(state.conversations) ? state.conversations : []
  };
  if (state.goals.length === 0) state.goals = defaultState.goals.map(g => ({ ...g, id: cryptoId() }));
  persist();
}

function setPage(page) {
  state.page = page;
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  document.querySelectorAll('.page').forEach(section => section.classList.toggle('active', section.id === `${page}Page`));
  persist();
  renderDashboard();
  if (page === 'chat') els.messageInput.focus();
}

function renderAll() {
  setPage(state.page || 'dashboard');
  renderDashboard();
  renderChat();
  renderMemories();
  renderGoals();
  renderConstitution();
  renderSettings();
  updateStats();
  renderMiniConstitution();
}

function renderDashboard() {
  const memories = state.memories;
  const goals = state.goals;
  const insights = state.insights;
  const activeGoals = goals.filter(g => Number(g.progress) < 100).slice(0, 3);
  els.recentGoalsLabel.textContent = activeGoals.length ? `${activeGoals.length} active` : 'No active goals';

  els.recentGoals.innerHTML = activeGoals.length
    ? activeGoals.map(goal => `
      <article class="goal-pill">
        <span class="badge">${goal.progress}%</span>
        <h4>${escapeHtml(goal.title)}</h4>
        <p><strong>Next:</strong> ${escapeHtml(goal.nextAction || 'Add a next step')}</p>
      </article>
    `).join('')
    : `<div class="goal-pill"><h4>No active goals</h4><p>Add goals in the Goals tab to make John more useful.</p></div>`;

  const latestInsight = insights[0]?.text || 'Nothing saved yet.';
  els.dashInsight.textContent = latestInsight;
  els.recentInsights.innerHTML = insights.slice(0, 4).length
    ? insights.slice(0, 4).map(insight => `
      <article class="insight-pill">
        <span class="badge">${insight.source || 'Insight'}</span>
        <h4>${escapeHtml(insight.text)}</h4>
        <p>${escapeHtml(insight.detail || 'Derived from memory and chat context.')}</p>
      </article>
    `).join('')
    : `<div class="insight-pill"><h4>No insights yet</h4><p>Start chatting and John will derive useful patterns.</p></div>`;

  const focus = getFocusSummary();
  els.dashFocus.textContent = focus.title;
  els.dashFocusText.textContent = focus.text;
  els.dashNextAction.textContent = focus.nextAction;
  els.dashMemorySnapshot.textContent = `${memories.length} item${memories.length === 1 ? '' : 's'} stored`;
  els.dashMemoryDetail.textContent = memories.length ? `${countByType(memories, 'critical')} critical, ${countByType(memories, 'important')} important, ${countByType(memories, 'temporary')} temporary.` : 'Important context will appear here as you chat.';
  els.todayFocus.textContent = focus.title;
  els.todaySummary.textContent = focus.text;
}

function renderChat() {
  if (!state.conversations.length) {
    els.chatLog.innerHTML = '';
    return;
  }

  els.chatLog.innerHTML = state.conversations.map(msg => {
    const why = msg.why ? `
      <div class="why-box" ${msg.showWhy ? '' : 'hidden'}>
        <div><strong>Reasoning</strong></div>
        <ul>${msg.why.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ul>
        <div><strong>Memories used</strong></div>
        <ul>${msg.why.memories.length ? msg.why.memories.map(m => `<li>${escapeHtml(m)}</li>`).join('') : '<li>No direct memory match.</li>'}</ul>
        <div><strong>Confidence</strong> ${escapeHtml(msg.why.confidence)}</div>
      </div>` : '';

    return `
      <div class="message ${msg.role}">
        <div class="message-head">
          <span>${msg.role === 'user' ? 'You' : 'John'}</span>
          ${msg.role === 'assistant' && msg.why ? `<button class="why-toggle" data-why="${msg.id}">${msg.showWhy ? 'Hide Why?' : 'Why?'}</button>` : ''}
        </div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
        ${why}
      </div>
    `;
  }).join('');

  els.chatLog.querySelectorAll('.why-toggle').forEach(btn => btn.addEventListener('click', () => toggleWhy(btn.dataset.why)));
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function renderMemories() {
  const filter = state.memoryFilter || 'all';
  const items = state.memories.filter(m => filter === 'all' ? true : m.type === filter).sort((a, b) => (b.pinned - a.pinned) || (new Date(b.createdAt) - new Date(a.createdAt)));
  els.memoryList.innerHTML = items.length ? items.map(renderMemoryCard).join('') : `<div class="list-item"><h4>No memories here yet</h4><p>John stores user messages automatically and lets you edit them here.</p></div>`;
  document.querySelectorAll('[data-memory-action]').forEach(btn => btn.addEventListener('click', () => handleMemoryAction(btn.dataset.memoryAction, btn.dataset.id)));
}

function renderGoals() {
  els.goalList.innerHTML = state.goals.length ? state.goals.map(renderGoalCard).join('') : `<div class="list-item"><h4>No goals yet</h4><p>Add a goal to make John more proactive.</p></div>`;
  document.querySelectorAll('[data-goal-action]').forEach(btn => btn.addEventListener('click', () => handleGoalAction(btn.dataset.goalAction, btn.dataset.id)));
}

function renderConstitution() {
  els.constitutionList.innerHTML = constitution.map((rule, index) => `
    <article class="rule-card">
      <span class="badge">Rule ${index + 1}</span>
      <h4>${escapeHtml(rule.title)}</h4>
      <p>${escapeHtml(rule.body)}</p>
    </article>
  `).join('');
}

function renderSettings() {
  els.voiceEnabled.checked = !!state.settings.voiceEnabled;
  els.showWhyOnReply.checked = !!state.settings.showWhyOnReply;
  els.autoSaveInsights.checked = !!state.settings.autoSaveInsights;
  els.autoClassifyMemory.checked = !!state.settings.autoClassifyMemory;
  els.apiBaseUrl.value = state.settings.apiBaseUrl || '';
  els.apiKey.value = state.settings.apiKey || '';
  els.apiModel.value = state.settings.apiModel || '';
  populateVoiceSelect();
}

function renderMiniConstitution() {
  els.miniConstitution.innerHTML = constitution.slice(0, 4).map(rule => `
    <div class="rule-dot">
      <div class="dot"></div>
      <div>
        <strong>${escapeHtml(rule.title)}</strong>
        <div class="muted">${escapeHtml(rule.body)}</div>
      </div>
    </div>
  `).join('');
}

function updateStats() {
  els.memoryCount.textContent = state.memories.length;
  els.goalCount.textContent = state.goals.length;
  els.insightCount.textContent = state.insights.length;
  els.chatCount.textContent = state.conversations.length;
}

function getFocusSummary() {
  const activeGoal = state.goals.find(g => Number(g.progress) < 100);
  if (activeGoal) return { title: activeGoal.title, text: activeGoal.notes || 'Keep this goal moving with small consistent steps.', nextAction: activeGoal.nextAction || 'Define a next action' };
  const latestPreference = state.memories.find(m => m.type === 'important' && /prefer|like|want|goal|study|exam/i.test(m.text));
  if (latestPreference) return { title: 'Learned preference', text: latestPreference.text, nextAction: 'Turn it into a concrete goal' };
  return { title: 'John v1.5', text: 'A practical assistant with memory, transparency, and thoughtful reasoning.', nextAction: 'Choose a goal or ask John a question.' };
}

function handleMemoryFilterClick(event) {
  const btn = event.target.closest('.filter');
  if (!btn) return;
  state.memoryFilter = btn.dataset.filter;
  document.querySelectorAll('.filter').forEach(f => f.classList.toggle('active', f === btn));
  persist();
  renderMemories();
}

function addManualMemory() {
  const text = els.memoryText.value.trim();
  const type = els.memoryType.value;
  if (!text) return;
  addMemory(text, type, 'manual');
  els.memoryText.value = '';
  els.memoryType.value = 'important';
  renderMemories();
  renderDashboard();
}

function addGoal() {
  const title = els.goalTitle.value.trim();
  const nextAction = els.goalNextAction.value.trim();
  const notes = els.goalNotes.value.trim();
  const progress = Number(els.goalProgress.value);
  if (!title) return;
  state.goals.unshift({ id: cryptoId(), title, nextAction, notes, progress });
  els.goalTitle.value = '';
  els.goalNextAction.value = '';
  els.goalNotes.value = '';
  els.goalProgress.value = '0';
  els.goalProgressValue.textContent = '0%';
  persist();
  renderGoals();
  renderDashboard();
}

function handleGoalAction(action, id) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;
  if (action === 'edit') {
    const title = prompt('Edit goal title', goal.title); if (title === null) return;
    const nextAction = prompt('Edit next action', goal.nextAction || ''); if (nextAction === null) return;
    const notes = prompt('Edit notes', goal.notes || ''); if (notes === null) return;
    const progress = Number(prompt('Edit progress 0-100', String(goal.progress ?? 0))); if (Number.isNaN(progress)) return;
    Object.assign(goal, { title: title.trim() || goal.title, nextAction: nextAction.trim(), notes: notes.trim(), progress: Math.max(0, Math.min(100, progress)) });
  }
  if (action === 'delete') { if (!confirm('Delete this goal?')) return; state.goals = state.goals.filter(g => g.id !== id); }
  persist();
  renderGoals();
  renderDashboard();
}

function renderGoalCard(goal) {
  return `
    <article class="list-item">
      <span class="badge">${goal.progress}%</span>
      <h4>${escapeHtml(goal.title)}</h4>
      <p><strong>Next:</strong> ${escapeHtml(goal.nextAction || 'No next action yet')}</p>
      <p><strong>Notes:</strong> ${escapeHtml(goal.notes || 'No notes yet')}</p>
      <div class="item-actions">
        <button class="ghost-btn" data-goal-action="edit" data-id="${goal.id}">Edit</button>
        <button class="ghost-btn" data-goal-action="delete" data-id="${goal.id}">Delete</button>
      </div>
    </article>
  `;
}

function handleMemoryAction(action, id) {
  const memory = state.memories.find(m => m.id === id);
  if (!memory) return;
  if (action === 'edit') {
    const text = prompt('Edit memory', memory.text); if (text === null) return;
    const type = prompt('Edit category: critical, important, temporary', memory.type); if (type === null) return;
    memory.text = text.trim() || memory.text;
    memory.type = normalizeType(type);
  }
  if (action === 'delete') { if (!confirm('Delete this memory?')) return; state.memories = state.memories.filter(m => m.id !== id); }
  if (action === 'pin') memory.pinned = !memory.pinned;
  if (action === 'reclassify') memory.type = memory.type === 'critical' ? 'important' : memory.type === 'important' ? 'temporary' : 'critical';
  persist();
  renderMemories();
  renderDashboard();
}

function renderMemoryCard(memory) {
  return `
    <article class="list-item">
      <span class="badge">${memory.type}${memory.pinned ? ' • pinned' : ''}</span>
      <h4>${escapeHtml(memory.text)}</h4>
      <p>${escapeHtml(formatDate(memory.createdAt))} · ${escapeHtml(memory.source || 'auto')}</p>
      <div class="item-actions">
        <button class="ghost-btn" data-memory-action="edit" data-id="${memory.id}">Edit</button>
        <button class="ghost-btn" data-memory-action="pin" data-id="${memory.id}">${memory.pinned ? 'Unpin' : 'Pin'}</button>
        <button class="ghost-btn" data-memory-action="reclassify" data-id="${memory.id}">Reclassify</button>
        <button class="ghost-btn" data-memory-action="delete" data-id="${memory.id}">Delete</button>
      </div>
    </article>
  `;
}

async function sendMessage() {
  const text = els.messageInput.value.trim();
  if (!text || thinking) return;
  els.messageInput.value = '';
  addConversation({ role: 'user', content: text });
  addMemory(text, classifyMemory(text), 'chat');
  const insight = deriveInsight(text);
  if (insight && state.settings.autoSaveInsights) addInsight(insight.text, insight.detail, 'Chat');
  setThinking(true);
  persist();
  renderChat();
  renderMemories();
  renderDashboard();
  try {
    const response = await generateReply(text);
    addConversation({ role: 'assistant', content: response.reply, why: response.why, showWhy: !!state.settings.showWhyOnReply });
    if (response.why?.insightText && state.settings.autoSaveInsights) addInsight(response.why.insightText, response.why.insightDetail || '', 'John');
    if (state.settings.voiceEnabled) speak(response.reply);
  } catch (err) {
    addConversation({ role: 'assistant', content: 'I hit a problem while generating a response. The local fallback is still available, but something went wrong.', why: { steps: ['Attempted to generate a reply.', 'An error interrupted the process.', 'A fallback message was returned.'], memories: [], confidence: 'low' }, showWhy: true });
  } finally {
    setThinking(false);
    persist();
    renderChat();
    renderMemories();
    renderGoals();
    renderDashboard();
    els.messageInput.focus();
  }
}

async function generateReply(userText) {
  const api = state.settings.apiBaseUrl?.trim();
  if (api) return await generateRemoteReply(userText);
  return generateLocalReply(userText);
}

async function generateRemoteReply(userText) {
  const messages = buildConversationForModel(userText);
  const payload = { model: state.settings.apiModel || undefined, messages };
  const headers = { 'Content-Type': 'application/json' };
  if (state.settings.apiKey) headers.Authorization = `Bearer ${state.settings.apiKey}`;
  const response = await fetch(state.settings.apiBaseUrl, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content ?? data?.output_text ?? data?.reply ?? 'I received the response, but could not parse it cleanly.';
  return { reply, why: { steps: ['A remote AI endpoint was used.', 'The reply was parsed from the API response.', 'John then formatted the result for the chat UI.'], memories: findRelevantMemories(userText).map(m => m.text), confidence: 'medium' } };
}

function buildConversationForModel(userText) {
  const system = { role: 'system', content: ['You are John, a calm, logical, direct, practical, and transparent assistant.', 'Follow this constitution: truth over agreement; reason before conclusion; challenge weak assumptions; remember important context; promote independence; track long-term goals; intellectual honesty; continuous self-improvement; transparency.', 'Ask useful follow-up questions when needed. Be concise, thoughtful, and practical.', 'Use the user’s memory and goals only as context, and do not pretend to know things you do not know.'].join(' ') };
  const recent = state.conversations.slice(-8).map(msg => ({ role: msg.role, content: msg.content }));
  return [system, ...recent, { role: 'user', content: userText }];
}

function generateLocalReply(userText) {
  const lower = userText.toLowerCase();
  const memories = findRelevantMemories(userText);
  const goals = state.goals.filter(g => Number(g.progress) < 100);
  let reply = '';
  let steps = [];
  let confidence = 'medium';
  let insightText = '';
  let insightDetail = '';

  if (/should i|what should i|is it better|help me decide|which is better/.test(lower)) {
    reply = buildDecisionReply(memories, goals);
    steps = ['Detected a decision-making question.', 'Checked for relevant goals and memories.', 'Chose a structured comparison instead of a generic answer.'];
  } else if (/study|exam|school|homework|revision/.test(lower)) {
    reply = buildStudyReply(memories, goals);
    steps = ['Detected a study-related topic.', 'Used goal context if available.', 'Focused on practical next actions instead of vague motivation.'];
    confidence = 'high';
  } else if (/english|speak|fluent|conversation/.test(lower)) {
    reply = buildEnglishReply(memories);
    steps = ['Detected an English improvement topic.', 'Used the conversation-learning pattern from memory.', 'Suggested active practice over passive repetition.'];
    confidence = 'high';
    insightText = 'Active conversation is a strong learning mode for English.';
    insightDetail = 'This was inferred from the user’s stated preference for speaking practice over app drills.';
  } else if (/remember|save this|note this|my name is|i like|i prefer|i want|i am|i'm/.test(lower)) {
    reply = 'Got it. I stored that context and will use it when it becomes relevant.';
    steps = ['The message looked like important context.', 'John saved it automatically.', 'The reply confirmed the memory update.'];
    confidence = 'high';
  } else if (/john|you are|who are you|what are you/.test(lower)) {
    reply = 'I am John: a practical thinking partner that helps with decisions, memory, goals, and clear reasoning.';
    steps = ['Detected an identity question.', 'Returned the assistant’s role and purpose.', 'Kept the answer short and direct.'];
    confidence = 'high';
  } else if (/procrastinat|lazy|motivat|focus/.test(lower)) {
    reply = 'What is actually blocking you: fatigue, confusion, boredom, or a bad task size? The fix depends on the cause, so I would identify that first.';
    steps = ['Detected a motivation/focus issue.', 'Separated the problem into possible causes.', 'Chose diagnosis before advice.'];
  } else if (/build john|project|code|github|website/.test(lower)) {
    reply = 'For John, the next practical step is to keep the UI usable, make memory visible, and only then connect a stronger AI brain.';
    steps = ['Detected a build/project topic.', 'Prioritized usability before intelligence.', 'Aligned the suggestion with the current roadmap.'];
    confidence = 'high';
    insightText = 'Usability comes before advanced intelligence in John v1.5.';
    insightDetail = 'The project should be comfortable to use before more features are added.';
  } else {
    const memoryLine = memories.length ? `I found a few relevant memories: ${memories.slice(0, 2).map(m => `"${m.text}"`).join(' and ')}.` : 'I did not find a strong memory match.';
    const goalLine = goals.length ? `Your active goals suggest this matters for: ${goals.slice(0, 2).map(g => g.title).join(' and ')}.` : 'There are no active goals yet.';
    reply = ['Here is the practical way I would think about it:', memoryLine, goalLine, 'If you want a sharper answer, give me the constraint, the deadline, and the outcome you care about most.'].join('\n\n');
    steps = ['No narrow intent was detected.', 'Used memory and goals for context.', 'Returned a structured request for more details.'];
  }

  return { reply, why: { steps, memories: memories.map(m => m.text).slice(0, 4), confidence, insightText, insightDetail } };
}

function buildDecisionReply(memories, goals) {
  const memoryHint = memories.length ? `I found relevant context: ${memories.slice(0, 2).map(m => `"${m.text}"`).join(' and ')}.` : 'I do not see a strong memory match yet.';
  const goalHint = goals.length ? `The most relevant active goal seems to be "${goals[0].title}".` : 'There are no active goals to anchor the decision.';
  return ['I would not decide this by instinct alone.', memoryHint, goalHint, 'First compare the options on outcome, time cost, and long-term benefit.', 'Then choose the one that best aligns with the goal you care about most.', 'If you want, I can turn it into a simple two-column comparison.'].join('\n\n');
}

function buildStudyReply(memories, goals) {
  const activeGoal = goals[0];
  const studyMemory = memories.find(m => /english|study|exam|school|revision/.test(m.text.toLowerCase()));
  return ['The practical move is to shrink the task until starting feels easy.', activeGoal ? `Your current goal "${activeGoal.title}" suggests we should protect consistency.` : 'There is no active goal conflict.', studyMemory ? `Related memory: "${studyMemory.text}"` : 'I do not have a study memory yet.', 'A useful next step is a single 15-minute block with one clear outcome.'].join('\n\n');
}

function buildEnglishReply(memories) {
  const memoryHint = memories.find(m => /conversation|speaking|duolingo|english/.test(m.text.toLowerCase()));
  return ['Your brain seems to respond better to active speaking than app drills.', memoryHint ? `Relevant context: "${memoryHint.text}"` : 'I am using your recent language-learning preference as context.', 'So I would prioritize voice conversation, short speaking drills, and quick feedback.', 'That is usually more efficient than forcing daily app streaks.'].join('\n\n');
}

function addConversation(msg) { state.conversations.push({ id: cryptoId(), showWhy: false, ...msg }); }
function toggleWhy(id) { const msg = state.conversations.find(m => m.id === id); if (!msg) return; msg.showWhy = !msg.showWhy; if (msg.showWhy) els.whyPanel.innerHTML = renderWhyPanel(msg); persist(); renderChat(); }
function renderWhyPanel(msg) { if (!msg.why) return '<p>No reasoning available.</p>'; return `<div class="badge">John’s reasoning</div><p><strong>Message:</strong> ${escapeHtml(msg.content)}</p><p><strong>Steps:</strong></p><ul>${msg.why.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ul><p><strong>Memories used:</strong></p><ul>${msg.why.memories.length ? msg.why.memories.map(item => `<li>${escapeHtml(item)}</li>`).join('') : '<li>No direct memory match.</li>'}</ul><p><strong>Confidence:</strong> ${escapeHtml(msg.why.confidence || 'unknown')}</p>`; }

function addMemory(text, type, source) {
  const entry = { id: cryptoId(), text: text.trim(), type: normalizeType(type), source: source || 'auto', createdAt: new Date().toISOString(), pinned: false };
  if (state.settings.autoClassifyMemory) entry.type = classifyMemory(text);
  state.memories.unshift(entry);
  persist();
  const insight = deriveInsight(text);
  if (insight && state.settings.autoSaveInsights) addInsight(insight.text, insight.detail, source === 'chat' ? 'Chat' : 'Manual');
}

function addInsight(text, detail, source) {
  if (!text) return;
  const exists = state.insights.some(i => i.text.toLowerCase() === text.toLowerCase());
  if (exists) return;
  state.insights.unshift({ id: cryptoId(), text, detail, source, createdAt: new Date().toISOString() });
  state.insights = state.insights.slice(0, 30);
  persist();
}

function deriveInsight(text) {
  const lower = text.toLowerCase();
  if (/conversation|speaking/.test(lower) && /english|language/.test(lower)) return { text: 'Conversation works better than app drills for English practice.', detail: 'The user explicitly favors speaking practice and real interaction.' };
  if (/build john|john/.test(lower)) return { text: 'John should be practical before being flashy.', detail: 'A useful assistant needs memory, transparency, and good navigation first.' };
  if (/study|exam/.test(lower)) return { text: 'Small consistent study blocks are more realistic than vague plans.', detail: 'The conversation points to execution over motivation.' };
  if (/i like|i prefer/.test(lower)) return { text: 'Preference detected and stored for future personalization.', detail: 'John can use this as context in later replies.' };
  return null;
}

function findRelevantMemories(query) {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 8);
  return state.memories.filter(memory => {
    const t = memory.text.toLowerCase();
    return terms.some(term => term.length > 2 && t.includes(term));
  }).slice(0, 5);
}

function classifyMemory(text) {
  const lower = text.toLowerCase();
  if (/(exam|deadline|project|important|urgent|tomorrow|today|next week|by )/.test(lower)) return 'critical';
  if (/(i like|i prefer|i want|my goal|my name|my school|my class|my hobby|remember)/.test(lower)) return 'important';
  return 'temporary';
}

function normalizeType(type) { const t = String(type || '').toLowerCase().trim(); return ['critical', 'important', 'temporary'].includes(t) ? t : 'important'; }
function countByType(items, type) { return items.filter(item => item.type === type).length; }
function clearChat() { if (!confirm('Clear the chat history?')) return; state.conversations = []; els.whyPanel.innerHTML = '<p>Select an assistant reply to see the reasoning.</p>'; persist(); renderChat(); updateStats(); }
function saveSettingsFromForm() { state.settings.voiceEnabled = !!els.voiceEnabled.checked; state.settings.showWhyOnReply = !!els.showWhyOnReply.checked; state.settings.autoSaveInsights = !!els.autoSaveInsights.checked; state.settings.autoClassifyMemory = !!els.autoClassifyMemory.checked; state.settings.apiBaseUrl = els.apiBaseUrl.value.trim(); state.settings.apiKey = els.apiKey.value.trim(); state.settings.apiModel = els.apiModel.value.trim(); state.settings.voiceName = els.voiceSelect.value || state.settings.voiceName; persist(); }
function clearAllData() { if (!confirm('This will delete all memories, goals, chats, and settings. Continue?')) return; localStorage.removeItem(STORAGE_KEY); state = structuredClone(defaultState); state.goals = defaultState.goals.map(g => ({ ...g, id: cryptoId() })); persist(); ensureStateShape(); renderAll(); }
function exportData() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'john-backup.json'; a.click(); URL.revokeObjectURL(url); }
async function importData(event) { const file = event.target.files?.[0]; if (!file) return; const text = await file.text(); try { const data = JSON.parse(text); state = { ...defaultState, ...data, settings: { ...defaultState.settings, ...(data.settings || {}) }, memories: Array.isArray(data.memories) ? data.memories : [], goals: Array.isArray(data.goals) ? data.goals : [], insights: Array.isArray(data.insights) ? data.insights : [], conversations: Array.isArray(data.conversations) ? data.conversations : [] }; ensureStateShape(); renderAll(); alert('Import complete.'); } catch { alert('Could not import that file.'); } finally { event.target.value = ''; } }
function addWelcomeIfNeeded() { if (state.conversations.length) return; addConversation({ role: 'assistant', content: ['John is ready.', 'I can reason from your goals, remember important context, and keep the interface transparent.', 'Try asking me about studying, decisions, or English practice.'].join('\n\n'), why: { steps: ['No prior chat history existed.', 'A brief welcome message was generated.', 'The focus was placed on practical use.'], memories: [], confidence: 'high', insightText: 'John starts with practicality and transparency.' }, showWhy: !!state.settings.showWhyOnReply }); persist(); renderChat(); }
function setupSpeech() { if (!('speechSynthesis' in window)) return; voices = []; const update = () => { voices = window.speechSynthesis.getVoices() || []; populateVoiceSelect(); applyDefaultVoice(); }; update(); window.speechSynthesis.onvoiceschanged = update; }
function populateVoiceSelect() { if (!els.voiceSelect) return; const availableVoices = voices.length ? voices : (window.speechSynthesis?.getVoices?.() || []); if (!availableVoices.length) { els.voiceSelect.innerHTML = '<option value="">No voices available</option>'; return; } const englishVoices = availableVoices.filter(v => /en/i.test(v.lang)); const list = englishVoices.length ? englishVoices : availableVoices; els.voiceSelect.innerHTML = list.map(v => `<option value="${escapeHtmlAttr(v.name)}">${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`).join(''); const desired = state.settings.voiceName || choosePreferredVoice(list)?.name || ''; if (desired) els.voiceSelect.value = desired; }
function applyDefaultVoice() { const availableVoices = voices.length ? voices : (window.speechSynthesis?.getVoices?.() || []); if (!availableVoices.length) return; if (!state.settings.voiceName) { const preferred = choosePreferredVoice(availableVoices); if (preferred) { state.settings.voiceName = preferred.name; if (els.voiceSelect) els.voiceSelect.value = preferred.name; persist(); } } }
function choosePreferredVoice(list) { const english = list.filter(v => /en/i.test(v.lang)); const candidateList = english.length ? english : list; const maleHint = candidateList.find(v => /male|man|david|alex|mark|microsoft zira/.test(v.name.toLowerCase())); if (maleHint) return maleHint; const neutralHint = candidateList.find(v => /google|microsoft|natural|enhanced/.test(v.name.toLowerCase())); return neutralHint || candidateList[0]; }
function speak(text) { if (!('speechSynthesis' in window) || !state.settings.voiceEnabled) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); const preferred = (window.speechSynthesis.getVoices() || []).find(v => v.name === state.settings.voiceName); if (preferred) utterance.voice = preferred; utterance.lang = preferred?.lang || 'en-IN'; utterance.pitch = 0.95; utterance.rate = 1.02; window.speechSynthesis.speak(utterance); }
function startVoiceInput() { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { alert('Speech recognition is not available in this browser.'); return; } const recognition = new SR(); recognition.lang = 'en-IN'; recognition.interimResults = false; recognition.maxAlternatives = 1; setStatus('Listening'); recognition.onresult = event => { const transcript = event.results[0][0].transcript; els.messageInput.value = transcript; setStatus('Ready'); sendMessage(); }; recognition.onerror = () => setStatus('Ready'); recognition.onend = () => setStatus('Ready'); recognition.start(); }
function setThinking(flag) { thinking = flag; els.thinkingRow.hidden = !flag; const signal = document.getElementById('intelligence'); if (signal) signal.classList.toggle('active', flag); setStatus(flag ? 'Thinking' : 'Ready'); }
function setStatus(text) { els.statusPill.textContent = text; }
function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return structuredClone(defaultState); return JSON.parse(raw); } catch { return structuredClone(defaultState); } }
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function cryptoId() { if (window.crypto?.randomUUID) return crypto.randomUUID(); return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`; }
function escapeHtml(str) { return String(str ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
function escapeHtmlAttr(str) { return escapeHtml(str).replaceAll('`', '&#96;'); }
function formatDate(value) { try { return new Date(value).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return String(value || ''); } }


document.addEventListener('DOMContentLoaded',()=>{
 const mic=document.getElementById('micBtn');
 if(mic){mic.textContent='🎙';}
 const v=document.getElementById('voiceCommandBtn');
 if(v){
   v.addEventListener('click',()=>{
      v.classList.toggle('listening-ring');
      const s=document.querySelector('.voice-status');
      if(v.classList.contains('listening-ring')) s.textContent='● LISTENING';
      else s.textContent='● READY';
   });
 }
});

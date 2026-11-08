window.__ModuleLoader__.load({
	id: "dsh-system-prompt-injector",
	factory: (require) => {
		try {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var __require = require;
		var __factories = {};
		var __cache = {};
		function __load(id) {
			if (Object.prototype.hasOwnProperty.call(__cache, id)) return __cache[id].exports;
			var factory = __factories[id];
			if (factory === undefined) {
				if (typeof id === "string" && id.indexOf("dspi:") !== 0) return __require(id);
				throw new Error("system-prompt-injector: unknown module " + id);
			}
			var record = { exports: {} };
			__cache[id] = record;
			factory(record, record.exports, __load);
			return record.exports;
		}
		if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="dsh-system-prompt-injector/styles.css"]') === null) {
			var __style = document.createElement("style");
			__style.dataset.plugin = "dsh-system-prompt-injector";
			__style.dataset.pluginCss = "dsh-system-prompt-injector/styles.css";
			__style.textContent = "\n.spi-page, .spi-chip {\n  --spi-accent: var(--dsw-alias-state-business-primary, #315ec7);\n  --spi-accent-soft: color-mix(in srgb, var(--spi-accent) 10%, transparent);\n  --spi-success: var(--dsw-alias-state-success-primary, #217646);\n  --spi-danger: var(--dsw-alias-state-error-primary, #d04545);\n  --spi-ink: var(--dsw-alias-label-primary, #24292f);\n  --spi-ink-soft: var(--dsw-alias-label-secondary, #57606a);\n  --spi-ink-faint: var(--dsw-alias-label-tertiary, #57606a);\n  --spi-line: var(--dsw-alias-border-l2, rgba(27, 31, 36, 0.12));\n  --spi-line-soft: var(--dsw-alias-border-l1, rgba(27, 31, 36, 0.07));\n  --spi-surface: var(--dsw-alias-bg-layer-1, #ffffff);\n  --spi-surface-soft: var(--dsw-alias-bg-layer-2, #f6f8fa);\n  --spi-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);\n}\n.spi-page {\n  font-family: inherit;\n  color: var(--spi-ink);\n  max-width: 860px;\n  margin: 0 auto;\n  padding: 8px 4px 40px;\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n  line-height: 1.55;\n}\n\n/* ---------- motion ---------- */\n@keyframes spi-fade {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n.spi-banner { animation: spi-fade .22s ease both; }\n/* 注意：卡片和空状态不加挂载动画。否则点击「新建规则」时整块内容会从\n   opacity:0 淡入，看起来像闪一下；这里只用展开/折叠与状态过渡。 */\n.spi-collapse {\n  display: grid;\n  grid-template-rows: 0fr;\n  min-height: 0;\n  opacity: 0;\n  transition: grid-template-rows .3s cubic-bezier(.22, 1, .36, 1), opacity .22s ease;\n}\n.spi-collapse[data-open=\"true\"] { grid-template-rows: 1fr; opacity: 1; }\n.spi-collapse-inner { overflow: hidden; min-height: 0; }\n\n.spi-presence {\n  display: grid;\n  grid-template-rows: 0fr;\n  opacity: 0;\n  transition: grid-template-rows .28s cubic-bezier(.22, 1, .36, 1), opacity .2s ease;\n}\n.spi-presence[data-open=\"true\"] { grid-template-rows: 1fr; opacity: 1; }\n.spi-presence-inner { overflow: hidden; min-height: 0; }\n\n.spi-swap { display: inline-grid; }\n.spi-swap > span {\n  grid-area: 1 / 1;\n  transition: opacity .2s ease, transform .2s cubic-bezier(.22, 1, .36, 1);\n  white-space: nowrap;\n}\n.spi-swap > span[data-show=\"true\"] { opacity: 1; transform: translateY(0); }\n.spi-swap > span[data-show=\"false\"] { opacity: 0; transform: translateY(3px); pointer-events: none; }\n\n/* ---------- header ---------- */\n.spi-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }\n.spi-header-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }\n.spi-title { margin: 0; font-size: 20px; font-weight: 650; letter-spacing: -0.01em; }\n.spi-subtitle { margin: 0; font-size: 13px; color: var(--spi-ink-faint); }\n.spi-header-actions { display: flex; align-items: center; gap: 8px; flex: none; }\n.spi-master {\n  display: inline-flex; align-items: center; gap: 8px;\n  height: 34px; padding: 0 14px; border-radius: 999px;\n  border: 1px solid var(--spi-line); background: var(--spi-surface);\n  color: var(--spi-ink-soft); font: inherit; font-size: 13px; font-weight: 550;\n  cursor: pointer; transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;\n  box-shadow: var(--spi-shadow);\n}\n.spi-master:hover { border-color: var(--spi-accent); }\n.spi-master:active { transform: scale(.97); }\n.spi-master[data-on=\"true\"] { color: var(--spi-success); border-color: color-mix(in srgb, var(--spi-success) 35%, transparent); background: color-mix(in srgb, var(--spi-success) 7%, var(--spi-surface)); }\n.spi-master-label { color: var(--spi-ink-soft); }\n.spi-master-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--spi-ink-faint); transition: background .2s ease, box-shadow .25s ease, transform .25s cubic-bezier(.22, 1, .36, 1); }\n.spi-master[data-on=\"true\"] .spi-master-dot { background: var(--spi-success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--spi-success) 18%, transparent); transform: scale(1.1); }\n.spi-icon-btn {\n  width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--spi-line);\n  background: var(--spi-surface); color: var(--spi-ink-soft); font-size: 17px; line-height: 1;\n  cursor: pointer; transition: border-color .2s ease, color .2s ease, transform .12s ease;\n  box-shadow: var(--spi-shadow);\n}\n.spi-icon-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }\n.spi-icon-btn:active { transform: scale(.95) rotate(12deg); }\n\n/* ---------- banners ---------- */\n.spi-banner { border-radius: 10px; padding: 10px 14px; font-size: 13px; background: var(--spi-surface-soft); color: var(--spi-ink-soft); transition: background-color .2s ease, color .2s ease; }\n.spi-banner[data-tone=\"ok\"] { background: color-mix(in srgb, var(--spi-success) 9%, var(--spi-surface)); color: var(--spi-success); }\n.spi-banner[data-tone=\"error\"] { background: color-mix(in srgb, var(--spi-danger) 9%, var(--spi-surface)); color: var(--spi-danger); }\n.spi-feedback { display: flex; flex-direction: column; gap: 10px; }\n.spi-status-bar {\n  display: flex; align-items: center; gap: 9px; font-size: 12px; color: var(--spi-ink-faint);\n  padding: 0 2px;\n}\n.spi-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spi-ink-faint); flex: none; transition: background .2s ease, transform .2s ease; }\n.spi-status-dot[data-on=\"true\"] { background: var(--spi-success); transform: scale(1.15); }\n.spi-status-rules { margin-left: auto; }\n\n/* ---------- section ---------- */\n.spi-section { display: flex; flex-direction: column; gap: 12px; }\n.spi-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }\n.spi-section-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }\n.spi-section-hint { margin: -6px 0 0; font-size: 11.5px; color: var(--spi-ink-faint); }\n.spi-section-title { margin: 0; font-size: 14px; font-weight: 650; color: var(--spi-ink-soft); letter-spacing: .02em; }\n.spi-cards { display: flex; flex-direction: column; gap: 10px; }\n.spi-file-input { display: none; }\n.spi-import {\n  display: flex; align-items: center; justify-content: space-between; gap: 12px;\n  flex-wrap: wrap; padding: 12px 14px; border: 1px solid var(--spi-line-soft);\n  border-radius: 12px; background: var(--spi-surface-soft);\n  animation: spi-fade .2s ease both;\n}\n.spi-import-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.spi-import-title { font-size: 13px; font-weight: 600; color: var(--spi-ink-soft); }\n.spi-import-actions { display: flex; gap: 8px; flex-wrap: wrap; }\n\n/* ---------- card ---------- */\n.spi-card {\n  position: relative;\n  background: var(--spi-surface); border: 1px solid var(--spi-line-soft);\n  border-radius: 14px; padding: 14px 16px; box-shadow: var(--spi-shadow);\n  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;\n}\n.spi-card:hover { border-color: var(--spi-line); }\n.spi-card[data-editing=\"true\"] { border-color: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft); }\n.spi-card-main { display: flex; align-items: center; gap: 8px; }\n.spi-card-main > .spi-drag-handle { margin: -4px 0 -4px -8px; }\n.spi-card-open {\n  display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1;\n  border: 0; background: none; padding: 0; color: inherit; font: inherit; text-align: left; cursor: pointer;\n}\n.spi-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--spi-ink-faint); flex: none; transition: background .2s ease, transform .2s ease; }\n.spi-dot[data-on=\"true\"] { background: var(--spi-success); transform: scale(1.08); }\n.spi-card-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.spi-mode-chip {\n  flex: none; font-size: 11px; line-height: 1; padding: 4px 8px; border-radius: 999px;\n  background: var(--spi-surface-soft); color: var(--spi-ink-soft); font-weight: 550;\n}\n.spi-mode-chip[data-mode=\"replace\"] { background: color-mix(in srgb, var(--spi-danger) 9%, var(--spi-surface)); color: var(--spi-danger); }\n.spi-schedule-chip { background: color-mix(in srgb, var(--spi-accent) 9%, var(--spi-surface)); color: var(--spi-accent); }\n.spi-prefill-chip { background: color-mix(in srgb, var(--spi-success) 9%, var(--spi-surface)); color: var(--spi-success); }\n.spi-soft-chip { background: color-mix(in srgb, var(--spi-accent) 9%, var(--spi-surface)); color: var(--spi-accent); }\n.spi-meta { font-size: 11.5px; color: var(--spi-ink-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.spi-card-side { display: flex; align-items: center; gap: 10px; flex: none; }\n.spi-card[data-dragging=\"true\"] { opacity: .55; border-style: dashed; }\n.spi-drag-handle {\n  display: grid; grid-template-columns: repeat(2, 4px); grid-template-rows: repeat(3, 4px);\n  gap: 3px; place-content: center; flex: none; width: 32px; height: 34px;\n  border-radius: 8px; cursor: grab;\n  transition: background-color .15s ease;\n}\n.spi-drag-handle:hover, .spi-drag-handle:focus-visible { background: var(--spi-surface-soft); }\n.spi-drag-handle:active { cursor: grabbing; }\n.spi-drag-handle > span { width: 4px; height: 4px; border-radius: 50%; background: var(--spi-ink-faint); }\n.spi-drag-handle:focus-visible { outline: 2px solid var(--spi-accent); outline-offset: 2px; }\n.spi-drag-handle-lg { width: 36px; height: 38px; }\n.spi-card[data-drop=\"before\"]::before,\n.spi-card[data-drop=\"after\"]::after,\n.spi-soft-slot[data-drop=\"before\"]::before,\n.spi-soft-slot[data-drop=\"after\"]::after {\n  content: \"\"; position: absolute; z-index: 1; left: 12px; right: 12px; height: 2px;\n  border-radius: 999px; background: var(--spi-accent); pointer-events: none;\n}\n.spi-card[data-drop=\"before\"]::before,\n.spi-soft-slot[data-drop=\"before\"]::before { top: -6px; }\n.spi-card[data-drop=\"after\"]::after,\n.spi-soft-slot[data-drop=\"after\"]::after { bottom: -6px; }\n.spi-preview { margin: 8px 0 0 16px; font-size: 12.5px; color: var(--spi-ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.spi-error { margin: 8px 0 0 16px; font-size: 12px; color: var(--spi-danger); }\n\n/* small switch inside card */\n.spi-switch { display: inline-flex; align-items: center; cursor: pointer; }\n.spi-switch input { position: absolute; opacity: 0; width: 0; height: 0; }\n.spi-switch-track { width: 34px; height: 20px; border-radius: 999px; background: var(--spi-line); position: relative; transition: background .16s ease; }\n.spi-switch-track::after { content: \"\"; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.18); transition: transform .16s ease; }\n.spi-switch input:checked + .spi-switch-track { background: var(--spi-success); }\n.spi-switch input:checked + .spi-switch-track::after { transform: translateX(14px); }\n.spi-switch input:focus-visible + .spi-switch-track { outline: 2px solid var(--spi-accent); outline-offset: 2px; }\n\n/* ---------- editor ---------- */\n.spi-editor { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--spi-line-soft); display: flex; flex-direction: column; gap: 14px; }\n.spi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }\n@media (max-width: 680px) { .spi-row { grid-template-columns: 1fr; } }\n.spi-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }\n.spi-label { font-size: 12px; font-weight: 600; color: var(--spi-ink-soft); }\n.spi-input, .spi-textarea {\n  width: 100%; box-sizing: border-box; border: 1px solid var(--spi-line); border-radius: 9px;\n  background: var(--spi-surface); color: var(--spi-ink); padding: 8px 10px; font: inherit; font-size: 13px;\n  transition: border-color .15s ease, box-shadow .15s ease;\n}\n.spi-input:focus, .spi-textarea:focus { outline: none; border-color: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft); }\n.spi-textarea { min-height: 160px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; line-height: 1.6; }\n.spi-hint { font-size: 11.5px; color: var(--spi-ink-faint); }\n.spi-modes { display: inline-flex; gap: 4px; padding: 3px; border-radius: 9px; background: var(--spi-surface-soft); align-self: flex-start; }\n.spi-mode-btn {\n  border: 0; border-radius: 7px; padding: 5px 14px; background: transparent;\n  color: var(--spi-ink-soft); font: inherit; font-size: 12.5px; cursor: pointer;\n  transition: background .2s ease, color .2s ease, transform .12s ease;\n}\n.spi-mode-btn:active { transform: scale(.96); }\n.spi-mode-btn[data-on=\"true\"] { background: var(--spi-surface); color: var(--spi-accent); font-weight: 600; box-shadow: 0 1px 3px rgba(16,24,40,.1); }\n.spi-mini-btn {\n  display: inline-flex; align-items: center; justify-content: center;\n  width: 24px; height: 20px; padding: 0; border-radius: 6px;\n  border: 1px solid var(--spi-line); background: var(--spi-surface);\n  color: var(--spi-ink-faint); font: inherit; font-size: 11px; line-height: 1; cursor: pointer;\n  transition: border-color .15s ease, color .15s ease, background .15s ease;\n}\n.spi-mini-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }\n.spi-mini-btn.danger:hover { border-color: var(--spi-danger); color: var(--spi-danger); }\n.spi-mini-btn[data-disabled=\"true\"], .spi-mini-btn:disabled { opacity: .45; cursor: not-allowed; }\n.spi-order-actions { display: inline-flex; gap: 3px; }\n.spi-undo { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; color: var(--spi-ink-soft); }\n.spi-banner .spi-btn { margin-left: 8px; }\n.spi-content-fields { display: flex; flex-direction: column; gap: 14px; }\n\n/* ---------- soft prefill editor ---------- */\n.spi-soft {\n  display: flex; flex-direction: column; gap: 8px;\n  padding: 12px; border: 1px dashed var(--spi-line); border-radius: 12px;\n  background: var(--spi-surface-soft);\n}\n.spi-soft-toolbar { display: flex; flex-direction: column; gap: 3px; margin-bottom: 2px; }\n.spi-soft-add { align-self: flex-start; height: 30px; font-size: 12px; }\n.spi-soft-slot {\n  position: relative;\n  display: flex; flex-direction: column; gap: 6px;\n  padding: 8px; border: 1px solid var(--spi-line-soft); border-radius: 10px;\n  background: var(--spi-surface);\n  transition: opacity .16s ease, border-color .16s ease, box-shadow .16s ease;\n}\n.spi-soft-slot[data-dragging=\"true\"] { opacity: .55; border-style: dashed; }\n.spi-soft-slot-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }\n.spi-soft-slot-head .spi-drag-handle { margin: -2px 0 -2px -3px; }\n.spi-modes-mini { padding: 2px; gap: 2px; }\n.spi-modes-mini .spi-mode-btn { padding: 3px 9px; font-size: 11.5px; }\n.spi-soft-slot-note { font-size: 11px; color: var(--spi-ink-faint); }\n.spi-soft-actions { display: flex; gap: 3px; margin-left: auto; }\n.spi-soft-textarea { min-height: 64px; font-family: inherit; }\n.spi-soft-baseline {\n  display: flex; align-items: center; gap: 9px;\n  padding: 10px 12px; border: 1px dashed color-mix(in srgb, var(--spi-accent) 35%, var(--spi-line));\n  border-radius: 10px; background: var(--spi-surface);\n}\n.spi-soft-baseline-dot {\n  width: 7px; height: 7px; border-radius: 50%; flex: none;\n  background: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft);\n}\n.spi-soft-baseline-text { display: flex; flex-direction: column; gap: 2px; }\n.spi-soft-baseline-label { font-size: 12px; font-weight: 600; color: var(--spi-accent); }\n\n.spi-editor-actions { display: flex; align-items: center; gap: 8px; }\n.spi-spacer { flex: 1; }\n\n/* ---------- buttons ---------- */\n.spi-btn {\n  display: inline-flex; align-items: center; justify-content: center; gap: 4px;\n  height: 34px; padding: 0 14px; border-radius: 9px;\n  border: 1px solid var(--spi-line); background: var(--spi-surface);\n  color: var(--spi-ink-soft); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;\n  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;\n  white-space: nowrap;\n}\n.spi-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }\n.spi-btn:active { transform: scale(.97); }\n.spi-btn.primary { background: var(--spi-accent); border-color: var(--spi-accent); color: #fff; }\n.spi-btn.primary:hover { filter: brightness(1.05); color: #fff; }\n.spi-btn.danger { color: var(--spi-danger); border-color: color-mix(in srgb, var(--spi-danger) 30%, transparent); }\n.spi-btn.danger:hover { background: color-mix(in srgb, var(--spi-danger) 8%, var(--spi-surface)); border-color: var(--spi-danger); color: var(--spi-danger); }\n/* 保存期间不给按钮加 disabled / 透明度变化：请求一来一回会让按钮闪一下。\n   忙碌状态只用 aria-busy 表达，重复点击由状态仓库去重。 */\n.spi-chip[aria-busy=\"true\"] { cursor: progress; }\n\n/* ---------- empty ---------- */\n.spi-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 16px; color: var(--spi-ink-faint); font-size: 13px; }\n.spi-empty-icon { font-size: 22px; opacity: .55; }\n.spi-empty p { margin: 0; }\n\n.spi-footer { font-size: 11.5px; color: var(--spi-ink-faint); text-align: center; }\n\n/* ---------- composer chip ---------- */\n.spi-chip {\n  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px;\n  border-radius: 999px; border: 1px solid var(--spi-line); background: var(--spi-surface);\n  color: var(--spi-ink-soft); font: inherit; font-size: 12px; line-height: 1; cursor: pointer;\n  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;\n}\n.spi-chip:hover { border-color: var(--spi-accent); }\n.spi-chip:active { transform: scale(.98); }\n.spi-chip[data-on=\"true\"] { border-color: color-mix(in srgb, var(--spi-success) 35%, transparent); background: color-mix(in srgb, var(--spi-success) 6%, var(--spi-surface)); color: var(--spi-success); }\n.spi-chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spi-ink-faint); transition: background .2s ease, transform .2s ease; }\n.spi-chip[data-on=\"true\"] .spi-chip-dot { background: var(--spi-success); transform: scale(1.15); }\n.spi-chip-label { font-weight: 500; }\n.spi-chip-state { font-size: 10.5px; opacity: .75; }\n.spi-chip:focus-visible { outline: 2px solid var(--spi-accent); outline-offset: 2px; }\n\n@media (max-width: 580px) {\n  .spi-card-main { align-items: flex-start; gap: 8px; flex-wrap: wrap; }\n  .spi-card-open { flex-basis: calc(100% - 32px); flex-wrap: wrap; }\n  .spi-card-name { flex-basis: calc(100% - 20px); white-space: normal; overflow-wrap: anywhere; }\n  .spi-card-side { width: 100%; justify-content: flex-end; }\n  .spi-card-open .spi-meta { max-width: 100%; white-space: normal; overflow-wrap: anywhere; }\n}\n\n.spi-card-new { /* 新规则占位；展开与外层 Collapse 的网格行过渡负责动画 */ }\n\n@media (prefers-reduced-motion: reduce) {\n  .spi-page *, .spi-chip {\n    animation-duration: .01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: .01ms !important;\n  }\n}\n";
			document.head.appendChild(__style);
		}
		__factories["dspi:client/index.js"] = (module, exports, __require) => {
/**
 * 系统提示词注入器 — 浏览器半体。
 *
 * 两个入口：
 *   - 设置 → 系统提示词注入器：管理规则和总开关；
 *   - 聊天输入框左侧的「系统提示词」小开关：只开启 / 关闭当前对话的注入。
 *
 * 总开关关闭时快捷按钮隐藏且所有规则失效；总开关开启后，只有当前对话的
 * 快捷开关也开启时，该对话才会真正注入。
 */

const __ext0 = __require("react");
const createElement = __ext0["createElement"];
const useEffect = __ext0["useEffect"];
const useLayoutEffect = __ext0["useLayoutEffect"];
const useRef = __ext0["useRef"];
const useState = __ext0["useState"];
const useSyncExternalStore = __ext0["useSyncExternalStore"];
const __m1 = __require("dspi:client/src/styles.js");
const SPI_CSS = __m1["SPI_CSS"];
const __m2 = __require("dspi:client/src/store.js");
const createStore = __m2["createStore"];
const mergeImportedRules = __m2["mergeImportedRules"];
const parseImportedRules = __m2["parseImportedRules"];
const plainRule = __m2["plainRule"];
const serializeRules = __m2["serializeRules"];

const inject = ['slots']

const MODE_INFO = {
  append: { label: '追加', hint: '保留原系统提示词，把内容加在最后。' },
  prepend: { label: '前置', hint: '把内容插到系统提示词最前面。' },
  replace: { label: '替换', hint: '清空原系统提示词，只保留本规则内容。' },
}

const SCHEDULE_INFO = {
  every: { label: '每轮', hint: '每个模型请求都会注入。' },
  first: { label: '仅首次', hint: '只在当前会话的第一次模型请求注入，之后不再注入。' },
}

const TARGET_INFO = {
  system: { label: '系统提示词', hint: '改写 messages[0]（role: system）。' },
  assistant: {
    label: 'Assistant 预填充',
    hint: '在本次模型请求里预置 assistant 内容；可选原生或软预填充，不写入会话历史。',
  },
}

const PREFILL_MODE_INFO = {
  native: {
    label: '原生',
    hint: '把内容作为最后一条 assistant 消息，模型从这段文字后面接着写；需要 provider 支持 prefill。',
  },
  soft: {
    label: '软预填充',
    hint: '以真实用户消息为基准，在它前面或后面插入假 user / assistant 消息，用上下文惯性引导模型继续写。',
  },
}

let softSlotSeq = 0
function nextSoftSlotKey() {
  softSlotSeq += 1
  return `soft-slot-${softSlotSeq}`
}

function emptyRule() {
  return {
    id: `rule-${Date.now().toString(36)}`,
    name: '新规则',
    enabled: true,
    target: 'system',
    prefillMode: 'native',
    mode: 'append',
    schedule: 'every',
    content: '',
    contentFile: '',
    soft: { before: [], after: [] },
    agentPresets: [],
  }
}

function normalizeDraftSoftSide(value) {
  return (Array.isArray(value) ? value : []).map((item) => ({
    key: typeof item?.key === 'string' && item.key.length > 0 ? item.key : nextSoftSlotKey(),
    role: item?.role === 'assistant' ? 'assistant' : 'user',
    content: typeof item?.content === 'string' ? item.content : '',
  }))
}

function toDraft(rule) {
  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled !== false,
    target: rule.target === 'assistant' ? 'assistant' : 'system',
    prefillMode: rule.target === 'assistant' && rule.prefillMode === 'soft' ? 'soft' : 'native',
    mode: MODE_INFO[rule.mode] ? rule.mode : 'append',
    schedule: rule.schedule === 'first' ? 'first' : 'every',
    content: rule.content || '',
    contentFile: rule.contentFile || '',
    soft: {
      before: normalizeDraftSoftSide(rule.soft?.before),
      after: normalizeDraftSoftSide(rule.soft?.after),
    },
    agentPresets: Array.isArray(rule.agentPresets) ? [...rule.agentPresets] : [],
  }
}

function ModePicker({ value, onChange }) {
  return createElement(
    'div',
    { className: 'spi-modes', role: 'group', 'aria-label': '注入模式' },
    Object.entries(MODE_INFO).map(([mode, info]) =>
      createElement(
        'button',
        {
          key: mode,
          type: 'button',
          className: 'spi-mode-btn',
          'data-on': value === mode ? 'true' : 'false',
          onClick: () => onChange(mode),
        },
        info.label,
      ),
    ),
  )
}

function SchedulePicker({ value, onChange }) {
  return createElement(
    'div',
    { className: 'spi-modes', role: 'group', 'aria-label': '注入时机' },
    Object.entries(SCHEDULE_INFO).map(([schedule, info]) =>
      createElement(
        'button',
        {
          key: schedule,
          type: 'button',
          className: 'spi-mode-btn',
          'data-on': value === schedule ? 'true' : 'false',
          onClick: () => onChange(schedule),
        },
        info.label,
      ),
    ),
  )
}

function TargetPicker({ value, onChange }) {
  return createElement(
    'div',
    { className: 'spi-modes', role: 'group', 'aria-label': '注入位置' },
    Object.entries(TARGET_INFO).map(([target, info]) =>
      createElement(
        'button',
        {
          key: target,
          type: 'button',
          className: 'spi-mode-btn',
          'data-on': value === target ? 'true' : 'false',
          onClick: () => onChange(target),
        },
        info.label,
      ),
    ),
  )
}

function PrefillModePicker({ value, onChange }) {
  return createElement(
    'div',
    { className: 'spi-modes', role: 'group', 'aria-label': '预填充方式' },
    Object.entries(PREFILL_MODE_INFO).map(([mode, info]) =>
      createElement(
        'button',
        {
          key: mode,
          type: 'button',
          className: 'spi-mode-btn',
          'data-on': value === mode ? 'true' : 'false',
          onClick: () => onChange(mode),
        },
        info.label,
      ),
    ),
  )
}

function SoftSlot({ side, item, index, count, dragging, dropPosition, onUpdate, onRemove, onMove, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const roleLabel = item.role === 'assistant' ? '假助手' : '假用户'
  return createElement(
    'div',
    {
      className: 'spi-soft-slot',
      'data-side': side,
      'data-dragging': dragging ? 'true' : 'false',
      'data-drop': dropPosition ?? 'false',
      'data-flip-id': item.key ?? `soft-${side}-${index}`,
      onDragOver,
      onDrop,
    },
    createElement(
      'div',
      { className: 'spi-soft-slot-head' },
      createElement(
        'span',
        {
          className: 'spi-drag-handle',
          draggable: true,
          title: '拖动排序；方向键调整顺序',
          role: 'button',
          tabIndex: 0,
          'aria-label': `${side === 'before' ? '基准前' : '基准后'}第 ${index + 1} 条消息排序把手，方向键调整顺序`,
          onKeyDown: (event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
            event.preventDefault()
            const direction = event.key === 'ArrowUp' ? -1 : 1
            if ((direction < 0 && index > 0) || (direction > 0 && index < count - 1)) onMove(direction)
          },
          onDragStart,
          onDragEnd,
        },
        ...Array.from({ length: 6 }, (_, dot) => createElement('span', { key: dot })),
      ),
      createElement(
        'div',
        { className: 'spi-modes spi-modes-mini', role: 'group', 'aria-label': '消息角色' },
        createElement(
          'button',
          {
            type: 'button',
            className: 'spi-mode-btn',
            'data-on': item.role !== 'assistant' ? 'true' : 'false',
            onClick: () => onUpdate({ role: 'user' }),
          },
          '用户',
        ),
        createElement(
          'button',
          {
            type: 'button',
            className: 'spi-mode-btn',
            'data-on': item.role === 'assistant' ? 'true' : 'false',
            onClick: () => onUpdate({ role: 'assistant' }),
          },
          '助手',
        ),
      ),
      createElement('span', { className: 'spi-soft-slot-note' }, `${side === 'before' ? '基准前' : '基准后'} · ${roleLabel}`),
      createElement(
        'div',
        { className: 'spi-soft-actions' },
        createElement(
          'button',
          {
            type: 'button',
            className: 'spi-mini-btn danger',
            title: '删除',
            'aria-label': '删除消息',
            onClick: onRemove,
          },
          '×',
        ),
      ),
    ),
    createElement('textarea', {
      className: 'spi-textarea spi-soft-textarea',
      value: item.content,
      'aria-label': `${side === 'before' ? '基准前' : '基准后'}第 ${index + 1} 条${roleLabel}消息内容`,
      placeholder: item.role === 'assistant' ? '写假 assistant 的应答……' : '写假 user 的请求……',
      onChange: (event) => onUpdate({ content: event.target.value }),
    }),
  )
}

function SoftPrefillEditor({ value, onChange }) {
  const soft = value ?? { before: [], after: [] }
  const before = Array.isArray(soft.before) ? soft.before : []
  const after = Array.isArray(soft.after) ? soft.after : []
  const [dragSlot, setDragSlot] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const listRef = useRef(null)
  const orderToken = [...before.map((item) => item.key ?? ''), ...after.map((item) => item.key ?? '')].join('|')
  useFlipAnimation(listRef, orderToken)
  const updateSide = (side, items) => onChange({ ...soft, [side]: items })
  const add = (side) =>
    updateSide(side, [...(side === 'before' ? before : after), { key: nextSoftSlotKey(), role: 'user', content: '' }])
  const update = (side, index, fields) => {
    const source = side === 'before' ? before : after
    updateSide(side, source.map((item, itemIndex) => (itemIndex === index ? { ...item, ...fields } : item)))
  }
  const remove = (side, index) => updateSide(side, (side === 'before' ? before : after).filter((_, itemIndex) => itemIndex !== index))
  const move = (side, index, direction) => {
    const items = [...(side === 'before' ? before : after)]
    const target = index + direction
    if (target < 0 || target >= items.length) return
    ;[items[index], items[target]] = [items[target], items[index]]
    updateSide(side, items)
  }

  const startSlotDrag = (event, side, item) => {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', item.key)
      const slot = typeof event.currentTarget?.closest === 'function' ? event.currentTarget.closest('.spi-soft-slot') : null
      if (slot && typeof event.dataTransfer.setDragImage === 'function') event.dataTransfer.setDragImage(slot, 20, 20)
    }
    setDragSlot({ side, key: item.key })
    setDropTarget(null)
  }
  const overSlot = (event, side, item) => {
    if (!dragSlot || dragSlot.side !== side) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const after = event.clientY > rect.top + rect.height / 2
    if (dropTarget !== null && dropTarget.side === side && dropTarget.key === item.key && dropTarget.after === after) return
    setDropTarget({ side, key: item.key, after })
  }
  const dropSlot = (event) => {
    event.preventDefault()
    if (dragSlot && dropTarget && dragSlot.side === dropTarget.side) {
      const side = dragSlot.side
      const source = [...(side === 'before' ? before : after)]
      const from = source.findIndex((item) => item.key === dragSlot.key)
      let to = source.findIndex((item) => item.key === dropTarget.key)
      if (from >= 0 && to >= 0 && from !== to) {
        if (dropTarget.after) to += 1
        if (from < to) to -= 1
        if (from !== to) {
          const [moved] = source.splice(from, 1)
          source.splice(to, 0, moved)
          updateSide(side, source)
        }
      }
    }
    setDragSlot(null)
    setDropTarget(null)
  }
  const endSlotDrag = () => {
    setDragSlot(null)
    setDropTarget(null)
  }

  const renderSlots = (side, items) =>
    items.map((item, index) =>
      createElement(SoftSlot, {
        key: item.key ?? `${side}-${index}`,
        side,
        item,
        index,
        count: items.length,
        onMove: (direction) => move(side, index, direction),
        dragging: dragSlot?.side === side && dragSlot.key === item.key,
        dropPosition:
          dropTarget !== null && dropTarget.side === side && dropTarget.key === item.key
            ? dropTarget.after
              ? 'after'
              : 'before'
            : 'false',
        onUpdate: (fields) => update(side, index, fields),
        onRemove: () => remove(side, index),
        onDragStart: (event) => startSlotDrag(event, side, item),
        onDragEnd: endSlotDrag,
        onDragOver: (event) => overSlot(event, side, item),
        onDrop: dropSlot,
      }),
    )

  return createElement(
    'div',
    { className: 'spi-soft', ref: listRef },
    createElement(
      'div',
      { className: 'spi-soft-toolbar' },
      createElement('span', { className: 'spi-label' }, '软预填充消息'),
      createElement('span', { className: 'spi-hint' }, '以本次真实用户消息为基准，假消息只存在于请求里。'),
    ),
    createElement(
      'button',
      { type: 'button', className: 'spi-btn spi-soft-add', onClick: () => add('before') },
      '＋ 在基准前添加',
    ),
    renderSlots('before', before),
    createElement(
      'div',
      { className: 'spi-soft-baseline' },
      createElement('span', { className: 'spi-soft-baseline-dot' }),
      createElement(
        'div',
        { className: 'spi-soft-baseline-text' },
        createElement('span', { className: 'spi-soft-baseline-label' }, '真实用户消息'),
        createElement('span', { className: 'spi-hint' }, '运行时自动填入，不在这里编辑'),
      ),
    ),
    renderSlots('after', after),
    createElement(
      'button',
      { type: 'button', className: 'spi-btn spi-soft-add', onClick: () => add('after') },
      '＋ 在基准后添加',
    ),
  )
}

function RuleEditor({ draft, setDraft, busy, onSave, onCancel, onDelete }) {
  const update = (fields) => setDraft({ ...draft, ...fields })
  return createElement(
    'div',
    { className: 'spi-editor' },
    createElement(
      'div',
      { className: 'spi-row' },
      createElement(
        'label',
        { className: 'spi-field' },
        createElement('span', { className: 'spi-label' }, '名称'),
        createElement('input', {
          className: 'spi-input',
          value: draft.name,
          placeholder: '例如：破甲模式系统提示词',
          onChange: (event) => update({ name: event.target.value }),
        }),
      ),
      createElement(
        'label',
        { className: 'spi-field' },
        createElement('span', { className: 'spi-label' }, '生效范围'),
        createElement('input', {
          className: 'spi-input',
          value: draft.agentPresets.join(', '),
          placeholder: '全部预设（留空）',
          onChange: (event) =>
            update({
              agentPresets: event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item.length > 0),
            }),
        }),
      ),
    ),
    createElement(
      'div',
      { className: 'spi-field' },
      createElement('span', { className: 'spi-label' }, '注入位置'),
      createElement(TargetPicker, {
        value: draft.target,
        onChange: (target) => update({ target }),
      }),
      createElement('span', { className: 'spi-hint' }, TARGET_INFO[draft.target].hint),
    ),
    draft.target === 'assistant'
      ? createElement(
          'div',
          { className: 'spi-field' },
          createElement('span', { className: 'spi-label' }, '预填充方式'),
          createElement(PrefillModePicker, {
            value: draft.prefillMode,
            onChange: (prefillMode) => update({ prefillMode }),
          }),
          createElement('span', { className: 'spi-hint' }, PREFILL_MODE_INFO[draft.prefillMode].hint),
        )
      : createElement(
          'div',
          { className: 'spi-field' },
          createElement('span', { className: 'spi-label' }, '模式'),
          createElement(ModePicker, { value: draft.mode, onChange: (mode) => update({ mode }) }),
          createElement('span', { className: 'spi-hint' }, MODE_INFO[draft.mode].hint),
        ),
    createElement(
      'div',
      { className: 'spi-field' },
      createElement('span', { className: 'spi-label' }, '注入时机'),
      createElement(SchedulePicker, {
        value: draft.schedule,
        onChange: (schedule) => update({ schedule }),
      }),
      createElement('span', { className: 'spi-hint' }, SCHEDULE_INFO[draft.schedule].hint),
    ),
    draft.target === 'assistant' && draft.prefillMode === 'soft'
      ? createElement(SoftPrefillEditor, {
          value: draft.soft,
          onChange: (soft) => update({ soft }),
        })
      : createElement(
          'div',
          { className: 'spi-content-fields' },
          createElement(
            'label',
            { className: 'spi-field' },
            createElement('span', { className: 'spi-label' }, draft.target === 'assistant' ? '预填充内容' : '注入内容'),
            createElement('textarea', {
              className: 'spi-textarea',
              value: draft.content,
              placeholder: draft.target === 'assistant' ? '写要让模型接着写的开头，例如：好的，我来处理。' : '写要注入到系统提示词里的内容……',
              onChange: (event) => update({ content: event.target.value }),
            }),
          ),
          createElement(
            'label',
            { className: 'spi-field' },
            createElement('span', { className: 'spi-label' }, '或从文件读取'),
            createElement('input', {
              className: 'spi-input',
              value: draft.contentFile,
              placeholder: '例如：~/.dsh/prompt-inject.md',
              onChange: (event) => update({ contentFile: event.target.value }),
            }),
            createElement('span', { className: 'spi-hint' }, '文件优先于上面的内联内容；修改文件后下一轮模型请求自动生效。'),
          ),
        ),
    createElement(
      'div',
      { className: 'spi-editor-actions' },
      // 保存期间不改按钮外观（disabled 会让按钮在请求往返时闪一下），
      // 只挂 aria 状态，重复点击由父级的保存队列去重。
      createElement(
        'button',
        {
          type: 'button',
          className: 'spi-btn primary',
          'aria-busy': busy ? 'true' : 'false',
          onClick: () => onSave(draft),
        },
        '保存',
      ),
      createElement('button', { type: 'button', className: 'spi-btn', onClick: onCancel }, '取消'),
      createElement('span', { className: 'spi-spacer' }),
      createElement(
        'button',
        {
          type: 'button',
          className: 'spi-btn danger',
          'aria-busy': busy ? 'true' : 'false',
          onClick: () => onDelete(draft),
        },
        '删除',
      ),
    ),
  )
}

function statusLine(status) {
  const applied = status?.lastApplied
  const prefillCount = status?.lastPrefill?.applied?.length ?? 0
  const dispatched = status?.lastPrefill?.dispatchedAt ? '（已发出）' : ''
  const prefillMode = status?.lastPrefill?.mode
  const prefillLabel = prefillMode === 'soft' ? '软预填充' : prefillMode === 'mixed' ? '混合预填充' : '原生预填充'
  if (!applied || !applied.at) {
    return prefillCount > 0 ? `已预填充 ${prefillCount} 条规则${dispatched}` : '尚未应用到任何请求'
  }
  const time = new Date(applied.at)
  const clock = Number.isNaN(time.getTime())
    ? applied.at
    : `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`
  const rules = (applied.applied ?? []).map((item) => item.name || item.id).join('、') || '（无）'
  if (rules === '（无）' && applied.errors?.length > 0) {
    return `上次未生效 ${clock} · ${applied.errors[0].message}`
  }
  const preset = applied.agentPreset || '默认'
  return `上次应用 ${clock} · ${preset} · ${rules}${prefillCount > 0 ? ` · ${prefillLabel} ${prefillCount} 条${dispatched}` : ''}`
}

function ruleFingerprint(rule) {
  return JSON.stringify(plainRule(rule))
}

function moveIdToTarget(ids, fromId, targetId, after) {
  const from = ids.indexOf(fromId)
  let to = ids.indexOf(targetId)
  if (from < 0 || to < 0 || from === to) return ids
  if (after) to += 1
  if (from < to) to -= 1
  if (from === to) return ids
  const next = ids.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * 列表重排的 FLIP 动画：规则卡片 / 软预填充槽位共用。
 * 只在「同一批节点换顺序」时播放；新增或删除节点直接跳到新布局，
 * 否则长列表会因为在视口里来回位移而看起来上下闪。
 *
 * 位置用 offsetTop / offsetLeft，而不是 getBoundingClientRect：
 * 后者包含正在播放的 transform，连续渲染时会把动画中的位置记成基准。
 */
function useFlipAnimation(containerRef, token) {
  const previous = useRef(new Map())
  const previousIds = useRef([])
  const lastToken = useRef(Symbol('initial'))
  useLayoutEffect(() => {
    if (token === lastToken.current) return
    const container = containerRef.current
    if (!container || typeof container.querySelectorAll !== 'function') return
    const nodes = [...container.querySelectorAll('[data-flip-id]')]
    const next = new Map()
    const nextIds = []
    for (const node of nodes) {
      const id = node.getAttribute('data-flip-id')
      if (!id) continue
      nextIds.push(id)
      next.set(id, { left: node.offsetLeft, top: node.offsetTop })
    }
    // 节点集合发生变化（添加 / 删除）时不播放位移动画。
    const batchChanged =
      previousIds.current.length > 0 &&
      (previousIds.current.length !== nextIds.length ||
        nextIds.some((id) => !previousIds.current.includes(id)))
    if (batchChanged) {
      for (const node of nodes) {
        node.style.transition = 'none'
        node.style.transform = ''
      }
    }
    const changed = !batchChanged && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    for (const [id, rect] of next) {
      if (!changed) continue
      const prev = previous.current.get(id)
      if (prev === undefined) continue
      const dx = prev.left - rect.left
      const dy = prev.top - rect.top
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue
      const node = nodes.find((item) => item.getAttribute('data-flip-id') === id)
      if (node === undefined) continue
      node.style.transition = 'none'
      node.style.transform = `translate(${dx}px, ${dy}px)`
      const play = () => {
        node.style.transition = 'transform 220ms cubic-bezier(.22, 1, .36, 1)'
        node.style.transform = ''
      }
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(play)
      else setTimeout(play, 0)
    }
    previous.current = next
    previousIds.current = nextIds
    lastToken.current = token
  })
}

function Collapse({ open, children }) {
  return createElement(
    'div',
    { className: 'spi-collapse', 'data-open': open ? 'true' : 'false', 'aria-hidden': open ? 'false' : 'true', inert: !open },
    createElement('div', { className: 'spi-collapse-inner' }, children),
  )
}

function Swap({ on, onText, offText, className }) {
  return createElement(
    'span',
    { className: 'spi-swap' + (className ? ' ' + className : '') },
    createElement('span', { 'data-show': on ? 'true' : 'false' }, onText),
    createElement('span', { 'data-show': on ? 'false' : 'true' }, offText),
  )
}

function MessageBanner({ message }) {
  const visible = typeof message?.text === 'string' && message.text.length > 0
  const [shown, setShown] = useState(message)
  const [mounted, setMounted] = useState(visible)
  useEffect(() => {
    if (visible) {
      setShown(message)
      setMounted(true)
      return undefined
    }
    const timer = setTimeout(() => setMounted(false), 300)
    return () => clearTimeout(timer)
  }, [visible, message?.text, message?.tone])
  if (!mounted) return null
  const display = visible ? message : shown
  return createElement(
    'div',
    { className: 'spi-presence', 'data-open': visible ? 'true' : 'false', 'aria-live': 'polite' },
    createElement(
      'div',
      { className: 'spi-presence-inner' },
      display?.text
        ? createElement(
            'div',
            { className: 'spi-banner', 'data-tone': display.tone },
            display.text,
          )
        : null,
    ),
  )
}

function SettingsPage({ store }) {
  const live = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
  const [editingId, setEditingId] = useState('')
  const [draft, setDraft] = useState(null)
  const drafts = useRef(new Map())
  const [deletedRule, setDeletedRule] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [dragId, setDragId] = useState('')
  const [dragTarget, setDragTarget] = useState(null)
  const [importDraft, setImportDraft] = useState(null)
  const closeTimer = useRef(null)
  const cardsRef = useRef(null)
  const importInputRef = useRef(null)
  const orderedRules = live.rules
  const ruleOrderToken = live.rules.map((rule) => rule.id).join('|')
  useFlipAnimation(cardsRef, ruleOrderToken)

  useEffect(() => {
    store.refresh()
    return () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current)
    }
  }, [])

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const beginEdit = (rule) => {
    if (live.saving) return
    clearCloseTimer()
    if (draft && editingId) drafts.current.set(editingId, draft)
    setEditingId(rule.id)
    setDraft(drafts.current.get(rule.id) ?? toDraft(rule))
    setEditorOpen(true)
  }

  const beginNew = () => {
    if (live.saving) return
    clearCloseTimer()
    if (draft && editingId) drafts.current.set(editingId, draft)
    const rule = drafts.current.get('__new__') ?? emptyRule()
    setEditingId('__new__')
    setDraft(rule)
    setEditorOpen(true)
  }

  const cancel = () => {
    drafts.current.delete(editingId)
    setEditorOpen(false)
    clearCloseTimer()
    // 等折叠动画结束再卸载编辑器，避免高度瞬间跳变。
    closeTimer.current = setTimeout(() => {
      setEditingId('')
      setDraft(null)
      closeTimer.current = null
    }, 300)
  }

  const toggleEdit = (rule) => {
    if (live.saving) return
    if (editingId === rule.id && editorOpen) {
      // 第二次点击同一张卡片：只有没改过才允许收起，避免丢掉未保存的编辑。
      if (draft !== null && ruleFingerprint(draft) === ruleFingerprint(rule)) cancel()
      else store.setMessage({ tone: 'error', text: '有未保存的修改，先保存或取消。' })
      return
    }
    beginEdit(rule)
  }

  const commitOrder = (orderIds) => {
    const byId = new Map(live.rules.map((rule) => [rule.id, plainRule(rule)]))
    const rules = orderIds.map((id) => byId.get(id)).filter(Boolean)
    if (rules.length !== live.rules.length) return Promise.resolve(false)
    return store.saveState({ rules }, '已调整规则顺序。')
  }

  const startRuleDrag = (event, rule) => {
    if (live.saving) return
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', rule.id)
      const card = typeof event.currentTarget?.closest === 'function' ? event.currentTarget.closest('.spi-card') : null
      if (card && typeof event.dataTransfer.setDragImage === 'function') event.dataTransfer.setDragImage(card, 24, 20)
    }
    setDragId(rule.id)
    setDragTarget(null)
  }

  const overRule = (event, rule) => {
    if (!dragId || live.saving) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    if (rule.id === dragId) return
    const rect = event.currentTarget.getBoundingClientRect()
    const after = event.clientY > rect.top + rect.height / 2
    if (dragTarget !== null && dragTarget.id === rule.id && dragTarget.after === after) return
    setDragTarget({ id: rule.id, after })
  }

  const dropRule = async (event) => {
    if (!dragId) return
    event.preventDefault()
    const fromId = dragId
    const target = dragTarget
    setDragId('')
    setDragTarget(null)
    if (target === null) return
    const ids = live.rules.map((rule) => rule.id)
    const next = moveIdToTarget(ids, fromId, target.id, target.after)
    if (next !== ids) await commitOrder(next)
  }

  const endRuleDrag = () => {
    setDragId('')
    setDragTarget(null)
  }

  const moveRule = (rule, direction) => {
    if (live.saving) return
    const ids = live.rules.map((item) => item.id)
    const index = ids.indexOf(rule.id)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    commitOrder(ids)
  }

  const exportRules = () => {
    if (live.saving) return
    const blob = new Blob([serializeRules(live.rules)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const stamp = new Date()
    const suffix = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, '0')}${String(stamp.getDate()).padStart(2, '0')}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}`
    anchor.href = url
    anchor.download = `dsh-system-prompt-injector-${suffix}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    store.setMessage({ tone: 'ok', text: `已导出 ${live.rules.length} 条规则。` })
  }

  const beginImport = () => {
    if (live.saving) return
    importInputRef.current?.click()
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const rules = parseImportedRules(await file.text())
      setImportDraft({ fileName: file.name, rules })
      store.setMessage({ tone: 'idle', text: '' })
    } catch (error) {
      setImportDraft(null)
      store.setMessage({ tone: 'error', text: `导入失败：${error instanceof Error ? error.message : String(error)}` })
    }
  }

  const cancelImport = () => setImportDraft(null)

  const applyImport = async (replace) => {
    if (!importDraft || live.saving) return
    if (replace && !window.confirm(`确定用 ${importDraft.rules.length} 条导入规则替换当前全部 ${live.rules.length} 条规则？现有规则将被清空。`)) return
    const rules = replace ? importDraft.rules : mergeImportedRules(live.rules, importDraft.rules)
    const text = replace ? `已替换为 ${rules.length} 条规则。` : `已追加 ${importDraft.rules.length} 条规则。`
    if (await store.saveState({ rules }, text)) setImportDraft(null)
  }

  const save = async (value) => {
    if (live.saving) return
    const exists = live.rules.some((rule) => rule.id === value.id)
    const rules = exists
      ? live.rules.map((rule) => (rule.id === value.id ? plainRule(value) : plainRule(rule)))
      : [...live.rules.map(plainRule), plainRule(value)]
    const text = live.enabled
      ? '已保存，下一轮模型请求生效。'
      : '已保存。总开关目前关闭，开启后生效。'
    if (await store.saveState({ rules }, text)) {
      drafts.current.delete(value.id)
      cancel()
    }
  }

  const remove = async (value) => {
    if (live.saving) return
    const index = live.rules.findIndex((rule) => rule.id === value.id)
    if (index < 0) { cancel(); return }
    if (!window.confirm(`确定删除规则「${live.rules[index].name}」？删除后可在本页撤销。`)) return
    const rules = live.rules.filter((rule) => rule.id !== value.id).map(plainRule)
    if (await store.saveState({ rules }, '已删除规则，可撤销。')) {
      setDeletedRule({ rule: plainRule(live.rules[index]), index })
      cancel()
    }
  }

  const undoDelete = async () => {
    if (!deletedRule || live.saving) return
    const rules = live.rules.map(plainRule)
    if (rules.some((rule) => rule.id === deletedRule.rule.id)) return
    rules.splice(Math.min(deletedRule.index, rules.length), 0, deletedRule.rule)
    if (await store.saveState({ rules }, '已恢复规则。')) setDeletedRule(null)
  }

  const toggleRule = (rule) => {
    if (live.saving) return
    const rules = live.rules.map((item) =>
      item.id === rule.id ? plainRule({ ...item, enabled: item.enabled === false }) : plainRule(item),
    )
    store.saveState({ rules }, rule.enabled === false ? '已启用规则。' : '已停用规则。')
  }

  const toggleAll = () => {
    if (live.saving) return
    store.saveState(
      { enabled: !live.enabled },
      live.enabled ? '已关闭总开关，快捷按钮已隐藏。' : '已开启总开关。',
    )
  }

  const renderEditor = (rule) =>
    createElement(RuleEditor, {
      draft,
      setDraft,
      busy: live.saving,
      onSave: save,
      onCancel: cancel,
      onDelete: remove,
    })

  return createElement(
    'div',
    { className: 'spi-page' },
    createElement(
      'header',
      { className: 'spi-header' },
      createElement(
        'div',
        { className: 'spi-header-text' },
        createElement('h1', { className: 'spi-title' }, '系统提示词'),
        createElement('p', { className: 'spi-subtitle' }, '在每次模型请求前注入提示词或预填充消息'),
      ),
      createElement(
        'div',
        { className: 'spi-header-actions' },
        createElement(
          'button',
          {
            type: 'button',
            className: 'spi-master',
            'data-on': live.enabled ? 'true' : 'false',
            'aria-pressed': live.enabled,
            'aria-busy': live.saving ? 'true' : 'false',
            onClick: toggleAll,
            title: live.enabled ? '点击关闭总开关' : '点击开启总开关',
          },
          createElement('span', { className: 'spi-master-dot' }),
          createElement('span', { className: 'spi-master-label' }, '总开关'),
          createElement(Swap, {
            on: live.enabled,
            onText: '已启用',
            offText: '已停用',
          }),
        ),
        createElement(
          'button',
          { type: 'button', className: 'spi-icon-btn', onClick: () => store.refresh(), title: '刷新', 'aria-label': '刷新状态' },
          '↻',
        ),
      ),
    ),
    createElement(
      'div',
      { className: 'spi-feedback' },
      createElement(MessageBanner, {
        message: live.error && live.message?.tone === 'error' && live.message.text.includes(live.error)
          ? null : live.message,
      }),
      live.error
        ? createElement('div', { className: 'spi-banner', 'data-tone': 'error', role: 'alert' },
        `状态错误：${live.error} `,
        createElement('button', { type: 'button', className: 'spi-btn', onClick: () => store.refresh() }, '重试'),
      ) : null,
      createElement(
        'div',
        { className: 'spi-status-bar' },
        createElement('span', {
          className: 'spi-status-dot',
          'data-on': live.enabled ? 'true' : 'false',
        }),
        createElement('span', null, statusLine(live.status)),
        createElement(
          'span',
          { className: 'spi-status-rules' },
          `${live.sessions.length} 个对话开启 · ${live.rules.length} 条规则`,
        ),
      ),
    ),
    createElement(
      'section',
      { className: 'spi-section' },
      createElement(
        'div',
        { className: 'spi-section-head' },
        createElement('h2', { className: 'spi-section-title' }, '规则'),
        createElement(
          'div',
          { className: 'spi-section-actions' },
          createElement(
            'button',
            { type: 'button', className: 'spi-btn', onClick: exportRules },
            '导出',
          ),
          createElement(
            'button',
            { type: 'button', className: 'spi-btn', onClick: beginImport },
            '导入',
          ),
          createElement(
            'button',
            {
              type: 'button',
              className: 'spi-btn primary',
              'aria-busy': live.saving ? 'true' : 'false',
              onClick: beginNew,
            },
            '＋ 新建规则',
          ),
          createElement('input', {
            ref: importInputRef,
            type: 'file',
            accept: '.json,application/json',
            className: 'spi-file-input',
            onChange: handleImportFile,
          }),
        ),
      ),
      createElement('p', { className: 'spi-section-hint' }, '按列表顺序生效，可拖动卡片左侧把手排序；「替换」会清空它之前的所有规则；预填充只影响本次请求。'),
      importDraft !== null
        ? createElement(
            'div',
            { className: 'spi-import' },
            createElement(
              'div',
              { className: 'spi-import-text' },
              createElement('span', { className: 'spi-import-title' }, `已读取 ${importDraft.rules.length} 条规则`),
              createElement('span', { className: 'spi-hint' }, importDraft.fileName),
              createElement('span', { className: 'spi-hint' }, '追加保留现有规则；替换会清空当前规则。'),
            ),
            createElement(
              'div',
              { className: 'spi-import-actions' },
              createElement(
                'button',
                { type: 'button', className: 'spi-btn', onClick: () => applyImport(false) },
                '追加导入',
              ),
              createElement(
                'button',
                { type: 'button', className: 'spi-btn danger', onClick: () => applyImport(true) },
                '替换全部',
              ),
              createElement('button', { type: 'button', className: 'spi-btn', onClick: cancelImport }, '取消'),
            ),
          )
        : null,
      deletedRule ? createElement('div', { className: 'spi-undo', role: 'status' },
        `已删除「${deletedRule.rule.name}」`,
        createElement('button', { type: 'button', className: 'spi-btn', onClick: undoDelete }, '撤销删除'),
      ) : null,
      live.rules.length === 0 && editingId !== '__new__'
        ? createElement(
            'div',
            { className: 'spi-empty' },
            createElement('div', { className: 'spi-empty-icon' }, '✎'),
            createElement('p', null, '还没有规则'),
            createElement('button', { type: 'button', className: 'spi-btn primary', onClick: beginNew }, '新建第一条规则'),
          )
        : null,
      createElement(
        'div',
        { className: 'spi-cards', ref: cardsRef },
        orderedRules.map((rule) =>
          createElement(
            'article',
            {
              key: rule.id,
              className: 'spi-card',
              'data-rule-id': rule.id,
              'data-flip-id': rule.id,
              'data-editing': editingId === rule.id ? 'true' : 'false',
              'data-dragging': dragId === rule.id ? 'true' : 'false',
              'data-drop':
                dragTarget !== null && dragTarget.id === rule.id && dragId !== rule.id
                  ? dragTarget.after
                    ? 'after'
                    : 'before'
                  : 'false',
              onDragOver: (event) => overRule(event, rule),
              onDrop: dropRule,
            },
            createElement(
              'div',
              { className: 'spi-card-main' },
              createElement(
                'span',
                {
                  className: 'spi-drag-handle spi-drag-handle-lg',
                  draggable: true,
                  title: '拖动排序；方向键调整顺序',
                  'aria-label': `${rule.name}排序把手，方向键调整顺序`,
                  role: 'button',
                  tabIndex: 0,
                  onKeyDown: (event) => {
                    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                    event.preventDefault()
                    moveRule(rule, event.key === 'ArrowUp' ? -1 : 1)
                  },
                  onDragStart: (event) => startRuleDrag(event, rule),
                  onDragEnd: endRuleDrag,
                },
                ...Array.from({ length: 6 }, (_, index) => createElement('span', { key: index })),
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  className: 'spi-card-open',
                  'aria-expanded': editingId === rule.id && editorOpen ? 'true' : 'false',
                  title:
                    editingId === rule.id && editorOpen
                      ? draft !== null && ruleFingerprint(draft) !== ruleFingerprint(rule)
                        ? '有未保存修改，先保存或取消'
                        : '点击收起'
                      : '点击展开编辑',
                  onClick: () => toggleEdit(rule),
                },
                createElement('span', { className: 'spi-dot', 'data-on': rule.enabled === false ? 'false' : 'true' }),
                createElement('span', { className: 'spi-card-name' }, rule.name),
                rule.target === 'assistant'
                  ? createElement(
                      'span',
                      { className: 'spi-mode-chip ' + (rule.prefillMode === 'soft' ? 'spi-soft-chip' : 'spi-prefill-chip') },
                      rule.prefillMode === 'soft' ? '软预填充' : '原生预填充',
                    )
                  : createElement(
                      'span',
                      { className: 'spi-mode-chip', 'data-mode': rule.mode },
                      MODE_INFO[rule.mode]?.label ?? rule.mode,
                    ),
                rule.schedule === 'first'
                  ? createElement('span', { className: 'spi-mode-chip spi-schedule-chip' }, '仅首次')
                  : null,
                rule.agentPresets.length > 0
                  ? createElement('span', { className: 'spi-meta' }, rule.agentPresets.join(' · '))
                  : null,
              ),
              createElement(
                'div',
                { className: 'spi-card-side' },
                createElement(
                  'span',
                  { className: 'spi-meta' },
                  `${rule.contentLength} 字符${rule.source === 'file' ? ' · 文件' : ''}`,
                ),
                createElement(
                  'label',
                  { className: 'spi-switch', title: rule.enabled === false ? '启用规则' : '停用规则' },
                  // 这里的 disabled 只拦住保存中的重复点击；开关本身没有禁用样式，
                  // 不会像按钮那样在请求往返时闪一下。
                  createElement('input', {
                    type: 'checkbox',
                    checked: rule.enabled !== false,
                    'aria-label': `${rule.name}规则开关`,
                    disabled: live.saving,
                    onChange: () => toggleRule(rule),
                  }),
                  createElement('span', { className: 'spi-switch-track' }),
                ),
              ),
            ),
            rule.preview ? createElement('p', { className: 'spi-preview' }, rule.preview) : null,
            rule.error ? createElement('p', { className: 'spi-error' }, rule.error) : null,
            createElement(
              Collapse,
              { open: editorOpen && editingId === rule.id },
              editingId === rule.id ? renderEditor(rule) : null,
            ),
          ),
        ),
        createElement(
          'div',
          { className: 'spi-new-slot' },
          createElement(
            Collapse,
            { open: editorOpen && editingId === '__new__' },
            createElement(
              'article',
              { className: 'spi-card spi-card-new' },
              createElement(
                'div',
                { className: 'spi-card-main' },
                createElement('span', { className: 'spi-card-name' }, '新规则'),
              ),
              editingId === '__new__' ? renderEditor() : null,
            ),
          ),
        ),
      ),
    ),
    createElement(
      'footer',
      { className: 'spi-footer' },
      `规则变更后下一轮模型请求生效 · 总开关关闭时所有对话停止注入，快捷按钮也会隐藏`,
    ),
  )
}

function ComposerToggle({ store, sessionId, session }) {
  const live = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)

  useEffect(() => {
    store.refresh()
    const timer = setInterval(() => store.refresh(), 8000)
    return () => clearInterval(timer)
  }, [])

  const id =
    typeof sessionId === 'string'
      ? sessionId
      : typeof session?.id === 'string'
        ? session.id
        : ''
  if (live.enabled !== true || id.length === 0) return null
  const on = Array.isArray(live.sessions) && live.sessions.includes(id)
  return createElement(
    'button',
    {
      type: 'button',
      className: 'spi-chip',
      'data-on': on ? 'true' : 'false',
      'aria-pressed': on,
      'aria-busy': live.saving ? 'true' : 'false',
      title: on
        ? `本对话的系统提示词注入已开启（${live.rules.length} 条规则）· 点击关闭`
        : `本对话的系统提示词注入已关闭（${live.rules.length} 条规则）· 点击开启`,
      onClick: () =>
        store.saveState(
          { sessionId: id, sessionEnabled: !on },
          on ? '已关闭本对话的系统提示词注入。' : '已开启本对话的系统提示词注入。',
        ),
    },
    createElement('span', { className: 'spi-chip-dot' }),
    createElement('span', { className: 'spi-chip-label' }, '系统提示词'),
    createElement(Swap, { on, onText: '开', offText: '关', className: 'spi-chip-state' }),
  )
}

function apply(ctx, deps) {
  void deps
  const store = createStore()
  store.refresh()

  const register = (key, options, component) => {
    try {
      ctx.slots.inject(key, () => ctx.slots.register({ name: key, ...options }, component))
    } catch (error) {
      console.error(`[system-prompt-injector] 注册 ${key} 失败`, error)
    }
  }

  register('settings.section', { id: 'system-prompt-injector', order: 32, label: () => '系统提示词' }, () =>
    createElement(SettingsPage, { store }),
  )
  register('conversation.input.left', { id: 'system-prompt-injector-toggle', order: 42, label: () => '系统提示词' }, (props) =>
    createElement(ComposerToggle, { ...props, store }),
  )

  if (
    typeof document !== 'undefined' &&
    document.querySelector('style[data-plugin-css="dsh-system-prompt-injector/styles.css"]') === null
  ) {
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-system-prompt-injector'
    style.dataset.pluginCss = 'dsh-system-prompt-injector/styles.css'
    style.textContent = SPI_CSS
    document.head.appendChild(style)
  }
}

exports["apply"] = apply;
exports["inject"] = inject;
		};
		__factories["dspi:client/src/styles.js"] = (module, exports, __require) => {
/** 设置页与聊天快捷按钮样式。构建时会被内联进 client.js。 */
const SPI_CSS = `
.spi-page, .spi-chip {
  --spi-accent: var(--dsw-alias-state-business-primary, #315ec7);
  --spi-accent-soft: color-mix(in srgb, var(--spi-accent) 10%, transparent);
  --spi-success: var(--dsw-alias-state-success-primary, #217646);
  --spi-danger: var(--dsw-alias-state-error-primary, #d04545);
  --spi-ink: var(--dsw-alias-label-primary, #24292f);
  --spi-ink-soft: var(--dsw-alias-label-secondary, #57606a);
  --spi-ink-faint: var(--dsw-alias-label-tertiary, #57606a);
  --spi-line: var(--dsw-alias-border-l2, rgba(27, 31, 36, 0.12));
  --spi-line-soft: var(--dsw-alias-border-l1, rgba(27, 31, 36, 0.07));
  --spi-surface: var(--dsw-alias-bg-layer-1, #ffffff);
  --spi-surface-soft: var(--dsw-alias-bg-layer-2, #f6f8fa);
  --spi-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}
.spi-page {
  font-family: inherit;
  color: var(--spi-ink);
  max-width: 860px;
  margin: 0 auto;
  padding: 8px 4px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  line-height: 1.55;
}

/* ---------- motion ---------- */
@keyframes spi-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.spi-banner { animation: spi-fade .22s ease both; }
/* 注意：卡片和空状态不加挂载动画。否则点击「新建规则」时整块内容会从
   opacity:0 淡入，看起来像闪一下；这里只用展开/折叠与状态过渡。 */
.spi-collapse {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  opacity: 0;
  transition: grid-template-rows .3s cubic-bezier(.22, 1, .36, 1), opacity .22s ease;
}
.spi-collapse[data-open="true"] { grid-template-rows: 1fr; opacity: 1; }
.spi-collapse-inner { overflow: hidden; min-height: 0; }

.spi-presence {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows .28s cubic-bezier(.22, 1, .36, 1), opacity .2s ease;
}
.spi-presence[data-open="true"] { grid-template-rows: 1fr; opacity: 1; }
.spi-presence-inner { overflow: hidden; min-height: 0; }

.spi-swap { display: inline-grid; }
.spi-swap > span {
  grid-area: 1 / 1;
  transition: opacity .2s ease, transform .2s cubic-bezier(.22, 1, .36, 1);
  white-space: nowrap;
}
.spi-swap > span[data-show="true"] { opacity: 1; transform: translateY(0); }
.spi-swap > span[data-show="false"] { opacity: 0; transform: translateY(3px); pointer-events: none; }

/* ---------- header ---------- */
.spi-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.spi-header-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.spi-title { margin: 0; font-size: 20px; font-weight: 650; letter-spacing: -0.01em; }
.spi-subtitle { margin: 0; font-size: 13px; color: var(--spi-ink-faint); }
.spi-header-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.spi-master {
  display: inline-flex; align-items: center; gap: 8px;
  height: 34px; padding: 0 14px; border-radius: 999px;
  border: 1px solid var(--spi-line); background: var(--spi-surface);
  color: var(--spi-ink-soft); font: inherit; font-size: 13px; font-weight: 550;
  cursor: pointer; transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;
  box-shadow: var(--spi-shadow);
}
.spi-master:hover { border-color: var(--spi-accent); }
.spi-master:active { transform: scale(.97); }
.spi-master[data-on="true"] { color: var(--spi-success); border-color: color-mix(in srgb, var(--spi-success) 35%, transparent); background: color-mix(in srgb, var(--spi-success) 7%, var(--spi-surface)); }
.spi-master-label { color: var(--spi-ink-soft); }
.spi-master-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--spi-ink-faint); transition: background .2s ease, box-shadow .25s ease, transform .25s cubic-bezier(.22, 1, .36, 1); }
.spi-master[data-on="true"] .spi-master-dot { background: var(--spi-success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--spi-success) 18%, transparent); transform: scale(1.1); }
.spi-icon-btn {
  width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--spi-line);
  background: var(--spi-surface); color: var(--spi-ink-soft); font-size: 17px; line-height: 1;
  cursor: pointer; transition: border-color .2s ease, color .2s ease, transform .12s ease;
  box-shadow: var(--spi-shadow);
}
.spi-icon-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }
.spi-icon-btn:active { transform: scale(.95) rotate(12deg); }

/* ---------- banners ---------- */
.spi-banner { border-radius: 10px; padding: 10px 14px; font-size: 13px; background: var(--spi-surface-soft); color: var(--spi-ink-soft); transition: background-color .2s ease, color .2s ease; }
.spi-banner[data-tone="ok"] { background: color-mix(in srgb, var(--spi-success) 9%, var(--spi-surface)); color: var(--spi-success); }
.spi-banner[data-tone="error"] { background: color-mix(in srgb, var(--spi-danger) 9%, var(--spi-surface)); color: var(--spi-danger); }
.spi-feedback { display: flex; flex-direction: column; gap: 10px; }
.spi-status-bar {
  display: flex; align-items: center; gap: 9px; font-size: 12px; color: var(--spi-ink-faint);
  padding: 0 2px;
}
.spi-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spi-ink-faint); flex: none; transition: background .2s ease, transform .2s ease; }
.spi-status-dot[data-on="true"] { background: var(--spi-success); transform: scale(1.15); }
.spi-status-rules { margin-left: auto; }

/* ---------- section ---------- */
.spi-section { display: flex; flex-direction: column; gap: 12px; }
.spi-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.spi-section-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.spi-section-hint { margin: -6px 0 0; font-size: 11.5px; color: var(--spi-ink-faint); }
.spi-section-title { margin: 0; font-size: 14px; font-weight: 650; color: var(--spi-ink-soft); letter-spacing: .02em; }
.spi-cards { display: flex; flex-direction: column; gap: 10px; }
.spi-file-input { display: none; }
.spi-import {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-wrap: wrap; padding: 12px 14px; border: 1px solid var(--spi-line-soft);
  border-radius: 12px; background: var(--spi-surface-soft);
  animation: spi-fade .2s ease both;
}
.spi-import-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.spi-import-title { font-size: 13px; font-weight: 600; color: var(--spi-ink-soft); }
.spi-import-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* ---------- card ---------- */
.spi-card {
  position: relative;
  background: var(--spi-surface); border: 1px solid var(--spi-line-soft);
  border-radius: 14px; padding: 14px 16px; box-shadow: var(--spi-shadow);
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}
.spi-card:hover { border-color: var(--spi-line); }
.spi-card[data-editing="true"] { border-color: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft); }
.spi-card-main { display: flex; align-items: center; gap: 8px; }
.spi-card-main > .spi-drag-handle { margin: -4px 0 -4px -8px; }
.spi-card-open {
  display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1;
  border: 0; background: none; padding: 0; color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.spi-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--spi-ink-faint); flex: none; transition: background .2s ease, transform .2s ease; }
.spi-dot[data-on="true"] { background: var(--spi-success); transform: scale(1.08); }
.spi-card-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spi-mode-chip {
  flex: none; font-size: 11px; line-height: 1; padding: 4px 8px; border-radius: 999px;
  background: var(--spi-surface-soft); color: var(--spi-ink-soft); font-weight: 550;
}
.spi-mode-chip[data-mode="replace"] { background: color-mix(in srgb, var(--spi-danger) 9%, var(--spi-surface)); color: var(--spi-danger); }
.spi-schedule-chip { background: color-mix(in srgb, var(--spi-accent) 9%, var(--spi-surface)); color: var(--spi-accent); }
.spi-prefill-chip { background: color-mix(in srgb, var(--spi-success) 9%, var(--spi-surface)); color: var(--spi-success); }
.spi-soft-chip { background: color-mix(in srgb, var(--spi-accent) 9%, var(--spi-surface)); color: var(--spi-accent); }
.spi-meta { font-size: 11.5px; color: var(--spi-ink-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spi-card-side { display: flex; align-items: center; gap: 10px; flex: none; }
.spi-card[data-dragging="true"] { opacity: .55; border-style: dashed; }
.spi-drag-handle {
  display: grid; grid-template-columns: repeat(2, 4px); grid-template-rows: repeat(3, 4px);
  gap: 3px; place-content: center; flex: none; width: 32px; height: 34px;
  border-radius: 8px; cursor: grab;
  transition: background-color .15s ease;
}
.spi-drag-handle:hover, .spi-drag-handle:focus-visible { background: var(--spi-surface-soft); }
.spi-drag-handle:active { cursor: grabbing; }
.spi-drag-handle > span { width: 4px; height: 4px; border-radius: 50%; background: var(--spi-ink-faint); }
.spi-drag-handle:focus-visible { outline: 2px solid var(--spi-accent); outline-offset: 2px; }
.spi-drag-handle-lg { width: 36px; height: 38px; }
.spi-card[data-drop="before"]::before,
.spi-card[data-drop="after"]::after,
.spi-soft-slot[data-drop="before"]::before,
.spi-soft-slot[data-drop="after"]::after {
  content: ""; position: absolute; z-index: 1; left: 12px; right: 12px; height: 2px;
  border-radius: 999px; background: var(--spi-accent); pointer-events: none;
}
.spi-card[data-drop="before"]::before,
.spi-soft-slot[data-drop="before"]::before { top: -6px; }
.spi-card[data-drop="after"]::after,
.spi-soft-slot[data-drop="after"]::after { bottom: -6px; }
.spi-preview { margin: 8px 0 0 16px; font-size: 12.5px; color: var(--spi-ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spi-error { margin: 8px 0 0 16px; font-size: 12px; color: var(--spi-danger); }

/* small switch inside card */
.spi-switch { display: inline-flex; align-items: center; cursor: pointer; }
.spi-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.spi-switch-track { width: 34px; height: 20px; border-radius: 999px; background: var(--spi-line); position: relative; transition: background .16s ease; }
.spi-switch-track::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.18); transition: transform .16s ease; }
.spi-switch input:checked + .spi-switch-track { background: var(--spi-success); }
.spi-switch input:checked + .spi-switch-track::after { transform: translateX(14px); }
.spi-switch input:focus-visible + .spi-switch-track { outline: 2px solid var(--spi-accent); outline-offset: 2px; }

/* ---------- editor ---------- */
.spi-editor { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--spi-line-soft); display: flex; flex-direction: column; gap: 14px; }
.spi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 680px) { .spi-row { grid-template-columns: 1fr; } }
.spi-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.spi-label { font-size: 12px; font-weight: 600; color: var(--spi-ink-soft); }
.spi-input, .spi-textarea {
  width: 100%; box-sizing: border-box; border: 1px solid var(--spi-line); border-radius: 9px;
  background: var(--spi-surface); color: var(--spi-ink); padding: 8px 10px; font: inherit; font-size: 13px;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.spi-input:focus, .spi-textarea:focus { outline: none; border-color: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft); }
.spi-textarea { min-height: 160px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; line-height: 1.6; }
.spi-hint { font-size: 11.5px; color: var(--spi-ink-faint); }
.spi-modes { display: inline-flex; gap: 4px; padding: 3px; border-radius: 9px; background: var(--spi-surface-soft); align-self: flex-start; }
.spi-mode-btn {
  border: 0; border-radius: 7px; padding: 5px 14px; background: transparent;
  color: var(--spi-ink-soft); font: inherit; font-size: 12.5px; cursor: pointer;
  transition: background .2s ease, color .2s ease, transform .12s ease;
}
.spi-mode-btn:active { transform: scale(.96); }
.spi-mode-btn[data-on="true"] { background: var(--spi-surface); color: var(--spi-accent); font-weight: 600; box-shadow: 0 1px 3px rgba(16,24,40,.1); }
.spi-mini-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 20px; padding: 0; border-radius: 6px;
  border: 1px solid var(--spi-line); background: var(--spi-surface);
  color: var(--spi-ink-faint); font: inherit; font-size: 11px; line-height: 1; cursor: pointer;
  transition: border-color .15s ease, color .15s ease, background .15s ease;
}
.spi-mini-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }
.spi-mini-btn.danger:hover { border-color: var(--spi-danger); color: var(--spi-danger); }
.spi-mini-btn[data-disabled="true"], .spi-mini-btn:disabled { opacity: .45; cursor: not-allowed; }
.spi-order-actions { display: inline-flex; gap: 3px; }
.spi-undo { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; color: var(--spi-ink-soft); }
.spi-banner .spi-btn { margin-left: 8px; }
.spi-content-fields { display: flex; flex-direction: column; gap: 14px; }

/* ---------- soft prefill editor ---------- */
.spi-soft {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px; border: 1px dashed var(--spi-line); border-radius: 12px;
  background: var(--spi-surface-soft);
}
.spi-soft-toolbar { display: flex; flex-direction: column; gap: 3px; margin-bottom: 2px; }
.spi-soft-add { align-self: flex-start; height: 30px; font-size: 12px; }
.spi-soft-slot {
  position: relative;
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px; border: 1px solid var(--spi-line-soft); border-radius: 10px;
  background: var(--spi-surface);
  transition: opacity .16s ease, border-color .16s ease, box-shadow .16s ease;
}
.spi-soft-slot[data-dragging="true"] { opacity: .55; border-style: dashed; }
.spi-soft-slot-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.spi-soft-slot-head .spi-drag-handle { margin: -2px 0 -2px -3px; }
.spi-modes-mini { padding: 2px; gap: 2px; }
.spi-modes-mini .spi-mode-btn { padding: 3px 9px; font-size: 11.5px; }
.spi-soft-slot-note { font-size: 11px; color: var(--spi-ink-faint); }
.spi-soft-actions { display: flex; gap: 3px; margin-left: auto; }
.spi-soft-textarea { min-height: 64px; font-family: inherit; }
.spi-soft-baseline {
  display: flex; align-items: center; gap: 9px;
  padding: 10px 12px; border: 1px dashed color-mix(in srgb, var(--spi-accent) 35%, var(--spi-line));
  border-radius: 10px; background: var(--spi-surface);
}
.spi-soft-baseline-dot {
  width: 7px; height: 7px; border-radius: 50%; flex: none;
  background: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft);
}
.spi-soft-baseline-text { display: flex; flex-direction: column; gap: 2px; }
.spi-soft-baseline-label { font-size: 12px; font-weight: 600; color: var(--spi-accent); }

.spi-editor-actions { display: flex; align-items: center; gap: 8px; }
.spi-spacer { flex: 1; }

/* ---------- buttons ---------- */
.spi-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  height: 34px; padding: 0 14px; border-radius: 9px;
  border: 1px solid var(--spi-line); background: var(--spi-surface);
  color: var(--spi-ink-soft); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;
  white-space: nowrap;
}
.spi-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }
.spi-btn:active { transform: scale(.97); }
.spi-btn.primary { background: var(--spi-accent); border-color: var(--spi-accent); color: #fff; }
.spi-btn.primary:hover { filter: brightness(1.05); color: #fff; }
.spi-btn.danger { color: var(--spi-danger); border-color: color-mix(in srgb, var(--spi-danger) 30%, transparent); }
.spi-btn.danger:hover { background: color-mix(in srgb, var(--spi-danger) 8%, var(--spi-surface)); border-color: var(--spi-danger); color: var(--spi-danger); }
/* 保存期间不给按钮加 disabled / 透明度变化：请求一来一回会让按钮闪一下。
   忙碌状态只用 aria-busy 表达，重复点击由状态仓库去重。 */
.spi-chip[aria-busy="true"] { cursor: progress; }

/* ---------- empty ---------- */
.spi-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 16px; color: var(--spi-ink-faint); font-size: 13px; }
.spi-empty-icon { font-size: 22px; opacity: .55; }
.spi-empty p { margin: 0; }

.spi-footer { font-size: 11.5px; color: var(--spi-ink-faint); text-align: center; }

/* ---------- composer chip ---------- */
.spi-chip {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px;
  border-radius: 999px; border: 1px solid var(--spi-line); background: var(--spi-surface);
  color: var(--spi-ink-soft); font: inherit; font-size: 12px; line-height: 1; cursor: pointer;
  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;
}
.spi-chip:hover { border-color: var(--spi-accent); }
.spi-chip:active { transform: scale(.98); }
.spi-chip[data-on="true"] { border-color: color-mix(in srgb, var(--spi-success) 35%, transparent); background: color-mix(in srgb, var(--spi-success) 6%, var(--spi-surface)); color: var(--spi-success); }
.spi-chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spi-ink-faint); transition: background .2s ease, transform .2s ease; }
.spi-chip[data-on="true"] .spi-chip-dot { background: var(--spi-success); transform: scale(1.15); }
.spi-chip-label { font-weight: 500; }
.spi-chip-state { font-size: 10.5px; opacity: .75; }
.spi-chip:focus-visible { outline: 2px solid var(--spi-accent); outline-offset: 2px; }

@media (max-width: 580px) {
  .spi-card-main { align-items: flex-start; gap: 8px; flex-wrap: wrap; }
  .spi-card-open { flex-basis: calc(100% - 32px); flex-wrap: wrap; }
  .spi-card-name { flex-basis: calc(100% - 20px); white-space: normal; overflow-wrap: anywhere; }
  .spi-card-side { width: 100%; justify-content: flex-end; }
  .spi-card-open .spi-meta { max-width: 100%; white-space: normal; overflow-wrap: anywhere; }
}

.spi-card-new { /* 新规则占位；展开与外层 Collapse 的网格行过渡负责动画 */ }

@media (prefers-reduced-motion: reduce) {
  .spi-page *, .spi-chip {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
`

exports["SPI_CSS"] = SPI_CSS;
		};
		__factories["dspi:client/src/store.js"] = (module, exports, __require) => {
/**
 * 浏览器端的规则状态仓库。
 *
 * 设置页和聊天输入框旁的快捷开关共用同一份状态：任意一处保存，另一处会立即
 * 通过订阅收到新快照。总开关关闭时快捷按钮隐藏、所有会话停止注入；总开关
 * 开启后，还要打开某个对话的快捷开关，该对话才会生效。HTTP 接口由宿主半体提供。
 */

const API = '/system-prompt-injector/system-prompt-injector/state'

/** 导入文件里的规则规范化。和宿主端 normalizeRule 保持同一套字段。 */
function normalizeImportedRule(raw, index = 0) {
  const rule = raw !== null && typeof raw === 'object' ? raw : {}
  const rawId = typeof rule.id === 'string' ? rule.id.trim() : ''
  const id = rawId.length > 0 ? rawId : `imported-${index + 1}`
  const target = rule.target === 'assistant' ? 'assistant' : 'system'
  const soft = rule.soft !== null && typeof rule.soft === 'object' ? rule.soft : {}
  const normalizeSide = (value) =>
    (Array.isArray(value) ? value : []).map((item) => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: typeof item?.content === 'string' ? item.content : '',
    }))
  return {
    id,
    name: typeof rule.name === 'string' && rule.name.trim().length > 0 ? rule.name.trim() : `导入规则 ${index + 1}`,
    enabled: rule.enabled !== false,
    target,
    prefillMode: target === 'assistant' && rule.prefillMode === 'soft' ? 'soft' : 'native',
    mode: ['append', 'prepend', 'replace'].includes(rule.mode) ? rule.mode : 'append',
    schedule: rule.schedule === 'first' ? 'first' : 'every',
    content: typeof rule.content === 'string' ? rule.content : '',
    contentFile: typeof rule.contentFile === 'string' ? rule.contentFile : '',
    soft: { before: normalizeSide(soft.before), after: normalizeSide(soft.after) },
    agentPresets: Array.isArray(rule.agentPresets)
      ? rule.agentPresets.map((item) => String(item).trim()).filter((item) => item.length > 0)
      : [],
  }
}

/**
 * 解析导入文件。支持导出文件对象 `{ rules: [...] }` 或裸规则数组。
 * @param {string} text
 * @returns {ReturnType<typeof normalizeImportedRule>[]}
 */
function parseImportedRules(text) {
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('不是有效的 JSON 文件')
  }
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.rules) ? payload.rules : null
  if (list === null) throw new Error('文件里没有 rules 数组')
  if (list.length === 0) throw new Error('文件里没有规则')
  return list.map((item, index) => normalizeImportedRule(item, index))
}

/**
 * 追加导入：保留现有规则，导入规则里重复的 id 自动改名。
 * @param {Array<Record<string, any>>} current
 * @param {Array<Record<string, any>>} incoming
 * @returns {Array<Record<string, any>>}
 */
function mergeImportedRules(current, incoming) {
  const rules = (Array.isArray(current) ? current : []).map(plainRule)
  const used = new Set(rules.map((rule) => rule.id))
  let sequence = 0
  for (const item of Array.isArray(incoming) ? incoming : []) {
    const rule = plainRule(item)
    let id = rule.id
    while (used.has(id)) {
      sequence += 1
      id = `${rule.id}-imported-${sequence}`
    }
    used.add(id)
    rules.push({ ...rule, id })
  }
  return rules
}

/**
 * 生成导出 JSON 文本。
 * @param {Array<Record<string, any>>} rules
 * @returns {string}
 */
function serializeRules(rules) {
  return `${JSON.stringify(
    {
      format: 'dsh-system-prompt-injector.rules',
      version: 1,
      exportedAt: new Date().toISOString(),
      rules: (Array.isArray(rules) ? rules : []).map(plainRule),
    },
    null,
    2,
  )}\n`
}

/** 只保留后端认识的字段，避免把 contentLength/preview 等展示字段写回去。 */
function plainRule(rule) {
  const target = rule.target === 'assistant' ? 'assistant' : 'system'
  const soft = rule.soft !== null && typeof rule.soft === 'object' ? rule.soft : {}
  const normalizeSide = (value) =>
    (Array.isArray(value) ? value : []).map((item) => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: typeof item?.content === 'string' ? item.content : '',
    }))
  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled !== false,
    target,
    prefillMode: target === 'assistant' && rule.prefillMode === 'soft' ? 'soft' : 'native',
    mode: rule.mode || 'append',
    schedule: rule.schedule === 'first' ? 'first' : 'every',
    content: rule.content || '',
    contentFile: rule.contentFile || '',
    soft: {
      before: normalizeSide(soft.before),
      after: normalizeSide(soft.after),
    },
    agentPresets: Array.isArray(rule.agentPresets) ? rule.agentPresets : [],
  }
}

/**
 * 创建共享状态仓库。
 * @returns {{
 *   subscribe(listener: () => void): () => void,
 *   snapshot(): object,
 *   refresh(): Promise<boolean>,
 *   saveState(next: { enabled?: boolean, rules?: unknown[], sessionId?: string, sessionEnabled?: boolean }, successText?: string): Promise<boolean>,
 *   setMessage(message: { tone: string, text: string }): void,
 * }}
 */
function createStore() {
  let state = {
    ready: false,
    enabled: false,
    sessions: [],
    rules: [],
    revision: 0,
    status: {},
    error: '',
    saving: false,
    message: { tone: 'idle', text: '' },
  }
  /** @type {Set<() => void>} */
  const listeners = new Set()
  let snapshot = state
  let refreshSequence = 0
  let mutationSequence = 0

  const emit = () => {
    snapshot = state
    for (const listener of [...listeners]) {
      try {
        listener()
      } catch (error) {
        console.error('[system-prompt-injector] listener failed', error)
      }
    }
  }

  const patch = (fields) => {
    state = { ...state, ...fields }
    emit()
  }

  const request = async (init) => {
    const response = await fetch(API, {
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      ...init,
    })
    const body = await response.json().catch(() => undefined)
    if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`)
    return body
  }

  const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const refresh = async () => {
    if (state.saving) return false
    const sequence = ++refreshSequence
    const mutationAtStart = mutationSequence
    try {
      const body = await request({})
      if (sequence !== refreshSequence || mutationAtStart !== mutationSequence || state.saving) return false
      if (typeof body.revision === 'number' && body.revision < state.revision) return false
      patch({
        ready: true,
        enabled: body.enabled === true,
        sessions: Array.isArray(body.sessions) ? body.sessions : [],
        rules: Array.isArray(body.rules) ? body.rules : [],
        revision: body.revision ?? 0,
        status: body.status ?? {},
        error: body.lastError || '',
      })
      return true
    } catch (error) {
      if (sequence !== refreshSequence || mutationAtStart !== mutationSequence || state.saving) return false
      const message = error instanceof Error ? error.message : String(error)
      patch({
        ready: true,
        error: message,
        message: { tone: 'error', text: '刷新失败：' + message },
      })
      return false
    }
  }

  const saveState = async (next, successText = '已保存，下一轮模型请求生效。') => {
    if (state.saving) return false
    mutationSequence += 1
    patch({ saving: true })
    try {
      // 只提交本次真正变化的字段：总开关和会话开关不会顺带覆盖规则。
      const payload = {}
      if (next.enabled !== undefined) payload.enabled = next.enabled === true
      if (next.rules !== undefined) payload.rules = next.rules.map(plainRule)
      if (next.sessionId !== undefined || next.sessionEnabled !== undefined) {
        payload.sessionId = next.sessionId
        payload.sessionEnabled = next.sessionEnabled === true
      }
      const body = await request({ method: 'PUT', body: JSON.stringify(payload) })
      patch({
        ready: true,
        enabled: body.enabled === true,
        sessions: Array.isArray(body.sessions) ? body.sessions : [],
        rules: Array.isArray(body.rules) ? body.rules : [],
        revision: body.revision ?? 0,
        status: body.status ?? {},
        error: body.lastError || '',
        saving: false,
        message: { tone: 'ok', text: successText },
      })
      return true
    } catch (error) {
      patch({
        saving: false,
        message: { tone: 'error', text: '保存失败：' + (error instanceof Error ? error.message : String(error)) },
      })
      return false
    }
  }

  return {
    subscribe,
    snapshot: () => snapshot,
    refresh,
    saveState,
    setMessage: (message) => patch({ message }),
  }
}

exports["normalizeImportedRule"] = normalizeImportedRule;
exports["parseImportedRules"] = parseImportedRules;
exports["mergeImportedRules"] = mergeImportedRules;
exports["serializeRules"] = serializeRules;
exports["plainRule"] = plainRule;
exports["createStore"] = createStore;
		};
		var entry = __load("dspi:client/index.js");
		return entry;
		} catch (error) {
			globalThis.__DSH_SYSTEM_PROMPT_INJECTOR_ERROR__ = error;
			console.error("dsh-system-prompt-injector: factory failed", error);
			throw error;
		}
	}
});

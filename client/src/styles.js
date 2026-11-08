/** 设置页与聊天快捷按钮样式。构建时会被内联进 client.js。 */
export const SPI_CSS = `
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

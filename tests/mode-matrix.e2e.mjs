import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = path.join(os.tmpdir(), "simpleportrait-mode-test");
const port = 9333;
const browser = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--disable-gpu",
  "--hide-scrollbars",
  "about:blank",
], { stdio: "ignore" });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function retry(task, timeout = 10000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeout) {
    try { return await task(); } catch (error) { lastError = error; await wait(100); }
  }
  throw lastError || new Error("Timed out");
}

let socket;
let nextId = 0;
const pending = new Map();
function command(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const response = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Browser evaluation failed");
  return response.result.value;
}
async function click(label) {
  const result = await evaluate(`(() => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent.trim() === ${JSON.stringify(label)});
    if (!button) return false;
    button.click();
    return true;
  })()`);
  assert(result, `Button not found: ${label}`);
  await wait(300);
}
async function clickSpec(label) {
  const result = await evaluate(`(() => {
    const button = [...document.querySelectorAll("button.spec-card")].find((item) => item.querySelector("b")?.textContent.trim() === ${JSON.stringify(label)});
    if (!button) return false;
    button.click();
    return true;
  })()`);
  assert(result, `Spec not found: ${label}`);
  await retry(async () => {
    const selected = await evaluate(`document.querySelector(".spec-card.selected b")?.textContent.trim()`);
    if (selected !== label) throw new Error(`Waiting for selected spec: ${label}`);
  });
}
async function uploadSyntheticPortrait() {
  const uploaded = await evaluate(`(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 420;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#4f9ef8"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#efc5a7"; ctx.beginPath(); ctx.ellipse(160, 135, 55, 70, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#263a49"; ctx.beginPath(); ctx.ellipse(160, 350, 115, 145, 0, 0, Math.PI * 2); ctx.fill();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], "portrait.png", { type: "image/png" });
    const transfer = new DataTransfer(); transfer.items.add(file);
    const input = document.querySelector('input[type="file"][accept="image/jpeg,image/png,image/webp"]');
    if (!input) return false;
    Object.defineProperty(input, "files", { value: transfer.files, configurable: true });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);
  assert(uploaded, "Could not upload the synthetic portrait");
  await retry(async () => {
    const complete = await evaluate("document.querySelector('.matting-inline-status')?.textContent.includes('抠图完成')");
    if (!complete) throw new Error("Waiting for integrated matting");
  }, 15000);
}
async function snapshot() {
  return evaluate(`(() => {
    const workspace = document.querySelector(".workspace");
    const panel = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { hidden: element.hidden, display: getComputedStyle(element).display, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    const display = (selector) => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element).display : null;
    };
    return {
      mode: workspace?.dataset.editorMode,
      workflow: workspace?.dataset.workflow,
      step: Number(workspace?.dataset.step),
      module: workspace?.dataset.module,
      progress: Boolean(document.querySelector(".progress-wrap")),
      proNav: Boolean(document.querySelector(".pro-module-nav")),
      proHead: Boolean(document.querySelector(".pro-workbench-head")),
      wizardNav: Boolean(document.querySelector(".wizard-nav")),
      workflowSwitch: Boolean(document.querySelector(".workflow-switch")),
      skipButton: [...document.querySelectorAll(".wizard-nav button")].some((item) => item.textContent.includes("跳过")),
      activePro: document.querySelector(".pro-module-nav button.active")?.textContent.trim() || null,
      rightTitle: document.querySelector(".right-panel .panel-heading h2")?.textContent.trim() || null,
      openDetails: [...document.querySelectorAll(".basic-detail-groups details")].filter((item) => item.open).length,
      visibleDetails: [...document.querySelectorAll(".basic-detail-groups details")].filter((item) => getComputedStyle(item).display !== "none").length,
      selectedSpec: document.querySelector(".spec-card.selected b")?.textContent.trim() || null,
      widthPx: Number(document.querySelector('[aria-label="采集图像宽度 PX"]')?.value),
      left: panel(".left-panel"),
      stage: panel(".stage-panel"),
      right: panel(".right-panel"),
      basicDetails: display(".basic-detail-groups"),
      specSettings: display(".spec-settings-group"),
      compositionSettings: display(".composition-settings-group"),
      background: display(".background-control"),
      transform: display(".transform-control"),
      gesture: display(".gesture-card"),
      appearance: display(".appearance-control"),
      output: display(".output-controls"),
      zoom: Number(document.querySelector(".photo-frame")?.dataset.zoom),
      offsetX: Number(document.querySelector(".photo-frame")?.dataset.offsetX),
      offsetY: Number(document.querySelector(".photo-frame")?.dataset.offsetY),
      panelBackgrounds: [".left-panel", ".stage-panel", ".right-panel"].map((selector) => getComputedStyle(document.querySelector(selector)).backgroundColor),
      panelOverflows: [".left-panel", ".stage-panel", ".right-panel"].map((selector) => getComputedStyle(document.querySelector(selector)).overflowY),
      compositionCardBackground: document.querySelector(".composition-settings-group .advanced-fields") ? getComputedStyle(document.querySelector(".composition-settings-group .advanced-fields")).backgroundColor : null,
      modeChoiceText: document.querySelector(".mode-choice")?.textContent.trim() || "",
      filenamePlaceholder: document.querySelector(".filename-field input")?.placeholder || "",
      formatDisabled: Boolean(document.querySelector(".output-controls select")?.disabled),
      templateLibrary: Boolean(document.querySelector(".spec-library")),
      colorPickerCount: document.querySelectorAll(".eyedropper-button input[type=color]").length,
      iconButtonDisplay: getComputedStyle(document.querySelector(".settings-button")).display,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  })()`);
}
const visible = (panel) => panel && !panel.hidden && panel.display !== "none" && panel.width > 0 && panel.height > 0;
const hidden = (panel) => !panel || panel.hidden || panel.display === "none" || panel.width === 0 || panel.height === 0;
function assertNoOverlap(panels, label) {
  const shown = panels.filter(visible);
  for (let a = 0; a < shown.length; a++) for (let b = a + 1; b < shown.length; b++) {
    const x = Math.max(0, Math.min(shown[a].x + shown[a].width, shown[b].x + shown[b].width) - Math.max(shown[a].x, shown[b].x));
    const y = Math.max(0, Math.min(shown[a].y + shown[a].height, shown[b].y + shown[b].height) - Math.max(shown[a].y, shown[b].y));
    assert(x * y < 4, `${label}: panels overlap by ${Math.round(x * y)}px²`);
  }
}

try {
  const version = await retry(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/version`);
    if (!response.ok) throw new Error("Chrome is not ready");
    return response.json();
  });
  assert(version.webSocketDebuggerUrl, "Chrome debugging endpoint missing");
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("http://localhost:5173/id-photo/")}`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const task = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  await command("Runtime.enable");
  await retry(async () => {
    const ready = await evaluate("Boolean(document.querySelector('.workspace'))");
    if (!ready) throw new Error("App is not ready");
  });
  await evaluate("localStorage.clear(); sessionStorage.clear(); location.reload(); true");
  await retry(async () => {
    const ready = await evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.workspace'))");
    if (!ready) throw new Error("Reloading app");
  });
  await wait(200);

  let state = await snapshot();
  assert(state.mode === "basic" && state.workflow === "wizard" && state.step === 0, "Default must be the Basic four-step guide");
  assert(state.progress && state.wizardNav && !state.proNav && !state.workflowSwitch && !state.skipButton, "Basic navigation contains obsolete mode or skip controls");
  assert(visible(state.left) && hidden(state.stage) && hidden(state.right), "Basic step 1 must show only size selection and its details");
  assert(state.basicDetails !== "none" && state.visibleDetails === 1 && state.openDetails === 0, "Basic step 1 details are not logically scoped and folded");
  assert(state.iconButtonDisplay === "flex", "Header icon and label alignment is wrong");
  assert(state.templateLibrary && !state.formatDisabled, "CET quick preset is locked or the folded template library is missing");
  assert(!state.filenamePlaceholder.includes("身份证"), "Filename is still presented as a required identity-card number");
  assert(!state.modeChoiceText.includes("推荐电脑") && !state.modeChoiceText.includes("完整工作台"), "Obsolete Professional mode subtitle is still visible");
  await clickSpec("一寸");
  await click("下一步 →");
  await uploadSyntheticPortrait();
  state = await snapshot();
  assert(state.step === 1 && visible(state.left) && visible(state.stage) && visible(state.right), "Basic step 2 must show canvas, gesture help and its details");
  assert(state.rightTitle === "构图操作" && state.transform === null && state.gesture !== "none" && state.background === "none" && state.visibleDetails === 1, "Basic step 2 leaked obsolete movement controls or unrelated settings");
  assert(state.openDetails === 0 && !state.skipButton, "Basic step 2 contains expanded details or a skip button");
  assertNoOverlap([state.left, state.stage, state.right], "Basic step 2");
  assert(await evaluate("Boolean(document.querySelector('.canvas-lock-toggle'))"), "Canvas lock control is missing");
  await click("锁定照片");
  assert(await evaluate("document.querySelector('.photo-frame').classList.contains('is-locked')"), "Canvas did not enter the locked state");
  await click("解锁照片");

  await evaluate("window.scrollTo(0,120)");
  const insideScrollBefore = await evaluate("window.scrollY");
  const frame = await evaluate(`(() => { const r=document.querySelector('.photo-frame').getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })()`);
  const beforeWheel = state.zoom;
  await command("Input.dispatchMouseEvent", { type:"mouseWheel", x:frame.x+frame.width*.72, y:frame.y+frame.height*.45, deltaX:0, deltaY:-120 });
  await wait(200);
  state = await snapshot();
  assert(state.zoom > beforeWheel, "Mouse wheel inside the photo did not zoom");
  const insideScrollAfter = await evaluate("window.scrollY");
  assert(Math.abs(insideScrollAfter-insideScrollBefore)<2, `Mouse wheel inside the photo also scrolled the page: ${insideScrollBefore}/${insideScrollAfter}`);
  const beforeDragX = state.offsetX;
  await command("Input.dispatchMouseEvent", { type:"mousePressed", x:frame.x+frame.width*.5, y:frame.y+frame.height*.5, button:"left", buttons:1, clickCount:1 });
  await command("Input.dispatchMouseEvent", { type:"mouseMoved", x:frame.x+frame.width*.6, y:frame.y+frame.height*.56, button:"left", buttons:1 });
  await command("Input.dispatchMouseEvent", { type:"mouseReleased", x:frame.x+frame.width*.6, y:frame.y+frame.height*.56, button:"left", buttons:0, clickCount:1 });
  await wait(200);
  state = await snapshot();
  assert(state.offsetX !== beforeDragX, "Mouse drag inside the photo did not move it");
  await evaluate("window.scrollTo(0,0)");
  await command("Input.dispatchMouseEvent", { type:"mouseWheel", x:8, y:560, deltaX:0, deltaY:420 });
  await wait(200);
  const outsideScroll = await evaluate("window.scrollY");
  assert(outsideScroll > 0, "Mouse wheel outside the photo did not scroll the page");

  await click("下一步 →");
  state = await snapshot();
  assert(state.step === 2 && state.rightTitle === "背景与画面" && state.basicDetails === "none", "Basic step 3 content or details are wrong");
  assert(state.background !== "none" && state.appearance !== "none" && !state.transform && state.output === "none", "Basic step 3 leaked unrelated controls");
  assert(!state.skipButton, "Basic step 3 still contains the obsolete skip button");
  const corner = await evaluate("Array.from(document.querySelector('.photo-frame canvas').getContext('2d').getImageData(0,0,1,1).data)");
  assert(Math.abs(corner[0]-216)<8 && Math.abs(corner[1]-240)<8 && Math.abs(corner[2]-255)<8 && corner[3]===255, `Integrated matting did not reveal the selected background: ${corner}`);
  const mattingControls = await evaluate(`({modes:[...document.querySelectorAll('.background-mode-row.two button')].map(x=>x.textContent.trim()),compare:[...document.querySelectorAll('.matting-control-actions button')].map(x=>x.textContent.trim()),status:document.querySelector('.matting-inline-status')?.textContent})`);
  assert(mattingControls.modes.length === 2 && !mattingControls.modes.includes("跳过处理") && mattingControls.compare.length === 2 && mattingControls.status.includes("抠图完成"), "ID-photo matting controls do not match the streamlined standalone tool");
  await evaluate("document.querySelector('[aria-label=\"透明背景\"]').click()");
  await retry(async()=>{const transparentFormat=await evaluate("document.querySelector('.output-controls select').value");if(transparentFormat!=="png")throw new Error("Transparent ID-photo background did not enforce PNG output")});
  assertNoOverlap([state.left, state.stage, state.right], "Basic step 3");

  await click("下一步 →");
  state = await snapshot();
  assert(state.step === 3 && state.rightTitle === "检查与保存" && state.basicDetails === "none", "Basic final step still repeats detailed settings");
  assert(state.output !== "none" && !state.transform && state.background === "none" && state.appearance === "none", "Basic final step leaked editing controls");
  assert(state.selectedSpec === "一寸" && state.widthPx === 295 && !state.skipButton, `Basic flow lost data or retained a skip button: ${JSON.stringify({selectedSpec:state.selectedSpec,widthPx:state.widthPx,skipButton:state.skipButton})}`);
  assert(state.colorPickerCount > 0, "ID-photo background controls are missing the colour picker");
  await evaluate(`(() => {
    const min = document.querySelector('[aria-label="minimum KB"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(min, "40");
    min.dispatchEvent(new Event("input", { bubbles:true })); min.dispatchEvent(new Event("change", { bubbles:true }));
    return true;
  })()`);
  await wait(100);
  await evaluate(`(() => {
    const max = document.querySelector('[aria-label="maximum KB"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(max, "30");
    max.dispatchEvent(new Event("input", { bubbles:true })); max.dispatchEvent(new Event("change", { bubbles:true }));
    return true;
  })()`);
  await wait(200);
  const correctedRange = await evaluate(`({min:Number(document.querySelector('[aria-label="minimum KB"]').value),max:Number(document.querySelector('[aria-label="maximum KB"]').value)})`);
  assert(correctedRange.min === 25 && correctedRange.max === 30, `File range did not auto-correct: ${JSON.stringify(correctedRange)}`);
  assertNoOverlap([state.left, state.stage, state.right], "Basic final step");

  await click("专业模式");
  state = await snapshot();
  assert(state.mode === "professional" && state.workflow === "full", "Professional mode must always open the full workbench");
  assert(!state.progress && !state.wizardNav && !state.proNav && state.proHead && !state.workflowSwitch, "Professional mode still contains module windows or guided navigation");
  assert(visible(state.left) && visible(state.stage) && visible(state.right), "Professional mode must show the complete workbench at once");
  assert(state.specSettings !== "none" && state.compositionSettings !== "none" && state.background !== "none" && state.transform !== "none" && state.appearance !== "none" && state.output !== "none", "Professional workbench hides part of its complete controls");
  assert(new Set(state.panelBackgrounds).size === 1, `Professional panel backgrounds are inconsistent: ${state.panelBackgrounds}`);
  assert(state.compositionCardBackground && state.compositionCardBackground !== "rgb(255, 255, 255)", `Professional composition card is still white: ${state.compositionCardBackground}`);
  assert(state.panelOverflows.every((value)=>value!=="auto"&&value!=="scroll"), `Professional workbench contains nested scrolling windows: ${state.panelOverflows}`);
  assert(state.selectedSpec === "一寸" && state.widthPx === 295, "Switching to Professional lost session data");
  assertNoOverlap([state.left, state.stage, state.right], "Professional complete workbench");

  await click("普通模式");
  await click("← 上一步");
  await click("← 上一步");
  await command("Emulation.setDeviceMetricsOverride", { width:390, height:844, deviceScaleFactor:2, mobile:true });
  await wait(300);
  await evaluate("document.querySelector('.photo-frame').scrollIntoView({block:'center'})");
  const touchFrame = await evaluate(`(() => { const r=document.querySelector('.photo-frame').getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })()`);
  state = await snapshot();
  const beforePinch = state.zoom;
  const cx=touchFrame.x+touchFrame.width/2, cy=touchFrame.y+touchFrame.height/2;
  await command("Input.dispatchTouchEvent", {type:"touchStart",touchPoints:[{x:cx-28,y:cy},{x:cx+28,y:cy}]});
  await command("Input.dispatchTouchEvent", {type:"touchMove",touchPoints:[{x:cx-58,y:cy},{x:cx+58,y:cy}]});
  await command("Input.dispatchTouchEvent", {type:"touchEnd",touchPoints:[]});
  await wait(250);
  state = await snapshot();
  assert(state.zoom > beforePinch, "Two-finger pinch inside the mobile photo did not zoom");
  const beforeTouchX=state.offsetX;
  await command("Input.dispatchTouchEvent", {type:"touchStart",touchPoints:[{x:cx,y:cy}]});
  await command("Input.dispatchTouchEvent", {type:"touchMove",touchPoints:[{x:cx+34,y:cy+18}]});
  await command("Input.dispatchTouchEvent", {type:"touchEnd",touchPoints:[]});
  await wait(250);
  state = await snapshot();
  assert(state.offsetX !== beforeTouchX, "Single-finger mobile drag did not move the photo");
  assert(state.pageWidth <= state.viewportWidth, `Mobile Basic guide overflows horizontally: ${state.pageWidth}/${state.viewportWidth}`);
  const mobileNav=await evaluate(`(()=>{const rect=document.querySelector(".wizard-nav").getBoundingClientRect();return{top:rect.top,bottom:rect.bottom,viewportHeight:window.visualViewport?.height||window.innerHeight}})()`);
  assert(mobileNav.top>=0&&mobileNav.bottom<=mobileNav.viewportHeight+1, `Mobile wizard navigation is obscured: ${JSON.stringify(mobileNav)}`);

  await click("专业模式");
  state = await snapshot();
  assert(state.mode === "professional" && state.workflow === "full" && state.proHead && !state.progress && !state.proNav, "Mobile Professional is not the single complete workbench");
  assert(state.pageWidth <= state.viewportWidth, `Mobile Professional workbench overflows horizontally: ${state.pageWidth}/${state.viewportWidth}`);
  assert(visible(state.left) && visible(state.stage) && visible(state.right), "Mobile Professional does not show all workbench sections");
  assertNoOverlap([state.left, state.stage, state.right], "Mobile Professional complete workbench");
  assert(state.selectedSpec === "一寸" && state.widthPx === 295, "Shared session data was lost on mobile mode switch");

  console.log("Editor UX browser test passed: scoped Basic steps, unified Professional workbench, integrated matting, mouse wheel/drag, and mobile touch gestures.");
} finally {
  try { socket?.close(); } catch {}
  browser.kill();
}

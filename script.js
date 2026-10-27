const languages = [
    ["en", "English"], ["ru", "Русский"], ["kk", "Қазақша"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["zh", "中文"], ["ja", "日本語"], ["ko", "한국어"], ["ar", "العربية"], ["hi", "हिन्दी"], ["pt", "Português"], ["it", "Italiano"], ["tr", "Türkçe"], ["nl", "Nederlands"], ["pl", "Polski"], ["uk", "Українська"], ["sv", "Svenska"], ["no", "Norsk"], ["da", "Dansk"], ["fi", "Suomi"], ["el", "Ελληνικά"], ["he", "עברית"], ["id", "Bahasa Indonesia"], ["ms", "Bahasa Melayu"], ["th", "ไทย"], ["vi", "Tiếng Việt"], ["fa", "فارسی"], ["ur", "اردو"], ["bn", "বাংলা"], ["ta", "தமிழ்"], ["te", "తెలుగు"], ["mr", "मराठी"], ["gu", "ગુજરાતી"], ["pa", "ਪੰਜਾਬੀ"], ["sw", "Kiswahili"], ["af", "Afrikaans"], ["sq", "Shqip"], ["am", "አማርኛ"], ["hy", "Հայերեն"], ["az", "Azərbaycan dili"], ["eu", "Euskara"], ["be", "Беларуская"], ["bs", "Bosanski"], ["bg", "Български"], ["my", "မြန်မာဘာသာ"], ["ca", "Català"], ["ceb", "Cebuano"], ["hr", "Hrvatski"], ["cs", "Čeština"], ["et", "Eesti"], ["tl", "Filipino"], ["gl", "Galego"], ["ka", "ქართული"], ["hu", "Magyar"], ["is", "Íslenska"], ["ga", "Gaeilge"], ["jv", "Basa Jawa"], ["kn", "ಕನ್ನಡ"], ["km", "ភាសាខ្មែរ"], ["lo", "ລາວ"], ["la", "Latina"], ["lv", "Latviešu"], ["lt", "Lietuvių"], ["mk", "Македонски"], ["ml", "മലയാളം"], ["mn", "Монгол"], ["ne", "नेपाली"], ["ps", "پښتو"], ["ro", "Română"], ["sr", "Српски"], ["si", "සිංහල"], ["sk", "Slovenčina"], ["sl", "Slovenščina"], ["so", "Soomaali"], ["su", "Basa Sunda"], ["tg", "Тоҷикӣ"], ["uz", "Oʻzbek"], ["yo", "Yorùbá"], ["zu", "isiZulu"], ["xh", "isiXhosa"], ["ig", "Igbo"], ["ha", "Hausa"], ["or", "ଓଡ଼ିଆ"], ["as", "অসমীয়া"], ["sd", "سنڌي"], ["ku", "Kurdî"], ["ky", "Кыргызча"], ["tk", "Türkmen"], ["fo", "Føroyskt"], ["lb", "Lëtzebuergesch"], ["mt", "Malti"], ["eo", "Esperanto"], ["ny", "Chichewa"], ["rw", "Kinyarwanda"], ["mg", "Malagasy"], ["mi", "Māori"], ["sm", "Gagana Sāmoa"], ["haw", "ʻŌlelo Hawaiʻi"], ["yue", "粵語"]
];
const englishNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "language" }) : null;

const sourceText = document.querySelector("#source-text");
const translatedText = document.querySelector("#translated-text");
const fromLanguage = document.querySelector("#from-language");
const toLanguage = document.querySelector("#to-language");
const characterCount = document.querySelector("#character-count");
const resultLanguage = document.querySelector("#result-language");
const message = document.querySelector("#message");
const themeButton = document.querySelector("#theme-button");
const themeIconUse = document.querySelector("#theme-icon-use");
const resultPanel = document.querySelector("#result-panel");

const languageModal = document.querySelector("#language-modal");
const languageShade = document.querySelector(".language-shade");
const closeLanguageButton = document.querySelector("#close-language");
const languageTabs = document.querySelector(".language-tabs");
const languageTrack = document.querySelector("#language-track");
const recentTab = document.querySelector("#recent-tab");
const allTab = document.querySelector("#all-tab");
const recentList = document.querySelector("#recent-languages");
const allList = document.querySelector("#all-languages");
const noRecent = document.querySelector("#no-recent");
const noResults = document.querySelector("#no-results");
const languageSearch = document.querySelector("#language-search");

let pickerSide = "from", buttonToReturnTo, showingAll = false;
let recentLanguages = ["en", "ru"];
let translateTimer = null, abortCtrl = null, voicesCache = [];

function readSaved(k) { try { return localStorage.getItem(k) } catch { return null } }
function saveValue(k, v) { try { localStorage.setItem(k, v) } catch { } }
function getLanguage(c) { return languages.find(l => l[0] === c) }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function countWords(t) { return t.trim().split(/\s+/).filter(Boolean).length }
function getDelay(c) { if (c <= 0) return 0; if (c <= 3) return 2000; if (c <= 16) return 5000; return 8000 }
function showSkeleton() { resultPanel.classList.add("translating") }
function hideSkeleton() { resultPanel.classList.remove("translating") }

function loadSavedLanguages() {
    const f = readSaved("lumi-from-language"), t = readSaved("lumi-to-language"), r = readSaved("lumi-recent-languages");
    if (getLanguage(f)) fromLanguage.dataset.language = f;
    if (getLanguage(t)) toLanguage.dataset.language = t;
    if (r) { try { const p = JSON.parse(r); if (Array.isArray(p)) recentLanguages = p.filter((c, i) => getLanguage(c) && p.indexOf(c) === i).slice(0, 12) } catch { } }
    updateLanguageButtons(); updateBadge();
}
function updateLanguageButtons() { [fromLanguage, toLanguage].forEach(b => { const l = getLanguage(b.dataset.language); if (l) b.querySelector(".language-name").textContent = l[1] }) }
function updateBadge() { resultLanguage.textContent = toLanguage.dataset.language.toUpperCase() }

async function translateViaGoogle(text, from, to) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url); if (!res.ok) throw new Error("google err");
    const data = await res.json(); return data[0].map(x => x[0]).join("");
}
async function translateViaMyMemory(text, from, to) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url); const d = await res.json();
    if (d.responseData?.translatedText) return d.responseData.translatedText;
    throw new Error("mymemory err");
}

async function performTranslation() {
    const raw = sourceText.value, text = raw.trim();
    const from = fromLanguage.dataset.language, to = toLanguage.dataset.language;
    characterCount.textContent = `${raw.length} / 5000`;
    if (!text) { hideSkeleton(); translatedText.value = ""; message.textContent = ""; return }
    if (from === to) { hideSkeleton(); translatedText.value = raw; return }

    const wc = countWords(text), delay = getDelay(wc);
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    showSkeleton();
    await sleep(delay);
    if (abortCtrl.signal.aborted) return;

    try {
        let result = "";
        try { result = await translateViaGoogle(text, from, to); }
        catch { result = await translateViaMyMemory(text, from, to); }
        translatedText.value = result; hideSkeleton(); message.textContent = ""; message.className = "message";
    } catch (e) { hideSkeleton(); message.textContent = "Не удалось перевести. Проверь интернет."; message.className = "message error"; }
}

// === REAL VOICES ===
const googleMap = { zh: "zh-CN", yue: "zh-CN", "zh-CN": "zh-CN", "zh-TW": "zh-TW", he: "iw", jv: "jw", tl: "tl", fil: "tl", haw: "haw", iw: "iw", jw: "jw", ny: "ny" };
function loadVoices() { if ("speechSynthesis" in window) voicesCache = speechSynthesis.getVoices() }
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.addEventListener("voiceschanged", loadVoices) }
function getBestVoice(lang) {
    if (!voicesCache.length) loadVoices();
    const base = lang.split("-")[0].toLowerCase();
    const matching = voicesCache.filter(v => v.lang.toLowerCase().startsWith(base) || v.lang.toLowerCase().includes(base));
    if (!matching.length) return null;
    const scored = matching.map(v => {
        let s = 0; const n = v.name.toLowerCase();
        if (n.includes("natural")) s += 20;
        if (n.includes("neural")) s += 18;
        if (n.includes("premium")) s += 15;
        if (n.includes("enhanced")) s += 12;
        if (n.includes("wavenet") || n.includes("studio")) s += 14;
        if (!n.includes("google")) s += 6;
        if (v.localService) s += 4;
        if (n.includes("aria") || n.includes("jenny") || n.includes("guy") || n.includes("dmitry") || n.includes("svetlana")) s += 10;
        return { voice: v, score: s }
    }).sort((a, b) => b.score - a.score);
    return scored[0].voice;
}
function isNatural(v) { return v && /natural|neural|premium|enhanced|wavenet|studio|aria|jenny|guy|dmitry|svetlana/i.test(v.name) }
function splitChunks(text, max) { const sens = text.split(/(?<=[.!?।。！？])\s+/); const chunks = []; let cur = ""; for (const s of sens) { if ((cur + " " + s).length > max) { if (cur) chunks.push(cur.trim()); if (s.length > max) { const parts = s.match(new RegExp(`.{1,${max}}`, "g")) || [s]; chunks.push(...parts); cur = ""; } else cur = s; } else cur = cur ? cur + " " + s : s; } if (cur) chunks.push(cur.trim()); return chunks.length ? chunks : [text]; }
let currentAudio = null;
function stopAll() { try { speechSynthesis.cancel() } catch { } if (currentAudio) { try { currentAudio.pause(); currentAudio.src = "" } catch { } currentAudio = null; } }
async function speakViaSystem(text, lang) {
    return new Promise((res, rej) => {
        const run = () => {
            const voice = getBestVoice(lang); if (!voice) { rej(new Error("no voice")); return; }
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text); u.voice = voice; u.lang = voice.lang; u.rate = .95; u.pitch = 1; u.volume = 1;
            u.onend = () => res(); u.onerror = e => rej(e);
            speechSynthesis.speak(u);
        };
        if (!voicesCache.length) { const h = () => { speechSynthesis.removeEventListener("voiceschanged", h); loadVoices(); run(); }; speechSynthesis.addEventListener("voiceschanged", h); setTimeout(() => { speechSynthesis.removeEventListener("voiceschanged", h); run(); }, 800); } else run();
    });
}
async function speakViaGoogleTTS(text, lang) {
    const tl = googleMap[lang] || lang;
    const chunks = splitChunks(text, 180);
    for (const ch of chunks) { if (!ch.trim()) continue; const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(ch)}&tl=${tl}&client=gtx`; await new Promise((res, rej) => { const a = new Audio(url); currentAudio = a; a.onended = () => res(); a.onerror = () => rej(new Error("tts err")); a.play().catch(rej); }); }
}
async function speakText(text, langCode, btn) {
    if (!text?.trim()) { message.textContent = "Пока нечего озвучивать."; return }
    stopAll(); btn.disabled = true; btn.classList.add("speaking"); message.textContent = "";
    const lang = langCode || "en"; const best = getBestVoice(lang);
    try {
        if (isNatural(best)) await speakViaSystem(text, lang);
        else {
            try { await speakViaGoogleTTS(text, lang); }
            catch { if (best) await speakViaSystem(text, lang); else await speakViaGoogleTTS(text, "en"); }
        }
    } catch (e) { message.textContent = `Нет голоса для ${lang}. Попробуй Chrome/Edge.`; message.className = "message error"; }
    finally { btn.disabled = false; btn.classList.remove("speaking"); currentAudio = null; }
}

// UI
function drawList(list, codes, emptyMsg) {
    list.replaceChildren(); let visible = 0;
    const q = languageSearch.value.trim().toLocaleLowerCase();
    const selected = pickerSide === "from" ? fromLanguage.dataset.language : toLanguage.dataset.language;
    codes.forEach(code => {
        const lang = getLanguage(code); if (!lang) return;
        const eng = englishNames?.of(lang[0]) || "";
        if (q && !`${lang[0]} ${lang[1]} ${eng}`.toLocaleLowerCase().includes(q)) return;
        const b = document.createElement("button"); b.className = "language-option"; b.type = "button"; b.dataset.language = lang[0];
        if (lang[0] === selected) b.classList.add("selected");
        const name = document.createElement("span"); name.textContent = lang[1];
        const c = document.createElement("span"); c.className = "language-option-code"; c.textContent = lang[0];
        b.append(name, c); list.append(b); visible++;
    });
    emptyMsg.hidden = visible !== 0;
}
function drawLists() { drawList(recentList, recentLanguages, noRecent); drawList(allList, languages.map(l => l[0]), noResults); }
function showTab(all) { showingAll = all; languageTabs.classList.toggle("show-all", all); languageTrack.classList.toggle("show-all", all); recentTab.classList.toggle("active", !all); allTab.classList.toggle("active", all); }
function openPicker(btn) { pickerSide = btn.dataset.side; buttonToReturnTo = btn; btn.setAttribute("aria-expanded", "true"); languageModal.hidden = false; document.body.classList.add("language-open"); languageSearch.value = ""; showTab(false); drawLists(); closeLanguageButton.focus(); }
function closePicker() { languageModal.hidden = true; document.body.classList.remove("language-open"); buttonToReturnTo?.setAttribute("aria-expanded", "false"); buttonToReturnTo?.focus(); }
function chooseLanguage(code) { const sel = getLanguage(code); if (!sel) return; const btn = pickerSide === "from" ? fromLanguage : toLanguage; btn.dataset.language = sel[0]; updateLanguageButtons(); updateBadge(); recentLanguages = [sel[0], ...recentLanguages.filter(x => x !== sel[0])].slice(0, 12); saveValue("lumi-from-language", fromLanguage.dataset.language); saveValue("lumi-to-language", toLanguage.dataset.language); saveValue("lumi-recent-languages", JSON.stringify(recentLanguages)); drawLists(); closePicker(); performTranslation(); }
function copyText(t) { if (!t) { message.textContent = "Сначала напиши текст."; return } navigator.clipboard.writeText(t).then(() => { message.textContent = "Скопировано!"; setTimeout(() => { if (message.textContent === "Скопировано!") message.textContent = "" }, 1200) }).catch(() => { message.textContent = "Не получилось скопировать." }); }

fromLanguage.addEventListener("click", () => openPicker(fromLanguage));
toLanguage.addEventListener("click", () => openPicker(toLanguage));
closeLanguageButton.addEventListener("click", closePicker);
languageShade.addEventListener("click", closePicker);
recentTab.addEventListener("click", () => showTab(false));
allTab.addEventListener("click", () => showTab(true));
languageSearch.addEventListener("input", drawLists);
document.querySelector(".language-window").addEventListener("click", e => { const b = e.target.closest(".language-option"); if (b) chooseLanguage(b.dataset.language); });
document.addEventListener("keydown", e => { if (languageModal.hidden) return; if (e.key === "Escape") closePicker(); });

sourceText.addEventListener("input", () => { characterCount.textContent = `${sourceText.value.length} / 5000`; clearTimeout(translateTimer); translateTimer = setTimeout(performTranslation, 400); });

// SWAP WITHOUT RE-TRANSLATE
const swapBtn = document.querySelector("#swap-button");
swapBtn.addEventListener("click", () => {
    swapBtn.classList.remove("animate"); requestAnimationFrame(() => swapBtn.classList.add("animate")); swapBtn.addEventListener("animationend", () => swapBtn.classList.remove("animate"), { once: true });
    const oldLang = fromLanguage.dataset.language; fromLanguage.dataset.language = toLanguage.dataset.language; toLanguage.dataset.language = oldLang;
    const oldTxt = sourceText.value; sourceText.value = translatedText.value; translatedText.value = oldTxt;
    characterCount.textContent = `${sourceText.value.length} / 5000`;
    updateLanguageButtons(); updateBadge();
    saveValue("lumi-from-language", fromLanguage.dataset.language); saveValue("lumi-to-language", toLanguage.dataset.language);
    drawLists();
    hideSkeleton(); message.textContent = ""; message.className = "message";
    if (abortCtrl) abortCtrl.abort();
});

document.querySelector("#copy-source").addEventListener("click", () => copyText(sourceText.value));
document.querySelector("#copy-result").addEventListener("click", () => copyText(translatedText.value));
document.querySelector("#speak-source").addEventListener("click", e => speakText(sourceText.value, fromLanguage.dataset.language, e.currentTarget));
document.querySelector("#speak-result").addEventListener("click", e => speakText(translatedText.value, toLanguage.dataset.language, e.currentTarget));
document.querySelector("#listen-source").addEventListener("click", () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { message.textContent = "Голосовой ввод не поддерживается."; return; }
    const rec = new SR(); const lang = fromLanguage.dataset.language; rec.lang = lang === "kk" ? "kk-KZ" : lang;
    rec.onresult = e => { sourceText.value = e.results[0][0].transcript; characterCount.textContent = `${sourceText.value.length} / 5000`; performTranslation(); };
    rec.onerror = () => { message.textContent = "Не получилось распознать речь."; };
    rec.onstart = () => { message.textContent = "Слушаю..."; }; rec.onend = () => { if (message.textContent === "Слушаю...") message.textContent = ""; };
    rec.start();
});

themeButton.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    themeIconUse.setAttribute("href", isDark ? "#i-sun" : "#i-moon");
    try { localStorage.setItem("lumi-theme", isDark ? "dark" : "light") } catch { }
});
try {
    const saved = localStorage.getItem("lumi-theme");
    if (saved === "dark") { document.body.classList.add("dark"); themeIconUse.setAttribute("href", "#i-sun"); }
} catch { }

loadSavedLanguages(); drawLists(); performTranslation();

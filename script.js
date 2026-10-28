const languages = [
    [
        "en",
        "English"
    ],
    [
        "ru",
        "Русский"
    ],
    [
        "kk",
        "Қазақша"
    ],
    [
        "es",
        "Español"
    ],
    [
        "fr",
        "Français"
    ],
    [
        "de",
        "Deutsch"
    ],
    [
        "zh",
        "中文"
    ],
    [
        "ja",
        "日本語"
    ],
    [
        "ko",
        "한국어"
    ],
    [
        "ar",
        "العربية"
    ],
    [
        "hi",
        "हिन्दी"
    ],
    [
        "pt",
        "Português"
    ],
    [
        "it",
        "Italiano"
    ],
    [
        "tr",
        "Türkçe"
    ],
    [
        "nl",
        "Nederlands"
    ],
    [
        "pl",
        "Polski"
    ],
    [
        "uk",
        "Українська"
    ],
    [
        "sv",
        "Svenska"
    ],
    [
        "no",
        "Norsk"
    ],
    [
        "da",
        "Dansk"
    ],
    [
        "fi",
        "Suomi"
    ],
    [
        "el",
        "Ελληνικά"
    ],
    [
        "he",
        "עברית"
    ],
    [
        "id",
        "Bahasa Indonesia"
    ],
    [
        "ms",
        "Bahasa Melayu"
    ],
    [
        "th",
        "ไทย"
    ],
    [
        "vi",
        "Tiếng Việt"
    ],
    [
        "fa",
        "فارسی"
    ],
    [
        "ur",
        "اردو"
    ],
    [
        "bn",
        "বাংলা"
    ],
    [
        "ta",
        "தமிழ்"
    ],
    [
        "te",
        "తెలుగు"
    ],
    [
        "mr",
        "मराठी"
    ],
    [
        "gu",
        "ગુજરાતી"
    ],
    [
        "pa",
        "ਪੰਜਾਬੀ"
    ],
    [
        "sw",
        "Kiswahili"
    ],
    [
        "af",
        "Afrikaans"
    ],
    [
        "sq",
        "Shqip"
    ],
    [
        "am",
        "አማርኛ"
    ],
    [
        "hy",
        "Հայերեն"
    ],
    [
        "az",
        "Azərbaycan dili"
    ],
    [
        "be",
        "Беларуская"
    ],
    [
        "bg",
        "Български"
    ],
    [
        "my",
        "မြန်မာဘာသာ"
    ],
    [
        "ca",
        "Català"
    ],
    [
        "hr",
        "Hrvatski"
    ],
    [
        "cs",
        "Čeština"
    ],
    [
        "et",
        "Eesti"
    ],
    [
        "tl",
        "Filipino"
    ],
    [
        "ka",
        "ქართული"
    ],
    [
        "hu",
        "Magyar"
    ],
    [
        "is",
        "Íslenska"
    ],
    [
        "ga",
        "Gaeilge"
    ],
    [
        "kn",
        "ಕನ್ನಡ"
    ],
    [
        "km",
        "ភាសាខ្មែរ"
    ],
    [
        "lo",
        "ລາວ"
    ],
    [
        "lv",
        "Latviešu"
    ],
    [
        "lt",
        "Lietuvių"
    ],
    [
        "mk",
        "Македонски"
    ],
    [
        "ml",
        "മലയാളം"
    ],
    [
        "mn",
        "Монгол"
    ],
    [
        "ne",
        "नेपाली"
    ],
    [
        "ro",
        "Română"
    ],
    [
        "sr",
        "Српски"
    ],
    [
        "si",
        "සිංහල"
    ],
    [
        "sk",
        "Slovenčina"
    ],
    [
        "sl",
        "Slovenščina"
    ],
    [
        "uz",
        "Oʻzbek"
    ],
    [
        "yo",
        "Yorùbá"
    ],
    [
        "zu",
        "isiZulu"
    ]
];

const $ = s => document.querySelector(s);
const sourceText = $("#source-text"), translatedText = $("#translated-text"), fromLanguage = $("#from-language"), toLanguage = $("#to-language"), characterCount = $("#character-count"), resultLanguage = $("#result-language"), message = $("#message"), themeButton = $("#theme-button"), resultPanel = $("#result-panel"), languageModal = $("#language-modal"), closeLanguageButton = $("#close-language"), languageTabs = $(".language-tabs"), languageTrack = $("#language-track"), recentTab = $("#recent-tab"), allTab = $("#all-tab"), recentList = $("#recent-languages"), allList = $("#all-languages"), languageSearch = $("#language-search"), noRecent = $("#no-recent"), noResults = $("#no-results");
let pickerSide = "from", recentLanguages = ["en", "ru"], translateTimer = null, abortCtrl = null, voicesCache = [], showingAll = false;
function createRipple(e) {
    const btn = e.currentTarget; if (btn.disabled) return;
    const rect = btn.getBoundingClientRect(); const size = Math.max(rect.width, rect.height) * 2.5;
    const r = document.createElement("span"); r.className = "ripple"; r.style.width = r.style.height = size + "px";
    const x = (e.clientX || rect.left + rect.width / 2) - rect.left; const y = (e.clientY || rect.top + rect.height / 2) - rect.top;
    r.style.left = x + "px"; r.style.top = y + "px"; btn.appendChild(r); setTimeout(() => r.remove(), 700);
}
function getLanguage(c) { return languages.find(l => l[0] === c) }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function countWords(t) { return t.trim().split(/\s+/).filter(Boolean).length }
function getDelay(c) { if (c <= 0) return 0; if (c <= 3) return 2000; if (c <= 16) return 5000; return 8000 }
function showSkeleton() { resultPanel.classList.add("translating") }
function hideSkeleton() { resultPanel.classList.remove("translating") }
function updateButtons() { [fromLanguage, toLanguage].forEach(b => { const l = getLanguage(b.dataset.language); if (l) b.querySelector(".language-name").textContent = l[1] }); resultLanguage.textContent = toLanguage.dataset.language.toUpperCase() }
function loadSaved() { try { const f = localStorage.getItem("lumi-from"), t = localStorage.getItem("lumi-to"), r = localStorage.getItem("lumi-recent"); if (getLanguage(f)) fromLanguage.dataset.language = f; if (getLanguage(t)) toLanguage.dataset.language = t; if (r) { const p = JSON.parse(r); if (Array.isArray(p)) recentLanguages = p.filter((c, i) => getLanguage(c) && p.indexOf(c) === i).slice(0, 12) } } catch { } updateButtons() }
async function translateGoogle(text, from, to) { const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`; const res = await fetch(url); if (!res.ok) throw new Error("g"); const data = await res.json(); return data[0].map(x => x[0]).join("") }
async function translateMyMemory(text, from, to) { const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`; const res = await fetch(url); const d = await res.json(); if (d.responseData?.translatedText) return d.responseData.translatedText; throw new Error("m") }
async function performTranslation() {
    const raw = sourceText.value, text = raw.trim(); const from = fromLanguage.dataset.language, to = toLanguage.dataset.language;
    characterCount.textContent = `${raw.length} / 5000`;
    if (!text) { hideSkeleton(); if (from === to) translatedText.value = raw; else translatedText.value = ""; message.textContent = ""; return }
    if (from === to) { hideSkeleton(); translatedText.value = raw; return }
    const wc = countWords(text), delay = getDelay(wc); if (abortCtrl) abortCtrl.abort(); abortCtrl = new AbortController();
    showSkeleton(); await sleep(delay); if (abortCtrl.signal.aborted) return;
    try { let r = ""; try { r = await translateGoogle(text, from, to) } catch { r = await translateMyMemory(text, from, to) } translatedText.value = r; hideSkeleton(); message.textContent = ""; message.className = "message" } catch { hideSkeleton(); message.textContent = "Не удалось перевести."; message.className = "message error" }
}
const googleMap = { zh: "zh-CN", yue: "zh-CN", he: "iw", jv: "jw", tl: "tl" };
function loadVoices() { if ("speechSynthesis" in window) voicesCache = speechSynthesis.getVoices() }
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.addEventListener("voiceschanged", loadVoices) }
function getBestVoice(lang) {
    if (!voicesCache.length) loadVoices(); const base = lang.split("-")[0].toLowerCase();
    const m = voicesCache.filter(v => v.lang.toLowerCase().startsWith(base) || v.lang.toLowerCase().includes(base));
    if (!m.length) return null;
    return m.map(v => { let s = 0; const n = v.name.toLowerCase(); if (n.includes("natural")) s += 20; if (n.includes("neural")) s += 18; if (n.includes("premium")) s += 15; if (n.includes("wavenet")) s += 14; if (!n.includes("google")) s += 6; return { voice: v, score: s } }).sort((a, b) => b.score - a.score)[0].voice;
}
function isNatural(v) { return v && /natural|neural|premium|wavenet|enhanced/i.test(v.name) }
function splitChunks(t, max) { const s = t.split(/(?<=[.!?।。！？])\s+/); const ch = []; let cur = ""; for (const sen of s) { if ((cur + " " + sen).length > max) { if (cur) ch.push(cur.trim()); if (sen.length > max) ch.push(...(sen.match(new RegExp(`.{1,${max}}`, "g")) || [sen])), cur = ""; else cur = sen } else cur = cur ? cur + " " + sen : sen } if (cur) ch.push(cur.trim()); return ch.length ? ch : [t] }
let currentAudio = null;
function stopAll() { try { speechSynthesis.cancel() } catch { } if (currentAudio) { try { currentAudio.pause(); currentAudio.src = "" } catch { } currentAudio = null } }
async function speakSystem(text, lang) { return new Promise((res, rej) => { const run = () => { const voice = getBestVoice(lang); if (!voice) { rej(new Error("no voice")); return } speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.voice = voice; u.lang = voice.lang; u.rate = .95; u.onend = res; u.onerror = rej; speechSynthesis.speak(u) }; if (!voicesCache.length) { const h = () => { speechSynthesis.removeEventListener("voiceschanged", h); loadVoices(); run() }; speechSynthesis.addEventListener("voiceschanged", h); setTimeout(() => { speechSynthesis.removeEventListener("voiceschanged", h); run() }, 800) } else run() }) }
async function speakGoogleTTS(text, lang) { const tl = googleMap[lang] || lang; const chunks = splitChunks(text, 180); for (const c of chunks) { if (!c.trim()) continue; const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(c)}&tl=${tl}&client=gtx`; await new Promise((res, rej) => { const a = new Audio(url); currentAudio = a; a.onended = res; a.onerror = () => rej(new Error("tts")); a.play().catch(rej) }) } }
async function speakText(text, langCode, btn) {
    if (!text?.trim()) { message.textContent = "Нечего озвучивать."; return }
    stopAll(); btn.disabled = true; btn.classList.add("speaking");
    const lang = langCode || "en"; const best = getBestVoice(lang);
    try { if (isNatural(best)) await speakSystem(text, lang); else { try { await speakGoogleTTS(text, lang) } catch { if (best) await speakSystem(text, lang); else await speakGoogleTTS(text, "en") } } } catch { message.textContent = `Нет голоса для ${lang}.`; message.className = "message error" } finally { btn.disabled = false; btn.classList.remove("speaking"); currentAudio = null }
}
function drawList(list, codes, emptyEl) {
    list.replaceChildren(); let vis = 0; const q = languageSearch.value.trim().toLowerCase(); const sel = pickerSide === "from" ? fromLanguage.dataset.language : toLanguage.dataset.language;
    codes.forEach(code => {
        const lang = getLanguage(code); if (!lang) return;
        const searchStr = `${lang[0]} ${lang[1]}`.toLowerCase(); if (q && !searchStr.includes(q)) return;
        const b = document.createElement("button"); b.className = "language-option ripple-btn"; b.type = "button";
        if (lang[0] === sel) b.classList.add("selected"); b.dataset.language = lang[0];
        const n = document.createElement("span"); n.textContent = lang[1]; const c = document.createElement("span"); c.className = "language-option-code"; c.textContent = lang[0].toUpperCase();
        b.append(n, c); b.addEventListener("pointerdown", createRipple, { passive: true }); list.append(b); vis++;
    }); emptyEl.hidden = vis !== 0;
}
function drawLists() { drawList(recentList, recentLanguages, noRecent); drawList(allList, languages.map(l => l[0]), noResults) }
function showTab(all) { showingAll = all; languageTabs.classList.toggle("show-all", all); languageTrack.classList.toggle("show-all", all); recentTab.classList.toggle("active", !all); allTab.classList.toggle("active", all) }
function openPicker(btn) { pickerSide = btn.dataset.side; btn.setAttribute("aria-expanded", "true"); languageModal.hidden = false; document.body.style.overflow = "hidden"; languageSearch.value = ""; showTab(false); drawLists() }
function closePicker() { languageModal.hidden = true; document.body.style.overflow = ""; document.querySelector(`[data-side="${pickerSide}"]`)?.setAttribute("aria-expanded", "false") }
function chooseLanguage(code) { const sel = getLanguage(code); if (!sel) return; const btn = pickerSide === "from" ? fromLanguage : toLanguage; btn.dataset.language = sel[0]; updateButtons(); recentLanguages = [sel[0], ...recentLanguages.filter(x => x !== sel[0])].slice(0, 12); try { localStorage.setItem("lumi-from", fromLanguage.dataset.language); localStorage.setItem("lumi-to", toLanguage.dataset.language); localStorage.setItem("lumi-recent", JSON.stringify(recentLanguages)) } catch { } drawLists(); closePicker(); performTranslation() }
function copyText(t) { if (!t) { message.textContent = "Нечего копировать."; return } navigator.clipboard.writeText(t).then(() => { message.textContent = "Скопировано!"; setTimeout(() => { if (message.textContent === "Скопировано!") message.textContent = "" }, 1200) }) }
fromLanguage.addEventListener("click", () => openPicker(fromLanguage));
toLanguage.addEventListener("click", () => openPicker(toLanguage));
closeLanguageButton.addEventListener("click", closePicker);
document.querySelector(".language-shade").addEventListener("click", closePicker);
recentTab.addEventListener("click", () => showTab(false));
allTab.addEventListener("click", () => showTab(true));
languageSearch.addEventListener("input", drawLists);
document.querySelector(".language-window").addEventListener("click", e => { const b = e.target.closest(".language-option"); if (b) chooseLanguage(b.dataset.language) });
document.addEventListener("keydown", e => { if (!languageModal.hidden && e.key === "Escape") closePicker() });
sourceText.addEventListener("input", () => { characterCount.textContent = `${sourceText.value.length} / 5000`; clearTimeout(translateTimer); translateTimer = setTimeout(performTranslation, 350) });
document.querySelector("#swap-button").addEventListener("click", function () {
    const b = this; b.classList.remove("animate"); void b.offsetWidth; b.classList.add("animate"); b.addEventListener("animationend", () => b.classList.remove("animate"), { once: true });
    const oldLang = fromLanguage.dataset.language; fromLanguage.dataset.language = toLanguage.dataset.language; toLanguage.dataset.language = oldLang;
    const oldTxt = sourceText.value; sourceText.value = translatedText.value; translatedText.value = oldTxt;
    characterCount.textContent = `${sourceText.value.length} / 5000`; updateButtons(); try { localStorage.setItem("lumi-from", fromLanguage.dataset.language); localStorage.setItem("lumi-to", toLanguage.dataset.language) } catch { } hideSkeleton(); message.textContent = ""; if (abortCtrl) abortCtrl.abort();
});
document.querySelector("#copy-source").addEventListener("click", () => copyText(sourceText.value));
document.querySelector("#copy-result").addEventListener("click", () => copyText(translatedText.value));
document.querySelector("#speak-source").addEventListener("click", e => speakText(sourceText.value, fromLanguage.dataset.language, e.currentTarget));
document.querySelector("#speak-result").addEventListener("click", e => speakText(translatedText.value, toLanguage.dataset.language, e.currentTarget));
document.querySelector("#listen-source").addEventListener("click", () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { message.textContent = "Микрофон не поддерживается."; return }
    const rec = new SR(); rec.lang = fromLanguage.dataset.language; rec.onresult = e => { sourceText.value = e.results[0][0].transcript; characterCount.textContent = `${sourceText.value.length} / 5000`; performTranslation() }; rec.onerror = () => message.textContent = "Не распозналось."; rec.onstart = () => message.textContent = "Слушаю..."; rec.onend = () => { if (message.textContent === "Слушаю...") message.textContent = "" }; rec.start();
});
themeButton.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    document.querySelector("#theme-icon-use").setAttribute("href", isDark ? "#i-sun" : "#i-moon");
    try { localStorage.setItem("lumi-theme", isDark ? "dark" : "light") } catch { }
});
try { const s = localStorage.getItem("lumi-theme"); if (s === "dark") { document.body.classList.add("dark"); document.querySelector("#theme-icon-use").setAttribute("href", "#i-sun") } } catch { }
document.querySelectorAll(".ripple-btn").forEach(btn => { btn.addEventListener("pointerdown", createRipple, { passive: true }) });
loadSaved(); drawLists(); performTranslation(); translatedText.value = "Добро пожаловать в LumiTranslate";

const languages = [
    ["en", "English"], ["ru", "Русский"], ["kk", "Қазақша"], ["es", "Español"],
    ["fr", "Français"], ["de", "Deutsch"], ["zh", "中文"], ["ja", "日本語"],
    ["ko", "한국어"], ["ar", "العربية"], ["hi", "हिन्दी"], ["pt", "Português"],
    ["it", "Italiano"], ["tr", "Türkçe"], ["nl", "Nederlands"], ["pl", "Polski"],
    ["uk", "Українська"], ["sv", "Svenska"], ["no", "Norsk"], ["da", "Dansk"],
    ["fi", "Suomi"], ["el", "Ελληνικά"], ["he", "עברית"], ["id", "Bahasa Indonesia"],
    ["ms", "Bahasa Melayu"], ["th", "ไทย"], ["vi", "Tiếng Việt"], ["fa", "فارسی"],
    ["ur", "اردو"], ["bn", "বাংলা"], ["ta", "தமிழ்"], ["te", "తెలుగు"],
    ["mr", "मराठी"], ["gu", "ગુજરાતી"], ["pa", "ਪੰਜਾਬੀ"], ["sw", "Kiswahili"],
    ["af", "Afrikaans"], ["sq", "Shqip"], ["am", "አማርኛ"], ["hy", "Հայերեն"],
    ["az", "Azərbaycan dili"], ["eu", "Euskara"], ["be", "Беларуская"], ["bs", "Bosanski"],
    ["bg", "Български"], ["my", "မြန်မာဘာသာ"], ["ca", "Català"], ["ceb", "Cebuano"],
    ["hr", "Hrvatski"], ["cs", "Čeština"], ["et", "Eesti"], ["tl", "Filipino"],
    ["gl", "Galego"], ["ka", "ქართული"], ["hu", "Magyar"], ["is", "Íslenska"],
    ["ga", "Gaeilge"], ["jv", "Basa Jawa"], ["kn", "ಕನ್ನಡ"], ["km", "ភាសាខ្មែរ"],
    ["lo", "ລາວ"], ["la", "Latina"], ["lv", "Latviešu"], ["lt", "Lietuvių"],
    ["mk", "Македонски"], ["ml", "മലയാളം"], ["mn", "Монгол"], ["ne", "नेपाली"],
    ["ps", "پښتو"], ["ro", "Română"], ["sr", "Српски"], ["si", "සිංහල"],
    ["sk", "Slovenčina"], ["sl", "Slovenščina"], ["so", "Soomaali"], ["su", "Basa Sunda"],
    ["tg", "Тоҷикӣ"], ["uz", "Oʻzbek"], ["yo", "Yorùbá"], ["zu", "isiZulu"],
    ["xh", "isiXhosa"], ["ig", "Igbo"], ["ha", "Hausa"], ["or", "ଓଡ଼ିଆ"],
    ["as", "অসমীয়া"], ["sd", "سنڌي"], ["ku", "Kurdî"], ["ky", "Кыргызча"],
    ["tk", "Türkmen"], ["fo", "Føroyskt"], ["lb", "Lëtzebuergesch"], ["mt", "Malti"],
    ["eo", "Esperanto"], ["ny", "Chichewa"], ["rw", "Kinyarwanda"], ["mg", "Malagasy"],
    ["mi", "Māori"], ["sm", "Gagana Sāmoa"], ["haw", "ʻŌlelo Hawaiʻi"], ["yue", "粵語"]
];

const englishLanguageNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "language" }) : null;

const sourceText = document.querySelector("#source-text");
const translatedText = document.querySelector("#translated-text");
const fromLanguage = document.querySelector("#from-language");
const toLanguage = document.querySelector("#to-language");
const characterCount = document.querySelector("#character-count");
const resultLanguage = document.querySelector("#result-language");
const message = document.querySelector("#message");
const themeButton = document.querySelector("#theme-button");
const themeIcon = document.querySelector("#theme-icon-use");
const resultPanel = document.querySelector("#result-panel");

const languageModal = document.querySelector("#language-modal");
const languageWindow = document.querySelector(".language-window");
const languageShade = document.querySelector(".language-shade");
const closeLanguageButton = document.querySelector("#close-language");
const languageTabs = document.querySelector(".language-tabs");
const languageTrack = document.querySelector("#language-track");
const recentTab = document.querySelector("#recent-tab");
const allTab = document.querySelector("#all-tab");
const recentPanel = document.querySelector("#recent-panel");
const allPanel = document.querySelector("#all-panel");
const recentList = document.querySelector("#recent-languages");
const allList = document.querySelector("#all-languages");
const noRecent = document.querySelector("#no-recent");
const noResults = document.querySelector("#no-results");
const languageSearch = document.querySelector("#language-search");

let pickerSide = "from";
let buttonToReturnTo;
let showingAllLanguages = false;
let recentLanguages = ["en", "ru"];
let translateTimer = null;
let currentTranslateAbort = null;

// VOICE STATE
let currentAudio = null;
let voicesCache = [];

function readSaved(key) { try { return localStorage.getItem(key); } catch { return null; } }
function saveValue(key, value) { try { localStorage.setItem(key, value); } catch { } }
function getLanguage(code) { return languages.find((l) => l[0] === code); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function countWords(text) { return text.trim().split(/\s+/).filter(Boolean).length; }
function getDelayByWords(c) { if (c <= 0) return 0; if (c <= 3) return 2000; if (c <= 16) return 5000; return 8000; }

function showSkeleton() { resultPanel.classList.add("translating"); }
function hideSkeleton() { resultPanel.classList.remove("translating"); }

function loadSavedLanguages() {
    const savedFrom = readSaved("lumi-from-language");
    const savedTo = readSaved("lumi-to-language");
    const savedRecent = readSaved("lumi-recent-languages");
    if (getLanguage(savedFrom)) fromLanguage.dataset.language = savedFrom;
    if (getLanguage(savedTo)) toLanguage.dataset.language = savedTo;
    if (savedRecent) {
        try {
            const parsed = JSON.parse(savedRecent);
            if (Array.isArray(parsed)) recentLanguages = parsed.filter((code, i) => getLanguage(code) && parsed.indexOf(code) === i).slice(0, 12);
        } catch { }
    }
    if (recentLanguages.length === 0) recentLanguages = ["en", "ru"];
    updateLanguageButtons();
    updateLanguageBadge();
}
function updateLanguageButtons() {
    [fromLanguage, toLanguage].forEach((button) => {
        const lang = getLanguage(button.dataset.language);
        if (lang) button.querySelector(".language-name").textContent = lang[1];
    });
}
function updateLanguageBadge() { resultLanguage.textContent = toLanguage.dataset.language.toUpperCase(); }

// TRANSLATION
async function translateViaGoogle(text, from, to) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("google error");
    const data = await res.json();
    if (!data || !data[0]) throw new Error("bad response");
    return data[0].map(item => item[0]).join("");
}
async function translateViaMyMemory(text, from, to) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("mymemory error");
    const data = await res.json();
    if (data.responseData?.translatedText) return data.responseData.translatedText;
    throw new Error("bad mymemory");
}

async function performTranslation() {
    const raw = sourceText.value;
    const text = raw.trim();
    const fromCode = fromLanguage.dataset.language;
    const toCode = toLanguage.dataset.language;
    characterCount.textContent = `${raw.length} / 5000`;

    if (!text) { hideSkeleton(); translatedText.value = ""; message.textContent = ""; return; }
    if (fromCode === toCode) { hideSkeleton(); translatedText.value = raw; return; }

    const wordCount = countWords(text);
    const delay = getDelayByWords(wordCount);

    if (currentTranslateAbort) currentTranslateAbort.abort();
    currentTranslateAbort = new AbortController();

    showSkeleton();
    await sleep(delay);
    if (currentTranslateAbort.signal.aborted) return;

    try {
        let result = "";
        try { result = await translateViaGoogle(text, fromCode, toCode); }
        catch (e) { console.warn("Google fail", e); result = await translateViaMyMemory(text, fromCode, toCode); }
        translatedText.value = result;
        hideSkeleton();
        message.textContent = "";
    } catch (err) {
        console.error(err);
        hideSkeleton();
        message.textContent = "Не удалось перевести. Проверь интернет.";
        message.className = "message error";
    }
}

// ===== REALISTIC VOICES =====
const googleLangMap = {
    zh: "zh-CN", yue: "zh-CN", "zh-CN": "zh-CN", "zh-TW": "zh-TW",
    he: "iw", jv: "jw", fil: "tl", tl: "tl", haw: "haw",
    eo: "eo", ny: "ny", hmn: "hmn", iw: "iw", jw: "jw"
};

function loadVoices() {
    if ("speechSynthesis" in window) {
        voicesCache = window.speechSynthesis.getVoices();
    }
}
if ("speechSynthesis" in window) {
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
}

function getBestVoice(langCode) {
    if (!voicesCache.length) loadVoices();
    const base = langCode.split("-")[0].toLowerCase();
    const matching = voicesCache.filter(v => v.lang.toLowerCase().startsWith(base) || v.lang.toLowerCase().includes(base));
    if (matching.length === 0) return null;
    const scored = matching.map(v => {
        let score = 0;
        const name = v.name.toLowerCase();
        if (name.includes("natural")) score += 20;
        if (name.includes("neural")) score += 18;
        if (name.includes("premium")) score += 15;
        if (name.includes("enhanced")) score += 12;
        if (name.includes("wavenet") || name.includes("studio")) score += 14;
        if (!name.includes("google")) score += 6;
        if (v.localService) score += 4;
        if (name.includes("microsoft") && (name.includes("aria") || name.includes("jenny") || name.includes("guy") || name.includes("dmitry") || name.includes("svetlana"))) score += 10;
        if (v.default) score += 2;
        return { voice: v, score };
    }).sort((a, b) => b.score - a.score);
    return scored[0].voice;
}

function isNaturalVoice(voice) {
    if (!voice) return false;
    return /natural|neural|premium|enhanced|wavenet|studio|aria|jenny|guy|dmitry|svetlana/i.test(voice.name);
}

function splitIntoChunks(text, maxLen) {
    const sentences = text.split(/(?<=[.!?।。！？])\s+/);
    const chunks = [];
    let current = "";
    for (const s of sentences) {
        if ((current + " " + s).length > maxLen) {
            if (current) chunks.push(current.trim());
            if (s.length > maxLen) {
                const parts = s.match(new RegExp(`.{1,${maxLen}}`, "g")) || [s];
                chunks.push(...parts);
                current = "";
            } else {
                current = s;
            }
        } else {
            current = current ? current + " " + s : s;
        }
    }
    if (current) chunks.push(current.trim());
    return chunks.length ? chunks : [text];
}

function stopAllSpeech() {
    try { window.speechSynthesis.cancel(); } catch { }
    if (currentAudio) {
        try { currentAudio.pause(); currentAudio.src = ""; } catch { }
        currentAudio = null;
    }
}

async function speakViaSystem(text, langCode, button) {
    return new Promise((resolve, reject) => {
        const ensure = () => {
            const voice = getBestVoice(langCode);
            if (!voice) { reject(new Error("no voice")); return; }
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.voice = voice;
            utter.lang = voice.lang;
            utter.rate = 0.95;
            utter.pitch = 1;
            utter.volume = 1;
            utter.onend = () => resolve();
            utter.onerror = (e) => reject(e);
            window.speechSynthesis.speak(utter);
        };
        if (voicesCache.length === 0) {
            const handler = () => {
                window.speechSynthesis.removeEventListener("voiceschanged", handler);
                loadVoices();
                ensure();
            };
            window.speechSynthesis.addEventListener("voiceschanged", handler);
            setTimeout(() => {
                window.speechSynthesis.removeEventListener("voiceschanged", handler);
                ensure();
            }, 800);
        } else {
            ensure();
        }
    });
}

async function speakViaGoogleTTS(text, langCode) {
    const tl = googleLangMap[langCode] || langCode;
    const chunks = splitIntoChunks(text, 180);
    for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${tl}&client=gtx`;
        await new Promise((resolve, reject) => {
            const audio = new Audio(url);
            currentAudio = audio;
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error("google tts error"));
            audio.play().catch(reject);
        });
    }
}

async function speakText(text, langCode, button) {
    if (!text?.trim()) { message.textContent = "Пока нечего озвучивать."; return; }
    stopAllSpeech();
    button.disabled = true;
    button.classList.add("speaking");
    message.textContent = "";
    const lang = langCode || "en";
    const best = getBestVoice(lang);
    const hasNatural = isNaturalVoice(best);

    try {
        // Приоритет: если есть натуральный голос системы — используем его, он самый реальный
        if (hasNatural && best) {
            await speakViaSystem(text, lang, button);
        } else {
            // Пробуем Google TTS (реальные голоса Google)
            try {
                await speakViaGoogleTTS(text, lang);
            } catch (e) {
                console.warn("Google TTS fail, fallback to system", e);
                if (best) {
                    await speakViaSystem(text, lang, button);
                } else {
                    // последняя попытка Google с английским как fallback
                    await speakViaGoogleTTS(text, "en");
                }
            }
        }
        message.textContent = "";
    } catch (err) {
        console.error(err);
        message.textContent = `Нет голоса для ${lang}. Попробуй другой браузер (Chrome/Edge).`;
        message.className = "message error";
    } finally {
        button.disabled = false;
        button.classList.remove("speaking");
        currentAudio = null;
    }
}

// UI EVENTS
function drawLanguageList(list, codes, emptyMessage) {
    list.replaceChildren();
    let visibleCount = 0;
    const search = languageSearch.value.trim().toLocaleLowerCase();
    const selectedCode = pickerSide === "from" ? fromLanguage.dataset.language : toLanguage.dataset.language;
    codes.forEach((code) => {
        const language = getLanguage(code);
        if (!language) return;
        const englishName = englishLanguageNames?.of(language[0]) || "";
        if (search && !`${language[0]} ${language[1]} ${englishName}`.toLocaleLowerCase().includes(search)) return;
        const button = document.createElement("button");
        button.className = "language-option";
        button.type = "button";
        button.dataset.language = language[0];
        button.setAttribute("aria-pressed", String(language[0] === selectedCode));
        if (language[0] === selectedCode) button.classList.add("selected");
        const name = document.createElement("span");
        name.textContent = language[1];
        const codeLabel = document.createElement("span");
        codeLabel.className = "language-option-code";
        codeLabel.textContent = language[0];
        button.append(name, codeLabel);
        list.append(button);
        visibleCount += 1;
    });
    emptyMessage.hidden = visibleCount !== 0;
}
function drawLists() {
    drawLanguageList(recentList, recentLanguages, noRecent);
    drawLanguageList(allList, languages.map((l) => l[0]), noResults);
}
function showTab(showAll) {
    showingAllLanguages = showAll;
    languageTabs.classList.toggle("show-all", showAll);
    languageTrack.classList.toggle("show-all", showAll);
    recentTab.classList.toggle("active", !showAll);
    allTab.classList.toggle("active", showAll);
    recentTab.setAttribute("aria-selected", String(!showAll));
    allTab.setAttribute("aria-selected", String(showAll));
    recentPanel.setAttribute("aria-hidden", String(showAll));
    allPanel.setAttribute("aria-hidden", String(!showAll));
}
function openLanguagePicker(button) {
    pickerSide = button.dataset.side;
    buttonToReturnTo = button;
    button.setAttribute("aria-expanded", "true");
    languageModal.hidden = false;
    document.body.classList.add("language-open");
    languageSearch.value = "";
    showTab(false);
    closeLanguageButton.focus();
}
function closeLanguagePicker() {
    languageModal.hidden = true;
    document.body.classList.remove("language-open");
    buttonToReturnTo?.setAttribute("aria-expanded", "false");
    buttonToReturnTo?.focus();
}
function chooseLanguage(code) {
    const selected = getLanguage(code);
    if (!selected) return;
    const button = pickerSide === "from" ? fromLanguage : toLanguage;
    button.dataset.language = selected[0];
    updateLanguageButtons();
    updateLanguageBadge();
    recentLanguages = [selected[0], ...recentLanguages.filter((item) => item !== selected[0])].slice(0, 12);
    saveValue("lumi-from-language", fromLanguage.dataset.language);
    saveValue("lumi-to-language", toLanguage.dataset.language);
    saveValue("lumi-recent-languages", JSON.stringify(recentLanguages));
    drawLists();
    closeLanguagePicker();
    performTranslation();
}
function copyText(text) {
    if (!text) { message.textContent = "Сначала напиши текст."; return; }
    if (!navigator.clipboard) { message.textContent = "Копирование недоступно."; return; }
    navigator.clipboard.writeText(text).then(() => {
        message.textContent = "Скопировано!";
        setTimeout(() => { if (message.textContent === "Скопировано!") message.textContent = ""; }, 1200);
    }).catch(() => { message.textContent = "Не получилось скопировать."; });
}

fromLanguage.addEventListener("click", () => openLanguagePicker(fromLanguage));
toLanguage.addEventListener("click", () => openLanguagePicker(toLanguage));
closeLanguageButton.addEventListener("click", closeLanguagePicker);
languageShade.addEventListener("click", closeLanguagePicker);
recentTab.addEventListener("click", () => showTab(false));
allTab.addEventListener("click", () => showTab(true));
languageTabs.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        showTab(!showingAllLanguages);
        (showingAllLanguages ? allTab : recentTab).focus();
    }
});
languageSearch.addEventListener("input", drawLists);
languageWindow.addEventListener("click", (event) => {
    const btn = event.target.closest(".language-option");
    if (btn) chooseLanguage(btn.dataset.language);
});
document.addEventListener("keydown", (event) => {
    if (languageModal.hidden) return;
    if (event.key === "Escape") closeLanguagePicker();
});

sourceText.addEventListener("input", () => {
    characterCount.textContent = `${sourceText.value.length} / 5000`;
    clearTimeout(translateTimer);
    translateTimer = setTimeout(performTranslation, 400);
});

const swapButton = document.querySelector("#swap-button");
swapButton.addEventListener("click", () => {
    swapButton.classList.remove("animate");
    requestAnimationFrame(() => swapButton.classList.add("animate"));
    swapButton.addEventListener("animationend", () => swapButton.classList.remove("animate"), { once: true });
    const oldLanguage = fromLanguage.dataset.language;
    fromLanguage.dataset.language = toLanguage.dataset.language;
    toLanguage.dataset.language = oldLanguage;
    const oldText = sourceText.value;
    sourceText.value = translatedText.value;
    translatedText.value = oldText;
    characterCount.textContent = `${sourceText.value.length} / 5000`;
    updateLanguageButtons();
    updateLanguageBadge();
    saveValue("lumi-from-language", fromLanguage.dataset.language);
    saveValue("lumi-to-language", toLanguage.dataset.language);
    drawLists();
    performTranslation();
});

document.querySelector("#copy-source").addEventListener("click", () => copyText(sourceText.value));
document.querySelector("#copy-result").addEventListener("click", () => copyText(translatedText.value));
document.querySelector("#speak-source").addEventListener("click", (event) => speakText(sourceText.value, fromLanguage.dataset.language, event.currentTarget));
document.querySelector("#speak-result").addEventListener("click", (event) => speakText(translatedText.value, toLanguage.dataset.language, event.currentTarget));

document.querySelector("#listen-source").addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { message.textContent = "Голосовой ввод не поддерживается."; return; }
    const recognition = new SpeechRecognition();
    const language = fromLanguage.dataset.language;
    recognition.lang = language === "kk" ? "kk-KZ" : language;
    recognition.onresult = (event) => {
        sourceText.value = event.results[0][0].transcript;
        characterCount.textContent = `${sourceText.value.length} / 5000`;
        performTranslation();
    };
    recognition.onerror = () => { message.textContent = "Не получилось распознать речь."; };
    recognition.onstart = () => { message.textContent = "Слушаю..."; };
    recognition.onend = () => { if (message.textContent === "Слушаю...") message.textContent = ""; };
    recognition.start();
});

themeButton.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    themeButton.setAttribute("aria-label", isDark ? "Светлая тема" : "Тёмная тема");
    themeIcon.setAttribute("href", isDark ? "#i-sun" : "#i-moon");
    try { localStorage.setItem("lumi-theme", isDark ? "dark" : "light"); } catch { }
});
try {
    const savedTheme = localStorage.getItem("lumi-theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeButton.setAttribute("aria-label", "Светлая тема");
        themeIcon.setAttribute("href", "#i-sun");
    }
} catch { }

loadSavedLanguages();
drawLists();
performTranslation();

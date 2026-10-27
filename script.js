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
const englishLanguageNames = typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "language" })
    : null;

const welcomeTranslations = {
    en: "Welcome to LumiTranslate",
    ru: "Добро пожаловать в LumiTranslate",
    kk: "LumiTranslate қызметіне қош келдіңіз"
};

const sourceText = document.querySelector("#source-text");
const translatedText = document.querySelector("#translated-text");
const fromLanguage = document.querySelector("#from-language");
const toLanguage = document.querySelector("#to-language");
const characterCount = document.querySelector("#character-count");
const resultLanguage = document.querySelector("#result-language");
const message = document.querySelector("#message");
const themeButton = document.querySelector("#theme-button");
const themeIcon = document.querySelector("#theme-icon-use");

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
let isTranslating = false;

function readSaved(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}
function saveValue(key, value) {
    try { localStorage.setItem(key, value); } catch {}
}
function getLanguage(code) {
    return languages.find((l) => l[0] === code);
}
function loadSavedLanguages() {
    const savedFrom = readSaved("lumi-from-language");
    const savedTo = readSaved("lumi-to-language");
    const savedRecent = readSaved("lumi-recent-languages");
    if (getLanguage(savedFrom)) fromLanguage.dataset.language = savedFrom;
    if (getLanguage(savedTo)) toLanguage.dataset.language = savedTo;
    if (savedRecent) {
        try {
            const parsed = JSON.parse(savedRecent);
            if (Array.isArray(parsed)) {
                recentLanguages = parsed.filter((code, index) =>
                    getLanguage(code) && parsed.indexOf(code) === index
                ).slice(0, 12);
            }
        } catch {}
    }
    if (recentLanguages.length === 0) recentLanguages = ["en", "ru"];
    updateLanguageButtons();
    updateLanguageBadge();
}
function updateLanguageButtons() {
    [fromLanguage, toLanguage].forEach((button) => {
        const language = getLanguage(button.dataset.language);
        if (language) button.querySelector(".language-name").textContent = language[1];
    });
}
function updateLanguageBadge() {
    resultLanguage.textContent = toLanguage.dataset.language.toUpperCase();
}

// ===== РЕАЛЬНЫЙ ПЕРЕВОД =====
async function translateViaGoogle(text, from, to) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("google error");
    const data = await res.json();
    if (!data || !data[0]) throw new Error("bad google response");
    return data[0].map(item => item[0]).join("");
}

async function translateViaMyMemory(text, from, to) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("mymemory error");
    const data = await res.json();
    if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
    }
    throw new Error("bad mymemory response");
}

async function performTranslation() {
    const text = sourceText.value.trim();
    const fromCode = fromLanguage.dataset.language;
    const toCode = toLanguage.dataset.language;

    characterCount.textContent = `${sourceText.value.length} / 5000`;

    if (!text) {
        translatedText.value = "";
        message.textContent = "";
        return;
    }
    if (fromCode === toCode) {
        translatedText.value = sourceText.value;
        message.textContent = "";
        return;
    }

    // Быстрый путь для приветствия если есть в словаре (мгновенно)
    if (welcomeTranslations[fromCode] === text && welcomeTranslations[toCode]) {
        translatedText.value = welcomeTranslations[toCode];
        return;
    }

    if (isTranslating) return;
    isTranslating = true;
    message.textContent = "Переводим...";
    message.className = "message";

    try {
        let result = "";
        try {
            result = await translateViaGoogle(text, fromCode, toCode);
        } catch (e) {
            console.warn("Google fail, trying MyMemory", e);
            result = await translateViaMyMemory(text, fromCode, toCode);
        }
        translatedText.value = result;
        message.textContent = "";
    } catch (err) {
        console.error(err);
        message.textContent = "Не удалось перевести. Проверь интернет.";
        message.className = "message error";
    } finally {
        isTranslating = false;
    }
}

// Для совместимости со старым кодом - эта функция теперь вызывает реальный перевод
function translateWelcome() {
    clearTimeout(translateTimer);
    translateTimer = setTimeout(performTranslation, 300);
}

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
    if (recentPanel.inert !== undefined) {
        recentPanel.inert = showAll;
        allPanel.inert = !showAll;
    }
    drawLists();
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
        setTimeout(()=>{ if(message.textContent==="Скопировано!") message.textContent=""; },1200);
    }).catch((error) => {
        console.error(error);
        message.textContent = "Не получилось скопировать.";
    });
}
function speakText(text, language, button) {
    if (!text) { message.textContent = "Пока нечего озвучивать."; return; }
    if (!("speechSynthesis" in window)) {
        message.textContent = "В этом браузере нет озвучивания. Попробуй Chrome.";
        return;
    }
    button.disabled = true;
    message.textContent = "";
    let voiceStarted = false;
    const speakWithAvailableVoice = () => {
        if (voiceStarted) return;
        voiceStarted = true;
        const languageCode = language === "kk" ? "kk-KZ" : language;
        const voices = window.speechSynthesis.getVoices();
        const matchingVoices = voices.filter((voice) =>
            voice.lang.toLowerCase().startsWith(languageCode.toLowerCase().split("-")[0])
        );
        const voice = matchingVoices.find((item) =>
            /natural|neural/i.test(item.name) && !/google/i.test(item.name)
        ) || matchingVoices.find((item) => !/google/i.test(item.name)) || matchingVoices[0];

        if (!voice) {
            message.textContent = `На устройстве нет голоса для ${languageCode}.`;
            button.disabled = false;
            return;
        }
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(text);
        speech.voice = voice;
        speech.lang = voice.lang;
        speech.onend = () => { button.disabled = false; };
        speech.onerror = () => {
            message.textContent = "Не получилось озвучить.";
            button.disabled = false;
        };
        window.speechSynthesis.speak(speech);
    };
    if (window.speechSynthesis.getVoices().length > 0) {
        speakWithAvailableVoice();
    } else {
        window.speechSynthesis.addEventListener("voiceschanged", speakWithAvailableVoice, { once: true });
        window.setTimeout(() => {
            if (button.disabled) {
                window.speechSynthesis.removeEventListener("voiceschanged", speakWithAvailableVoice);
                speakWithAvailableVoice();
            }
        }, 1000);
    }
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
    const languageButton = event.target.closest(".language-option");
    if (languageButton) chooseLanguage(languageButton.dataset.language);
});
document.addEventListener("keydown", (event) => {
    if (languageModal.hidden) return;
    if (event.key === "Escape") closeLanguagePicker();
    if (event.key === "Tab") {
        const focusable = [...languageWindow.querySelectorAll("button, input")].filter((el) => !el.disabled);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
        }
    }
});

sourceText.addEventListener("input", () => {
    characterCount.textContent = `${sourceText.value.length} / 5000`;
    clearTimeout(translateTimer);
    translateTimer = setTimeout(performTranslation, 350);
});

const swapButton = document.querySelector("#swap-button");
swapButton.addEventListener("click", () => {
    swapButton.classList.remove("animate");
    requestAnimationFrame(() => swapButton.classList.add("animate"));
    swapButton.addEventListener("animationend", () => swapButton.classList.remove("animate"), { once: true });
    
    // Меняем языки
    const oldLanguage = fromLanguage.dataset.language;
    fromLanguage.dataset.language = toLanguage.dataset.language;
    toLanguage.dataset.language = oldLanguage;
    
    // Просто меняем тексты местами БЕЗ нового перевода
    const oldText = sourceText.value;
    sourceText.value = translatedText.value;
    translatedText.value = oldText;
    
    characterCount.textContent = `${sourceText.value.length} / 5000`;
    updateLanguageButtons();
    updateLanguageBadge();
    saveValue("lumi-from-language", fromLanguage.dataset.language);
    saveValue("lumi-to-language", toLanguage.dataset.language);
    drawLists();
    
    // Убираем скелетон, не вызываем performTranslation
    hideSkeleton();
    message.textContent = "";
    message.className = "message";
    
    // Отменяем любой текущий перевод в процессе
    if (currentTranslateAbort) {
        currentTranslateAbort.abort();
    }
});

document.querySelector("#copy-source").addEventListener("click", () => copyText(sourceText.value));
document.querySelector("#copy-result").addEventListener("click", () => copyText(translatedText.value));
document.querySelector("#speak-source").addEventListener("click", (event) =>
    speakText(sourceText.value, fromLanguage.dataset.language, event.currentTarget));
document.querySelector("#speak-result").addEventListener("click", (event) =>
    speakText(translatedText.value, toLanguage.dataset.language, event.currentTarget));

document.querySelector("#listen-source").addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        message.textContent = "Голосовой ввод не поддерживается в этом браузере.";
        return;
    }
    const recognition = new SpeechRecognition();
    const language = fromLanguage.dataset.language;
    recognition.lang = language === "kk" ? "kk-KZ" : language;
    recognition.onresult = (event) => {
        sourceText.value = event.results[0][0].transcript;
        characterCount.textContent = `${sourceText.value.length} / 5000`;
        performTranslation();
    };
    recognition.onerror = (event) => {
        console.error(event.error);
        message.textContent = "Не получилось распознать речь.";
    };
    recognition.onstart = () => { message.textContent = "Слушаю..."; };
    recognition.onend = () => { if(message.textContent==="Слушаю...") message.textContent=""; };
    recognition.start();
});

themeButton.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    themeButton.setAttribute("aria-label", isDark ? "Включить светлую тему" : "Включить тёмную тему");
    themeIcon.setAttribute("href", isDark ? "#i-sun" : "#i-moon");
    try { localStorage.setItem("lumi-theme", isDark ? "dark" : "light"); } catch {}
});

// Restore theme
try {
    const savedTheme = localStorage.getItem("lumi-theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeButton.setAttribute("aria-label", "Включить светлую тему");
        themeIcon.setAttribute("href", "#i-sun");
    }
} catch {}

loadSavedLanguages();
drawLists();
performTranslation();

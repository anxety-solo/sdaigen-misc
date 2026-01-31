const log = createLogger('timer');

// ===== Translations =====
const TRANSLATIONS = {
    en: {
        connecting: 'Connecting...',
        refreshTooltip: 'Click to refresh.',
        muteTooltip: 'Currently not-muted. Click to mute.',
        unmuteTooltip: 'Currently muted. Click to unmute.',
        blurTooltip: 'Toggle NSFW Blur. Click to blur.',
        unblurTooltip: 'Toggle NSFW Blur. Click to unblur.',
        civitaiTooltip: 'Go to CivitAI.',
        pinggyMessage: 'Recreate the Pinggy tunnel!',
        error: 'Error: '
    },
    ru: {
        connecting: 'Подключение...',
        refreshTooltip: 'Нажмите, чтобы обновить.',
        muteTooltip: 'Звук включен. Нажмите, чтобы отключить.',
        unmuteTooltip: 'Звук отключен. Нажмите, чтобы включить.',
        blurTooltip: 'Переключить размытие NSFW. Нажмите, чтобы размыть.',
        unblurTooltip: 'Переключить размытие NSFW. Нажмите, чтобы убрать размытие.',
        civitaiTooltip: 'Перейти на CivitAI.',
        pinggyMessage: 'Пересоздайте туннель Pinggy!',
        error: 'Ошибка: '
    }
};

// Detect User Language
const lang = (navigator.language || navigator.userLanguage).split('-')[0];
const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

// ===== Constants =====
const BASEPATH = document.currentScript.src.split('file=')[1].split('/').slice(0, 2).join('/');
const ICONS = {
    CLOCK: `file=${BASEPATH}/__files__/icon/clock.svg`,
    ALARM_BELL: `file=${BASEPATH}/__files__/icon/alarm-bell.svg`,
    ALARM_BELL_CANCELLED: `file=${BASEPATH}/__files__/icon/alarm-bell-cancelled.svg`,
    EYE: `file=${BASEPATH}/__files__/icon/eye.svg`,
    EYE_CANCELLED: `file=${BASEPATH}/__files__/icon/eye-cancelled.svg`,
    CIVITAI: `file=${BASEPATH}/__files__/icon/CivitAi_Icon.svg`,
};
const CIVITAI_URL = 'https://civitai.com/models';
const TIMER_FILES = {
    DEFAULT: 'file=static/timer.txt',
    PINGGY: 'file=static/timer-pinggy.txt'
};

// Timer class
class Timer {
    constructor(element) {
        this.element = element;
        this.startTime = null;
        this.timeout = null;
        this._isPinggy = null; // Cached Pinggy status
    }

    get isPinggy() {
        if (this._isPinggy === null) {
            this._isPinggy = window.location.href.includes('a.free.pinggy.link');
            log(`Pinggy tunnel detected: ${this._isPinggy}`);
        }
        return this._isPinggy;
    }

    start() {
        this.refresh();
    }

    update() {
        const now = Date.now() / 1000;
        let timeLeft = this.isPinggy ? this.startTime - now : now - this.startTime;

        if (this.isPinggy && timeLeft <= 0) {
            this.stop();
            this.element.innerText = t.pinggyMessage;
            return;
        }

        const formattedTime = this.formatTime(timeLeft);
        this.element.innerText = formattedTime;

        this.timeout = setTimeout(() => this.update(), 1000);
    }

    formatTime(timeLeft) {
        const hours = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((timeLeft / 60) % 60)).padStart(2, '0');
        const seconds = String(Math.floor(timeLeft % 60)).padStart(2, '0');

        return this.isPinggy ? `${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`;
    }

    async refresh() {
        clearTimeout(this.timeout);
        this.element.innerText = t.connecting;

        const timerFile = this.isPinggy ? TIMER_FILES.PINGGY : TIMER_FILES.DEFAULT;

        try {
            const response = await fetch(timerFile);
            if (!response.ok) {
                throw new Error(`Error fetching timer: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            this.startTime = parseInt(text);

            if (isNaN(this.startTime)) {
                throw new Error('Invalid timer value: NaN');
            }

            this.update();
        } catch (error) {
            log.error(`Error refreshing timer: ${error.message}`);
            this.element.innerText = t.error + error.message;
        }
    }

    stop() {
        clearTimeout(this.timeout);
    }
}

// Helper function for creating elements
function createElement(tag, className, attributes = {}, children = []) {
    const element = document.createElement(tag);
    element.className = className;
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    children.forEach(child => element.appendChild(child));
    return element;
}

// Audio element detection
let cachedAudioElement = null;

function findAudioElement() {
    // Return cached element if already found
    if (cachedAudioElement) {
        return cachedAudioElement;
    }

    // Gradio 3.x
    const legacyAudio = gradioApp().querySelector('#audio_notification > audio');
    if (legacyAudio) {
        cachedAudioElement = legacyAudio;
        log('Found legacy audio element (Gradio 3.x)');
        return legacyAudio;
    }

    // Gradio 4.x
    const audioBlock = gradioApp().querySelector('#audio_notification');
    if (audioBlock) {
        // Find download link to get audio URL
        const downloadLink = audioBlock.querySelector('a[download]');

        if (downloadLink) {
            log('Found audio download link in Gradio 4.x structure');

            let audioUrl = downloadLink.getAttribute('href');

            // Fix local URL for tunnels (127.0.0.1 or localhost)
            if (audioUrl.includes('127.0.0.1') || audioUrl.includes('localhost')) {
                const originalUrl = audioUrl;
                audioUrl = audioUrl.replace(/http:\/\/(127\.0\.0\.1|localhost):\d+/, window.location.origin);
                log(`Fixed audio URL: ${originalUrl} → ${audioUrl}`);
            }

            // Create real audio element
            const audio = new Audio(audioUrl);
            audio.preload = 'auto';

            cachedAudioElement = audio;
            log('Created audio element with URL:', audioUrl);
            return audio;
        }
    }

    log.error('Audio element not found in DOM structure');
    return null;
}

// Toggle functions
function toggleNotification(button, image) {
    const audio = findAudioElement();
    if (!audio) {
        log.warn('No audio element found for notification toggle');
        return;
    }

    // Toggle muted state
    const newMutedState = !audio.muted;
    audio.muted = newMutedState;

    log(`Audio ${newMutedState ? 'muted' : 'unmuted'}`);

    // Reset and play/pause audio
    audio.currentTime = 0;
    if (newMutedState) {
        audio.pause();
    } else {
        audio.play().catch(e => log.error(`Playback error: ${e.message}`));
    }

    button.title = newMutedState ? t.unmuteTooltip : t.muteTooltip;
    button.style.borderColor = newMutedState ? '#FF005D' : '#00FF8C';
    button.style.backgroundColor = newMutedState ? '#FF005D1A' : '#00FF8C1A';
    image.src = newMutedState ? ICONS.ALARM_BELL_CANCELLED : ICONS.ALARM_BELL;
}

function resetAudioCache() {
    if (cachedAudioElement) {
        cachedAudioElement.pause();
        cachedAudioElement = null;
        log('Audio cache reset');
    }
}

// Call reset on UI updates if audio block changed
onUiUpdate(() => {
    const audioBlock = gradioApp().querySelector('#audio_notification');
    if (!audioBlock && cachedAudioElement) {
        resetAudioCache();
    }
});

function toggleNSFWBlur(button, image) {
    const t2iGallery = gradioApp().querySelector('#txt2img_gallery_container');
    const i2iGallery = gradioApp().querySelector('#img2img_gallery_container');

    if (!t2iGallery || !i2iGallery) {
        log.warn('Gallery containers not found for NSFW blur toggle');
        return;
    }

    const isBlurred = button.classList.toggle('nsfw_blurred');

    button.title = isBlurred ? t.unblurTooltip : t.blurTooltip;
    button.style.borderColor = isBlurred ? '#FF005D' : '#00FF8C';
    button.style.backgroundColor = isBlurred ? '#FF005D1A' : '#00FF8C1A';
    image.src = isBlurred ? ICONS.EYE_CANCELLED : ICONS.EYE;

    [t2iGallery, i2iGallery].forEach(gallery => gallery.classList.toggle('anxety-blur', isBlurred));
}

// Main function
function createTimer() {
    const app = gradioApp();
    const quickSettings = app.querySelector('#quicksettings');

    if (!quickSettings) {
        log.error('Quick settings element not found');
        return;
    }

    // Create main div
    const mainDiv = createElement('div', 'anxety-timer justify-start', {
        style: 'box-sizing: border-box; display: flex; gap: 6px; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; margin-block: -8px; align-items: center;'
    });

    // Timer
    const timerDiv = createElement('div', 'gr-box', {
        style: 'box-sizing: border-box; display: flex; gap: 0.3rem; align-items: center; padding: 3px 5px; border: solid 1px #00FFFF; border-radius: 10px; background-color: #00FFFF1A !important; cursor: pointer;',
        title: t.refreshTooltip
    });
    const timerImage = createElement('img', '', { src: ICONS.CLOCK, width: 24 });
    const timerElement = createElement('div', '', {
        style: 'font-family: monospace; color: #00FFFF; text-align: center; flex-grow: 1;',
        textContent: t.connecting
    });
    timerDiv.append(timerImage, timerElement);
    const timer = new Timer(timerElement);
    timerDiv.addEventListener('click', () => timer.refresh());
    mainDiv.appendChild(timerDiv);

    // Audio notification
    const audioDiv = createElement('div', 'gr-box', {
        style: 'transition: all 0.15s ease; box-sizing: border-box; display: flex; align-items: center; padding: 5px; border: solid 1px #00FF8C; border-radius: 10px; background-color: #00FF8C1A !important; cursor: pointer;',
        title: t.muteTooltip
    });
    const audioImage = createElement('img', '', { src: ICONS.ALARM_BELL, width: 20 });
    audioDiv.appendChild(audioImage);
    audioDiv.addEventListener('click', () => toggleNotification(audioDiv, audioImage));
    mainDiv.appendChild(audioDiv);

    // NSFW Blur
    const nsfwDiv = createElement('div', 'gr-box', {
        style: 'transition: all 0.15s ease; box-sizing: border-box; display: flex; align-items: center; padding: 5px; border: solid 1px #00FF8C; border-radius: 10px; background-color: #00FF8C1A !important; cursor: pointer;',
        title: t.blurTooltip
    });
    const nsfwImage = createElement('img', '', { src: ICONS.EYE, width: 20 });
    nsfwDiv.appendChild(nsfwImage);
    nsfwDiv.addEventListener('click', () => toggleNSFWBlur(nsfwDiv, nsfwImage));
    mainDiv.appendChild(nsfwDiv);

    // CivitAI link
    const civitDiv = createElement('div', 'gr-box', {
        style: 'box-sizing: border-box; display: flex; align-items: center; padding: 5px; border: solid 1px #3399FF; border-radius: 10px; background-color: #3399FF1A !important; cursor: pointer;',
        title: t.civitaiTooltip
    });
    const civitImage = createElement('img', '', { src: ICONS.CIVITAI, width: 20 });
    civitDiv.appendChild(civitImage);
    civitDiv.addEventListener('click', () => window.open(CIVITAI_URL, '_blank'));
    mainDiv.appendChild(civitDiv);

    // Start the timer
    timer.start();

    // Inject blur CSS
    if (!document.getElementById('nsfw-blur-css')) {
        const style = document.createElement('style');
        style.id = 'nsfw-blur-css';
        style.innerHTML = `
            .anxety-blur img {
                filter: blur(15px) grayscale(1) brightness(0.3);
                transition: filter 0.2s ease;
            }
            .anxety-blur img:hover {
                filter: blur(0px) grayscale(0) brightness(1);
            }
        `;
        document.head.appendChild(style);
    }

    // INIT
    quickSettings.parentNode.insertBefore(mainDiv, quickSettings.nextSibling);
    log('Timer UI initialized successfully');
}

onUiLoaded(createTimer);
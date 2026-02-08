(function() {
    // 'use strict';

    const log = createLogger('asl');

    // ===== CONFIG =====
    const CONFIG = {
        DEBUG: false,
        STAR_COUNT: 125,
        TIMEOUT: 90000,
        COMPLETION_CHECK: 'txt2img_token_counter',
        NEKO_EMOJIS: ['≽^•⩊•^≼', '=^･ω･^=', '=^･ｪ･^=', 'ฅ^•ﻌ•^ฅ', '(=ↀωↀ=)', '( =ω=)...', 'ᗜ⩊ᗜ'],
        STAGES: [
            { selector: null, progress: 25, status: 'DOM ready...' },
            { selector: '#gradio-app, gradio-app', progress: 55, status: 'Loading Gradio...' },
            { selector: '#txt2img_token_counter', progress: 85, status: 'Almost ready...' }
        ],
        INTERVALS: {
            progress: 10,
            check: 50
        },
        SIMULATION: {
            INCREMENT_MIN: 2,
            INCREMENT_MAX: 5,
            INTERVAL_MIN: 500,
            INTERVAL_MAX: 2500
        }
    };

    const logDebug = (...args) => CONFIG.DEBUG && log(...args);

    // ===== STYLES =====
    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Rounded+Mplus+1c&family=M+PLUS+Rounded+1c&display=swap');

        #als-loader {
            inset: 0;
            position: fixed;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Rounded Mplus 1c', 'M PLUS Rounded 1c', sans-serif;
            background: color-mix(in srgb, var(--background-fill-primary, #0b0b0b), transparent);
            backdrop-filter: blur(10px);
            user-select: none;
            overflow: hidden;
            z-index: 999999;
            transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #als-loader.als-fade-out {
            opacity: 0;
            pointer-events: none;
        }

        .als-carbon-bg {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image:
                linear-gradient(45deg, var(--border-color-primary, #22282a) 25%, transparent 25%),
                linear-gradient(-45deg, var(--border-color-primary, #22282a) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, var(--border-color-primary, #22282a) 75%),
                linear-gradient(-45deg, transparent 75%, var(--border-color-primary, #22282a) 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            opacity: 0.1;
        }

        .als-stars {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        .als-star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: var(--color-accent, #db88ae);
            border-radius: 50%;
            opacity: 0.3;
            animation: als-twinkle 3s infinite ease-in-out;
        }

        @keyframes als-twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1) translate(0) }
            25% { opacity: 0.6; transform: scale(1.3) translate(5px,-5px) }
            50% { opacity: 1; transform: scale(1.5) translate(0) }
            75% { opacity: 0.6; transform: scale(1.3) translate(-5px,5px) }
        }

        .als-card {
            position: relative;
            display: flex;
            flex-direction: column;
            width: min(480px, calc(100vw - 32px));
            max-width: 480px;
            margin: 16px;
            padding: clamp(28px, 5vw, 44px) clamp(24px, 4vw, 36px);
            background: var(--background-fill-secondary, #131313);
            border: 2px solid var(--border-color-primary, #22282a);
            border-radius: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 1;
        }

        .als-card-header { flex-shrink: 0; }

        .als-card-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: clamp(20px, 4vw, 28px);
        }

        .als-card-footer { flex-shrink: 0; }

        .als-card.als-fade-in {
            animation: als-card-fade-in 0.8s cubic-bezier(0.35, 1.55, 0.65, 1) forwards;
        }
        .als-card.als-fade-out {
            animation: als-card-fade-out 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes als-card-fade-in {
            from { opacity: 0; transform: translateY(40px) scale(0.9) }
            to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes als-card-fade-out {
            from { opacity: 1; transform: translateY(0) }
            to   { opacity: 0; transform: translateY(30px) }
        }

        .als-logo-section {
            text-align: center;
        }

        .als-logo-text {
            color: var(--color-accent, #db88ae);
            font-size: clamp(36px, 8vw, 48px);
            font-weight: 800;
            letter-spacing: 3px;
            margin-bottom: 8px;
        }

        .als-subtitle {
            color: var(--body-text-color-subdued, #939a9c);
            font-size: clamp(11px, 2vw, 13px);
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .als-neko-container {
            display: flex;
            justify-content: center;
        }

        .als-neko {
            color: #ffffff;
            font-size: clamp(48px, 10vw, 72px);
            filter: drop-shadow(0 4px 8px rgba(220, 135, 175, 0.2));
            transform: translateY(4px);
            animation: als-neko-float 2s ease-in-out infinite;
        }

        @keyframes als-neko-float {
            0%, 100% { transform: translateY(4px); }
            50% { transform: translateY(-4px); }
        }

        .als-spinner-wrapper {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            height: clamp(50px, 10vw, 60px);
        }

        .als-spinner {
            position: absolute;
            width: clamp(50px, 10vw, 60px);
            height: clamp(50px, 10vw, 60px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .als-spinner.als-hide {
            opacity: 0;
            transform: scale(0.5);
        }

        .als-checkmark {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            width: clamp(50px, 10vw, 60px);
            height: clamp(50px, 10vw, 60px);
            color: #ffffff;
            font-size: clamp(40px, 8vw, 50px);
            opacity: 0;
            transform: scale(0.5);
            transition: opacity 0.3s ease 0.3s, transform 0.3s ease 0.3s;
        }
        .als-checkmark.als-show {
            opacity: 1;
            transform: scale(1);
        }
        .als-checkmark.als-timeout {
            color: #e05555;
        }

        .als-spinner-circle {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 4px solid transparent;
            border-radius: 50%;
            border-top-color: var(--color-accent, #db88ae);
            border-right-color: var(--color-accent, #db88ae);
            animation: als-spin 1.2s cubic-bezier(0.70, -0.55, 0.265, 1.55) infinite;
        }
        .als-spinner-circle:nth-child(2) {
            animation-delay: 0.15s;
            opacity: 0.6;
            transform: scale(0.8);
        }
        .als-spinner-circle:nth-child(3) {
            animation-delay: 0.3s;
            opacity: 0.3;
            transform: scale(0.6);
        }

        @keyframes als-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }

        .als-progress-bg {
            position: relative;
            width: 100%;
            height: 10px;
            background: var(--input-background-fill, #171717);
            border: 1px solid var(--border-color-primary, #22282a);
            border-radius: 20px;
            overflow: hidden;
        }

        .als-progress-bar {
            position: relative;
            width: 0%;
            height: 100%;
            background: var(--color-accent, #db88ae);
            border-radius: 20px;
            box-shadow: 0 0 12px var(--color-accent, #db88ae);
            overflow: hidden;
            transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .als-progress-bar::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.5) 50%,
                transparent 100%);
            animation: als-shimmer 1.5s infinite;
        }

        @keyframes als-shimmer {
            from { transform: translateX(-100%); }
            to   { transform: translateX(100%); }
        }

        .als-progress-info {
            display: flex;
            justify-content: space-between;
            font-size: clamp(12px, 2vw, 13px);
            margin-top: 10px;
        }

        .als-progress-label {
            color: var(--body-text-color-subdued, #939a9c);
            font-weight: 700;
        }

        .als-progress-value {
            color: var(--color-accent, #db88ae);
            font-weight: 800;
        }

        .als-status {
            text-align: center;
            color: var(--body-text-color-subdued, #939a9c);
            font-size: clamp(13px, 2vw, 14px);
            font-weight: 700;
            min-height: 22px;
            margin-bottom: clamp(12px, 2vw, 16px);
        }
        .als-status.als-timeout {
            color: #e05555;
        }

        .als-kawaii-dots {
            display: flex;
            justify-content: center;
            gap: 6px;
        }

        .als-dot {
            width: 10px;
            height: 10px;
            background: var(--color-accent, #db88ae);
            border-radius: 50%;
            animation: als-dot-bounce 1.4s infinite ease-in-out;
        }
        .als-dot:nth-child(1) { animation-delay: 0s; }
        .als-dot:nth-child(2) { animation-delay: 0.2s; }
        .als-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes als-dot-bounce {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1.2); opacity: 1; }
        }
    `;

    // ===== HTML TEMPLATE =====
    const HTML_TEMPLATE = `
        <div class="als-carbon-bg"></div>
        <div class="als-stars" id="als-stars"></div>
        <div class="als-card als-fade-in">
            <div class="als-card-header">
                <div class="als-logo-section">
                    <div class="als-logo-text">~ ANXETY ~</div>
                    <div class="als-subtitle">Stable Diffusion WebUI</div>
                </div>
            </div>
            <div class="als-card-content">
                <div class="als-neko-container">
                    <div class="als-neko" id="als-neko"></div>
                </div>
                <div class="als-spinner-wrapper">
                    <div class="als-spinner" id="als-spinner">
                        <div class="als-spinner-circle"></div>
                        <div class="als-spinner-circle"></div>
                        <div class="als-spinner-circle"></div>
                    </div>
                    <div class="als-checkmark" id="als-checkmark"></div>
                </div>
                <div class="als-progress-section">
                    <div class="als-progress-bg">
                        <div class="als-progress-bar" id="als-progress-bar"></div>
                    </div>
                    <div class="als-progress-info">
                        <span class="als-progress-label">Loading WebUI</span>
                        <span class="als-progress-value" id="als-progress-percent">0%</span>
                    </div>
                </div>
            </div>
            <div class="als-card-footer">
                <div class="als-status" id="als-status">Initializing...</div>
                <div class="als-kawaii-dots">
                    <div class="als-dot"></div>
                    <div class="als-dot"></div>
                    <div class="als-dot"></div>
                </div>
            </div>
        </div>
    `;

    // ===== UTILITIES =====
    const Utils = {
        randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        randomItem: arr => arr[Utils.randomInt(0, arr.length - 1)],
        createElement: (tag, attrs = {}) => Object.assign(document.createElement(tag), attrs),
        // Extracts filename from URL for error reporting
        loadScript: src => new Promise((resolve) => {
            if (window.anime) return resolve();
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => { log.warn(`Failed to load ${src.split('/').pop()}`); resolve(); };
            document.head.appendChild(script);
        })
    };

    // ===== LOADER =====
    class AnxetyLoadingScreen {
        constructor() {
            this.container = null;
            this.elements = {};
            this.state = { current: 0, target: 0, active: true, currentStage: -1 };
            this.timers = { progress: null, check: null, timeout: null, simulation: null };
            this.observers = [];
        }

        async init() {
            if (document.getElementById(CONFIG.COMPLETION_CHECK)) {
                return logDebug('UI already loaded');
            }

            await Utils.loadScript('https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js');
            this.injectStyles();
            this.createContainer();
            this.createStars();
            this.setRandomNeko();
            this.cacheElements();
            this.animateEntrance();
            this.startProgressTracking();
            this.startSimulation();
            this.watchForCompletion();
        }

        injectStyles() {
            document.head.appendChild(Utils.createElement('style', { textContent: CSS }));
        }

        createContainer() {
            this.container = Utils.createElement('div', { id: 'als-loader', innerHTML: HTML_TEMPLATE });
            document.body.insertBefore(this.container, document.body.firstChild);
        }

        createStars() {
            const wrap = this.container.querySelector('#als-stars');
            for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
                const star = Utils.createElement('div', { className: 'als-star' });
                Object.assign(star.style, {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                });
                wrap.appendChild(star);
            }
        }

        setRandomNeko() {
            this.container.querySelector('#als-neko').textContent = Utils.randomItem(CONFIG.NEKO_EMOJIS);
        }

        animateEntrance() {
            if (!window.anime) return;
            anime({
                targets: '.als-neko',
                opacity: [0, 1],
                scale: [0, 1],
                rotate: [-20, 0],
                duration: 600,
                delay: 300,
                easing: 'easeOutBack'
            });
        }

        cacheElements() {
            ['progressBar', 'progressPercent', 'status', 'spinner', 'checkmark'].forEach(id => {
                this.elements[id] = document.getElementById(`als-${id.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            });
            this.elements.card = this.container.querySelector('.als-card');
        }

        // Returns max progress allowed before the next real stage fires
        _getSimulationCeiling() {
            const next = this.state.currentStage + 1;
            return next < CONFIG.STAGES.length ? CONFIG.STAGES[next].progress - 1 : 99;
        }

        // Randomly bumps target within the current stage ceiling
        startSimulation() {
            const { INCREMENT_MIN, INCREMENT_MAX, INTERVAL_MIN, INTERVAL_MAX } = CONFIG.SIMULATION;

            const tick = () => {
                if (!this.state.active) return;

                const ceiling = this._getSimulationCeiling();
                if (this.state.target < ceiling) {
                    this.state.target = Math.min(ceiling, this.state.target + Utils.randomInt(INCREMENT_MIN, INCREMENT_MAX));
                    logDebug(`Sim tick: target → ${this.state.target} (ceiling: ${ceiling})`);
                }

                this.timers.simulation = setTimeout(tick, Utils.randomInt(INTERVAL_MIN, INTERVAL_MAX));
            };

            this.timers.simulation = setTimeout(tick, Utils.randomInt(INTERVAL_MIN, INTERVAL_MAX));
        }

        // Smoothly interpolates current toward target every frame tick
        startProgressTracking() {
            this.timers.progress = setInterval(() => {
                if (!this.state.active) return clearInterval(this.timers.progress);

                if (this.state.current < this.state.target) {
                    const diff = this.state.target - this.state.current;
                    this.state.current = Math.min(this.state.target, this.state.current + Math.max(0.3, diff * 0.05));
                    this.updateProgressBar();
                }
            }, CONFIG.INTERVALS.progress);

            this.checkLoadingState();
        }

        // Polls DOM for stage selectors and advances accordingly
        checkLoadingState() {
            this.timers.check = setInterval(() => {
                if (!this.state.active) return this.clearTimer('check');

                // Stage 0: DOM Ready
                if (this.state.currentStage < 0 && document.readyState !== 'loading') {
                    this.setStage(0);
                }
                // Stage 1: Gradio App Found
                if (this.state.currentStage === 0 && document.querySelector(CONFIG.STAGES[1].selector)) {
                    this.setStage(1);
                }
                // Stage 2 advances progress but does NOT complete — visibility check handles that
                if (this.state.currentStage === 1 && document.getElementById(CONFIG.COMPLETION_CHECK)) {
                    this.setStage(2);
                    this.clearTimer('check');
                }
            }, CONFIG.INTERVALS.check);
        }

        setStage(index) {
            const stage = CONFIG.STAGES[index];
            this.state.currentStage = index;
            this.state.target = stage.progress;
            this.elements.status.textContent = stage.status;
            logDebug(`Stage ${index + 1}: ${stage.status} (${stage.progress}%)`);
        }

        updateProgressBar() {
            const progress = Math.min(100, Math.round(this.state.current));
            this.elements.progressBar.style.width = `${progress}%`;
            this.elements.progressPercent.textContent = `${progress}%`;
        }

        // True only when element is laid out and at least partially in the viewport
        _isElementVisible(el) {
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return (r.width || r.height) &&
                r.top < window.innerHeight && r.bottom > 0 &&
                r.left < window.innerWidth && r.right > 0;
        }

        // Waits for the completion element to actually appear on screen, then completes
        watchForCompletion() {
            let handled = false;

            const attemptComplete = () => {
                if (handled || !this.state.active) return;

                const el = document.getElementById(CONFIG.COMPLETION_CHECK);
                if (!el) return;

                if (this._isElementVisible(el)) {
                    handled = true;
                    this.complete();
                } else {
                    requestAnimationFrame(attemptComplete);
                }
            };

            const observer = new MutationObserver(() => {
                if (document.getElementById(CONFIG.COMPLETION_CHECK)) {
                    observer.disconnect();
                    attemptComplete();
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            this.observers.push(observer);

            // Element may already exist before observer attaches
            if (document.getElementById(CONFIG.COMPLETION_CHECK)) {
                observer.disconnect();
                attemptComplete();
            }

            // Force completion on timeout
            this.timers.timeout = setTimeout(() => {
                if (this.state.active) {
                    log.warn('Timeout reached, forcing completion');
                    handled = true;
                    observer.disconnect();
                    this.complete('timeout');
                }
            }, CONFIG.TIMEOUT);
        }

        // reason: 'success' (default) | 'timeout'
        complete(reason = 'success') {
            if (!this.state.active) return;
            this.state.active = false;
            this.state.target = 100;
            this.state.current = 100;

            Object.keys(this.timers).forEach(key => this.clearTimer(key));
            this.observers.forEach(obs => obs.disconnect());
            this.observers = [];

            this.updateProgressBar();
            this.elements.spinner?.classList.add('als-hide');

            if (reason === 'timeout') {
                this.elements.checkmark?.classList.add('als-timeout', 'als-show');
                this.elements.checkmark.textContent = '✗';
                this.elements.status?.classList.add('als-timeout');
                this.elements.status.textContent = 'Timed out...';
            } else {
                this.elements.checkmark?.classList.add('als-show');
                this.elements.checkmark.textContent = '✓';
                this.elements.status.textContent = `Ready! ${Utils.randomItem(CONFIG.NEKO_EMOJIS)}`;
            }

            log(`UI complete: ${reason}`);

            // Wait for checkmark to be seen, then fade out and remove
            setTimeout(() => {
                this.elements.card?.classList.add('als-fade-out');
                this.container?.classList.add('als-fade-out');
                setTimeout(() => this.removeContainer(), 850); // covers 0.8s container transition
            }, 800);
        }

        clearTimer(name) {
            if (!this.timers[name]) return;
            const clear = (name === 'simulation' || name === 'timeout') ? clearTimeout : clearInterval;
            clear(this.timers[name]);
            this.timers[name] = null;
        }

        removeContainer() {
            try {
                this.container?.parentNode?.removeChild(this.container);
            } catch (e) {
                log.error(`Error removing container: ${e}`);
            }
            this.container = this.elements = null;
            log('Loading screen removed');
        }
    }

    // ===== INIT =====
    const initialize = () => new AnxetyLoadingScreen().init();

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', initialize)
        : setTimeout(initialize, 15);
})();
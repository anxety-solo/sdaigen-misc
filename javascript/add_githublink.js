function createGithubLink() {
    const log = createLogger('gh');

    const CONFIG = {
        URL: 'https://github.com/anxety-solo',
        TEXT: 'ANXETY',
        SEPARATOR: '\u2003•\u2003'
    };

    const addLink = () => {
        const footer = gradioApp()?.querySelector('#footer');
        if (!footer) return false;

        if (footer.querySelector(`a[href="${CONFIG.URL}"]`)) {
            log('GitHub link already exists, skipping');
            return true;
        }

        const reloadLink = footer.querySelector(
            'a[onclick*="settings_restart_gradio"]'
        );
        if (!reloadLink) {
            log.warn('"Reload UI" link not found in footer');
            return false;
        }

        try {
            reloadLink.after(
                document.createTextNode(CONFIG.SEPARATOR),
                Object.assign(document.createElement('a'), {
                    href: CONFIG.URL,
                    target: '_blank',
                    textContent: CONFIG.TEXT
                })
            );

            log('GitHub link successfully added to footer');
            return true;
        } catch (e) {
            log.error(`Error adding GitHub link: ${e}`);
            return false;
        }
    };

    if (addLink()) {
        return;
    }

    log('Footer not ready, starting observer');

    const observer = new MutationObserver(() => {
        if (addLink()) {
            observer.disconnect();
            log('Observer stopped after successful insertion');
        }
    });

    observer.observe(gradioApp(), { childList: true, subtree: true });
}

onUiLoaded(createGithubLink);

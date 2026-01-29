onUiLoaded(() => {
    const log = createLogger('hyp');
    const tabs = document.querySelectorAll('#txt2img_extra_tabs .tab-nav button');

    let removed = false;

    tabs.forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === 'hypernetworks') {
            btn.remove();
            removed = true;
        }
    });

    if (removed) {
        log('Hypernetworks tab removed');
    }
});
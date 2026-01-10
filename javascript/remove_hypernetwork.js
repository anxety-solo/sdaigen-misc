onUiLoaded(() => {
    const PREFIX = '[sdAIgen-misc]';
    const tabs = document.querySelectorAll('#txt2img_extra_tabs .tab-nav button');

    let removed = false;

    tabs.forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === 'hypernetworks') {
            btn.remove();
            removed = true;
        }
    });

    if (removed) {
        console.log(`${PREFIX}: Hypernetworks tab removed`);
    }
});
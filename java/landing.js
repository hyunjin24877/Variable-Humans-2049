(() => {
    const logo = document.getElementById('landing-logo');
    const inputs = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown', 'click'];
    let exiting = false;

    function exitLanding() {
        if (exiting) return;
        exiting = true;

        for (const input of inputs) {
            window.removeEventListener(input, exitLanding);
        }

        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            location.replace('./about.html');
            return;
        }

        logo.classList.add('is-exiting');
        window.setTimeout(() => location.replace('./about.html'), 2500);
    }

    for (const input of inputs) {
        window.addEventListener(input, exitLanding, { passive: true });
    }
})();

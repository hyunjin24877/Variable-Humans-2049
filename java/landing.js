(() => {
    const landing = document.querySelector('.landing');
    const inputs = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown', 'click'];
    let exiting = false;

    function showAbout() {
        location.replace('./about.html');
    }

    function exitLanding() {
        if (exiting) return;
        exiting = true;

        for (const input of inputs) {
            window.removeEventListener(input, exitLanding);
        }

        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            showAbout();
            return;
        }

        landing.addEventListener('transitionend', (event) => {
            if (event.target === landing && event.propertyName === 'opacity') showAbout();
        });
        landing.classList.add('is-exiting');
        window.setTimeout(showAbout, 2700);
    }

    for (const input of inputs) {
        window.addEventListener(input, exitLanding, { passive: true });
    }
})();

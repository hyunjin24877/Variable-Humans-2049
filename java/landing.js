(() => {
    const stage = document.getElementById('stage');
    const space = document.getElementById('logo-space');
    const layer = document.getElementById('pieces');
    const fallback = document.getElementById('logo-fallback');
    const flash = document.getElementById('burst-flash');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const LOGO_WIDTH = 565.44;
    const LOGO_HEIGHT = 130.26;
    const FLOAT_END = 4300;
    const INFLATE_END = 7300;
    const PRESS_END = 7850;
    const DURATION = 8350;
    const pieces = [];
    let width, height, scale, bounds, floatBounds, fullBounds;
    let growthX = 1.22, growthY = 3.5, fittedInflation = 0;

    function measure() {
        width = innerWidth;
        height = innerHeight;
        scale = Math.min(width * 0.76 / LOGO_WIDTH, height * 0.25 / LOGO_HEIGHT);
        stage.setAttribute('viewBox', `0 0 ${width} ${height}`);
        space.setAttribute('transform', `translate(${(width - LOGO_WIDTH * scale) / 2} ${(height - LOGO_HEIGHT * scale) / 2}) scale(${scale})`);
        const originX = (width - LOGO_WIDTH * scale) / 2;
        const originY = (height - LOGO_HEIGHT * scale) / 2;
        const area = (left, right, top, bottom) => ({
            left: (width * left - originX) / scale,
            right: (width * right - originX) / scale,
            top: (height * top - originY) / scale,
            bottom: (height * bottom - originY) / scale
        });
        floatBounds = area(0.08, 0.92, 0.34, 0.66);
        fullBounds = area(0.04, 0.96, 0.04, 0.96);
        bounds = floatBounds;
        if (pieces.length) {
            const totalWidth = pieces.reduce((sum, piece) => sum + piece.w, 0);
            const largestHeight = Math.max(...pieces.map(piece => piece.h));
            const strokeSpace = pieces.length * 5;
            growthX = Math.max(1, Math.min(1.6,
                (fullBounds.right - fullBounds.left - strokeSpace) / totalWidth * 0.94));
            growthY = Math.max(1, Math.min(9,
                (fullBounds.bottom - fullBounds.top) / largestHeight * 0.94));
        }
    }

    function limit(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function ease(value) {
        return value * value * (3 - 2 * value);
    }

    function shape(piece) {
        const pulseX = Math.sin(piece.time * piece.freqX * 2 + piece.phaseX) * piece.inflate * 0.012;
        const pulseY = Math.sin(piece.time * piece.freqY * 2 + piece.phaseY) * piece.inflate * 0.025;
        return {
            sx: (1 + (growthX - 1) * piece.inflate + pulseX) * (1 - limit(piece.pressureX, 0, 0.16)) * piece.pack * piece.burstScale,
            sy: (1 + (growthY - 1) * piece.inflate + pulseY) * (1 - limit(piece.pressureY, 0, 0.16)) * piece.pack * piece.burstScale,
            stroke: piece.inflate * piece.strokeWidth + piece.tension * 1.5
        };
    }

    function extent(piece) {
        const { sx, sy, stroke } = shape(piece);
        const radians = piece.angle * Math.PI / 180;
        const cosine = Math.abs(Math.cos(radians));
        const sine = Math.abs(Math.sin(radians));
        return {
            x: ((piece.w + stroke) * sx * cosine + (piece.h + stroke) * sy * sine) / 2,
            y: ((piece.w + stroke) * sx * sine + (piece.h + stroke) * sy * cosine) / 2
        };
    }

    function draw(piece) {
        const { sx, sy, stroke } = shape(piece);
        piece.outer.setAttribute('transform', `translate(${piece.x + piece.burstX} ${piece.y + piece.burstY})`);
        piece.inner.setAttribute('transform',
            `translate(${piece.cx} ${piece.cy}) rotate(${piece.angle}) scale(${sx} ${sy}) translate(${-piece.cx} ${-piece.cy})`);
        piece.inner.setAttribute('stroke-width', stroke);
        piece.outer.style.opacity = piece.opacity;
    }

    function update(dt, time, strength, requestedInflation, tension) {
        const air = ease(requestedInflation);
        bounds = {
            left: floatBounds.left + (fullBounds.left - floatBounds.left) * air,
            right: floatBounds.right + (fullBounds.right - floatBounds.right) * air,
            top: floatBounds.top + (fullBounds.top - floatBounds.top) * air,
            bottom: floatBounds.bottom + (fullBounds.bottom - floatBounds.bottom) * air
        };

        for (const piece of pieces) {
            const current = 1 - requestedInflation * 0.62;
            const targetX = (piece.baseVX + Math.sin(time * piece.freqX + piece.phaseX) * 13) * strength * current;
            const targetY = (piece.baseVY + Math.sin(time * piece.freqY + piece.phaseY) * 14) * strength * current;
            piece.vx += (targetX - piece.vx) * Math.min(1, dt * 0.75);
            piece.vy += (targetY - piece.vy) * Math.min(1, dt * 0.75);
            const speed = Math.hypot(piece.vx, piece.vy);
            if (speed > 42) {
                piece.vx *= 42 / speed;
                piece.vy *= 42 / speed;
            }
            piece.x += piece.vx * dt;
            piece.y += piece.vy * dt;
            piece.pressureX += (tension * 0.055 - piece.pressureX) * Math.min(1, dt * 5);
            piece.pressureY += (tension * 0.055 - piece.pressureY) * Math.min(1, dt * 5);
            piece.pack += (1 - piece.pack) * Math.min(1, dt * 3);
            piece.angle = Math.sin(time * piece.spin + piece.phaseX) * piece.turn * strength
                * Math.pow(1 - requestedInflation, 2);
            piece.tension = tension;
            piece.time = time;
        }

        // Try the requested size, then ease back only if the crowded box cannot fit it.
        let fitted = Math.min(requestedInflation, fittedInflation + dt * 0.7);
        for (let attempt = 0; attempt < 26; attempt++) {
            for (const piece of pieces) {
                piece.inflate = fitted;
                piece.contactX = 0;
                piece.contactY = 0;
            }
            solveContacts();
            if (remainingOverlap() < 0.2 || fitted === 0) break;
            fitted = Math.max(0, fitted - 0.04);
        }
        fittedInflation = fitted;

        // Compress a crowded configuration and solve again before drawing.
        for (let attempt = 0; remainingOverlap() >= 0.2 && attempt < 36; attempt++) {
            for (const piece of pieces) piece.pack = Math.max(0.28, piece.pack - 0.02);
            solveContacts();
        }

        for (const piece of pieces) {
            // Squash is a response to contact. The solver uses the same live silhouette.
            piece.pressureX = Math.max(piece.pressureX, piece.contactX);
            piece.pressureY = Math.max(piece.pressureY, piece.contactY);
            draw(piece);
        }
    }

    function solveContacts() {
        // Extents stay fixed during each solve pass; only positions and velocities change.
        for (const piece of pieces) piece.edge = extent(piece);
        for (let iteration = 0; iteration < 120; iteration++) {
            for (const piece of pieces) {
                const edge = piece.edge;
                const x = piece.cx + piece.x;
                const y = piece.cy + piece.y;
                const left = bounds.left - (x - edge.x);
                const right = x + edge.x - bounds.right;
                const top = bounds.top - (y - edge.y);
                const bottom = y + edge.y - bounds.bottom;
                if (left > 0) {
                    piece.x += left;
                    piece.vx = Math.max(0, -piece.vx * 0.22);
                    piece.contactX = Math.max(piece.contactX, limit(left / Math.max(edge.x, 1) * 0.7 + 0.035, 0, 0.16));
                }
                if (right > 0) {
                    piece.x -= right;
                    piece.vx = Math.min(0, -piece.vx * 0.22);
                    piece.contactX = Math.max(piece.contactX, limit(right / Math.max(edge.x, 1) * 0.7 + 0.035, 0, 0.16));
                }
                if (top > 0) {
                    piece.y += top;
                    piece.vy = Math.max(0, -piece.vy * 0.22);
                    piece.contactY = Math.max(piece.contactY, limit(top / Math.max(edge.y, 1) * 0.7 + 0.035, 0, 0.16));
                }
                if (bottom > 0) {
                    piece.y -= bottom;
                    piece.vy = Math.min(0, -piece.vy * 0.22);
                    piece.contactY = Math.max(piece.contactY, limit(bottom / Math.max(edge.y, 1) * 0.7 + 0.035, 0, 0.16));
                }
            }

            let anyContact = false;
            for (let i = 0; i < pieces.length; i++) {
                for (let j = i + 1; j < pieces.length; j++) {
                    const a = pieces[i], b = pieces[j];
                    const ea = a.edge, eb = b.edge;
                    const dx = b.cx + b.x - a.cx - a.x;
                    const dy = b.cy + b.y - a.cy - a.y;
                    const overlapX = ea.x + eb.x - Math.abs(dx);
                    const overlapY = ea.y + eb.y - Math.abs(dy);
                    if (overlapX <= 0 || overlapY <= 0) continue;
                    anyContact = true;
                    if (overlapX < overlapY) {
                        const direction = dx >= 0 ? 1 : -1;
                        const shift = (overlapX + 0.02) / 2;
                        a.x -= direction * shift;
                        b.x += direction * shift;
                        const approach = (a.vx - b.vx) * direction;
                        if (approach > 0) {
                            const impulse = approach * 0.58 + Math.min(1.2, overlapX * 0.08);
                            a.vx -= direction * impulse;
                            b.vx += direction * impulse;
                        }
                        const pressure = limit(overlapX / Math.max(ea.x + eb.x, 1) * 0.42 + 0.035, 0, 0.16);
                        a.contactX = Math.max(a.contactX, pressure);
                        b.contactX = Math.max(b.contactX, pressure);
                    } else {
                        const direction = dy >= 0 ? 1 : -1;
                        const shift = (overlapY + 0.02) / 2;
                        a.y -= direction * shift;
                        b.y += direction * shift;
                        const approach = (a.vy - b.vy) * direction;
                        if (approach > 0) {
                            const impulse = approach * 0.58 + Math.min(1.2, overlapY * 0.08);
                            a.vy -= direction * impulse;
                            b.vy += direction * impulse;
                        }
                        const pressure = limit(overlapY / Math.max(ea.y + eb.y, 1) * 0.42 + 0.035, 0, 0.16);
                        a.contactY = Math.max(a.contactY, pressure);
                        b.contactY = Math.max(b.contactY, pressure);
                    }
                }
            }
            if (!anyContact) break;
        }
    }

    function remainingOverlap() {
        let worst = 0;
        for (const piece of pieces) {
            const edge = extent(piece);
            worst = Math.max(worst,
                bounds.left - (piece.cx + piece.x - edge.x),
                piece.cx + piece.x + edge.x - bounds.right,
                bounds.top - (piece.cy + piece.y - edge.y),
                piece.cy + piece.y + edge.y - bounds.bottom);
        }
        for (let i = 0; i < pieces.length; i++) {
            for (let j = i + 1; j < pieces.length; j++) {
                const a = pieces[i], b = pieces[j];
                const ea = extent(a), eb = extent(b);
                const overlapX = ea.x + eb.x - Math.abs(b.cx + b.x - a.cx - a.x);
                const overlapY = ea.y + eb.y - Math.abs(b.cy + b.y - a.cy - a.y);
                if (overlapX > 0 && overlapY > 0) worst = Math.max(worst, Math.min(overlapX, overlapY));
            }
        }
        return worst;
    }

    function burst(progress) {
        const spread = ease(progress) * Math.max(width, height) * 1.25 / scale;
        for (const piece of pieces) {
            if (!piece.burstStarted) {
                piece.burstStarted = true;
                piece.burstStartAngle = piece.angle;
            }
            piece.burstX = piece.burstDirectionX * spread;
            piece.burstY = piece.burstDirectionY * spread;
            piece.burstScale = 1 + progress * 0.8;
            piece.angle = piece.burstStartAngle + piece.burstTurn * progress;
            piece.opacity = Math.pow(1 - progress, 1.35);
            draw(piece);
        }
        flash.style.opacity = ease(limit((progress - 0.08) / 0.72, 0, 1));
    }

    measure();
    addEventListener('resize', measure);

    fetch('./img/logo-2.svg?v=e0a4146')
        .then(response => {
            if (!response.ok) throw new Error('Logo could not be loaded');
            return response.text();
        })
        .then(source => {
            const document = new DOMParser().parseFromString(source, 'image/svg+xml');
            const paths = [...document.querySelectorAll('path')];
            if (!paths.length) throw new Error('Logo has no paths');
            for (const path of paths) {
                const outer = document.createElementNS(SVG_NS, 'g');
                const inner = document.createElementNS(SVG_NS, 'g');
                inner.setAttribute('stroke', '#000');
                inner.setAttribute('stroke-linejoin', 'round');
                inner.setAttribute('stroke-linecap', 'round');
                inner.appendChild(path.cloneNode(true));
                outer.appendChild(inner);
                layer.appendChild(outer);
                const box = inner.getBBox();
                const cx = box.x + box.width / 2;
                const cy = box.y + box.height / 2;
                const direction = Math.atan2(cy - LOGO_HEIGHT / 2, cx - LOGO_WIDTH / 2)
                    + (Math.random() - 0.5) * 0.5;
                pieces.push({
                    outer, inner, x: 0, y: 0, vx: 0, vy: 0,
                    cx, cy,
                    w: box.width, h: box.height,
                    baseVX: (Math.random() * 2 - 1) * 27,
                    baseVY: (Math.random() * 2 - 1) * 24,
                    freqX: 0.45 + Math.random() * 0.45,
                    freqY: 0.36 + Math.random() * 0.5,
                    phaseX: Math.random() * Math.PI * 2,
                    phaseY: Math.random() * Math.PI * 2,
                    spin: 0.55 + Math.random() * 0.5,
                    turn: 1 + Math.random() * 2,
                    strokeWidth: 3 + Math.random() * 2,
                    burstDirectionX: Math.cos(direction),
                    burstDirectionY: Math.sin(direction),
                    burstTurn: (Math.random() - 0.5) * 42,
                    burstX: 0, burstY: 0, burstScale: 1, opacity: 1,
                    inflate: 0, tension: 0, time: 0, pack: 1,
                    angle: 0, pressureX: 0, pressureY: 0
                });
            }
            measure();
            fallback.remove();
        })
        .catch(() => {})
        .finally(() => {
            if (reduced.matches) {
                setTimeout(() => location.replace('./about.html'), 600);
                return;
            }
            const start = performance.now();
            let previous = start;
            function frame(now) {
                const elapsed = now - start;
                if (elapsed >= DURATION || reduced.matches) {
                    location.replace('./about.html');
                    return;
                }
                const dt = Math.min((now - previous) / 1000, 0.04);
                previous = now;
                // Hold the exact original logo briefly, then let the pieces drift apart.
                const strength = limit((elapsed - 450) / 1000, 0, 1);
                if (elapsed < PRESS_END) {
                    const inflate = ease(limit((elapsed - FLOAT_END) / (INFLATE_END - FLOAT_END), 0, 1));
                    const tension = ease(limit((elapsed - INFLATE_END) / (PRESS_END - INFLATE_END), 0, 1));
                    if (pieces.length && strength > 0) update(dt, elapsed / 1000, strength, inflate, tension);
                } else {
                    burst((elapsed - PRESS_END) / (DURATION - PRESS_END));
                }
                requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        });
})();

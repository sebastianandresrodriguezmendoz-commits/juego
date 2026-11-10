/**
 * GunRun 2D - Controles táctiles (móvil / tablet)
 *
 * - Joystick izquierdo : mover la nave (velocidad proporcional al empuje)
 * - Joystick derecho   : apuntar y disparar (dispara mientras lo mantengas inclinado)
 * - Botones            : recargar, cambiar de arma, pausa y pantalla completa
 *
 * Usa Pointer Events con captura, así se pueden usar ambos pulgares a la vez (multitáctil).
 * Este archivo solo habla con el motor a través de window.gunRunGame.input y sus métodos públicos.
 */
(function () {
    'use strict';

    const root = document.getElementById('touch-controls');
    if (!root) return;

    const game = () => window.gunRunGame;

    // ------------------------------------------------------------------
    // 1. Detección de dispositivo táctil
    // ------------------------------------------------------------------
    const coarse = window.matchMedia('(pointer: coarse)');

    function updateDeviceBadge() {
        const badge = document.getElementById('device-badge');
        if (badge) {
            const touch = document.body.classList.contains('is-touch');
            badge.innerHTML = touch
                ? '<i class="bi bi-phone me-1"></i> Modo MÓVIL / TÁCTIL'
                : '<i class="bi bi-pc-display me-1"></i> Modo PC (teclado y mouse)';
        }
        // Abre automáticamente la pestaña de "Cómo se juega" que corresponde al dispositivo
        const tabId = document.body.classList.contains('is-touch') ? 'howto-tab-mobile' : 'howto-tab-pc';
        const tabBtn = document.getElementById(tabId);
        if (tabBtn && window.bootstrap) window.bootstrap.Tab.getOrCreateInstance(tabBtn).show();
    }

    function setTouchMode(on) {
        document.body.classList.toggle('is-touch', on);
        updateDeviceBadge();
        if (game()) game().resize();
    }

    setTouchMode(coarse.matches);
    if (coarse.addEventListener) coarse.addEventListener('change', (e) => setTouchMode(e.matches));

    // Si en un equipo híbrido (laptop con pantalla táctil) se toca la pantalla, se activa el modo táctil
    window.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' && !document.body.classList.contains('is-touch')) setTouchMode(true);
    }, { passive: true });

    // ------------------------------------------------------------------
    // 2. Joystick virtual
    // ------------------------------------------------------------------
    function createStick(zone, onChange, onRelease) {
        const base = zone.querySelector('.stick-base');
        const knob = zone.querySelector('.stick-knob');
        let pointerId = null;
        let cx = 0, cy = 0, radius = 1;

        function setKnob(dx, dy) {
            const travel = radius * 0.55;
            knob.style.transform = `translate(${dx * travel}px, ${dy * travel}px)`;
        }

        function update(e) {
            let dx = (e.clientX - cx) / radius;
            let dy = (e.clientY - cy) / radius;
            const mag = Math.hypot(dx, dy);
            if (mag > 1) { dx /= mag; dy /= mag; }
            setKnob(dx, dy);
            onChange(dx, dy, Math.min(1, mag));
        }

        function end(e) {
            if (e.pointerId !== pointerId) return;
            pointerId = null;
            zone.classList.remove('active');
            setKnob(0, 0);
            onRelease();
        }

        zone.addEventListener('pointerdown', (e) => {
            if (pointerId !== null) return;
            e.preventDefault();
            pointerId = e.pointerId;
            zone.setPointerCapture(pointerId);

            const r = base.getBoundingClientRect();
            cx = r.left + r.width / 2;
            cy = r.top + r.height / 2;
            radius = r.width / 2;

            zone.classList.add('active');
            if (game()) game().soundFX.init();
            update(e);
        });
        zone.addEventListener('pointermove', (e) => { if (e.pointerId === pointerId) update(e); });
        zone.addEventListener('pointerup', end);
        zone.addEventListener('pointercancel', end);
        zone.addEventListener('lostpointercapture', end);

        return {
            reset() {
                pointerId = null;
                zone.classList.remove('active');
                setKnob(0, 0);
            }
        };
    }

    // Joystick izquierdo: movimiento
    const DEAD = 0.14;
    const moveStick = createStick(
        document.getElementById('stick-move'),
        (dx, dy, mag) => {
            const g = game();
            if (!g) return;
            if (mag < DEAD) { g.input.analog.x = 0; g.input.analog.y = 0; return; }
            g.input.analog.x = dx;
            g.input.analog.y = dy;
        },
        () => {
            const g = game();
            if (g) { g.input.analog.x = 0; g.input.analog.y = 0; }
        }
    );

    // Joystick derecho: apuntar (> 0.2) y disparar (> 0.35)
    const aimStick = createStick(
        document.getElementById('stick-aim'),
        (dx, dy, mag) => {
            const g = game();
            if (!g) return;
            if (mag < 0.2) { g.input.aim.active = false; g.input.mouse.isDown = false; return; }
            const len = Math.hypot(dx, dy) || 1;
            g.input.aim.x = dx / len;
            g.input.aim.y = dy / len;
            g.input.aim.active = true;
            g.input.mouse.isDown = mag > 0.35;
        },
        () => {
            const g = game();
            if (g) { g.input.aim.active = false; g.input.mouse.isDown = false; }
        }
    );

    // ------------------------------------------------------------------
    // 3. Botones
    // ------------------------------------------------------------------
    const vibrate = (ms) => { if (navigator.vibrate) navigator.vibrate(ms); };

    function bindButton(id, onDown, onUp) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (game()) game().soundFX.init();
            el.classList.add('pressed');
            onDown(e);
        });
        const up = () => { el.classList.remove('pressed'); if (onUp) onUp(); };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('pointerleave', up);
    }

    // Recargar = misma tecla R que en PC
    bindButton('tbtn-reload',
        () => { if (game()) { game().input.keys['KeyR'] = true; vibrate(15); } },
        () => { if (game()) game().input.keys['KeyR'] = false; }
    );

    // Cambiar de arma (Blaster -> Escopeta -> Railgun)
    bindButton('tbtn-weapon', () => { if (game()) { game().cycleWeapon(1); vibrate(15); } });

    // Pausa / reanudar
    bindButton('tbtn-pause', () => { if (game()) game().togglePause(); });

    // Pantalla completa
    bindButton('tbtn-fs', () => { if (game()) game().toggleFullscreen(); });

    // ------------------------------------------------------------------
    // 4. Cuando el juego cambia de estado, soltar los joysticks
    // ------------------------------------------------------------------
    window.addEventListener('gunrun:state', () => {
        moveStick.reset();
        aimStick.reset();
    });

    // ------------------------------------------------------------------
    // 5. Evitar gestos del navegador mientras se juega (scroll, zoom por pellizco)
    // ------------------------------------------------------------------
    document.addEventListener('touchmove', (e) => {
        const g = game();
        if (g && g.state === 'PLAYING' && e.target.closest && e.target.closest('.game-viewport')) {
            e.preventDefault();
        }
    }, { passive: false });

    ['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => {
        document.addEventListener(ev, (e) => {
            if (e.target.closest && e.target.closest('.game-viewport')) e.preventDefault();
        });
    });
})();

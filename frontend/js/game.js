/**
 * GunRun 2D - Motor de Juego Canvas 2D Completo
 * Arquitectura de Producción:
 * - Bucle a 60 FPS con Delta Time y Screen Shake
 * - Arsenal Táctico: Blaster, Escopeta de Dispersión y Railgun Perforante
 * - Balística Enemiga con esquive y Boss Titan Goliath cada 5 oleadas
 * - Sistema de Drops y Power-Ups: Salud, Munición, Escudo, Frenesí y Nuke PEM
 * - Sintetizador de audio nativo Web Audio API (cero dependencias de archivos de sonido externos)
 * - HUD táctico con Barra de Jefe, Shield Gauge y Frenzy Meter
 * - Sincronización automática con MySQL mediante API REST y JWT
 */

// 1. Sintetizador de Efectos de Sonido Nativo (Web Audio API)
class SoundFX {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        const icon = document.getElementById('sound-icon');
        if (icon) {
            icon.className = this.muted ? 'bi bi-volume-mute-fill' : 'bi bi-volume-up-fill';
        }
        return this.muted;
    }

    playLaser() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) { }
    }

    playShotgun() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) { }
    }

    playRailgun() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.35);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1100, now);
            filter.Q.setValueAtTime(4, now);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) { }
    }

    playHit() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) { }
    }

    playExplosion() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.28;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(580, now);
            filter.frequency.exponentialRampToValueAtTime(60, now + 0.28);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.32, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
        } catch (e) { }
    }

    playReload() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.setValueAtTime(750, now + 0.08);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) { }
    }

    playPowerUp() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // Arpegio C Mayor Neón
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = now + idx * 0.06;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.15, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.12);
            });
        } catch (e) { }
    }

    playEnemyShoot() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) { }
    }

    playBossAlert() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(620, now + 0.25);
            osc.frequency.setValueAtTime(440, now + 0.50);
            osc.frequency.setValueAtTime(620, now + 0.75);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 1.0);
        } catch (e) { }
    }

    playShieldDeflect() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) { }
    }

    playNuke() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.8;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(30, now + 0.8);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
        } catch (e) { }
    }
}

// 2. Sistema de Partículas para Estelas y Explosiones
class Particle {
    constructor(x, y, color, vx, vy, life = 0.5, size = 3) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size * alpha), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 3. Textos Flotantes de Daño y Alertas (Floating Combat Text)
class FloatingText {
    constructor(x, y, text, color = '#ffffff', fontSize = 13, duration = 0.8) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
        this.life = duration;
        this.maxLife = duration;
        this.vy = -38;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6;
        ctx.font = `bold ${this.fontSize}px "Orbitron", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// 4. Entidad Proyectil del Jugador (Plasma, Escopeta o Railgun)
class Bullet {
    constructor(x, y, angle, speed = 850, damage = 35, color = '#00ffcc', radius = 4, piercing = 1) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = radius;
        this.damage = damage;
        this.life = 1.4; // Segundos de vida máxima
        this.color = color;
        this.piercing = piercing;
        this.hits = 0;
        this.hitEnemyIds = new Set();
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo brillante
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(1, this.radius - 1.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 5. Entidad Proyectil Enemigo (Balística Hostil)
class EnemyBullet {
    constructor(x, y, targetX, targetY, speed = 360, damage = 18) {
        this.x = x;
        this.y = y;
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 5;
        this.damage = damage;
        this.life = 2.8;
        this.color = '#ff0055';
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 6. Drops Coleccionables en Arena (Power-Ups)
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'health', 'ammo', 'shield', 'rapid', 'nuke'
        this.radius = 15;
        this.life = 14;
        this.bobTimer = Math.random() * Math.PI * 2;

        if (type === 'health') {
            this.color = '#39ff14';
            this.symbol = '+';
            this.label = '+35 HP';
        } else if (type === 'ammo') {
            this.color = '#00ffcc';
            this.symbol = '⚡';
            this.label = '+60 AMMO';
        } else if (type === 'shield') {
            this.color = '#00ccff';
            this.symbol = '🛡';
            this.label = 'ESCUDO';
        } else if (type === 'rapid') {
            this.color = '#ffe600';
            this.symbol = '🔥';
            this.label = 'FRENESÍ';
        } else { // 'nuke'
            this.color = '#ff5500';
            this.symbol = '☢';
            this.label = 'PEM NUKE';
        }
    }

    update(dt) {
        this.life -= dt;
        this.bobTimer += dt * 4;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const bob = Math.sin(this.bobTimer) * 4;
        const isExpiring = this.life < 3 && Math.floor(this.life * 6) % 2 === 0;

        if (isExpiring) return;

        ctx.save();
        ctx.translate(this.x, this.y + bob);

        // Halo Exterior Neón
        ctx.fillStyle = 'rgba(10, 14, 24, 0.85)';
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Icono Central
        ctx.fillStyle = this.color;
        ctx.font = 'bold 12px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 1);

        ctx.restore();
    }
}

// 7. Inteligencia Artificial de Enemigos por Tipos y Bosses
class Enemy {
    constructor(x, y, type = 'drone', wave = 1) {
        this.id = Math.random().toString(36).substring(2, 9);
        this.x = x;
        this.y = y;
        this.type = type;
        this.wave = wave;

        this.shootTimer = 0;
        this.shootInterval = 2.2;

        if (type === 'boss') {
            // TITAN PROTOCOL OMEGA (Mega Jefe)
            this.radius = 42;
            this.speed = 80 + wave * 4;
            this.maxHealth = 600 + (wave - 1) * 220;
            this.damage = 45;
            this.scoreValue = 2500;
            this.color = '#00e5ff';
            this.accent = '#ff007f';
            this.shootInterval = 1.7;
            this.rotationAngle = 0;
        } else if (type === 'shooter') {
            // Francotirador / Ranger a distancia
            this.radius = 18;
            this.speed = 130 + wave * 6;
            this.maxHealth = 50 + (wave - 1) * 18;
            this.damage = 22;
            this.scoreValue = 180;
            this.color = '#ff00cc'; // Violeta / Magenta
            this.accent = '#00ffff';
            this.preferredDist = 260;
        } else if (type === 'kamikaze') {
            // Dron Suicida Explosivo
            this.radius = 13;
            this.speed = 240 + wave * 10;
            this.maxHealth = 28 + (wave - 1) * 10;
            this.damage = 40;
            this.scoreValue = 140;
            this.color = '#ff3300'; // Rojo Candente
            this.accent = '#ffe600';
            this.pulseTimer = 0;
        } else if (type === 'tank') {
            // Tanque Blindado Pesado
            this.radius = 26;
            this.speed = 95 + wave * 5;
            this.maxHealth = 130 + (wave - 1) * 35;
            this.damage = 35;
            this.scoreValue = 250;
            this.color = '#ffe600'; // Amarillo/Naranja Neón
            this.accent = '#ff5500';
        } else {
            // Drone Estándar de Asalto
            this.radius = 16;
            this.speed = 160 + wave * 9;
            this.maxHealth = 45 + (wave - 1) * 14;
            this.damage = 20;
            this.scoreValue = 100;
            this.color = '#ff0055'; // Rojo/Magenta Neón
            this.accent = '#ff00aa';
        }

        this.health = this.maxHealth;
        this.angle = 0;
        this.hitFlash = 0;
    }

    update(dt, playerX, playerY, onEnemyShoot) {
        if (this.hitFlash > 0) this.hitFlash -= dt;

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
            this.angle = Math.atan2(dy, dx);
        }

        if (this.type === 'shooter') {
            // Mantener distancia táctica respecto al jugador
            if (distance > this.preferredDist + 40) {
                this.x += (dx / distance) * this.speed * dt;
                this.y += (dy / distance) * this.speed * dt;
            } else if (distance < this.preferredDist - 40) {
                this.x -= (dx / distance) * this.speed * dt * 0.8;
                this.y -= (dy / distance) * this.speed * dt * 0.8;
            }

            // Disparar proyectil periódicamente
            this.shootTimer += dt;
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                if (onEnemyShoot) {
                    onEnemyShoot(new EnemyBullet(this.x, this.y, playerX, playerY, 380, 18));
                }
            }
        } else if (this.type === 'boss') {
            // Movimiento imponente del Jefe y ráfagas triples de proyectiles
            this.rotationAngle = (this.rotationAngle || 0) + dt * 1.5;
            this.x += (dx / distance) * this.speed * dt;
            this.y += (dy / distance) * this.speed * dt;

            this.shootTimer += dt;
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                if (onEnemyShoot) {
                    // Ráfaga en abanico de 3 proyectiles
                    const baseAngle = Math.atan2(dy, dx);
                    [-0.22, 0, 0.22].forEach(offset => {
                        const targetX = this.x + Math.cos(baseAngle + offset) * 300;
                        const targetY = this.y + Math.sin(baseAngle + offset) * 300;
                        onEnemyShoot(new EnemyBullet(this.x, this.y, targetX, targetY, 320, 24));
                    });
                }
            }
        } else if (this.type === 'kamikaze') {
            // Persecución ultra rápida
            this.pulseTimer = (this.pulseTimer || 0) + dt * 10;
            this.x += (dx / distance) * this.speed * dt;
            this.y += (dy / distance) * this.speed * dt;
        } else {
            // Persecución directa normal (drone y tank)
            this.x += (dx / distance) * this.speed * dt;
            this.y += (dy / distance) * this.speed * dt;
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        this.hitFlash = 0.08;
        return this.health <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        const renderColor = this.hitFlash > 0 ? '#ffffff' : this.color;

        if (this.type === 'boss') {
            // TITAN PROTOCOL OMEGA: Armadura Hexagonal Doble Giratoria
            ctx.fillStyle = '#0a0d18';
            ctx.strokeStyle = renderColor;
            ctx.lineWidth = 4;

            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (i * Math.PI) / 4;
                const px = Math.cos(a) * this.radius;
                const py = Math.sin(a) * this.radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Placas frontales de plasma
            ctx.fillStyle = this.accent;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();

            // Cañones triples frontales
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.radius - 4, -14, 18, 6);
            ctx.fillRect(this.radius, -3, 22, 6);
            ctx.fillRect(this.radius - 4, 8, 18, 6);
        } else if (this.type === 'tank') {
            // Tanque Blindado: Hexágono robusto
            ctx.fillStyle = '#10141f';
            ctx.strokeStyle = renderColor;
            ctx.lineWidth = 3;

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI) / 3;
                const px = Math.cos(a) * this.radius;
                const py = Math.sin(a) * this.radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = this.accent;
            ctx.beginPath();
            ctx.moveTo(this.radius, -8);
            ctx.lineTo(this.radius + 10, 0);
            ctx.lineTo(this.radius, 8);
            ctx.fill();
        } else if (this.type === 'shooter') {
            // Francotirador: Rombo estilizado con mira
            ctx.fillStyle = '#16091c';
            ctx.strokeStyle = renderColor;
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.moveTo(this.radius + 8, 0);
            ctx.lineTo(0, -this.radius);
            ctx.lineTo(-this.radius + 4, 0);
            ctx.lineTo(0, this.radius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cañón alargado
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, -2, this.radius + 10, 4);
        } else if (this.type === 'kamikaze') {
            // Suicida: Orbe con pulso de advertencia
            const scalePulse = 1 + Math.sin(this.pulseTimer) * 0.15;
            ctx.fillStyle = renderColor;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * scalePulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Drone estándar: Triángulo ágil
            ctx.fillStyle = '#160a14';
            ctx.strokeStyle = renderColor;
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.moveTo(this.radius + 6, 0);
            ctx.lineTo(-this.radius, -this.radius + 2);
            ctx.lineTo(-this.radius + 6, 0);
            ctx.lineTo(-this.radius, this.radius - 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = renderColor;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Barra de Salud local si está dañado (no se dibuja si es Boss, el boss tiene barra superior)
        if (this.type !== 'boss' && this.health < this.maxHealth) {
            const barW = this.radius * 2;
            const barH = 4;
            const barX = this.x - this.radius;
            const barY = this.y - this.radius - 10;
            const pct = Math.max(0, this.health / this.maxHealth);

            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = this.color;
            ctx.fillRect(barX, barY, barW * pct, barH);
            ctx.restore();
        }
    }
}

// 8. Entidad Jugador Completa con Arsenal Táctico y Escudos
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 22;
        this.speed = 280;
        this.angle = 0;

        // Salud y Escudo Defensivo
        this.maxHealth = 100;
        this.health = 100;
        this.shield = 0; // Sobreescudo
        this.maxShield = 50;
        this.damageFlash = 0;

        // Balística y Armas
        this.clipSize = 25;
        this.ammo = 25;
        this.reserveAmmo = 175;
        this.isReloading = false;
        this.reloadDuration = 1.4;
        this.reloadTimer = 0;
        this.fireCooldown = 0;

        // Power-Up Activo: Frenesí (Overcharge)
        this.frenzyTimer = 0;

        // Configuración de Arsenal Táctico
        this.currentWeapon = 'blaster'; // 'blaster', 'shotgun', 'railgun'
        this.weapons = {
            blaster: {
                name: 'Blaster de Plasma',
                fireRate: 0.13,
                damage: 35,
                speed: 850,
                spread: 0.04,
                cost: 1,
                color: '#00ffcc'
            },
            shotgun: {
                name: 'Escopeta de Dispersión',
                fireRate: 0.42,
                damage: 22,
                speed: 780,
                spread: 0.18,
                bulletsPerShot: 5,
                cost: 2,
                color: '#ff007f'
            },
            railgun: {
                name: 'Railgun Penetrante',
                fireRate: 0.60,
                damage: 95,
                speed: 1350,
                spread: 0.01,
                piercing: 3,
                cost: 3,
                color: '#ffe600'
            }
        };

        // Estética
        this.coreColor = '#00ffcc';
        this.hullColor = '#121826';
        this.accentColor = '#ff007f';
        this.barrelLength = 28;
        this.barrelWidth = 7;

        this.particles = [];
        this.trailTimer = 0;
    }

    setWeapon(weaponType) {
        if (this.weapons[weaponType]) {
            this.currentWeapon = weaponType;
            // Actualizar botones de la UI
            document.querySelectorAll('.btn-weapon').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.weapon === weaponType);
            });
            const touchLabel = document.getElementById('touch-weapon-label');
            if (touchLabel) touchLabel.textContent = { blaster: '1', shotgun: '2', railgun: '3' }[weaponType];
        }
    }

    update(dt, input, arenaWidth, arenaHeight, onShoot, soundFX) {
        if (this.damageFlash > 0) this.damageFlash -= dt;
        if (this.frenzyTimer > 0) this.frenzyTimer -= dt;

        // 1. Movimiento Normalizado
        let dx = 0;
        let dy = 0;

        if (input.keys['KeyW'] || input.keys['ArrowUp']) dy -= 1;
        if (input.keys['KeyS'] || input.keys['ArrowDown']) dy += 1;
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) dx -= 1;
        if (input.keys['KeyD'] || input.keys['ArrowRight']) dx += 1;

        // Teclado: velocidad completa en cualquier dirección (normalizado)
        const kbMag = Math.hypot(dx, dy);
        if (kbMag > 0) {
            dx /= kbMag;
            dy /= kbMag;
        }
        // Táctil: el joystick analógico manda y la velocidad es proporcional al empuje
        if (input.analog && (input.analog.x || input.analog.y)) {
            dx = input.analog.x;
            dy = input.analog.y;
        }

        const magnitude = Math.hypot(dx, dy);
        if (magnitude > 0) {
            dx = dx * this.speed * dt;
            dy = dy * this.speed * dt;
            this.x += dx;
            this.y += dy;

            this.trailTimer += dt;
            if (this.trailTimer >= 0.04) {
                this.trailTimer = 0;
                const pColor = this.frenzyTimer > 0 ? '#ffe600' : this.coreColor;
                const pVx = -dx * 8 + (Math.random() - 0.5) * 40;
                const pVy = -dy * 8 + (Math.random() - 0.5) * 40;
                this.particles.push(new Particle(this.x, this.y, pColor, pVx, pVy, 0.4, 3.5));
            }
        }

        // Límites de Arena
        this.x = Math.max(this.radius + 8, Math.min(arenaWidth - this.radius - 8, this.x));
        this.y = Math.max(this.radius + 8, Math.min(arenaHeight - this.radius - 8, this.y));

        // Apuntado táctil: el punto de mira sigue la dirección del joystick derecho
        if (input.aim && input.aim.active) {
            input.mouse.x = this.x + input.aim.x * 260;
            input.mouse.y = this.y + input.aim.y * 260;
        }

        // Rotación hacia el cursor
        this.angle = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);

        // Atajos de Armas [1, 2, 3]
        if (input.keys['Digit1']) this.setWeapon('blaster');
        if (input.keys['Digit2']) this.setWeapon('shotgun');
        if (input.keys['Digit3']) this.setWeapon('railgun');

        // 2. Control de Recarga
        if (input.keys['KeyR'] && !this.isReloading && this.ammo < this.clipSize && this.reserveAmmo > 0) {
            this.startReload(soundFX);
        }

        if (this.isReloading) {
            this.reloadTimer += dt;
            if (this.reloadTimer >= this.reloadDuration) {
                this.finishReload();
            }
        }

        // 3. Cadencia y Disparo Continuo
        if (this.fireCooldown > 0) this.fireCooldown -= dt;

        if (input.mouse.isDown && !this.isReloading && this.fireCooldown <= 0) {
            const wpn = this.weapons[this.currentWeapon];
            const cost = this.frenzyTimer > 0 ? 0 : wpn.cost;

            if (this.ammo >= cost) {
                this.shoot(onShoot, soundFX);
            } else if (this.reserveAmmo > 0) {
                this.startReload(soundFX);
            }
        }

        // Partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
    }

    shoot(onShoot, soundFX) {
        const wpn = this.weapons[this.currentWeapon];
        const cost = this.frenzyTimer > 0 ? 0 : wpn.cost;
        this.ammo = Math.max(0, this.ammo - cost);

        const rate = this.frenzyTimer > 0 ? wpn.fireRate * 0.55 : wpn.fireRate;
        this.fireCooldown = rate;

        const spawnX = this.x + Math.cos(this.angle) * (this.barrelLength + 8);
        const spawnY = this.y + Math.sin(this.angle) * (this.barrelLength + 8);

        if (this.currentWeapon === 'shotgun') {
            // Escopeta: 5 proyectiles en abanico
            const count = wpn.bulletsPerShot || 5;
            for (let i = 0; i < count; i++) {
                const spreadAngle = this.angle + (i - (count - 1) / 2) * (wpn.spread / 2) + (Math.random() - 0.5) * 0.06;
                const bullet = new Bullet(spawnX, spawnY, spreadAngle, wpn.speed, wpn.damage, wpn.color, 3.5, 1);
                if (onShoot) onShoot(bullet);
            }
            soundFX.playShotgun();
        } else if (this.currentWeapon === 'railgun') {
            // Railgun: 1 proyectil pesado que penetra enemigos
            const bullet = new Bullet(spawnX, spawnY, this.angle, wpn.speed, wpn.damage, wpn.color, 5.5, wpn.piercing || 3);
            soundFX.playRailgun();
            if (onShoot) onShoot(bullet);
        } else {
            // Blaster estándar
            const spread = (Math.random() - 0.5) * wpn.spread;
            const bullet = new Bullet(spawnX, spawnY, this.angle + spread, wpn.speed, wpn.damage, wpn.color, 4, 1);
            soundFX.playLaser();
            if (onShoot) onShoot(bullet);
        }

        // Fogueo en cañón
        for (let i = 0; i < 4; i++) {
            const pVx = Math.cos(this.angle) * 120 + (Math.random() - 0.5) * 60;
            const pVy = Math.sin(this.angle) * 120 + (Math.random() - 0.5) * 60;
            this.particles.push(new Particle(spawnX, spawnY, '#ffffff', pVx, pVy, 0.15, 3));
        }
    }

    startReload(soundFX) {
        if (this.isReloading || this.reserveAmmo <= 0 || this.ammo === this.clipSize) return;
        this.isReloading = true;
        this.reloadTimer = 0;
        soundFX.playReload();
    }

    finishReload() {
        const needed = this.clipSize - this.ammo;
        const amount = Math.min(needed, this.reserveAmmo);
        this.ammo += amount;
        this.reserveAmmo -= amount;
        this.isReloading = false;
        this.reloadTimer = 0;
    }

    takeDamage(amount, soundFX) {
        if (this.shield > 0) {
            const absorbed = Math.min(this.shield, amount);
            this.shield -= absorbed;
            amount -= absorbed;
            if (soundFX) soundFX.playShieldDeflect();
        }

        if (amount > 0) {
            this.health = Math.max(0, this.health - amount);
            this.damageFlash = 0.15;
        }

        return this.health <= 0;
    }

    draw(ctx) {
        for (const p of this.particles) p.draw(ctx);

        ctx.save();
        ctx.translate(this.x, this.y);

        // Si tiene Sobreescudo activo, dibujar campo de fuerza protector
        if (this.shield > 0) {
            ctx.save();
            ctx.strokeStyle = '#00ccff';
            ctx.shadowColor = '#00ccff';
            ctx.shadowBlur = 18;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.rotate(this.angle);

        const wpn = this.weapons[this.currentWeapon];
        const activeColor = this.damageFlash > 0 ? '#ff0033' : (this.frenzyTimer > 0 ? '#ffe600' : wpn.color);

        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 15;

        // Cañón según arma activa
        ctx.fillStyle = '#060911';
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 2;

        if (this.currentWeapon === 'shotgun') {
            // Cañón doble para escopeta
            ctx.fillRect(8, -this.barrelWidth, this.barrelLength - 4, this.barrelWidth * 2);
            ctx.strokeRect(8, -this.barrelWidth, this.barrelLength - 4, this.barrelWidth * 2);
        } else if (this.currentWeapon === 'railgun') {
            // Cañón largo y fino para railgun
            ctx.fillRect(8, -this.barrelWidth / 2 + 1, this.barrelLength + 8, this.barrelWidth - 2);
            ctx.strokeRect(8, -this.barrelWidth / 2 + 1, this.barrelLength + 8, this.barrelWidth - 2);
        } else {
            // Cañón blaster
            ctx.fillRect(8, -this.barrelWidth / 2, this.barrelLength, this.barrelWidth);
            ctx.strokeRect(8, -this.barrelWidth / 2, this.barrelLength, this.barrelWidth);
        }

        // Mira láser proyectada
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 255, 204, 0.25)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(this.barrelLength + 8, 0);
        ctx.lineTo(this.barrelLength + 160, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Casco
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.damageFlash > 0 ? '#550011' : this.hullColor;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = activeColor;
        ctx.stroke();

        // Blindaje posterior
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 6, -Math.PI / 2, Math.PI / 2);
        ctx.strokeStyle = this.accentColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Reactor Neón Central
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = activeColor;
        ctx.fill();

        ctx.restore();
    }
}

// 9. Motor Principal de Combate, Arsenal e IA (GunRun 2D)
class GunRunEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.virtualWidth = 1000;
        this.virtualHeight = 600;

        // Subsistemas
        this.soundFX = new SoundFX();
        this.state = 'READY'; // READY, PLAYING, PAUSED, GAME_OVER

        // Entidades y Colecciones
        this.player = new Player(this.virtualWidth / 2, this.virtualHeight / 2);
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.floatingTexts = [];
        this.activeBoss = null;

        // Screen Shake
        this.screenShake = 0;

        // Estadísticas de la Partida Actual
        this.score = 0;
        this.wave = 1;
        this.kills = 0;
        this.startTime = 0;
        this.survivalTime = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;

        // Gestor de Oleadas
        this.waveInProgress = false;
        this.enemiesToSpawn = 0;
        this.spawnInterval = 1.0;
        this.spawnTimer = 0;
        this.waveBannerTimer = 0;
        this.waveBannerText = '';

        // Controles de entrada
        this.input = {
            keys: {},
            mouse: { x: this.virtualWidth / 2 + 60, y: this.virtualHeight / 2, isDown: false },
            analog: { x: 0, y: 0 },                 // Joystick izquierdo (movimiento)
            aim: { x: 0, y: 0, active: false }      // Joystick derecho (apuntar/disparar)
        };

        this.lastTouchTs = 0;
        this.gameOverTs = 0;

        // Métricas de FPS
        this.lastTime = performance.now();
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTimer = 0;

        this.setupEventListeners();
        this.resize();

        // Loop continuo a 60 FPS
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    get isTouch() {
        return document.body.classList.contains('is-touch');
    }

    cycleWeapon(dir = 1) {
        const order = ['blaster', 'shotgun', 'railgun'];
        const idx = order.indexOf(this.player.currentWeapon);
        this.player.setWeapon(order[(idx + dir + order.length) % order.length]);
    }

    // Publica el estado del juego en el contenedor (lo usa el CSS táctil) y suelta los controles
    syncUIState() {
        const vp = this.canvas.parentElement;
        if (!vp || vp.dataset.state === this.state) return;
        vp.dataset.state = this.state;

        this.input.analog.x = 0;
        this.input.analog.y = 0;
        if (this.input.aim.active) this.input.mouse.isDown = false;
        this.input.aim.active = false;

        if (this.state === 'GAME_OVER') this.gameOverTs = performance.now();
        window.dispatchEvent(new CustomEvent('gunrun:state', { detail: this.state }));
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
        document.addEventListener('fullscreenchange', () => this.resize());
        document.addEventListener('webkitfullscreenchange', () => this.resize());

        // Auto-pausa si el jugador cambia de app/pestaña o bloquea el celular
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === 'PLAYING') this.togglePause();
        });

        window.addEventListener('keydown', (e) => {
            const gameKeys = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyR', 'Digit1', 'Digit2', 'Digit3'];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }

            this.soundFX.init();
            this.input.keys[e.code] = true;

            if (e.code === 'Escape' || e.code === 'KeyP') {
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            const gameKeys = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyR', 'Digit1', 'Digit2', 'Digit3'];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
            this.input.keys[e.code] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.virtualWidth / rect.width;
            const scaleY = this.virtualHeight / rect.height;
            this.input.mouse.x = (e.clientX - rect.left) * scaleX;
            this.input.mouse.y = (e.clientY - rect.top) * scaleY;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (performance.now() - this.lastTouchTs < 800) return;
            this.soundFX.init();
            if (e.button === 0) {
                this.input.mouse.isDown = true;
                if (this.state === 'READY') {
                    this.start();
                } else if (this.state === 'GAME_OVER') {
                    this.restart();
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            if (e.button === 0) this.input.mouse.isDown = false;
        });

        // Alternar armas con la rueda del ratón
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const weapons = ['blaster', 'shotgun', 'railgun'];
            let idx = weapons.indexOf(this.player.currentWeapon);
            if (e.deltaY > 0) {
                idx = (idx + 1) % weapons.length;
            } else {
                idx = (idx - 1 + weapons.length) % weapons.length;
            }
            this.player.setWeapon(weapons[idx]);
        }, { passive: false });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('dragstart', (e) => e.preventDefault());

        // Táctil: tocar la pantalla inicia, reinicia o reanuda la partida
        this.canvas.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'touch') return;
            this.lastTouchTs = performance.now();
            document.body.classList.add('is-touch');
            this.soundFX.init();

            if (this.state === 'READY') {
                this.start();
            } else if (this.state === 'GAME_OVER') {
                if (performance.now() - this.gameOverTs > 900) this.restart();
            } else if (this.state === 'PAUSED') {
                this.togglePause();
            }
        });
    }

    isFullscreenActive() {
        const c = this.canvas.parentElement;
        return !!(document.fullscreenElement || document.webkitFullscreenElement ||
                  (c && c.classList.contains('pseudo-fullscreen')));
    }

    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const fs = this.isFullscreenActive();
        const landscape = window.innerWidth > window.innerHeight;

        // Ancho disponible
        let maxW = fs ? container.clientWidth : Math.min(container.clientWidth, 1000);

        // Alto disponible: en pantalla completa o en celular horizontal, el canvas debe caber sin hacer scroll
        let maxH = Infinity;
        if (fs) maxH = container.clientHeight;
        else if (this.isTouch && landscape) maxH = window.innerHeight * 0.92;

        // En pantalla completa vertical (celular) se deja espacio para los controles táctiles
        if (fs && this.isTouch && !landscape) maxH = window.innerHeight - 240;

        const targetWidth = Math.max(160, Math.min(maxW, (maxH * 1000) / 600));
        const targetHeight = (targetWidth * 600) / 1000;

        this.canvas.width = this.virtualWidth;
        this.canvas.height = this.virtualHeight;
        this.canvas.style.width = `${targetWidth}px`;
        this.canvas.style.height = `${targetHeight}px`;
    }

    start() {
        this.state = 'PLAYING';
        this.startTime = performance.now();
        this.startWave(1);
        this.updateHUDStatus('EN COMBATE');
        this.centerView();
    }

    centerView() {
        if (this.canvas) {
            this.canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    enterPseudoFullscreen(container) {
        container.classList.add('pseudo-fullscreen');
        document.body.classList.add('no-scroll');
        setTimeout(() => this.resize(), 50);
    }

    toggleFullscreen() {
        const container = this.canvas.parentElement;
        const nativeFs = document.fullscreenElement || document.webkitFullscreenElement;
        const pseudo = container.classList.contains('pseudo-fullscreen');

        // Salir
        if (nativeFs || pseudo) {
            if (pseudo) {
                container.classList.remove('pseudo-fullscreen');
                document.body.classList.remove('no-scroll');
            }
            if (nativeFs) {
                (document.exitFullscreen || document.webkitExitFullscreen).call(document);
            }
            try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { }
            setTimeout(() => this.resize(), 50);
            return;
        }

        // Entrar (en iPhone no existe la API: se usa el modo "pantalla completa" por CSS)
        const request = container.requestFullscreen || container.webkitRequestFullscreen;
        if (!request) {
            this.enterPseudoFullscreen(container);
            return;
        }

        const lockLandscape = () => {
            if (this.isTouch && screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => { });
            }
        };
        const result = request.call(container);
        if (result && result.then) {
            result.then(lockLandscape).catch(() => this.enterPseudoFullscreen(container));
        } else {
            lockLandscape();
        }
    }

    restart() {
        this.player = new Player(this.virtualWidth / 2, this.virtualHeight / 2);
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.floatingTexts = [];
        this.activeBoss = null;
        this.screenShake = 0;
        this.score = 0;
        this.wave = 1;
        this.kills = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.survivalTime = 0;
        this.start();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.updateHUDStatus('PAUSADO');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.updateHUDStatus('EN COMBATE');
            this.lastTime = performance.now();
        }
    }

    triggerShake(amount = 8) {
        this.screenShake = Math.max(this.screenShake, amount);
    }

    startWave(waveNumber) {
        this.wave = waveNumber;
        this.waveInProgress = true;
        this.spawnTimer = 0;

        // Comprobar si es Oleada de Jefe (cada 5 oleadas)
        if (waveNumber % 5 === 0) {
            this.waveBannerText = `¡¡ALERTA: TITAN GOLIATH (OLEADA ${waveNumber})!!`;
            this.waveBannerTimer = 3.5;
            this.enemiesToSpawn = 6 + waveNumber * 2;
            this.spawnInterval = 1.2;
            this.soundFX.playBossAlert();
            this.triggerShake(12);

            // Generar inmediatamente al Jefe
            const boss = new Enemy(this.virtualWidth / 2, -50, 'boss', waveNumber);
            this.enemies.push(boss);
            this.activeBoss = boss;
        } else {
            this.activeBoss = null;
            this.enemiesToSpawn = 5 + (waveNumber * 3);
            this.spawnInterval = Math.max(0.35, 1.3 - (waveNumber * 0.08));
            this.waveBannerText = `¡OLEADA ${waveNumber} ENTRANTE!`;
            this.waveBannerTimer = 2.5;
        }
    }

    spawnEnemy() {
        const edge = Math.floor(Math.random() * 4);
        let x = 0;
        let y = 0;

        if (edge === 0) {
            x = Math.random() * this.virtualWidth;
            y = -25;
        } else if (edge === 1) {
            x = this.virtualWidth + 25;
            y = Math.random() * this.virtualHeight;
        } else if (edge === 2) {
            x = Math.random() * this.virtualWidth;
            y = this.virtualHeight + 25;
        } else {
            x = -25;
            y = Math.random() * this.virtualHeight;
        }

        // Selección de tipo según avance de oleadas
        const rand = Math.random();
        let type = 'drone';

        if (this.wave >= 3 && rand < 0.22) {
            type = 'shooter'; // Francotirador
        } else if (this.wave >= 2 && rand < 0.40) {
            type = 'kamikaze'; // Suicida veloz
        } else if (this.wave >= 2 && rand < 0.65) {
            type = 'tank'; // Blindado
        }

        this.enemies.push(new Enemy(x, y, type, this.wave));
        this.enemiesToSpawn--;
    }

    createExplosion(x, y, color = '#ff0055', count = 18) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 4;
            const life = 0.3 + Math.random() * 0.4;
            this.particles.push(new Particle(x, y, color, vx, vy, life, size));
        }
    }

    triggerNuke() {
        this.soundFX.playNuke();
        this.triggerShake(20);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.type !== 'boss') {
                this.kills++;
                this.score += enemy.scoreValue;
                this.createExplosion(enemy.x, enemy.y, '#ff5500', 25);
                this.enemies.splice(i, 1);
            } else {
                enemy.takeDamage(250);
                this.createExplosion(enemy.x, enemy.y, '#ff5500', 30);
            }
        }

        this.floatingTexts.push(new FloatingText(this.virtualWidth / 2, this.virtualHeight / 2 - 20, '¡¡PEM NUKE DETONADA!!', '#ff5500', 22, 1.4));
    }

    updateHUDStatus(text) {
        const el = document.getElementById('hud-game-status');
        if (el) el.textContent = text;
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        // FPS
        this.frameCount++;
        this.fpsTimer += dt;
        if (this.fpsTimer >= 0.5) {
            this.fps = Math.round(this.frameCount / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
            const el = document.getElementById('hud-fps');
            if (el) el.textContent = `${this.fps} FPS`;
        }

        this.syncUIState();

        // Screen Shake decay
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * 25);
        }

        if (this.state === 'PLAYING') {
            this.survivalTime += dt;
            if (this.waveBannerTimer > 0) this.waveBannerTimer -= dt;

            // 1. Jugador
            this.player.update(dt, this.input, this.virtualWidth, this.virtualHeight, (bullet) => {
                this.bullets.push(bullet);
                this.shotsFired++;
            }, this.soundFX);

            // 2. Balas del Jugador
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const b = this.bullets[i];
                b.update(dt);

                if (b.x < 4 || b.x > this.virtualWidth - 4 || b.y < 4 || b.y > this.virtualHeight - 4 || b.life <= 0) {
                    this.createExplosion(b.x, b.y, b.color, 4);
                    this.bullets.splice(i, 1);
                }
            }

            // 3. Proyectiles Enemigos
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const eb = this.enemyBullets[i];
                eb.update(dt);

                // Colisión con límites
                if (eb.x < 4 || eb.x > this.virtualWidth - 4 || eb.y < 4 || eb.y > this.virtualHeight - 4 || eb.life <= 0) {
                    this.createExplosion(eb.x, eb.y, eb.color, 4);
                    this.enemyBullets.splice(i, 1);
                    continue;
                }

                // Colisión con el Jugador
                const distPlayer = Math.hypot(this.player.x - eb.x, this.player.y - eb.y);
                if (distPlayer < this.player.radius + eb.radius) {
                    this.createExplosion(eb.x, eb.y, eb.color, 8);
                    this.enemyBullets.splice(i, 1);
                    this.triggerShake(7);

                    if (this.player.takeDamage(eb.damage, this.soundFX)) {
                        this.gameOver();
                        break;
                    }
                }
            }

            // 4. Spawns de Enemigos
            if (this.enemiesToSpawn > 0) {
                this.spawnTimer += dt;
                if (this.spawnTimer >= this.spawnInterval) {
                    this.spawnTimer = 0;
                    this.spawnEnemy();
                }
            } else if (this.enemies.length === 0 && this.waveInProgress) {
                this.waveInProgress = false;
                setTimeout(() => {
                    if (this.state === 'PLAYING') {
                        this.startWave(this.wave + 1);
                    }
                }, 1800);
            }

            // 5. Actualización y Colisiones de Enemigos
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                enemy.update(dt, this.player.x, this.player.y, (enemyBullet) => {
                    this.enemyBullets.push(enemyBullet);
                    this.soundFX.playEnemyShoot();
                });

                // Colisión Enemigo - Balas de Jugador
                let enemyDied = false;
                for (let j = this.bullets.length - 1; j >= 0; j--) {
                    const bullet = this.bullets[j];
                    if (bullet.hitEnemyIds.has(enemy.id)) continue;

                    const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);

                    if (dist < enemy.radius + bullet.radius) {
                        bullet.hitEnemyIds.add(enemy.id);
                        bullet.hits++;
                        this.shotsHit++;
                        this.soundFX.playHit();
                        this.createExplosion(bullet.x, bullet.y, enemy.color, 5);

                        // Texto de daño
                        const isCrit = Math.random() < 0.15;
                        const finalDmg = isCrit ? bullet.damage * 2 : bullet.damage;
                        const txtColor = isCrit ? '#ffe600' : '#ffffff';
                        this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 12, isCrit ? `CRIT! -${finalDmg}` : `-${finalDmg}`, txtColor, isCrit ? 14 : 11));

                        if (bullet.hits >= bullet.piercing) {
                            this.bullets.splice(j, 1);
                        }

                        if (enemy.takeDamage(finalDmg)) {
                            enemyDied = true;
                            this.kills++;
                            this.score += enemy.scoreValue;
                            this.soundFX.playExplosion();
                            this.createExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 50 : 22);

                            if (enemy.type === 'boss') {
                                this.activeBoss = null;
                                this.triggerShake(16);
                                this.floatingTexts.push(new FloatingText(enemy.x, enemy.y, '¡¡TITAN OMEGA ANIQUILADO!! +2500', '#00ffcc', 18, 1.8));

                                // El jefe garantiza múltiples drops
                                this.powerUps.push(new PowerUp(enemy.x - 30, enemy.y, 'health'));
                                this.powerUps.push(new PowerUp(enemy.x + 30, enemy.y, 'shield'));
                                this.powerUps.push(new PowerUp(enemy.x, enemy.y + 30, 'rapid'));
                            } else {
                                // Probabilidad de drop de power-up normal
                                const dropRoll = Math.random();
                                if (dropRoll < 0.18) {
                                    const pTypes = ['health', 'ammo', 'shield', 'rapid', 'nuke'];
                                    const chosenType = pTypes[Math.floor(Math.random() * pTypes.length)];
                                    this.powerUps.push(new PowerUp(enemy.x, enemy.y, chosenType));
                                }
                            }
                            break;
                        }
                    }
                }

                if (enemyDied) {
                    this.enemies.splice(i, 1);
                    continue;
                }

                // Colisión Enemigo - Jugador (Daño por contacto)
                const distPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
                if (distPlayer < this.player.radius + enemy.radius) {
                    const pushAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
                    this.player.x += Math.cos(pushAngle) * 35;
                    this.player.y += Math.sin(pushAngle) * 35;

                    this.soundFX.playHit();
                    this.triggerShake(8);

                    if (this.player.takeDamage(enemy.damage, this.soundFX)) {
                        this.gameOver();
                        break;
                    }

                    // Si era kamikaze, explota al contactar
                    if (enemy.type === 'kamikaze') {
                        this.soundFX.playExplosion();
                        this.createExplosion(enemy.x, enemy.y, enemy.color, 25);
                        this.enemies.splice(i, 1);
                    }
                }
            }

            // 6. Actualización y Recolección de Power-Ups
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const pup = this.powerUps[i];
                pup.update(dt);

                if (pup.life <= 0) {
                    this.powerUps.splice(i, 1);
                    continue;
                }

                // Recoger con proximidad
                const distPlayer = Math.hypot(this.player.x - pup.x, this.player.y - pup.y);
                if (distPlayer < this.player.radius + pup.radius + 6) {
                    this.soundFX.playPowerUp();
                    this.floatingTexts.push(new FloatingText(pup.x, pup.y - 10, pup.label, pup.color, 14, 1.1));

                    if (pup.type === 'health') {
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
                    } else if (pup.type === 'ammo') {
                        this.player.reserveAmmo += 60;
                        this.player.ammo = this.player.clipSize;
                    } else if (pup.type === 'shield') {
                        this.player.shield = Math.min(this.player.maxShield, this.player.shield + 35);
                    } else if (pup.type === 'rapid') {
                        this.player.frenzyTimer = 7.5;
                    } else if (pup.type === 'nuke') {
                        this.triggerNuke();
                    }

                    this.createExplosion(pup.x, pup.y, pup.color, 12);
                    this.powerUps.splice(i, 1);
                }
            }

            // 7. Partículas y Textos Flotantes
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update(dt);
                if (this.particles[i].life <= 0) this.particles.splice(i, 1);
            }

            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                this.floatingTexts[i].update(dt);
                if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1);
            }
        }

        this.render();
        requestAnimationFrame(this.loop);
    }

    gameOver() {
        this.state = 'GAME_OVER';
        this.soundFX.playExplosion();
        this.createExplosion(this.player.x, this.player.y, '#00ffcc', 40);
        this.triggerShake(15);
        this.updateHUDStatus('CAÍDO EN ACCIÓN');

        const finalScore = this.score;
        const finalWave = this.wave;
        const finalKills = this.kills;
        const finalTime = Math.round(this.survivalTime);
        const accuracy = this.shotsFired > 0 ? parseFloat(((this.shotsHit / this.shotsFired) * 100).toFixed(1)) : 0;

        // Sincronizar automáticamente con el formulario CRUD
        const simScore = document.getElementById('sim-score');
        const simWave = document.getElementById('sim-wave');
        const simKills = document.getElementById('sim-kills');
        const simTime = document.getElementById('sim-time');
        const simAcc = document.getElementById('sim-accuracy');

        if (simScore) simScore.value = finalScore;
        if (simWave) simWave.value = finalWave;
        if (simKills) simKills.value = finalKills;
        if (simTime) simTime.value = finalTime;
        if (simAcc) simAcc.value = accuracy;

        // Auto-guardado en base de datos MySQL
        this.saveStatus = 'Sincronizando récord con MySQL...';
        this.autoSaveMatch(finalScore, finalWave, finalKills, finalTime, accuracy);
    }

    async autoSaveMatch(score, wave, kills, time, accuracy) {
        const token = sessionStorage.getItem('gunrun_token');
        if (!token) {
            this.saveStatus = 'Inicia sesión para guardar tu récord';
            return;
        }

        const API_URL = (window.location.origin && window.location.origin.startsWith('http'))
            ? `${window.location.origin}/api`
            : 'http://127.0.0.1:5000/api';

        try {
            const response = await fetch(`${API_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ score, wave, kills, survival_time: time, accuracy })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                this.saveStatus = '✓ Récord guardado exitosamente en MySQL';
                if (window.fetchLeaderboard) window.fetchLeaderboard();
                if (window.fetchUserStats) window.fetchUserStats();
                if (window.fetchUserHistory) window.fetchUserHistory();
                if (window.fetchAchievements) window.fetchAchievements();
                if (window.showAlert) window.showAlert(`¡Partida sincronizada en MySQL! Puntuación: +${score.toLocaleString()} pts`, 'success');

                if (data.data.new_achievements && data.data.new_achievements.length > 0) {
                    data.data.new_achievements.forEach(ach => {
                        if (window.showToast) window.showToast('¡LOGRO DESBLOQUEADO!', `${ach.title}: ${ach.description}`, 'achievement', 6000);
                    });
                }
            } else {
                this.saveStatus = `Aviso: ${data.error || 'No se pudo guardar'}`;
            }
        } catch (error) {
            this.saveStatus = 'No se pudo conectar con el servidor MySQL';
            console.error('Error auto-guardado:', error);
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.virtualWidth;
        const h = this.virtualHeight;

        ctx.save();

        // Aplicar Screen Shake dinámico
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(shakeX, shakeY);
        }

        ctx.fillStyle = '#07090e';
        ctx.fillRect(0, 0, w, h);

        this.drawNeonGrid(ctx, w, h);
        this.drawBorders(ctx, w, h);

        // Power-Ups en la arena
        for (const pup of this.powerUps) pup.draw(ctx);

        // Partículas
        for (const p of this.particles) p.draw(ctx);

        // Balas del jugador
        for (const b of this.bullets) b.draw(ctx);

        // Proyectiles enemigos
        for (const eb of this.enemyBullets) eb.draw(ctx);

        // Enemigos
        for (const e of this.enemies) e.draw(ctx);

        // Textos flotantes
        for (const ft of this.floatingTexts) ft.draw(ctx);

        // Jugador
        if (this.state !== 'GAME_OVER') {
            this.player.draw(ctx);
        }

        ctx.restore();

        // Crosshair e interfaces (no afectados por shake)
        this.drawCrosshair(ctx, this.input.mouse.x, this.input.mouse.y);
        this.drawCombatHUD(ctx, w, h);
    }

    drawNeonGrid(ctx, w, h) {
        const gridSize = 50;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.04)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let x = 0; x <= w; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        for (let y = 0; y <= h; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 130, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.06)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    drawBorders(ctx, w, h) {
        ctx.save();
        ctx.strokeStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, w - 8, h - 8);

        const cSize = 22;
        ctx.strokeStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, cSize, cSize);
        ctx.strokeRect(w - 4 - cSize, 4, cSize, cSize);
        ctx.strokeRect(4, h - 4 - cSize, cSize, cSize);
        ctx.strokeRect(w - 4 - cSize, h - 4 - cSize, cSize, cSize);
        ctx.restore();
    }

    drawCrosshair(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-18, 0); ctx.lineTo(-6, 0);
        ctx.moveTo(6, 0); ctx.lineTo(18, 0);
        ctx.moveTo(0, -18); ctx.lineTo(0, -6);
        ctx.moveTo(0, 6); ctx.lineTo(0, 18);
        ctx.stroke();

        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawCombatHUD(ctx, w, h) {
        ctx.save();

        // 1. Barra de Salud y Escudo Superior Izquierda
        const barX = 24;
        const barY = 24;
        const barW = 200;
        const barH = 14;
        const healthPct = Math.max(0, this.player.health / this.player.maxHealth);

        // Salud
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(barX, barY, barW, barH);

        ctx.fillStyle = healthPct > 0.3 ? '#00ffcc' : '#ff3344';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(barX, barY, barW * healthPct, barH);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px "Orbitron", monospace';
        ctx.shadowBlur = 0;
        ctx.fillText(`SALUD: ${Math.round(this.player.health)} / 100`, barX, barY - 5);

        // Escudo Protector (debajo de la salud)
        if (this.player.shield > 0) {
            const shieldPct = Math.min(1, this.player.shield / this.player.maxShield);
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(barX, barY + barH + 4, barW, 6);
            ctx.fillStyle = '#00ccff';
            ctx.shadowColor = '#00ccff';
            ctx.shadowBlur = 8;
            ctx.fillRect(barX, barY + barH + 4, barW * shieldPct, 6);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#00ccff';
            ctx.font = '9px "Orbitron", monospace';
            ctx.fillText(`SOBREESCUDO: ${Math.round(this.player.shield)}`, barX, barY + barH + 20);
        }

        // 2. Barra del Jefe Titan (si está activo)
        if (this.activeBoss && this.activeBoss.health > 0) {
            const bossBarW = 340;
            const bossBarH = 12;
            const bossBarX = (w - bossBarW) / 2;
            const bossBarY = 24;
            const bossPct = Math.max(0, this.activeBoss.health / this.activeBoss.maxHealth);

            ctx.fillStyle = 'rgba(10, 5, 20, 0.85)';
            ctx.fillRect(bossBarX, bossBarY, bossBarW, bossBarH);
            ctx.strokeStyle = '#ff007f';
            ctx.strokeRect(bossBarX, bossBarY, bossBarW, bossBarH);

            ctx.fillStyle = '#ff007f';
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 12;
            ctx.fillRect(bossBarX, bossBarY, bossBarW * bossPct, bossBarH);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px "Orbitron", monospace';
            ctx.shadowBlur = 0;
            ctx.fillText(`TITAN PROTOCOL OMEGA: ${Math.round(this.activeBoss.health)} / ${this.activeBoss.maxHealth}`, w / 2, bossBarY - 6);
        }

        // 3. Cargador, Munición y Arma Activa (Abajo Izquierda)
        const ammoX = this.isTouch ? Math.round(w / 2 - 110) : 24;
        const ammoY = h - 38;
        const curWpn = this.player.weapons[this.player.currentWeapon];

        ctx.textAlign = 'left';
        ctx.font = 'bold 12px "Orbitron", monospace';
        ctx.fillStyle = curWpn.color;
        ctx.shadowColor = curWpn.color;
        ctx.shadowBlur = 8;
        ctx.fillText(`ARMA: ${curWpn.name.toUpperCase()}`, ammoX, ammoY);

        if (this.player.frenzyTimer > 0) {
            ctx.font = 'bold 11px "Orbitron", monospace';
            ctx.fillStyle = '#ffe600';
            ctx.shadowColor = '#ffe600';
            ctx.shadowBlur = 10;
            ctx.fillText(`¡FRENESÍ ACTIVO! [${this.player.frenzyTimer.toFixed(1)}s]`, ammoX + 220, ammoY);
        }

        if (this.player.isReloading) {
            const reloadPct = Math.min(1, this.player.reloadTimer / this.player.reloadDuration);
            ctx.fillStyle = '#ffe600';
            ctx.shadowColor = '#ffe600';
            ctx.shadowBlur = 8;
            ctx.font = '12px "Orbitron", monospace';
            ctx.fillText(`RECARGANDO... [${Math.round(reloadPct * 100)}%]`, ammoX, ammoY + 18);

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(ammoX, ammoY + 24, 140, 5);
            ctx.fillStyle = '#ffe600';
            ctx.fillRect(ammoX, ammoY + 24, 140 * reloadPct, 5);
        } else {
            ctx.font = '13px "Orbitron", monospace';
            ctx.fillStyle = this.player.ammo <= 5 ? '#ff3344' : '#00ffcc';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fillText(`MUNICIÓN: ${this.player.ammo} / ${this.player.reserveAmmo}`, ammoX, ammoY + 18);
        }

        // 4. Puntuación, Oleada y Bajas (Superior Derecha)
        ctx.textAlign = 'right';
        ctx.font = 'bold 20px "Orbitron", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10;
        ctx.fillText(`${this.score.toLocaleString()} PTS`, w - 24, 34);

        ctx.font = '13px "Orbitron", monospace';
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 8;
        ctx.fillText(`OLEADA ${this.wave}`, w - 24, 56);

        ctx.font = '12px "Rajdhani", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.shadowBlur = 0;
        const accuracy = this.shotsFired > 0 ? ((this.shotsHit / this.shotsFired) * 100).toFixed(1) : 0;
        ctx.fillText(`BAJAS: ${this.kills} | PRECISIÓN: ${accuracy}%`, w - 24, 76);

        // 5. Banner de Oleada Temporal
        if (this.waveBannerTimer > 0 && this.state === 'PLAYING') {
            ctx.textAlign = 'center';
            ctx.fillStyle = this.wave % 5 === 0 ? '#ff007f' : '#ffe600';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 20;
            ctx.font = 'bold 28px "Orbitron", monospace';
            ctx.fillText(this.waveBannerText, w / 2, 140);
        }

        // 6. Modales de Pantalla (Ready, Pause, Game Over)
        if (this.state === 'READY') {
            this.drawOverlayText(ctx, w, h, 'GUNRUN 2D', this.isTouch ? 'TOCA LA PANTALLA PARA INICIAR' : 'HAZ CLIC O PRESIONA WASD PARA INICIAR', '#00ffcc');
        } else if (this.state === 'PAUSED') {
            this.drawOverlayText(ctx, w, h, 'PARTIDA EN PAUSA', this.isTouch ? 'TOCA LA PANTALLA PARA CONTINUAR' : 'PRESIONA [ESCAPE] PARA CONTINUAR', '#ffe600');
        } else if (this.state === 'GAME_OVER') {
            this.drawGameOverScreen(ctx, w, h);
        }

        ctx.restore();
    }

    drawOverlayText(ctx, w, h, title, subtitle, color) {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 7, 12, 0.78)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.font = 'bold 36px "Orbitron", monospace';
        ctx.fillText(title, w / 2, h / 2 - 15);

        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.font = '14px "Rajdhani", sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText(subtitle, w / 2, h / 2 + 25);
        ctx.restore();
    }

    drawGameOverScreen(ctx, w, h) {
        ctx.save();
        ctx.fillStyle = 'rgba(8, 5, 12, 0.90)';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 25;
        ctx.font = 'bold 42px "Orbitron", monospace';
        ctx.fillText('FIN DE LA PARTIDA', w / 2, h / 2 - 60);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10;
        ctx.font = 'bold 22px "Orbitron", monospace';
        ctx.fillText(`PUNTUACIÓN FINAL: ${this.score.toLocaleString()} PTS`, w / 2, h / 2 - 15);

        ctx.font = '16px "Rajdhani", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.shadowBlur = 0;
        const accuracy = this.shotsFired > 0 ? ((this.shotsHit / this.shotsFired) * 100).toFixed(1) : 0;
        ctx.fillText(`Oleada: ${this.wave} | Bajas: ${this.kills} | Tiempo: ${Math.round(this.survivalTime)}s | Precisión: ${accuracy}%`, w / 2, h / 2 + 18);

        // Indicador de Sincronización Automática con MySQL
        if (this.saveStatus) {
            ctx.fillStyle = this.saveStatus.includes('✓') ? '#39ff14' : '#ffe600';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.font = 'bold 14px "Rajdhani", sans-serif';
            ctx.fillText(this.saveStatus, w / 2, h / 2 + 56);
        }

        ctx.fillStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 12;
        ctx.font = 'bold 15px "Orbitron", monospace';
        ctx.fillText(this.isTouch ? 'TOCA LA PANTALLA PARA VOLVER AL COMBATE' : 'HAZ CLIC O PRESIONA REINICIAR PARA VOLVER AL COMBATE', w / 2, h / 2 + 95);

        ctx.restore();
    }
}

// Inicialización Automática
window.addEventListener('DOMContentLoaded', () => {
    window.gunRunGame = new GunRunEngine('gameCanvas');

    const btnStart = document.getElementById('btn-game-start');
    const btnPause = document.getElementById('btn-game-pause');
    const btnResetPos = document.getElementById('btn-game-reset-pos');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            if (window.gunRunGame) {
                if (window.gunRunGame.state === 'GAME_OVER') window.gunRunGame.restart();
                else window.gunRunGame.start();
            }
        });
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            if (window.gunRunGame) window.gunRunGame.togglePause();
        });
    }

    if (btnResetPos) {
        btnResetPos.addEventListener('click', () => {
            if (window.gunRunGame) window.gunRunGame.restart();
        });
    }

    const btnFullscreen = document.getElementById('btn-game-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (window.gunRunGame) window.gunRunGame.toggleFullscreen();
        });
    }

    const btnCenter = document.getElementById('btn-game-center');
    if (btnCenter) {
        btnCenter.addEventListener('click', () => {
            if (window.gunRunGame) window.gunRunGame.centerView();
        });
    }

    const btnToggleSound = document.getElementById('btn-toggle-sound');
    if (btnToggleSound) {
        btnToggleSound.addEventListener('click', () => {
            if (window.gunRunGame && window.gunRunGame.soundFX) {
                window.gunRunGame.soundFX.toggleMute();
            }
        });
    }

    // Botones del Arsenal [1] Blaster, [2] Escopeta, [3] Railgun
    const wpnButtons = document.querySelectorAll('.btn-weapon');
    wpnButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const weaponType = btn.dataset.weapon;
            if (window.gunRunGame && window.gunRunGame.player) {
                window.gunRunGame.player.setWeapon(weaponType);
            }
        });
    });

    // Auto-pausar la simulación al abrir cualquier modal (Guía, Logros, Historial)
    document.querySelectorAll('.modal').forEach(modalEl => {
        modalEl.addEventListener('show.bs.modal', () => {
            if (window.gunRunGame && window.gunRunGame.state === 'PLAYING') {
                window.gunRunGame.togglePause();
            }
        });
    });
});

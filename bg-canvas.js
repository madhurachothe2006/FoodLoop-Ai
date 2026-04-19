(() => {
    const canvas = document.getElementById('bg-canvas');
    const ctx    = canvas.getContext('2d');

    // ── Pre-defined Neon Palettes ─────────────────────────────────
    const NEON_PALETTES = [
        { main: '#ff0055', glow: '#ff3366', core: '#ffe5ed' }, // Pink (Strawberry)
        { main: '#00ffaa', glow: '#33ffcc', core: '#e5fff9' }, // Green (Grapes)
        { main: '#ffcc00', glow: '#ffdb4d', core: '#fff9e5' }, // Yellow (Lemon/Apple)
        { main: '#ff4400', glow: '#ff7733', core: '#ffece5' }, // Orange (Tomato)
        { main: '#9933cc', glow: '#b366e6', core: '#f5e5ff' }, // Purple (Brinjal)
        { main: '#00ccff', glow: '#4ddbff', core: '#e5f9ff' }, // Blue (Misc)
    ];

    // ── High-Quality "Neon Ikon" Paths (100x100) ──────────────────
    const FRUIT_ICONS = [
        // 1. Strawberry (with seeds)
        {
            path: new Path2D("M50 90 C30 90 15 75 15 50 C15 30 30 15 50 15 C70 15 85 30 85 50 C85 75 70 90 50 90 Z M40 25 L35 15 M60 25 L65 15 M50 25 L50 15 M35 45 h1 M65 45 h1 M50 60 h1 M40 70 h1 M60 70 h1"),
            palette: NEON_PALETTES[0]
        },
        // 2. Grapes (Circle clusters)
        {
            path: new Path2D("M40 35 a10 10 0 1 0 0.1 0 Z M60 35 a10 10 0 1 0 0.1 0 Z M50 50 a10 10 0 1 0 0.1 0 Z M35 60 a10 10 0 1 0 0.1 0 Z M65 60 a10 10 0 1 0 0.1 0 Z M50 75 a10 10 0 1 0 0.1 0 Z M50 25 L50 10"),
            palette: NEON_PALETTES[1]
        },
        // 3. Apple (with leaf)
        {
            path: new Path2D("M50 25 C30 25 15 40 15 60 C15 80 30 90 50 90 C70 90 85 80 85 60 C85 40 70 25 50 25 Z M50 25 L50 10 Q65 10 70 0"),
            palette: NEON_PALETTES[2]
        },
        // 4. Tomato
        {
            path: new Path2D("M50 85 A35 35 0 1 0 50 15 A35 35 0 1 0 50 85 Z M40 15 L30 5 M60 15 L70 5 M50 15 L50 5"),
            palette: NEON_PALETTES[3]
        },
        // 5. Brinjal (Curved)
        {
            path: new Path2D("M50 20 Q80 20 80 55 C80 85 55 95 25 65 C15 35 30 15 50 20 Z M40 20 L35 10 M60 20 L65 10"),
            palette: NEON_PALETTES[4]
        }
    ];

    const rand  = (a, b)  => Math.random() * (b - a) + a;
    const pick  = arr     => arr[Math.floor(Math.random() * arr.length)];
    const clamp = (v,a,b) => Math.min(b, Math.max(a, v));

    // ── Resize helper ───────────────────────────────────────────────
    const resize = () => {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Node class (Neon Sign Prototype) ────────────────────────────
    class Node {
        constructor() { 
            const entry = pick(FRUIT_ICONS);
            this.path    = entry.path;
            this.palette = entry.palette;
            this.reset(true); 
        }

        reset(initial = false) {
            this.x      = rand(0, canvas.width);
            this.y      = initial ? rand(0, canvas.height) : (Math.random() < 0.5 ? -30 : canvas.height + 30);
            this.vx     = rand(-0.2, 0.2);
            this.vy     = rand(-0.2, 0.2);
            this.scale  = rand(0.15, 0.35); // Small size as requested
            this.alpha  = rand(0.12, 0.25);
            this.rotation = rand(0, Math.PI * 2);
            this.rotationSpeed = rand(-0.005, 0.005);
            this.pulseSpeed = rand(0.004, 0.012);
            this.pulsePhase = rand(0, Math.PI * 2);
            this.life = 0;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;
            this.life++;
            // bounce off walls gently
            if (this.x < 0 || this.x > canvas.width)  this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }

        get pulse() {
            return 0.7 + 0.3 * Math.abs(Math.sin(this.life * this.pulseSpeed + this.pulsePhase));
        }

        draw() {
            const p = this.pulse;
            const a = this.alpha * p;
            
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.scale(this.scale, this.scale);
            ctx.translate(-50, -50); // Center the 100x100 ikon

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // 1. Outer Glow (Atmosphere)
            ctx.shadowBlur  = 35 * p;
            ctx.shadowColor = this.palette.glow;
            ctx.lineWidth   = 6;
            ctx.strokeStyle = `${this.palette.main}33`; // low alpha hex
            ctx.stroke(this.path);

            // 2. Middle Glow (Intense Gas)
            ctx.shadowBlur  = 15 * p;
            ctx.lineWidth   = 3;
            ctx.strokeStyle = this.palette.main;
            ctx.globalAlpha = a;
            ctx.stroke(this.path);

            // 3. Bright Core (Filament)
            ctx.shadowBlur  = 5;
            ctx.lineWidth   = 1;
            ctx.strokeStyle = this.palette.core;
            ctx.globalAlpha = a * 0.8;
            ctx.stroke(this.path);

            ctx.restore();
        }
    }

    // ── Build scene ─────────────────────────────────────────────────
    const NODE_COUNT = 14; 
    const nodes = Array.from({ length: NODE_COUNT }, () => new Node());

    // ── Animation loop ──────────────────────────────────────────────
    const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        nodes.forEach(n => { n.update(); n.draw(); });
        requestAnimationFrame(loop);
    };

    loop();
})();

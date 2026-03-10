const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const staminaBarEl = document.getElementById("stamina-bar");
const overlayEl = document.getElementById("message-overlay");
const mainMsgEl = document.getElementById("main-message");
const subMsgEl = document.getElementById("sub-message");

const playerImg = new Image();
playerImg.src = 'ava.png'; 

let mouseInCanvas = false;
let gameState = 'START'; 
let score = 0;
let cameraY = 0;
let highestY = 0; 
let shakeAmount = 0; 
let winTimer = 0;

const TARGET_SCORE = 200; 

// stamina
let stamina = 100;
const STAMINA_DRAIN = 0.04;
const STAMINA_REGEN = 2.5;  

// objetos
const player = {
    x: 400, y: 700,
    vx: 0, vy: -12, 
    width: 85, 
    height: 85, 
    radius: 28,
    scaleX: 1, // Para animacion de squash
    scaleY: 1  // Para animacion de squash
};

playerImg.onload = () => {
    const aspectRatio = playerImg.width / playerImg.height;
    player.height = player.width / aspectRatio; 
};

let platforms = [];
let hazards = [];
let powerups = []; 
let particles = [];

// particulas
class Particle {
    constructor(x, y, color, speed) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.life = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life -= 0.02; 
    }
    draw(cameraOffset) {
        ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
        // Partículas en forma de diamantes/estrellas afiladas
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - cameraOffset - 4);
        ctx.lineTo(this.x + 2, this.y - cameraOffset);
        ctx.lineTo(this.x, this.y - cameraOffset + 4);
        ctx.lineTo(this.x - 2, this.y - cameraOffset);
        ctx.fill();
    }
}

function spawnParticles(x, y, color, amount, speed) {
    for(let i=0; i<amount; i++) {
        particles.push(new Particle(x, y, color, speed));
    }
}

// generacion procedual
function createPlatform(yPos) {
    let width = 120 + Math.random() * 80;
    if (score < 10) width += 40; 

    let x = Math.random() * (canvas.width - width);
    let vx = 0;
    if (score > 10) {
        vx = (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.8); 
    }

    platforms.push({ x, y: yPos, w: width, h: 20, vx });

    let rand = Math.random();
    
    if (score > 25 && rand < 0.05) {  // probabilidad espinas
        hazards.push({
            x: x + width/2 - 15, 
            y: yPos - 45, 
            w: 30, h: 45, 
            vx: vx 
        });
    } else if (score > 5 && rand > 0.88) { // probabilidad powerups
        powerups.push({
            x: x + width/2 - 15, 
            y: yPos - 40, 
            w: 30, h: 40, 
            vx: vx 
        });
    }
}

function initWorld() {
    platforms = [];
    hazards = [];
    powerups = [];
    particles = [];
    score = 0;
    cameraY = 0;
    highestY = 800;
    stamina = 100;
    winTimer = 0;
    
    player.x = 400; player.y = 700;
    player.vx = 0; player.vy = -12;
    player.scaleX = 1; player.scaleY = 1;

    platforms.push({ x: 0, y: 850, w: canvas.width, h: 20, vx: 0 }); 

    for (let i = 1; i < 6; i++) {
        createPlatform(850 - (i * 140)); 
    }
}

// game over
function triggerGameOver() {
    gameState = 'GAMEOVER';
    shakeAmount = 25; 
    spawnParticles(player.x, player.y, "0, 240, 255", 30, 8); 
    spawnParticles(player.x, player.y, "255, 255, 255", 40, 12); 
    
    mainMsgEl.style.color = "#ffffff";
    mainMsgEl.style.textShadow = "0 0 15px rgba(255,255,255,0.5)";
    mainMsgEl.textContent = "SISTEMA CAÍDO";
    subMsgEl.textContent = `Puntuación Final: ${score}`;
    overlayEl.classList.add('visible');
}

// victoria
function triggerWin() {
    gameState = 'WIN';
    shakeAmount = 10;
    
    mainMsgEl.style.color = "#00f0ff"; 
    mainMsgEl.style.textShadow = "0 0 20px #00f0ff";
    mainMsgEl.textContent = "ACCESO CONCEDIDO";
    subMsgEl.textContent = `¡Sobreviviste! Puntuación Objetivo Alcanzada.`;
    overlayEl.classList.add('visible');
}

// --- FUNCIONES DE DIBUJO CYBER SIGIL ---

function drawSigilPlatform(p) {
    let drawY = p.y - cameraY;
    let cx = p.x + p.w / 2;
    
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ffffff";

    ctx.beginPath();
    // Línea central afilada
    ctx.moveTo(p.x, drawY);
    ctx.lineTo(p.x + p.w, drawY);

    // Estrella/Sigilo central
    ctx.moveTo(cx, drawY - 15);
    ctx.quadraticCurveTo(cx, drawY, cx + 25, drawY);
    ctx.quadraticCurveTo(cx, drawY, cx, drawY + 15);
    ctx.quadraticCurveTo(cx, drawY, cx - 25, drawY);
    ctx.quadraticCurveTo(cx, drawY, cx, drawY - 15);

    // Adornos de espinas en los bordes
    ctx.moveTo(p.x, drawY);
    ctx.quadraticCurveTo(p.x - 15, drawY - 10, p.x - 25, drawY);
    ctx.quadraticCurveTo(p.x - 15, drawY + 10, p.x, drawY);

    ctx.moveTo(p.x + p.w, drawY);
    ctx.quadraticCurveTo(p.x + p.w + 15, drawY - 10, p.x + p.w + 25, drawY);
    ctx.quadraticCurveTo(p.x + p.w + 15, drawY + 10, p.x + p.w, drawY);
    
    ctx.stroke();
    ctx.restore();
}

function drawSigilHazard(h) {
    let drawY = h.y - cameraY;
    let cx = h.x + h.w/2;

    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00f0ff"; // Brillo agresivo

    ctx.beginPath();
    // Pincho central
    ctx.moveTo(cx, drawY + h.h);
    ctx.lineTo(cx, drawY);

    // Arcos/Alas simétricas estilo tribal
    ctx.moveTo(cx, drawY + h.h);
    ctx.quadraticCurveTo(cx - 20, drawY + h.h/2, cx, drawY + 10);
    
    ctx.moveTo(cx, drawY + h.h);
    ctx.quadraticCurveTo(cx + 20, drawY + h.h/2, cx, drawY + 10);

    // Cruces afiladas internas
    ctx.moveTo(cx - 10, drawY + h.h*0.4);
    ctx.lineTo(cx + 10, drawY + h.h*0.4);
    ctx.moveTo(cx - 15, drawY + h.h*0.7);
    ctx.lineTo(cx + 15, drawY + h.h*0.7);

    ctx.stroke();
    ctx.restore();
}

// gameplay loop
function draw() {
    requestAnimationFrame(draw);

    ctx.save();
    if (shakeAmount > 0) {
        const dx = (Math.random() - 0.5) * shakeAmount;
        const dy = (Math.random() - 0.5) * shakeAmount;
        ctx.translate(dx, dy);
        shakeAmount *= 0.85; 
        if (shakeAmount < 0.5) shakeAmount = 0;
    }

    ctx.fillStyle = "rgba(5, 5, 5, 0.85)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // TEXTO ENORME CON FUENTE GÓTICA/AFILADA
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; 
    ctx.font = "bold 38px 'Cinzel Decorative', serif"; // Fuente custom y más grande
    ctx.textAlign = "center";
    ctx.fillText(`OBJETIVO: ${TARGET_SCORE} PUNTOS`, canvas.width / 2, 350 - cameraY);
    ctx.font = "22px 'Cinzel Decorative', serif";
    ctx.fillText("ASCIENDE PARA DESBLOQUEAR EL SISTEMA", canvas.width / 2, 400 - cameraY);
    ctx.restore();

    if (gameState === 'PLAYING') {
        if (mouseInCanvas) {
            stamina -= STAMINA_DRAIN;
            if (stamina <= 0) stamina = 0;
        } else {
            stamina += STAMINA_REGEN;
            if (stamina >= 100) stamina = 100;
        }
        
        staminaBarEl.style.width = stamina + '%';
        if (stamina < 30) staminaBarEl.classList.add('low');
        else staminaBarEl.classList.remove('low');
    }

    platforms.forEach(p => { p.x += p.vx; if (p.x + p.w > canvas.width || p.x < 0) p.vx *= -1; });
    hazards.forEach(h => { h.x += h.vx; if (h.x + h.w > canvas.width || h.x < 0) h.vx *= -1; });
    powerups.forEach(pu => { pu.x += pu.vx; if (pu.x + pu.w > canvas.width || pu.x < 0) pu.vx *= -1; });

    if (player.y < cameraY + 500) { 
        cameraY = player.y - 500; 
    }
    
    if (cameraY < highestY - 75) {
        highestY -= 75;
        createPlatform(highestY - 800);
        
        if (gameState === 'PLAYING') {
            score++;
            scoreEl.textContent = score;

            if (score >= TARGET_SCORE) {
                gameState = 'WIN_SEQUENCE';
                shakeAmount = 30; 
            }
        }
    }

    if (gameState === 'WIN_SEQUENCE') {
        player.vy -= 0.8; 
        player.y += player.vy;
        
        spawnParticles(player.x, player.y + player.radius, "0, 240, 255", 8, 15);
        spawnParticles(player.x, player.y + player.radius, "255, 255, 255", 8, 10);
        
        shakeAmount = 5; 

        winTimer++;
        if (winTimer > 120) { 
            triggerWin();
        }
    }

    if (gameState === 'PLAYING' && mouseInCanvas) {
        player.x += player.vx;
        player.y += player.vy;
        player.vy += 0.20; 

        if (player.x + player.radius > canvas.width || player.x - player.radius < 0) {
            player.vx *= -0.8;
            spawnParticles(player.x, player.y, "255, 255, 255", 5, 3);
            player.scaleX = 0.6; // Aplastar al tocar paredes
            player.scaleY = 1.4;
        }

        let dynamicBounce = -10 - (stamina / 100) * 3.5;

        platforms.forEach(p => {
            if (player.vy > 0 && 
                player.x > p.x && player.x < p.x + p.w &&
                player.y + player.radius >= p.y &&
                player.y + player.radius <= p.y + player.vy + 3) {
                
                player.y = p.y - player.radius;
                player.vy = dynamicBounce; 
                spawnParticles(player.x, player.y + player.radius, "255, 255, 255", 8, 4);
                
                // ANIMACIÓN DE SQUASH (Aplastamiento notorio)
                player.scaleX = 1.6; // Se estira horizontal
                player.scaleY = 0.5; // Se aplasta vertical
            }
        });

        for (let i = powerups.length - 1; i >= 0; i--) {
            let pu = powerups[i];
            let dist = Math.hypot(player.x - (pu.x + pu.w/2), player.y - (pu.y + pu.h/2));
            
            if (dist <= player.radius + 15) {
                player.vy = -24; 
                shakeAmount = 10;
                spawnParticles(pu.x, pu.y, "0, 240, 255", 40, 8); 
                powerups.splice(i, 1); 
                score += 5; 
                
                // Súper estiramiento al coger el powerup
                player.scaleX = 0.5;
                player.scaleY = 2.0;
            }
        }

        hazards.forEach(h => {
            let testX = player.x; let testY = player.y;
            if (player.x < h.x) testX = h.x; else if (player.x > h.x + h.w) testX = h.x + h.w;
            if (player.y < h.y) testY = h.y; else if (player.y > h.y + h.h) testY = h.y + h.h;

            let dist = Math.hypot(player.x - testX, player.y - testY);
            if (dist <= player.radius - 8) triggerGameOver();
        });

        if (player.y > cameraY + canvas.height + 150) {
            triggerGameOver();
        }
        
        if (Math.random() < 0.5) particles.push(new Particle(player.x, player.y, "0, 240, 255", 1));
    }

    // DIBUJO DE PLATAFORMAS (Cyber Sigil)
    platforms.forEach(p => {
        if (p.y - cameraY > canvas.height + 100) return; 
        drawSigilPlatform(p);
    });

    // DIBUJO DE POWERUPS (Sigilo Estrella/Diamante)
    ctx.fillStyle = "rgba(0, 240, 255, 0.8)";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00f0ff";
    powerups.forEach(pu => {
        ctx.beginPath();
        let cx = pu.x + pu.w/2;
        let cy = pu.y - cameraY + pu.h/2;
        ctx.moveTo(cx, cy - 20);
        ctx.quadraticCurveTo(cx, cy, cx + 20, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy + 20);
        ctx.quadraticCurveTo(cx, cy, cx - 20, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy - 20);
        ctx.fill();
    });

    // DIBUJO DE OBSTÁCULOS (Cyber Sigil Hazards)
    hazards.forEach(h => {
        if (h.y - cameraY > canvas.height + 100) return;
        drawSigilHazard(h);
    });
    ctx.shadowBlur = 0; 

    // Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(cameraY);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // DIBUJO DEL JUGADOR CON SQUASH & STRETCH LENTO
    if (gameState !== 'GAMEOVER') {
        // Recuperación lenta de la forma original (0.06 hace que se aprecie mucho más)
        player.scaleX += (1 - player.scaleX) * 0.06;
        player.scaleY += (1 - player.scaleY) * 0.06;

        ctx.save();
        ctx.translate(player.x, player.y - cameraY); // Mover el contexto al centro del jugador
        ctx.scale(player.scaleX, player.scaleY);     // Aplicar deformación

        try {
            // Dibujar desde -width/2, -height/2 porque el origen ya está trasladado
            ctx.drawImage(playerImg, -player.width/2, -player.height/2, player.width, player.height);
        } catch (e) {
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore(); // Limpiar deformaciones para lo demás
    }

    ctx.restore(); // Quitar shake del canvas general
}

// CONTROLES
canvas.addEventListener("mousemove", (e) => {
    if (!mouseInCanvas || (gameState !== 'PLAYING' && gameState !== 'WIN_SEQUENCE')) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    player.vx = (mouseX - player.x) * 0.05; 
});

canvas.addEventListener("mouseenter", () => {
    if (gameState === 'PLAYING') mouseInCanvas = true;
});

canvas.addEventListener("mouseleave", () => {
    mouseInCanvas = false;
});

overlayEl.addEventListener("click", () => {
    overlayEl.classList.remove('visible');
    initWorld();
    gameState = 'PLAYING';
});

initWorld();
requestAnimationFrame(draw);
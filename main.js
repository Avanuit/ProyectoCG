const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let mouseInCanvas = false;
let gameOver = false;
let score = 0;
let cameraY = 0;
let nextPlatformY = 600;

const ball = {
    x: 300,
    y: 720,
    vx: 0,
    vy: -14,
    radius: 12,
    color: "#2980b9",
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y - cameraY, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }
};

let platforms = [
    { x: 0, y: 780, w: 600, h: 20, vx: 0 }
];
let obstacles = [];

function createStep() {
    while (nextPlatformY > cameraY - 100) {
        const w = 80 + Math.random() * 50;
        const x = Math.random() * (canvas.width - w);
        const vx = (Math.random() - 0.5) * 4;
        
        platforms.push({ x, y: nextPlatformY, w, h: 15, vx });

        if (Math.random() > 0.7) {
            const ow = 15 + Math.random() * 10;
            const oh = 60 + Math.random() * 40;
            const ox = Math.random() * (canvas.width - ow);
            obstacles.push({ x: ox, y: nextPlatformY - oh - 20, w: ow, h: oh });
        }

        nextPlatformY -= 150;
    }

    platforms = platforms.filter(p => p.y > cameraY + canvas.height + 100 === false);
    obstacles = obstacles.filter(o => o.y > cameraY + canvas.height + 100 === false);
}

function resetGame() {
    ball.x = 300;
    ball.y = 720;
    ball.vx = 0;
    ball.vy = -14;
    cameraY = 0;
    nextPlatformY = 600;
    score = 0;
    platforms = [{ x: 0, y: 780, w: 600, h: 20, vx: 0 }];
    obstacles = [];
    gameOver = false;
    mouseInCanvas = false;
}

function draw() {
    ctx.fillStyle = "rgb(255 255 255 / 40%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (mouseInCanvas && !gameOver) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += 0.4;

        if (ball.y < cameraY + canvas.height / 2) {
            cameraY = ball.y - canvas.height / 2;
        }

        score = Math.max(score, Math.floor((720 - ball.y) / 10));

        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.vx = -ball.vx;
        }

        if (ball.y - ball.radius > cameraY + canvas.height) {
            gameOver = true;
        }

        platforms.forEach(p => {
            p.x += p.vx;
            if (p.x + p.w > canvas.width || p.x < 0) p.vx *= -1;

            if (ball.vy > 0 && 
                ball.x > p.x && ball.x < p.x + p.w &&
                ball.y + ball.radius >= p.y &&
                ball.y + ball.radius <= p.y + ball.vy + 2) {
                ball.y = p.y - ball.radius; 
                ball.vy = -12;
            }
        });

        obstacles.forEach(o => {
            let testX = Math.max(o.x, Math.min(ball.x, o.x + o.w));
            let testY = Math.max(o.y, Math.min(ball.y, o.y + o.h));
            let dist = Math.sqrt((ball.x - testX)**2 + (ball.y - testY)**2);
            if (dist <= ball.radius) gameOver = true;
        });

        createStep();
    }

    ctx.fillStyle = "#333";
    platforms.forEach(p => ctx.fillRect(p.x, p.y - cameraY, p.w, p.h));

    ctx.fillStyle = "#e74c3c";
    obstacles.forEach(o => ctx.fillRect(o.x, o.y - cameraY, o.w, o.h));

    ball.draw();

    ctx.fillStyle = "#2c3e50";
    ctx.font = "20px Arial";
    ctx.fillText(`Puntos: ${score}`, 20, 40);

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px sans-serif";
        ctx.fillText("GAME OVER", 180, canvas.height / 2);
        ctx.font = "20px sans-serif";
        ctx.fillText(`Puntaje final: ${score}`, 220, canvas.height / 2 + 50);
        ctx.fillText("Haz clic para reiniciar", 200, canvas.height / 2 + 90);
    }

    requestAnimationFrame(draw);
}

canvas.addEventListener("mousemove", (e) => {
    if (!mouseInCanvas || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    ball.vx = (e.clientX - rect.left - ball.x) * 0.05;
});

canvas.addEventListener("mouseenter", () => mouseInCanvas = true);
canvas.addEventListener("mouseleave", () => mouseInCanvas = false);
canvas.addEventListener("click", () => { if (gameOver) resetGame(); });

createStep();
requestAnimationFrame(draw);
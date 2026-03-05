const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let isLocked = false;
let gameOver = false;
let win = false;
let score = 0;
let cameraY = 0;
let nextPlatformY = 600;

//Configuración del Jugador
const ball = {
    x: 300,
    y: 720,
    vx: -3,
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

//Almacenamiento de Objetos
let platforms = [{ x: 0, y: 780, w: 600, h: 20, vx: 0 }];
let obstacles = [];
let goal = null;

//Generación Procedural
function createStep() {
    if (win || goal) return;
    while (nextPlatformY > cameraY - 100) {
        if (score >= 1000) {
            goal = { x: 200, y: nextPlatformY, w: 200, h: 40, color: "gold" };
            break;
        }
        const w = 80 + Math.random() * 50;
        const x = Math.random() * (canvas.width - w);
        const vx = (Math.random() - 0.5) * 4;
        platforms.push({ x, y: nextPlatformY, w, h: 15, vx });
        if (Math.random() > 0.4 && score < 950) {
            const ow = 15 + Math.random() * 10;
            const oh = 70 + Math.random() * 50;
            const ox = Math.random() * (canvas.width - ow);
            obstacles.push({ x: ox, y: nextPlatformY - oh - 10, w: ow, h: oh });
        }
        nextPlatformY -= 150;
    }
    platforms = platforms.filter(p => p.y < cameraY + canvas.height + 200);
    obstacles = obstacles.filter(o => o.y < cameraY + canvas.height + 200);
}

//Reinicio
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
    goal = null;
    gameOver = false;
    win = false;
}

//Bucle Principal
function draw() {
    ctx.fillStyle = "rgb(255 255 255 / 40%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    if (isLocked && !gameOver && !win) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += 0.4;
        ball.vx *= 0.95; 

        // EFECTO DE PAREDES 
        if (ball.x > canvas.width) ball.x = 0;
        if (ball.x < 0) ball.x = canvas.width;

        if (ball.y < cameraY + canvas.height / 2) {
            cameraY = ball.y - canvas.height / 2;
        }

        score = Math.max(score, Math.floor((720 - ball.y) / 10));

        if (ball.y - ball.radius > cameraY + canvas.height) {
            gameOver = true;
        }

        platforms.forEach(p => {
            p.x += p.vx;
            if (p.x + p.w > canvas.width || p.x < 0) p.vx *= -1;
            if (ball.vy > 0 && ball.x > p.x && ball.x < p.x + p.w &&
                ball.y + ball.radius >= p.y && ball.y + ball.radius <= p.y + ball.vy + 2) {
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

        if (goal && ball.x > goal.x && ball.x < goal.x + goal.w &&
            ball.y > goal.y && ball.y < goal.y + goal.h) win = true;

        createStep();
    }

    //Renderizado
    ctx.fillStyle = "#333";
    platforms.forEach(p => ctx.fillRect(p.x, p.y - cameraY, p.w, p.h));
    ctx.fillStyle = "#e74c3c";
    obstacles.forEach(o => ctx.fillRect(o.x, o.y - cameraY, o.w, o.h));
    if (goal) {
        ctx.fillStyle = goal.color;
        ctx.fillRect(goal.x, goal.y - cameraY, goal.w, goal.h);
    }
    ball.draw();

    // UI y Pantallas
    ctx.fillStyle = "#2c3e50";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`Puntos: ${score} / 1000`, 20, 40);

    if (!isLocked && !gameOver && !win) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Haz clic para empezar (Usa el mouse)", canvas.width/2, canvas.height/2);
        ctx.textAlign = "start";
    }

    if (win || gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = win ? "gold" : "#e74c3c";
        ctx.textAlign = "center";
        ctx.font = "40px sans-serif";
        ctx.fillText(win ? "¡VICTORIA!" : "GAME OVER", canvas.width/2, canvas.height / 2);
        ctx.fillStyle = "white";
        ctx.font = "20px sans-serif";
        ctx.fillText(`Puntaje: ${score}`, canvas.width/2, canvas.height / 2 + 50);
        ctx.fillText("Haz clic para reiniciar", canvas.width/2, canvas.height / 2 + 90);
        ctx.textAlign = "start";
    }

    requestAnimationFrame(draw);
}

//Manejo del Mouse y Pointer Lock
canvas.addEventListener("click", () => {
    if (gameOver || win) {
        resetGame();
    } else {
        canvas.requestPointerLock();
    }
});

document.addEventListener("pointerlockchange", () => {
    isLocked = document.pointerLockElement === canvas;
});

document.addEventListener("mousemove", (e) => {
    if (isLocked && !gameOver && !win) {

        ball.vx += e.movementX * 0.08; 
    }
});

createStep();
requestAnimationFrame(draw);
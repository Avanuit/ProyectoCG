const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Variables de estado del juego
let mouseInCanvas = false;
let win = false;
let gameOver = false;

// 1. El Personaje (Pelota)
const startPos = { x: 300, y: 720 };
const ball = {
    x: startPos.x,
    y: startPos.y,
    vx: 0,
    vy: -14, // Salto
    radius: 12,
    color: "#2980b9",
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }
};

// 2. Plataformas (Ahora tienen velocidad 'vx' para moverse)
const platforms = [
    { x: 0, y: 780, w: 600, h: 20, vx: 0 },   // Suelo base estático
    { x: 50, y: 640, w: 120, h: 15, vx: 2 },  // Se mueve a la derecha
    { x: 400, y: 500, w: 120, h: 15, vx: -2.5 }, // Se mueve a la izquierda
    { x: 100, y: 360, w: 120, h: 15, vx: 3 },
    { x: 300, y: 220, w: 100, h: 15, vx: -1.5 },
    { x: 200, y: 100, w: 80,  h: 15, vx: 3.5 }
];

// 3. Obstáculos Verticales (Rojos, debes evadirlos)
const obstacles = [
    { x: 280, y: 560, w: 20, h: 100 }, // Barrera central
    { x: 150, y: 400, w: 15, h: 120 }, // Barrera izquierda
    { x: 450, y: 280, w: 20, h: 90 },  // Barrera derecha
];

const goal = { x: 250, y: 20, w: 100, h: 30, color: "gold" };

// Función para reiniciar
function resetGame() {
    ball.x = startPos.x;
    ball.y = startPos.y;
    ball.vx = 0;
    ball.vy = -14;
    gameOver = false;
    win = false;
}

// 4. El Bucle Principal
function draw() {
    // A. EL MUNDO SIEMPRE SE MUEVE (Incluso sin mouse)
    // Actualizar movimiento de plataformas
    platforms.forEach(p => {
        p.x += p.vx;
        // Rebotar contra las paredes
        if (p.x + p.w > canvas.width || p.x < 0) {
            p.vx *= -1; 
        }
    });

    // Limpiar canvas con efecto rastro
    ctx.fillStyle = "rgb(255 255 255 / 40%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar Meta
    ctx.fillStyle = goal.color;
    ctx.fillRect(goal.x, goal.y, goal.w, goal.h);

    // Dibujar Plataformas
    ctx.fillStyle = "#333";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Dibujar Obstáculos mortales
    ctx.fillStyle = "#e74c3c"; // Color rojo peligro
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

    // Dibujar Pelota
    ball.draw();

    // B. EL PERSONAJE SOLO SE MUEVE SI EL MOUSE ESTÁ DENTRO
    if (mouseInCanvas && !win && !gameOver) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += 0.4; // Gravedad

        // Rebote en paredes laterales
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.vx = -ball.vx;
        }

        // Caerse por debajo del mapa = Game Over
        if (ball.y - ball.radius > canvas.height) {
            gameOver = true;
        }

        // Colisión con Plataformas (Rebote)
        platforms.forEach(p => {
            if (ball.vy > 0 && 
                ball.x > p.x && ball.x < p.x + p.w &&
                ball.y + ball.radius >= p.y &&
                ball.y + ball.radius <= p.y + ball.vy + 2) {
                
                ball.y = p.y - ball.radius; 
                ball.vy = -12; // Fuerza del rebote
            }
        });

        // Colisión con Obstáculos Rojos (Game Over)
        obstacles.forEach(o => {
            // Algoritmo matemático para colisión entre Círculo y Rectángulo
            let testX = ball.x;
            let testY = ball.y;

            if (ball.x < o.x) testX = o.x;               // Borde izquierdo
            else if (ball.x > o.x + o.w) testX = o.x + o.w; // Borde derecho
            if (ball.y < o.y) testY = o.y;               // Borde superior
            else if (ball.y > o.y + o.h) testY = o.y + o.h; // Borde inferior

            let distX = ball.x - testX;
            let distY = ball.y - testY;
            let distance = Math.sqrt((distX*distX) + (distY*distY));

            if (distance <= ball.radius) {
                gameOver = true; // Tocaste la lava roja
            }
        });

        // Colisión con la Meta (Victoria)
        if (ball.x > goal.x && ball.x < goal.x + goal.w &&
            ball.y > goal.y && ball.y < goal.y + goal.h) {
            win = true;
        }
    }

    // C. PANTALLAS DE FIN DE JUEGO
    if (win) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = "gold";
        ctx.font = "40px sans-serif";
        ctx.fillText("¡VICTORIA!", 190, canvas.height / 2);
    } else if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = "#e74c3c";
        ctx.font = "40px sans-serif";
        ctx.fillText("¡CHOCASTE!", 180, canvas.height / 2 - 20);
        
        ctx.fillStyle = "white";
        ctx.font = "20px sans-serif";
        ctx.fillText("Haz clic para reiniciar", 200, canvas.height / 2 + 30);
    }

    // El ciclo del mundo jamás se detiene
    requestAnimationFrame(draw);
}

// 5. Controles (Interacción con el Mouse)

canvas.addEventListener("mousemove", (e) => {
    if (!mouseInCanvas || win || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    ball.vx = (mouseX - ball.x) * 0.05; // Dirigir la bola hacia el cursor
});

canvas.addEventListener("mouseenter", () => {
    mouseInCanvas = true;
});

canvas.addEventListener("mouseleave", () => {
    mouseInCanvas = false;
});

// Reiniciar al hacer clic si perdiste
canvas.addEventListener("click", () => {
    if (gameOver || win) {
        resetGame();
    }
});

// Arrancar el ciclo
requestAnimationFrame(draw);
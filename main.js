// ==========================================
// CONFIGURACIÓN PRINCIPAL
// ==========================================
const canvas = document.getElementById('artefactCanvas');
const ctx = canvas.getContext('2d');
const uiOverlay = document.getElementById('interaction-ui');

// Dimensiones dinámicas
let width, height, centerX, centerY;
function resize() {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
    centerX = width / 2;
    centerY = height / 2;
}
window.addEventListener('resize', resize);
resize();

// ==========================================
// VARIABLES DE ESTADO E INTERACCIÓN
// ==========================================
let mouse = { x: centerX, y: centerY, active: false };
let rotation = { x: 0, y: 0, z: 0 };
let targetRotation = { x: 0, y: 0 };
let particles = [];
let projectedGlyphs = []; // Aquí guardaremos las runas flotantes

// Escuchadores del Mouse
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;

    // Calculamos la rotación objetivo basada en la posición relativa al centro
    targetRotation.x = (mouse.y - centerY) * 0.005; // Sensibilidad vertical
    targetRotation.y = (mouse.x - centerX) * 0.005; // Sensibilidad horizontal
});

canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
});

// ==========================================
// GEOMETRÍA BÁSICA: OCTAEDRO (Diamante 3D)
// ==========================================
const vertices = [
    { x: 0, y: -1, z: 0 },  // 0: Top
    { x: 1, y: 0, z: 0 },   // 1: Right
    { x: 0, y: 0, z: 1 },   // 2: Front
    { x: -1, y: 0, z: 0 },  // 3: Left
    { x: 0, y: 0, z: -1 },  // 4: Back
    { x: 0, y: 1, z: 0 }    // 5: Bottom
];

const faces = [
    [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], // Pirámide superior
    [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]  // Pirámide inferior
];

// ==========================================
// MATEMÁTICAS DE ROTACIÓN Y PROYECCIÓN
// ==========================================
function rotateX(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: point.x,
        y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos
    };
}

function rotateY(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: point.x * cos + point.z * sin,
        y: point.y,
        z: -point.x * sin + point.z * cos
    };
}

function project(point) {
    const scale = 150; // Tamaño base del objeto
    const perspective = 4; // Factor de profundidad
    const zFactor = 1 / (perspective - point.z);
    
    return {
        x: point.x * scale * zFactor + centerX,
        y: point.y * scale * zFactor + centerY,
        z: point.z // Mantenemos Z para ordenar las caras
    };
}

// ==========================================
// CLASES DE EFECTOS VISUALES
// ==========================================

// Partículas de polvo mágico que siguen al mouse
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 100;
        this.size = Math.random() * 3;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 1.5;
    }
    draw() {
        ctx.fillStyle = `rgba(0, 210, 255, ${this.life / 100})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Runas flotantes con distribución radial aleatoria
class FloatingRune {
    constructor(baseX, baseY) {
        const glyphs = ['ᚱ', 'ᚦ', 'ᚨ', 'ᛒ', 'ᛗ', 'ᛟ', 'ᚲ', 'ᚢ', 'ᚺ', 'ᛈ'];
        this.char = glyphs[Math.floor(Math.random() * glyphs.length)];
        
        // Esparcimiento natural: Elegimos un ángulo al azar (0 a 360 grados en radianes)
        const angle = Math.random() * Math.PI * 2;
        
        // Definimos un radio mínimo (fuera del artefacto) y máximo
        const minRadius = 160; 
        const maxRadius = 300; 
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        
        // Calculamos X e Y basados en el ángulo y el radio
        this.x = baseX + Math.cos(angle) * radius;
        this.y = baseY + Math.sin(angle) * radius;
        
        // Movimiento sutil de deriva
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4 - 0.2; 
        
        this.life = 0;
        this.maxLife = 80 + Math.random() * 80;
        this.opacity = 0;
        this.scale = 0.6 + Math.random() * 0.8;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;

        // Lógica de Fade-in y Fade-out
        if (this.life < 30) {
            this.opacity = this.life / 30; 
        } else if (this.life > this.maxLife - 30) {
            this.opacity = (this.maxLife - this.life) / 30; 
        } else {
            this.opacity = 1;
        }
    }

    draw(ctx) {
        if (this.life > this.maxLife) return;
        
        ctx.save();
        ctx.font = `${24 * this.scale}px Cinzel, monospace`;
        ctx.fillStyle = `rgba(0, 210, 255, ${this.opacity * 0.8})`;
        ctx.shadowColor = 'rgba(0, 210, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText(this.char, this.x, this.y);
        ctx.restore();
    }
}

// ==========================================
// BUCLE DE ANIMACIÓN PRINCIPAL
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    
    // Limpiar Canvas
    ctx.clearRect(0, 0, width, height);
    
    // 1. Actualizar Rotación (suavizado)
    rotation.x += (targetRotation.x - rotation.x) * 0.1;
    rotation.y += (targetRotation.y - rotation.y) * 0.1;
    rotation.z += 0.002; // Rotación automática lenta en el eje Z

    // 2. Procesar Geometría (Rotar y Proyectar)
    let projectedVertices = vertices.map(v => {
        let p = v;
        p = rotateX(p, rotation.x);
        p = rotateY(p, rotation.y);
        p = rotateY(p, rotation.z); 
        return project(p);
    });

    // 3. Ordenar Caras por Profundidad (Painter's Algorithm)
    let sortedFaces = faces.map((faceIdx, i) => {
        const zDepth = (projectedVertices[faceIdx[0]].z + projectedVertices[faceIdx[1]].z + projectedVertices[faceIdx[2]].z) / 3;
        return { indices: faceIdx, depth: zDepth, id: i };
    });
    sortedFaces.sort((a, b) => b.depth - a.depth); // Ordenar de atrás hacia adelante

    // 4. Dibujar Caras del Artefacto
    sortedFaces.forEach(faceData => {
        const points = faceData.indices.map(idx => projectedVertices[idx]);
        
        // Estilo del cristal
        ctx.fillStyle = `rgba(40, 42, 50, 0.9)`;
        ctx.strokeStyle = `rgba(100, 105, 120, 0.5)`; // Malla de alambre
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
    });

    // 5. Interacción General y Generación de Runas
    if (mouse.active) {
        // Partículas en el mouse
        if (Math.random() < 0.3) particles.push(new Particle(mouse.x, mouse.y));
        uiOverlay.classList.remove('hidden');
        
        // Generar runas flotantes alrededor del objeto
        if (Math.random() < 0.08) {
            projectedGlyphs.push(new FloatingRune(centerX, centerY));
        }
    } else {
        uiOverlay.classList.add('hidden');
    }

    // 6. Dibujar y actualizar Partículas
    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    });

    // 7. Dibujar y actualizar Runas Flotantes
    projectedGlyphs.forEach((g, i) => {
        g.update();
        g.draw(ctx);
        if (g.life >= g.maxLife) projectedGlyphs.splice(i, 1);
    });
}

// Iniciar la animación
animate();
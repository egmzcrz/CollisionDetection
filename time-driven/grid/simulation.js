function init() {
    var canvas = document.getElementById("myBox");
    ctx = canvas.getContext("2d");
    w = canvas.width
    h = canvas.height

    var title = document.getElementById("myTitle");
    ctxTitle = title.getContext("2d");
    wt = title.width
    ht = title.height

    ctx.fillStyle = "orange";
    ctx.strokeStyle = "black";
    ctxTitle.font = '24pt Calibri';
    ctxTitle.lineWidth = 4;

    tau = 300; // Simulation time
    radii = [40]; // Array of possible particle radii.
    maxParticles = 100; // Maximum possible number of particles.

    // Define a new unit-box containing all particles.
    box = new Grid(canvas.width,canvas.height,maxParticles,radii);

    t = 0;
    dt = 0.1;

    draw()
}

function draw() {
    if (t > tau) { return; }
    drawTimelapse(t);

    ctx.clearRect(0, 0, w, h);
    for (let p of box.particles) { drawParticle(p); }

    box.update(dt);
    t += dt;

    window.requestAnimationFrame(draw);
}

function drawTimelapse(t) {
    ctxTitle.clearRect(0, 0, wt, ht);
    ctxTitle.fillText('t = ' + t, 0, ht/2);
}

function drawParticle(p) {
    ctx.beginPath();
    ctx.arc(p.rx,p.ry,p.radius,0,2*Math.PI);
    ctx.fill();
    ctx.stroke();
    // Periodic boundaries.
    if (p.ry > h - p.radius) {
        ctx.beginPath();
        ctx.arc(p.rx, p.ry - h, p.radius, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
    } else if (p.ry < p.radius) {
        ctx.beginPath();
        ctx.arc(p.rx, p.ry + h, p.radius, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

init()

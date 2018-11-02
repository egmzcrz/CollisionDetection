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

    capacity = 4; // Capacity per subquadtree.
    maxParticles = 100; // Number of particles.
    radii = [30];
    particles = createParticles(maxParticles, radii); // Array of particles.
    boundary = new Rectangle(canvas.width, canvas.height,0,0);

    t = 0;
    dt = 0.1;
    draw()
}

function createParticles(maxParticles,radii) {
    particles = [];
    var failedAttempts = 0;
    while (particles.length < maxParticles) {
        if (failedAttempts > 100000) break;

        var radius = radii[Math.floor(Math.random() * radii.length)],
            mass = radius,
            rx = (w - 2*radius) * Math.random() + radius,
            ry = (h - 2*radius) * Math.random() + radius,
            vx = 2*Math.random() - 1,
            vy = 3*Math.random() - 1,
            n = Math.sqrt(vx*vx + vy*vy);
        vx = vx/n;
        vy = vy/n;
        var p = new Particle(rx,ry,vx,vy,radius,mass);

        var intersecting = false;
        for (let q of particles) {
            var dx = p.rx - q.rx,
                dy = p.ry - q.ry;
            dy -= Math.round(dy/h) * h;
            var drdr = dx*dx + dy*dy,
                sigma = p.radius + q.radius;
            if (drdr < sigma*sigma) {
                intersecting = true;
                failedAttempts++;
                break;
            }
        }
        if (!intersecting) particles.push(p);
    }
    return particles
}

function draw() {
    if (t > tau) { return; }
    drawTimelapse(t);

    ctx.clearRect(0, 0, w, h);
    for (let p of particles) { drawParticle(p); }

    box = new QuadTree(boundary,capacity);
    for (let p of particles) { box.insert(p); }
    for (let p of particles) { box.update(p,dt,w,h); }
    for (let p of particles) { p.move(dt,h); }
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

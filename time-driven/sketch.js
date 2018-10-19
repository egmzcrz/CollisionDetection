function setup() {
    createCanvas(600,600);

    capacity = 4; // Capacity per subquadtree.
    nParticles = 100; // Number of particles.
    particles = []; // Array of particles.
    dt = 0.1; // Time step differential.
    boundary = new Rectangle(width,height,0,0); // Boundary of box.

    // Fill box with n particles.
    for (let i = 0; i < nParticles; i++) {
        var radius = random(20,30),
            mass = radius,
            rx = random(radius,width-radius),
            ry = random(radius,height-radius),
            vx = random(-20,20),
            vy = random(-20,20);
        particles.push(new Particle(rx,ry,vx,vy,radius,mass));
    }
}
function draw() {
    background(0);
    box = new QuadTree(boundary,capacity);
    for (let p of particles) box.insert(p);
    for (let p of particles) {
        box.update(p,dt);
        drawParticle(p);
    }
}

function drawParticle(p) {
    stroke(255);
    fill(0,102,34,100);
    ellipse(p.rx,p.ry,p.radius * 2);
}

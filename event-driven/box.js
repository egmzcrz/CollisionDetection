class Box {
    constructor(width,height,maxParticles,maxVel,sizes) {
        this.width = width;
        this.height = height;
        this.createParticles(maxParticles,maxVel,sizes);
        this.createGrid(Math.max(...sizes))
        this.events = new PriorityQueue((e1,e2) => e1.lessThan(e2)); // priority queue
    }

    /*
    Fill box with non-overlapping particles.
    */
    createParticles(maxParticles,maxVel,sizes) {
        this.particles = [];
        var failedAttempts = 0;
        while (this.particles.length < maxParticles) {
            if (failedAttempts > 100000) break;

            var radius = sizes[Math.floor(Math.random() * sizes.length)],
                mass = radius,
                rx = (this.width - 2*radius) * Math.random() + radius,
                ry = (this.height - 2*radius) * Math.random() + radius,
                vx = maxVel * (2*Math.random() - 1),
                vy = maxVel * (2*Math.random() - 1),
                p = new Particle(rx,ry,vx,vy,radius,mass);

            var intersecting = false;
            for (let q of this.particles) {
                var dx = p.rx - q.rx,
                    dy = p.ry - q.ry;
                dy -= Math.round(dy/this.height) * this.height;
                var drdr = dx*dx + dy*dy,
                    sigma = p.radius + q.radius;
                if (drdr < sigma*sigma) {
                    intersecting = true;
                    failedAttempts++;
                    break;
                }
            }
            if (!intersecting) this.particles.push(p);
        }
        /*
        this.particles = [];
        p = new Particle(70,70,0,0,50,500000);
        let q = new Particle(70,269,0,10,50,50);
        this.particles.push(p);
        this.particles.push(q);
        */
    }

    /*
    Creates an empty grid, each subcell is at least the size of that square defined by
    its circumcircle of radius 2*sigma. Sigma being the radius of the biggest particle
    in the box:
    __________
    | .¨¨¨¨. |
    |!      ;|
    |_`....´_|
    */
    createGrid(sigma) {
        var cellMinWidth = 2.01*sigma;
        this.nx = Math.floor(this.width/cellMinWidth);
        this.ny = Math.floor(this.height/cellMinWidth);
        this.lx = this.width/this.nx; // the size of the subcells in x
        this.ly = this.height/this.ny; // the size of the subcell in y
        this.grid = [];
        var nn = this.nx * this.ny;
        for (var n = 0; n < nn; n++) {
            this.grid.push([]);
        }

        for (let p of this.particles) {
            p.i = Math.floor(p.rx / this.lx);
            p.j = Math.floor(p.ry / this.ly);
            this.grid[p.i*this.ny + p.j].push(p);
        }
    }

    /*
    Check particle-particle, particle-wall and particle-grid collisions
    in the neighbourhood of the particle p.
    */
    predict(p,t) {
        // particle-grid collisions
        var escapeTime = t + p.timeToEscapeCell(this.lx,this.ly);
        this.events.push(new Event(escapeTime,p,p));
        for (var m = -1; m <= 1; m++) {
            var x = p.i + m;
            if (x < 0 || x >= this.nx) {
                var tt = t + p.timeToHitVerticalWall(this.width);
                if (tt < escapeTime) {
                    this.events.push(new Event(tt,null,p));
                }
                continue;
            }
            for (var n = -1; n <= 1; n++) {
                var y = p.j + n;
                y = ((y % this.ny) + this.ny) % this.ny;
                for (let q of this.grid[x*this.ny + y]) {
                    var tt = t + p.timeToHit(q,this.height);
                    if (tt < escapeTime) {
                        this.events.push(new Event(tt,p,q));
                    }
                }
            }
        }
    }


    resolveCollisions(event) {
        var p = event.p;
        var q = event.q;
        var t = event.t;
        if (p !== null && q !== null) {
            if (p !== q) {
                p.bounceOff(q,this.height);
                this.predict(p,t);
                this.predict(q,t);
            } else {
                var cell = this.grid[p.i*this.ny + p.j];
                for (var i = 0; i < cell.length; i++) {
                    if (p === cell[i]) {
                        cell.splice(i,1);
                        break;
                    }
                }
                // Update particle's cell.
                p.i = Math.floor(p.rx / this.lx);
                p.j = Math.floor(p.ry / this.ly);
                p.j = ((p.j % this.ny) + this.ny) % this.ny;
                this.grid[p.i*this.ny + p.j].push(p);
                this.predict(p,t);
            }
        } else if (q !== null) {
            q.bounceOffVerticalWall();
            this.predict(q,t);
        }
    }

    resolveGridEvent(t,event) {
        var p = event.p;
        // Particle p will change cell inside the grid.
        // Remove particle from current cell:
        var cell = this.grid[p.i*this.ny + p.j];
        for (var i = 0; i < cell.length; i++) {
            if (p === cell[i]) {
                cell.splice(i,1);
                break;
            }
        }
        // Move all particles in time
        var dt = event.t - t;
        for (let particle of this.particles) {
            particle.move(dt,this.height);
        }

        // Update particle's cell.
        p.i = Math.floor(p.rx / this.lx);
        p.j = Math.floor(p.ry / this.ly);
        p.j = ((p.j % this.ny) + this.ny) % this.ny;
        this.grid[p.i*this.ny + p.j].push(p);
        this.predict(p,event.t);
    }

    update(t) {
        if (this.events.heap.length == 0) return Infinity;

        var event = this.events.pop();
        var gridEvent = event.p !== null && event.p === event.q;
        while (!event.isValid() || gridEvent) { 
            if (gridEvent) {
                this.resolveGridEvent(t,event);
                t = event.t;
            }
            event = this.events.pop();
            gridEvent = event.p !== null && event.p === event.q;
        }
        /*
        var event = this.events.pop();
        while(!event.isValid()) {
            event = this.events.pop();
        }
        */

        // Move particles to next interesting event.
        var dt = event.t - t
        for (let p of this.particles) {
            p.move(dt,this.height);
        }

        // Resolve particle-particle, particle-wall and particle-grid collisions.
        this.resolveCollisions(event);
        return event.t
    }
}

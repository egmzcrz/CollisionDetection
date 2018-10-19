const periodic = (y,ny) => ((y % ny) + ny) % ny;
const linear = (x,y,nx) => y * nx + x

class Box {
    constructor(width,height,maxParticles,radii) {
        this.width = width;
        this.height = height;
        this.events = new PriorityQueue((e1,e2) => e1.lessThan(e2)); // priority queue

        this.createParticles(maxParticles,radii);


        var sigma = Math.max(...radii)
        var minCellWidth = 2.01*sigma;
        this.nx = Math.floor(width/minCellWidth);
        this.ny = Math.floor(height/minCellWidth);
        this.lx = width/this.nx; // the size of the subcells in x
        this.ly = height/this.ny; // the size of the subcell in y

        var n = this.nx * this.ny;

        this.grid = [];
        for (var i = 0; i < n; i++) { this.grid.push([]); }
        this.positionInGrid = [];
        this.collisionCount = [];
        for (var i = 0, len = this.particles.length; i < len; i++) {
            let p = this.particles[i];
            let x = Math.floor(p.rx / this.lx);
            let y = Math.floor(p.ry / this.ly);
            let k = linear(x,y,this.nx);
            this.grid[k].push(i);
            this.positionInGrid[i] = k;
            this.collisionCount[i] = 0;
        }

        this.region = [];
        this.borders = [];
        for (var y = 0; y < this.ny; y++) {
            for (var x = 0; x < this.nx; x++) {
                var v = [];
                for (var j = y-1; j <= y+1; j++) {
                    var jj = periodic(j,this.ny);
                    for (var i = x-1; i <= x+1; i++) {
                        if (0 <= i && i < this.nx) {
                            v.push(linear(i,jj,this.nx));
                        }
                    }
                }
                this.region.push(v);

                var xmin = this.lx * x;
                var xmax = this.lx * (x+1);
                var ymin = this.ly * y;
                var ymax = this.ly * (y+1);
                this.borders.push({xmin:xmin,xmax:xmax, ymin:ymin, ymax:ymax});
            }
        }
        for (var i = 0, len=this.particles.length; i < len; i++) {
            this.predict(i,0)
        }
    }

    /*
    Fill box with non-overlapping particles.
    */
    createParticles(maxParticles,radii) {
        this.particles = [];
        var failedAttempts = 0;
        while (this.particles.length < maxParticles) {
            if (failedAttempts > 100000) break;

            var radius = radii[Math.floor(Math.random() * radii.length)],
                mass = radius,
                rx = (this.width - 2*radius) * Math.random() + radius,
                ry = (this.height - 2*radius) * Math.random() + radius,
                vx = 2*Math.random() - 1,
                vy = 3*Math.random() - 1,
                n = Math.sqrt(vx*vx + vy*vy),
            vx = vx/n;
            vy = vy/n;
            var p = new Particle(rx,ry,vx,vy,radius,mass);

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
    /*
    Check particle-particle, particle-wall and particle-grid collisions
    in the neighbourhood of the particle p.
    */
    predict(i,t) {
        var pi = this.particles[i];
        var ic = this.collisionCount[i];
        var k = this.positionInGrid[i];


        // particle-grid collisions
        var x = Math.floor(pi.rx / this.lx);
        var y = Math.floor(pi.ry / this.ly);
        var eps = 1e-10;
        var borders = this.borders[k];
        var xmin = borders.xmin - eps;
        var xmax = borders.xmax + eps;
        var ymin = borders.ymin - eps;
        var ymax = borders.ymax + eps;
        var escapeTime = t + pi.timeToEscapeCell(xmin,xmax,ymin,ymax);
        this.events.push(new Event(escapeTime,i,i,ic,ic));
        if (this.region[k].length < 8) {
            var tt = t + pi.timeToHitVerticalWall(0,this.width);
            if (tt < escapeTime) {
                this.events.push(new Event(tt,-1,i,-1,ic));
            }
        }
        for (let kk of this.region[k]) {
            for (let j of this.grid[kk]) {
                var pj = this.particles[j];
                var tt = t + pi.timeToHit(pj,this.height);
                if (tt < escapeTime) {
                    var jc = this.collisionCount[j];
                    this.events.push(new Event(tt,i,j,ic,jc));
                }
            }
        }
    }


    resolveCollisionEvent(event) {
        var i = event.i;
        var j = event.j;
        var t = event.t;
        if (i > -1 && j > -1) {
            var pi = this.particles[i];
            var pj = this.particles[j];
            pi.bounceOff(pj,this.height);
            this.collisionCount[i]++;
            this.collisionCount[j]++;
            this.predict(i,t);
            this.predict(j,t);
        } else if (j > -1) {
            var pj = this.particles[j];
            pj.bounceOffVerticalWall();
            this.collisionCount[j]++;
            this.predict(j,t);
        }
    }

    resolveGridEvent(t,event) {
        var i = event.i;
        var pi = this.particles[i];
        var k = this.positionInGrid[i];
        // Particle p will change cell inside the grid.
        // Remove particle from current cell:
        var cell = this.grid[k];
        for (var n = 0, len = cell.length; n < len; n++) {
            if (i == cell[n]) {
                cell.splice(n,1);
                break;
            }
        }
        // Move all particles in time
        var dt = event.t - t;
        for (let particle of this.particles) {
            particle.move(dt,this.height);
        }

        // Update particle's cell.
        var x = Math.floor(pi.rx / this.lx);
        var y = Math.floor(pi.ry / this.ly);
        var k = linear(x,y,this.nx);
        this.positionInGrid[i] = k;
        this.grid[k].push(i);
        this.predict(i,event.t);
    }

    update(t) {
        // Discard every invalid event and resolve grid events.
        while (true) {
            var event = this.events.pop();
            if (event.isValid(this.collisionCount)) {
                if (event.i > -1 && event.i == event.j) {
                    this.resolveGridEvent(t,event);
                    t = event.t;
                } else { break; }
            }
        }

        // Move particles to next interesting event.
        var dt = event.t - t
        for (let p of this.particles) {
            p.move(dt,this.height);
        }

        // Resolve particle-particle, particle-wall and particle-grid collisions.
        this.resolveCollisionEvent(event);
        return event.t
    }
}

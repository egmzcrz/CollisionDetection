const periodic = (y,ny) => ((y % ny) + ny) % ny;
const linear = (x,y,nx) => y * nx + x

class Grid {
    constructor(width,height,maxParticles,radii) {
        this.width = width;
        this.height = height;

        this.createParticles(maxParticles,radii);


        /*
        Creates an empty grid, each subcell is at least the size of that square defined by
        its circumcircle of radius 2*sigma. Sigma being the radius of the biggest particle
        in the box:
        __________
        | .¨¨¨¨. |
        |!      ;|
        |_`....´_|
        */
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
        for (var i = 0, len = this.particles.length; i < len; i++) {
            let p = this.particles[i];
            let x = Math.floor(p.rx / this.lx);
            let y = Math.floor(p.ry / this.ly);
            let k = linear(x,y,this.nx);
            this.grid[k].push(i);
            this.positionInGrid[i] = k;
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
                n = Math.sqrt(vx*vx + vy*vy);
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

    updatePositionInGrid(i) {
        var p = this.particles[i];
        var k = this.positionInGrid[i];
        var currentCell = this.grid[k];
        for (var n = 0, len = currentCell.length; n < len; n++) {
            if (i == currentCell[n]) {
                currentCell.splice(n,1);
                break;
            }
        }

        var x = Math.floor(p.rx / this.lx);
        var y = Math.floor(p.ry / this.ly);
        k = linear(x,y,this.nx);
        this.positionInGrid[i] = k;
        this.grid[k].push(i);
    }

    update(dt) {
        for (var i = 0, len = this.particles.length; i < len; i++) {
            var p = this.particles[i];
            var k = this.positionInGrid[i];
            // Particle is near wall
            if (this.region[k].length < 8) {
                if (p.timeToHitVerticalWall(0, this.height) < dt) {
                    p.bounceOffVerticalWall();
                }
                if (p.timeToHitHorizontalWall(0, this.width) < dt) {
                    //p.bounceOffHorizontalWall();
                }
            }
            for (let kk of this.region[k]) {
                for (let j of this.grid[kk]) {
                    var q = this.particles[j];
                    if (p.timeToHit(q, this.height) < dt) {
                        p.bounceOff(q, this.height);
                    }
                }
            }
        }

        for (var i = 0, len = this.particles.length; i < len; i++) {
            this.particles[i].move(dt,this.height);
            this.updatePositionInGrid(i);
        }
    }
}

class Particle {
    constructor(rx,ry,vx,vy,radius,mass) {
        this.rx = rx;
        this.ry = ry;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.mass = mass;

        // Collision count.
        this.count = 0;

        // Position in grid.
        this.i = -1;
        this.j = -1;
    }


    move(dt,height) {
        this.rx += this.vx * dt;
        this.ry += this.vy * dt;
        this.ry -= Math.floor(this.ry/height) * height;
    }

    /*
    Returns the amount of time taken for "this" particle
    to collide with "that" particle.
    */
    timeToHit(that, height) {
        if (this === that) return Infinity;
        var dx = that.rx - this.rx,
            dy = that.ry - this.ry;
        dy -= Math.round(dy/height) * height;

        var dvx = that.vx - this.vx,
            dvy = that.vy - this.vy,
            dvdr = dx*dvx + dy*dvy;
        if (dvdr > 0) return Infinity;
        var dvdv = dvx*dvx + dvy*dvy;
        if (dvdv == 0) return Infinity;
        var drdr = dx*dx + dy*dy,
            sigma = this.radius + that.radius,
            d = (dvdr*dvdr) - dvdv * (drdr - sigma*sigma);
        if (d < 0) return Infinity;
        return -(dvdr + Math.sqrt(d)) / dvdv;
    }

    /*
    Return the amount of time taken for "this" particle to
    collide with a vertical wall.
    */
    timeToHitVerticalWall(width) {
        if (this.vx > 0) return (width - this.radius - this.rx)/this.vx;
        else if (this.vx < 0) return (this.radius - this.rx)/this.vx;
        else             return Infinity;
    }
    /*
    Return the amount of time taken for "this" particle to
    collide with a horizontal wall.
    */
    timeToHitHorizontalWall(height) {
        if (this.vy > 0) return (height - this.radius - this.ry)/this.vy;
        else if (this.vy < 0) return (this.radius - this.ry)/this.vy;
        else             return Infinity;
    }
    /*
    Return the amount of time taken for "this" particle's center to
    escape its container. The container is a bounding rectangle
    with dimensions (lx,ly).
    */
    timeToEscapeCell(lx,ly) {
        var dtx = 0, dty = 0;
        var epsilon = 1e-10;

        if (this.vy > 0) dty = (ly*(this.j+1) - this.ry + epsilon)/this.vy;
        else if (this.vy < 0) dty = (ly*this.j - this.ry - epsilon)/this.vy;
        else             dty = Infinity;

        if (this.vx > 0) dtx = (lx*(this.i+1) - this.rx + epsilon)/this.vx;
        else if (this.vx < 0) dtx = (lx*this.i - this.rx - epsilon)/this.vx;
        else             dtx = Infinity;

        return Math.min(dtx,dty);
    }

    /*
    Update "this" particle's velocity after the ellastic collision with
    "that" particle.
    */
    bounceOff(that,height) {
        /*
        var dx = that.rx - this.rx,
            dy = that.ry - this.ry,
            dvx = that.vx - this.vx,
            dvy = that.vy - this.vy,
            dvdr = dx*dvx + dy*dvy,
            sigma  = this.radius + that.radius;

        //Normal impulse:
        var J = 2*this.mass*that.mass*dvdr/((this.mass+that.mass)*sigma),
            Jx = J*dx / sigma,
            Jy = J*dy / sigma;

        this.vx += Jx/this.mass;
        this.vy += Jy/this.mass;
        that.vx -= Jx/that.mass;
        that.vy -= Jy/that.mass;
        */

        var dx = that.rx - this.rx,
            dy = that.ry - this.ry;
        dy -= Math.round(dy/height) * height;

        var dvx = that.vx - this.vx,
            dvy = that.vy - this.vy,
            drdr = dx*dx + dy*dy,
            dvdr = dvx*dx + dvy*dy;

        var c = 2*dvdr/(drdr*(this.mass + that.mass)),
            c1 = that.mass * c,
            c2 = this.mass * c;

        this.vx += c1 * dx;
        this.vy += c1 * dy;
        that.vx -= c2 * dx;
        that.vy -= c2 * dy;

        this.count++;
        that.count++;
    }

    /*
    Update particle's velocity after wall collision.
    */
    bounceOffVerticalWall() {
        this.vx = -this.vx;
        this.count++;
    }

    bounceOffHorizontalWall() {
        this.vy = -this.vy;
        this.count++;
    }
}

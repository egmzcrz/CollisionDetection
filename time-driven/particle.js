class Particle {
    constructor(rx,ry,vx,vy,radius,mass) {
        this.rx = rx;
        this.ry = ry;
        this.vx = vx
        this.vy = vy
        this.radius = radius
        this.mass = mass
    }

    move(dt) {
        this.rx += this.vx * dt;
        this.ry += this.vy * dt;
    }

    timeToHit(that) {
        var dx = that.rx - this.rx,
            dy = that.ry - this.ry,
            dvx = that.vx - this.vx,
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
    timeToHitVerticalWall() {
        if (this.vx > 0) return (width - this.radius - this.rx)/this.vx;
        else if (this.vx < 0) return (this.radius - this.rx)/this.vx;
        else             return Infinity;
    }
    timeToHitHorizontalWall() {
        if (this.vy > 0) return (height - this.radius - this.ry)/this.vy;
        else if (this.vy < 0) return (this.radius - this.ry)/this.vy;
        else             return Infinity;
    }


    // Elastic collision equations

    bounceOff(that) {
        var dx = that.rx - this.rx,
            dy = that.ry - this.ry,
            dvx = that.vx - this.vx,
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
    }
    bounceOffVerticalWall() {
        this.vx = -this.vx;
    }
    bounceOffHorizontalWall() {
        this.vy = -this.vy;
    }
}

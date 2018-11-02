class Rectangle {
    constructor(w,h,x,y) {
        this.w = w;
        this.h = h;
        this.x = x;
        this.y = y;
    }

    contains(p) {
        return this.x < p.rx && p.rx < this.x + this.w
            && this.y < p.ry && p.ry < this.y + this.h;
    }

    intersects(p) {
        var halfwidth = this.w/2,
            halfheight = this.h/2;

        // get distance from circle's center to box's center
        var dx_circle2center = Math.abs(p.rx - (this.x + halfwidth)),
            dy_circle2center = Math.abs(p.ry - (this.y + halfheight));

        if (dx_circle2center > halfwidth + p.radius) return false;
        if (dy_circle2center > halfheight + p.radius) return false;

        var dx_circle2edge = dx_circle2center - halfwidth,
            dy_circle2edge = dy_circle2center - halfheight,
            drdr_circle2corner = dx_circle2edge * dx_circle2edge +
                                 dy_circle2edge * dy_circle2edge;

        if (dx_circle2center < halfwidth) return true;
        if (dy_circle2center < halfheight) return true;
        return drdr_circle2corner < p.radius*p.radius;
    }
}

class QuadTree {
    constructor(rectangle,n) {
        this.boundary = rectangle;
        this.capacity = n;
        this.particles = [];
        this.divided = false;
    }

    subdivide() {
        var w = this.boundary.w/2, h = this.boundary.h/2,
            x = this.boundary.x,   y = this.boundary.y;
        var tr = new Rectangle(w, h, x+w, y+h),
            tl = new Rectangle(w, h, x, y+h),
            br = new Rectangle(w, h, x+w, y),
            bl = new Rectangle(w, h, x, y);

        this.tr = new QuadTree(tr,this.capacity);
        this.tl = new QuadTree(tl,this.capacity);
        this.br = new QuadTree(br,this.capacity);
        this.bl = new QuadTree(bl,this.capacity);
        this.divided = true;
    }

    searchSubBoxes(p) {
        if      (this.tr.boundary.contains(p)) return this.tr;
        else if (this.tl.boundary.contains(p)) return this.tl;
        else if (this.br.boundary.contains(p)) return this.br;
        else                                   return this.bl;
    }

    insert(p) {
        var correctBox = this;
        while (correctBox.divided)
            correctBox = correctBox.searchSubBoxes(p);

        if (correctBox.particles.length == correctBox.capacity) {
            correctBox.subdivide();
            correctBox = correctBox.searchSubBoxes(p);
        }
        correctBox.particles.push(p);
    }

    update(p,dt, w, h) {
        if (p.timeToHitVerticalWall(0,w) < dt) { p.bounceOffVerticalWall(); }
        //if (p.timeToHitHorizontalWall(0,h) < dt) { p.bounceOffHorizontalWall(); }
        var boxes = [this];
        var isOver = p.ry + p.radius > h
        var isUnder = p.ry - p.radius < 0
        if (isOver) {
            var pOver = new Particle(p.rx, p.ry - h, p.vx, p.vy, p.radius, p.mass)
        }
        if (isUnder) {
            var pUnder = new Particle(p.rx, p.ry + h, p.vx, p.vy, p.radius, p.mass)
        }
        while (boxes.length > 0) {
            var currentBox = boxes.pop();
            for (var q of currentBox.particles) {
                if (p === q) { continue; }
                if (p.timeToHit(q,h) < dt) { p.bounceOff(q,h); }
            }
            if (currentBox.divided) {
                if (currentBox.tr.boundary.intersects(p)) {
                    boxes.push(currentBox.tr)
                }
                if (currentBox.tl.boundary.intersects(p)) {
                    boxes.push(currentBox.tl)
                }
                if (currentBox.br.boundary.intersects(p)) {
                    boxes.push(currentBox.br)
                }
                if (currentBox.bl.boundary.intersects(p)) {
                    boxes.push(currentBox.bl)
                }
            }
            if (currentBox.divided && isOver) {
                if (currentBox.tr.boundary.intersects(pOver)) {
                    boxes.push(currentBox.tr)
                }
                if (currentBox.tl.boundary.intersects(pOver)) {
                    boxes.push(currentBox.tl)
                }
                if (currentBox.br.boundary.intersects(pOver)) {
                    boxes.push(currentBox.br)
                }
                if (currentBox.bl.boundary.intersects(pOver)) {
                    boxes.push(currentBox.bl)
                }
            }
            if (currentBox.divided && isUnder) {
                if (currentBox.tr.boundary.intersects(pUnder)) {
                    boxes.push(currentBox.tr)
                }
                if (currentBox.tl.boundary.intersects(pUnder)) {
                    boxes.push(currentBox.tl)
                }
                if (currentBox.br.boundary.intersects(pUnder)) {
                    boxes.push(currentBox.br)
                }
                if (currentBox.bl.boundary.intersects(pUnder)) {
                    boxes.push(currentBox.bl)
                }
            }
        }
    }
}

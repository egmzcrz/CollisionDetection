class Event {
    constructor(t,p,q) {
        this.t = t;
        this.p = p;
        this.q = q;
        this.countP = p === null ? -1 : p.count;
        this.countQ = q === null ? -1 : q.count;
    }

    isValid() {
        if (this.p !== null && this.p.count != this.countP) return false;
        if (this.q !== null && this.q.count != this.countQ) return false;
        return true;
    }

    lessThan(that) {
        return this.t < that.t
    }
}

class Event {
    constructor(t,i,j,ic,jc) {
        this.t = t;
        this.i = i;
        this.j = j;
        this.iCount = ic
        this.jCount = jc
    }

    isValid(collisionCount) {
        if (this.i > -1 && this.iCount != collisionCount[this.i]) return false;
        if (this.j > -1 && this.jCount != collisionCount[this.j]) return false;
        return true;
    }

    lessThan(that) {
        return this.t < that.t
    }
}

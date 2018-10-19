const up = i => i >>> 1
const left = i => i << 1;
const right = i => (i << 1) + 1;

class PriorityQueue {
    constructor(comparator) {
        this.heap = [];
        this.comparator = comparator;
    }
    size() {
        return this.heap.length
    }
    push(value) {
        this.heap.push(value);
        this.siftUp();
    }
    pop() {
        const poppedValue = this.heap[0];
        const bottom = this.heap.length - 1;
        if (bottom > 0) {
            this.swap(0, bottom);
        }
        this.heap.pop();
        this.siftDown();
        return poppedValue;
    }

    compare(i,j) {
        return this.comparator(this.heap[i],this.heap[j])
    }
    swap(i,j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    siftUp() {
        let node = this.heap.length - 1;
        let upper = up(node);
        while (node > 0 && this.compare(node, upper)) {
            this.swap(node,upper);
            node = upper;
            upper = up(node);
        }
    }
    siftDown() {
        let node = 0;
        let lft = left(node);
        let rght = right(node);
        while (
            (lft < this.heap.length && this.compare(lft,node)) ||
            (rght < this.heap.length && this.compare(rght, node)) ) {

            let maxChild = rght < this.heap.length && this.compare(rght,lft) ?
                rght : lft;
            this.swap(node,maxChild);
            node = maxChild;
            lft = left(node);
            rght = right(node);
        }
    }
}

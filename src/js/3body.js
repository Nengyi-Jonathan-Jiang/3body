/** @extends {Array<number>} */
class Vec3 extends Array {
    constructor (...x) {
        super(...[0, 1, 2].map(i => x[i] ?? 0));
    }

    get magnitude () {
        return Math.sqrt(this.dot(this));
    }

    /** @type {(fn: (a : number) => number) => Vec3} */
    map = fn => new Vec3(...super.map(fn));
    /** @type {() => number} */
    sum = () => +this.reduce((a, b) => a + b);
    /** @type {(other: Vec3) => Vec3} */
    plus = other => this.map((s, i) => s + (other[i] ?? 0))
    /** @type {(other: Vec3) => void} */
    add = other => other.forEach((s, i) => this[i] = (this[i] ?? 0) + s)
    /** @type {(other: number) => Vec3} */
    times = x => this.map(i => i * x)
    /** @type {(other: Vec3) => number} */
    dot = other => this.map((s, i) => s * (other[i] ?? 0)).sum()
    /** @type {() => Vec3} */
    clone = () => this.map(i => i)
}

class Body {
    constructor(mass = 1, pos = new Vec3(0, 0, 0), velocity = new Vec3(0, 0 ,0)) {
        this.mass = mass;
        this.pos = pos;
        this.velocity = velocity;
        this._acceleration = new Vec3(0, 0, 0);
    }

    get_field_at_pos(pos = new Vec3(0, 0, 0)) {
        const r = this.pos.plus(pos.times(-1));
        const R = r.magnitude;
        return r.times(this.mass / Math.pow(R, 3));
    }
}

class System {
    /**
     * @param {{pos: Vec3, vel : Vec3, mass : number}[]} startingConditions
     */
    constructor(startingConditions) {
        this.bodies = startingConditions.map(
            ({pos, vel, mass}) => new Body(mass, pos, vel)
        );
        this.elapsedTime = 0;
    }

    update(timeStep = 0.016){
        for (const body of this.bodies){
            body.pos = body.pos.plus(body.velocity.plus(body._acceleration.times(timeStep / 2)).times(timeStep));
        }
        for(const body of this.bodies){
            let new_acceleration = new Vec3(0, 0, 0);
            for(const b of this.bodies){
                if(b === body) continue;
                new_acceleration = new_acceleration.plus(b.get_field_at_pos(body.pos));
            }
            body.velocity = body.velocity.plus(body._acceleration.plus(new_acceleration).times(timeStep / 2));
            body._acceleration = new_acceleration;
        }
        this.elapsedTime += timeStep;
    }
}
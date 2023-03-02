/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const G = 1;

class Vec extends Array {
    constructor (...x) {
        super(...x);
    }
    get magnitude2 () {
        return +this.map(i => i * i).reduce((a, b) => a + b);
    }
    get magnitude () {
        return Math.sqrt(this.magnitude2);
    }

    map = fn => new Vec(...super.map(fn));
    plus = other => this.map((s, i) => s + (other[i] ?? 0))
    add = other => other.forEach((s, i) => this[i] = (this[i] ?? 0) + s)
    times = x => this.map(i => i * x)
}

class Body {
    velocity = new Vec(0, 0, 0);
    pos = new Vec(0, 0, 0)
    mass = 1;
    _acceleration = new Vec(0, 0, 0);

    constructor(mass = 1) {
        this.mass = mass;
    }

    calc(pos = new Vec(0, 0, 0)) {
        const r = this.pos.plus(pos.times(-1));
        const R2 = r.magnitude2;
        const R = r.magnitude;
        return {r, R2, R};
    }

    get_field_at_pos(pos = new Vec(0, 0, 0)) {
        const {r, R} = this.calc(pos);
        return r.times(G * this.mass / Math.pow(R, 3));
    }

    get_potential_at_pos(pos = new Vec(0, 0, 0)) {
        const {R} = this.calc(pos);
        return +(G * this.mass / R);
    }
}

v_planet = [0, 0, 0];

const bodies = [new Body(), new Body(), new Body(), new Body(.0000001)];
[bodies[0].pos, bodies[1].pos, bodies[2].pos] = [new Vec(-1, 0, 0), new Vec(.5, -.86, 0), new Vec(.5, .86, 0)];
bodies[0].velocity = new Vec(0, 1, 0).times(.8);
bodies[1].velocity = new Vec(-.86, -.5, 0).times(.8);
bodies[2].velocity = new Vec(.86, -.5, 0).times(.8);

let TIME_STEP = .016;
let STEPS_PER_FRAME = 1;

/**
 * @param {Body[]} bodies
 * @param {number} [timeStep]
 */
function update(bodies, timeStep = 0.016) {
    for (const body of bodies){
        body.pos.add(body.velocity.plus(body._acceleration.times(timeStep / 2)).times(timeStep));
    }
    for(const body of bodies){
        let new_acceleration = new Vec(0, 0, 0);
        for(const b of bodies){
            if(b === body) continue;
            new_acceleration.add(b.get_field_at_pos(body.pos));
        }
        body.velocity.add(body._acceleration.plus(new_acceleration).times(timeStep / 2));
        body._acceleration = new_acceleration;
    }
}

function getPE(pos = new Vec(0, 0, 0)){
    return bodies.map(i => i.get_potential_at_pos(pos)).reduce((a, b) => a + b);
}

function hslToRgb(h, s, l){
    let r, g, b;
    if(s === 0){
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const aux = document.createElement('canvas');
// const auxctx = aux.getContext('2d');
// let resolution = 50;

function render() {
    aux.width = canvas.width = canvas.clientWidth;
    aux.height = canvas.height = canvas.clientHeight;

    ctx.fillStyle =  "#000";
    ctx.strokeStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // let imgDat = auxctx.getImageData(0, 0, aux.width, aux.height);
    // for(let x = 0; x < resolution; x++){
    //     for(let y = 0; y < resolution; y++){
    //         let i = y * resolution * 4 + x * 4;
    //         let PE = getPE(new Vec(
    //             (x * canvas.clientWidth / resolution - canvas.clientWidth / 2) / 30,
    //             (y * canvas.clientHeight / resolution - canvas.clientHeight / 2) / 30,
    //             0
    //         ));
    //         let hue = .5 - Math.atan(PE - 2) / Math.PI;
    //
    //         let [r, g, b] = hslToRgb(hue, 1, .5);
    //
    //         imgDat.data[i] = r;
    //         imgDat.data[i + 1] = g;
    //         imgDat.data[i + 2] = b;
    //         imgDat.data[i + 3] = 255;
    //     }
    // }
    // auxctx.putImageData(imgDat, 0, 0);
    ctx.drawImage(aux, 0, 0, canvas.width, canvas.height);

    for(const body of bodies){
        ctx.beginPath();
        ctx.arc(
            body.pos[0] * 30 + canvas.clientWidth / 2,
            body.pos[1] * 30 + canvas.clientHeight / 2,
            10 * Math.cbrt(body.mass),
            0,
            2 * Math.PI
        );
        ctx.stroke();
        ctx.closePath();
    }

    for(let i = 0; i < STEPS_PER_FRAME; i++)
        update(bodies, TIME_STEP);
    requestAnimationFrame(render);
}

render();
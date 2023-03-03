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
    clone = () => this.map(i => i)
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

const aux = new GLCanvas(document.createElement('canvas'));
aux.shader = `
precision mediump float;
varying vec2 fragCoord;
uniform vec3 p1;
uniform vec3 p2;
uniform vec3 p3;
uniform float m1;
uniform float m2;
uniform float m3;

uniform float xScale;
uniform float yScale;

const float G = 1.0;

float hue2rgb(float p, float q, float t){
    if(t < 0.) t += 1.;
    if(t > 1.) t -= 1.;
    if(t < 1./6.) return p + (q - p) * 6. * t;
    if(t < 1./2.) return q;
    if(t < 2./3.) return p + (q - p) * (2./3. - t) * 6.;
    return p;
}

vec3 hsl2rgb(float h, float s, float l){
    float r, g, b;
    if(s == 0.){
        r = g = b = l; // achromatic
    } else {
        float q = l < 0.5 ? l * (1. + s) : l + s - l * s;
        float p = 2. * l - q;
        r = hue2rgb(p, q, h + 1./3.);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1./3.);
    }
    return vec3(r, g, b);
}

void main(){
    vec3 pos = vec3(xScale * fragCoord.x, yScale * fragCoord.y, 0);
    float PE = G * (m1 / distance(pos, p1) + m2 / distance(pos, p2) + m3 / distance(pos, p3));
     
    gl_FragColor = vec4(hsl2rgb(0.393 - atan(log(PE) - 0.5) / 4., 1., 0.5 * (1. - 1. / (8.0 * PE + 1.))), 1.);
}
`

function render() {
    aux.size = [
        canvas.width = canvas.clientWidth,
        canvas.height = canvas.clientHeight
    ];

    ctx.fillStyle =  "#000";
    ctx.strokeStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    aux.setUniform('p1', "vec3", ...bodies[0].pos);
    aux.setUniform('p2', "vec3", ...bodies[1].pos);
    aux.setUniform('p3', "vec3", ...bodies[2].pos);

    aux.setUniform('m1', "float", bodies[0].mass);
    aux.setUniform('m2', "float", bodies[1].mass);
    aux.setUniform('m3', "float", bodies[2].mass);

    aux.setUniform('xScale', 'float', canvas.width / 60);
    aux.setUniform('yScale', 'float', canvas.height / 60);

    aux.render();
    ctx.drawImage(aux.canvas, 0, 0, canvas.width, canvas.height);

    for(const body of bodies){
        // save traj
        body.traj ||= [];
        body.traj.push(body.pos.clone());
        while (body.traj.length > 50) body.traj.shift();
        ctx.beginPath();
        ctx.moveTo(
            body.traj[0][0] * 30 + canvas.clientWidth / 2,
            body.traj[0][1] * 30 + canvas.clientHeight / 2
        );
        for (let [x, y] of body.traj.slice(1)) {
            ctx.lineTo(
                x * 30 + canvas.clientWidth / 2,
                y * 30 + canvas.clientHeight / 2
            )
        }
        ctx.stroke();
        ctx.closePath();

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
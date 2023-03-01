/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const G = 1;


function magnitude2(vec=[0]){
    return +vec.map(i => i * i).reduce((a, b) => a + b);
}
function magnitude(vec=[0, 0]){
    return Math.sqrt(magnitude2(vec));
}

class Body {
    velocity = [0, 0, 0]
    pos = [0, 0, 0]
    mass = 1;

    constructor(mass=1) {
        this.mass = mass;
    }

    calc(pos=[0,0,0]){
        const r = [pos[0] - this.pos[0], pos[1] - this.pos[1], pos[2] - this.pos[2]];
        const R2 = magnitude2(r);
        const R = Math.sqrt(R2);
        return {r, R2, R};
    }

    get_field_at_pos(pos=[0,0,0]) {
        const {r, R} = this.calc(pos);
        return r.map(i => i * G * this.mass / Math.pow(R, 3));
    }

    get_potential_at_pos(pos) {
        const {r, R2} = this.calc(pos);
        return r.map(i => i * G * this.mass / R2);
    }

    get KE(){
        return this.mass * magnitude2(this.velocity);
    }
}

v_planet = [0, 0];

const bodies = [new Body(), new Body(), new Body()];
[bodies[0].pos, bodies[1].pos, bodies[2].pos] = [[-1, 0, 0], [.5, -.86, 0], [.5, .86, 0]];
bodies[0].velocity = [0, 4, 0];


function update(){

}

function render(){

}
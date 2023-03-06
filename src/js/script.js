/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

/** @type {System} */
let system;

let STEPS_PER_FRAME = 1;

function reset() {
    // Load start conditions
    let [p1, p2, v1, v2] = ['p1','p2','v1','v2'].map(i => i.split('')).map(
        ([a,b]) => new Vec3(
            ...['x','y','z'].map(i => +document.getElementById(`${a}${i}-${b}`).value)
        )
    );
    let [m1, m2, m3] = [1, 2, 3].map(i => +document.getElementById(`m-${i}`).value);

    let cm = p1.times(m1).plus(p2.times(m2)).times(1/(m1+m2+m3));
    p1.add(cm.times(-1));
    p2.add(cm.times(-1));
    let p3 = cm.times(-1);
    let v3 = v1.times(m1).plus(v2.times(m2)).times(-1/m3);

    const stars = [
        {pos: p1, vel: v1, mass: m1},
        {pos: p2, vel: v2, mass: m2},
        {pos: p3, vel: v3, mass: m3}
    ]

    system = new System(stars);
}

document.getElementById('speed-input').oninput = _ =>{
    let v = +document.getElementById('speed-input').value;
    STEPS_PER_FRAME = Math.pow(2, v);
    document.getElementById('speed-display').innerText = `${Math.round(STEPS_PER_FRAME * 10) / 10}`;
}
document.getElementById('reset-btn').onclick = _ => reset();

reset();

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
    
    vec3 r1 = vec3((pos - p1).xy / atan(pow(1.5, -p1.z)), 0.),
         r2 = vec3((pos - p2).xy / atan(pow(1.5, -p2.z)), 0.),
         r3 = vec3((pos - p3).xy / atan(pow(1.5, -p3.z)), 0.);
    float d1 = length(r1),
          d2 = length(r2),
          d3 = length(r3);
    
    float PE = (m1 / d1 + m2 / d2 + m3 / d3);
    
    float hue = .4 + min(.6 * atan(pow(2., log(.4 * PE) + 1.0)), .76);
    float dist = 6. / PE;
    float lighten = 1.0 - 1.0 / (1.0 + 0.5 * pow(dist, 3.));
    float brightness = 0.5 * (1. - 1. / (3.0 * PE * PE + 1.));
    
    vec3 color = hsl2rgb(hue, 1., brightness);
    color = 1.0 - (1.0 - color) * lighten;
     
    gl_FragColor = vec4(color, 1.);
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

    aux.setUniform('p1', "vec3", ...system.bodies[0].pos);
    aux.setUniform('p2', "vec3", ...system.bodies[1].pos);
    aux.setUniform('p3', "vec3", ...system.bodies[2].pos);

    aux.setUniform('m1', "float", system.bodies[0].mass);
    aux.setUniform('m2', "float", system.bodies[1].mass);
    aux.setUniform('m3', "float", system.bodies[2].mass);

    aux.setUniform('xScale', 'float', canvas.width / 60);
    aux.setUniform('yScale', 'float', canvas.height / 60);

    aux.render();
    ctx.drawImage(aux.canvas, 0, 0, canvas.width, canvas.height);

    for(let i = 0; i < STEPS_PER_FRAME; i++)
        system.update();

    document.getElementById('time-display').innerText = 't = ' + Math.round(system.elapsedTime * 10) / 10;

    requestAnimationFrame(render);
}

render();
let c = document.getElementById("canva");
let ctx = c.getContext("2d");

const POINT_RAD = 5;
const LINE_WIDTH = 3;

function point({x, y}) {
    ctx.beginPath();
    ctx.arc(x, y, POINT_RAD, 0, 2 * Math.PI); 
    ctx.fillStyle = "rgb(0, 255, 0)";
    ctx.fill();
}

function draw_line(a, b) {
    ctx.strokeStyle = "rgb(0, 255, 0)";
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
}

class camera {
    constructor(pos, rot) {
        this.position = pos;
        this.rotation = rot;
    }
}

class scene {
    constructor(ms) { this.meshes = Array.isArray(ms) ? ms : [ms]; }
}

class mesh {
    constructor(p, v, t) {
        this.position = p;
        this.vertecies = v;
        this.triangles = t;
    }
}

function to_screen({x, y}) {
    return {
        x: ((x + 1) / 2) * c.width,
        y: ((-y + 1) / 2) * c.height,
    }
}

function to_world({x, y, z}) {
    const z_safe = z <= 0 ? 0.1 : z;
    return {
        x: x / z_safe,
        y: y / z_safe,
    }
}

function rotate_y(v, angle) {
    return {
        x: v.x * Math.cos(angle) - v.z * Math.sin(angle),
        y: v.y,
        z: v.x * Math.sin(angle) + v.z * Math.cos(angle)
    };
}

const verts = [
    {x: 0.5, y: 0.5, z: 0.5}, {x: 0.5, y: -0.5, z: 0.5},
    {x: -0.5, y: -0.5, z: 0.5}, {x: -0.5, y: 0.5, z: 0.5},
    {x: 0.5, y: 0.5, z: -0.5}, {x: 0.5, y: -0.5, z: -0.5},
    {x: -0.5, y: -0.5, z: -0.5}, {x: -0.5, y: 0.5, z: -0.5},
];

const tris = [
    [0, 1, 2], [2, 3, 0], [4, 5, 6], [6, 7, 4],
    [0, 3, 7], [7, 4, 0], [1, 2, 6], [6, 5, 1],
    [0, 1, 5], [5, 4, 0], [3, 2, 6], [6, 7, 3]
];

const keys = {};

window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

const SCENE = new scene(new mesh({x: 0, y: 0, z: 3}, verts, tris));

let cam = new camera({x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0});

let last_time = 0;

function InTriangle(p, p1, p2, p3) {
    let v0 = {x: p3.x - p1.x, y: p3.y - p1.y};
    let v1 = {x: p2.x - p1.x, y: p2.y - p1.y};
    let v2 = {x: p.x - p1.x, y: p.y - p1.y};

    let dot00 = v0.x * v0.x + v0.y * v0.y;
    let dot01 = v0.x * v1.x + v0.y * v1.y;
    let dot02 = v0.x * v2.x + v0.y * v2.y;
    let dot11 = v1.x * v1.x + v1.y * v1.y;
    let dot12 = v1.x * v2.x + v1.y * v2.y;

    let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v <= 1);
}

function render(s, cam) {
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
    }

    for (let m of s.meshes) {
        let projected_verts = m.vertecies.map(v => {
            let world_pos = {
                x: v.x + m.position.x - cam.position.x,
                y: v.y + m.position.y - cam.position.y,
                z: v.z + m.position.z - cam.position.z
            };
            return to_screen(to_world(world_pos));
        });

        for (let t of m.triangles) {
            let p1 = projected_verts[t[0]];
            let p2 = projected_verts[t[1]];
            let p3 = projected_verts[t[2]];

            let x_min = Math.max(0, Math.floor(Math.min(p1.x, p2.x, p3.x)));
            let x_max = Math.min(c.width, Math.ceil(Math.max(p1.x, p2.x, p3.x)));
            let y_min = Math.max(0, Math.floor(Math.min(p1.y, p2.y, p3.y)));
            let y_max = Math.min(c.height, Math.ceil(Math.max(p1.y, p2.y, p3.y)));

            for (let y = y_min; y < y_max; y++) {
                for (let x = x_min; x < x_max; x++) {
                    if (InTriangle({x, y}, p1, p2, p3)) {
                        let i = (y * c.width + x) * 4;
                        data[i + 1] = 255;
                    }
                }
            }
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function loop(time) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, c.width, c.height);

    if (!last_time) last_time = time;
    let dt = (time - last_time) / 1000; 
    last_time = time;
    
    if (keys['w']) cam.position.z += 2 * dt;
    if (keys['s']) cam.position.z -= 2 * dt;
    if (keys['a']) cam.position.x -= 2 * dt;
    if (keys['d']) cam.position.x += 2 * dt;

    render(SCENE, cam);

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

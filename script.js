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

function to_screen({x, y}) {
    return {
        x: ((x + 1) / 2) * c.width,
        y: ((-y + 1) / 2) * c.height,
    }
}

function rotate_y({x, y, z}, angle) {
    return {
        x: x * Math.cos(angle) - z * Math.sin(angle),
        y: y,
        z: x * Math.sin(angle) + z * Math.cos(angle),
    };
}

function to_world({x, y, z}) {
    return {
        x: x / z,
        y: y / z,
    }
}

let last_time = 0;
let dz = 0;
let rot = 0;

let new_pos = [];

const verts = [
    {x: 0.5, y: 0.5, z: 0.5},
    {x: 0.5, y: -0.5, z: 0.5},
    {x: -0.5, y: -0.5, z: 0.5},
    {x: -0.5, y: 0.5, z: 0.5},

    {x: 0.5, y: 0.5, z: -0.5},
    {x: 0.5, y: -0.5, z: -0.5},
    {x: -0.5, y: -0.5, z: -0.5},
    {x: -0.5, y: 0.5, z: -0.5},
]

const tris = [
    [0, 1, 2], [2, 3, 0],
    [4, 5, 6], [6, 7, 4],
    [0, 3, 7], [7, 4, 0],
    [1, 2, 6], [6, 5, 1],
    [0, 1, 5], [5, 4, 0],
    [3, 2, 6], [6, 7, 3]
];

function loop(time) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, c.width, c.height);

    if (!last_time) last_time = time;
    let dt = (time - last_time) / 1000; 
    last_time = time;

    dz += 0.5 * dt;
    rot += 1.5 * dt;

    new_verts = [];
    for (let i=0;i<verts.length;i++) {
        let rotated = rotate_y(verts[i], rot);
        
        new_verts.push({
            x: rotated.x, 
            y: rotated.y, 
            z: rotated.z + dz,
        });
        
        point(to_screen(to_world({
            x: rotated.x, 
            y: rotated.y, 
            z: rotated.z + dz,
        })));
    }
    for (let i = 0; i < tris.length; i++) {
        for (let j = 0; j < tris[i].length; j++) {
            let index1 = tris[i][j];
            let index2 = tris[i][(j + 1) % 3];

            let p1 = to_screen(to_world(new_verts[index1]));
            let p2 = to_screen(to_world(new_verts[index2]));

            draw_line(p1, p2);
        }
    }
    
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

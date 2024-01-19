'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.BufferDataNormal = function (normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    let x1 = document.getElementById('x1').value,
        y1 = document.getElementById('y1').value,
        z1 = document.getElementById('z1').value,
        x2 = document.getElementById('x2').value,
        y2 = document.getElementById('y2').value,
        z2 = document.getElementById('z2').value
    gl.uniform3fv(shProgram.iLightLocation, [x1, y1, z1]);
    gl.uniform3fv(shProgram.iLightDirection, [x2, y2, z2]);
    gl.uniform1f(shProgram.iAngle, document.getElementById('angle').value);
    gl.uniform1f(shProgram.iFocus, document.getElementById('focus').value);

    surface.Draw();
}

function reDraw() {
    surface.BufferData(CreateSurfaceData());
    surface.BufferDataNormal(CreateSurfaceDataNormal());
    draw()
}

function CreateSurfaceData() {
    let vertexList = [];
    let numStepsI = document.getElementById('numSteps').value,
        numStepsJ = numStepsI / 2;

    for (let i = 0; i < numStepsI; i++) {
        for (let j = -numStepsJ; j < numStepsJ; j++) {
            vertexList.push(...monge((i) / 10, (j) / 10))
            vertexList.push(...monge((i + 1) / 10, (j) / 10))
            vertexList.push(...monge((i) / 10, (j + 1) / 10))
            vertexList.push(...monge((i) / 10, (j + 1) / 10))
            vertexList.push(...monge((i + 1) / 10, (j) / 10))
            vertexList.push(...monge((i + 1) / 10, (j + 1) / 10))
        }
    }

    return vertexList;
}
function CreateSurfaceDataNormal() {
    let normalList = [];
    let numStepsI = document.getElementById('numSteps').value,
        numStepsJ = numStepsI / 2;

    for (let i = 0; i < numStepsI; i++) {
        for (let j = -numStepsJ; j < numStepsJ; j++) {
            normalList.push(...mongeNormal((i) / 10, (j) / 10))
            normalList.push(...mongeNormal((i + 1) / 10, (j) / 10))
            normalList.push(...mongeNormal((i) / 10, (j + 1) / 10))
            normalList.push(...mongeNormal((i) / 10, (j + 1) / 10))
            normalList.push(...mongeNormal((i + 1) / 10, (j) / 10))
            normalList.push(...mongeNormal((i + 1) / 10, (j + 1) / 10))
        }
    }

    return normalList;
}
const scaler = 0.1
function monge(a, t) {
    return [scaler * x(a, t), scaler * y(a, t), scaler * z(t)]
}
const e = 0.001
function mongeNormal(a, t) {
    let vert = monge(a, t)
    let vertA = monge(a + e, t)
    let vertB = monge(a, t + e)
    const n1 = [
        (vert[0] - vertA[0]) / e,
        (vert[1] - vertA[1]) / e,
        (vert[2] - vertA[2]) / e
    ]
    const n2 = [
        (vert[0] - vertB[0]) / e,
        (vert[1] - vertB[1]) / e,
        (vert[2] - vertB[2]) / e
    ]
    return m4.normalize(m4.cross(n1, n2))
}
const { PI, sin, cos } = Math;
const r = 1, theta = PI / 2, a0 = 1, aParam = 0.1;
function x(a, t) {
    let coord = r * cos(a) - (r * (a0 - a) + t * cos(theta) - aParam * t * t * sin(theta)) * sin(a)
    return coord;
}
function y(a, t) {
    let coord = r * sin(a) + (r * (a0 - a) + t * cos(theta) - aParam * t * t * sin(theta)) * cos(a)
    return coord;
}
function z(t) {
    let coord = t * sin(theta) + aParam * t * t * cos(theta);
    return coord;
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLightLocation = gl.getUniformLocation(prog, "lightLocation");
    shProgram.iLightDirection = gl.getUniformLocation(prog, "lightDirection");
    shProgram.iAngle = gl.getUniformLocation(prog, "angle");
    shProgram.iFocus = gl.getUniformLocation(prog, "focus");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.BufferDataNormal(CreateSurfaceDataNormal());

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

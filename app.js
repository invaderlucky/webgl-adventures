var InitDemo = function() {
    var canvas = document.getElementById('game-surface');
    var gl = canvas.getContext('webgl');

    if (!gl) {
        console.log('WebGL not supported - starting experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }
    
    if (!gl) {
        console.log('WebGL not supported at all - use a different browser');
    }

    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Only render the front facing stuff
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    var vertexShaderCode = `
        precision mediump float;
        
        attribute vec3 vertexPosition;
        attribute vec2 vertexTexCoord;
        varying vec2 fragTexCoord;

        uniform mat4 modelMat;
        uniform mat4 viewMat;
        uniform mat4 projMat;

        void main() {
            fragTexCoord = vertexTexCoord;
            gl_Position = projMat * viewMat * modelMat * vec4(vertexPosition, 1.0);
        }
    `;

    var fragmentShaderCode = `
        precision mediump float;

        varying vec2 fragTexCoord;
        uniform sampler2D sampler;

        void main() {
            gl_FragColor = texture2D(sampler, fragTexCoord);
        }
    `;

    // Create shaders
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    // Create program
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }
    
    gl.useProgram(program);

    // Create buffer
    var boxVertices = 
    [ // X, Y, Z           U, V
        // Top
        -1.0, 1.0, -1.0,   0, 0, // -1 = 0, 1 = 1, ignore the one that is constant for all four parts
        -1.0, 1.0, 1.0,    0, 1,
        1.0, 1.0, 1.0,     1, 1,
        1.0, 1.0, -1.0,    1, 0,
     
        // Left
        -1.0, 1.0, 1.0,    1, 1,
        -1.0, -1.0, 1.0,   0, 1,
        -1.0, -1.0, -1.0,  0, 0,
        -1.0, 1.0, -1.0,   1, 0,
     
        // Right
        1.0, 1.0, 1.0,    1, 1,
        1.0, -1.0, 1.0,   0, 1,
        1.0, -1.0, -1.0,  0, 0,
        1.0, 1.0, -1.0,   1, 0,
     
        // Front
        1.0, 1.0, 1.0,    1, 1,
        1.0, -1.0, 1.0,    1, 0,
        -1.0, -1.0, 1.0,    0, 0,
        -1.0, 1.0, 1.0,    0, 1,
     
        // Back
        1.0, 1.0, -1.0,     1, 1,
        1.0, -1.0, -1.0,    1, 0,
        -1.0, -1.0, -1.0,   0, 0,
        -1.0, 1.0, -1.0,    0, 1,
     
        // Bottom
        -1.0, -1.0, -1.0,   0, 0,
        -1.0, -1.0, 1.0,    0, 1,
        1.0, -1.0, 1.0,     1, 1,
        1.0, -1.0, -1.0,    1, 0
    ];

    var boxIndices =
    [
        // Top
        0, 1, 2,
        0, 2, 3,
     
        // Left
        5, 4, 6,
        6, 4, 7,
     
        // Right
        8, 9, 10,
        8, 10, 11,
     
        // Front
        13, 12, 14,
        15, 14, 12,
     
        // Back
        16, 17, 18,
        16, 18, 19,
     
        // Bottom
        21, 20, 22,
        22, 20, 23
    ];

    var boxVertexBuffer = gl.createBuffer();
    // Makes this the active buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBuffer);
    // Set what data the active buffer has
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    var boxIndexBuffer = gl.createBuffer();
    // Makes this the active buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBuffer);
    // Set what data the active buffer has
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    // Pass all the data to the attributes in the vertex shader
    var positionAttribLocation = gl.getAttribLocation(program, 'vertexPosition');
    var texCoordAttribLocation = gl.getAttribLocation(program, 'vertexTexCoord');

    gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location
        3, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT, // Size of a vertex (includes coords and color)
        0 // Offset from the beginning of a vertex
    );

    gl.vertexAttribPointer(
        texCoordAttribLocation, // Attribute location
        2, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT, // Size of a vertex (includes coords and color)
        3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a vertex
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(texCoordAttribLocation);

    // Create texture

    // Place holder texture
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([255, 0, 0, 255])); // red

    // Actual texture
    // var boxTexture = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);    
    
    // gl.texImage2D(
    //     gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
    //     gl.UNSIGNED_BYTE, 
    //     document.getElementById('crate-image')
    // );

    //Stuff for tainted canvas
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = document.getElementById("crate-image").src;

    img.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
        gl.UNSIGNED_BYTE, 
        img
    );

    // Set up view/perspective
    var modelMatrix = mat4.create();
    var viewMatrix = mat4.create();
    var projMatrix = mat4.create();
    
    var eye = vec3.fromValues(0, 0, -6);
    var center = vec3.fromValues(0, 0, 0);
    var viewUp = vec3.fromValues(0, 1, 0);

    mat4.identity(modelMatrix);
    mat4.lookAt(viewMatrix, eye, center, viewUp);
    mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 100.0);

    // Send up to shader
    var matWorldUniformLocation = gl.getUniformLocation(program, 'modelMat');
    var matViewUniformLocation = gl.getUniformLocation(program, 'viewMat');
    var matProjUniformLocation = gl.getUniformLocation(program, 'projMat');

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, modelMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    // Rotation setup
    var xRotMatrix = mat4.create();
    var yRotMatrix = mat4.create();

    // Render
    var identityMatrix = mat4.create();
    mat4.identity(identityMatrix);
    var angle = 0;

    var loop = function() {
        angle = performance.now() / 1000 / 6 * 2 * Math.PI;

        mat4.rotate(yRotMatrix, identityMatrix, angle, [0, 1, 0]);
        mat4.rotate(xRotMatrix, identityMatrix, angle / 3, [1, 0, 0]);
        mat4.mul(modelMatrix, yRotMatrix, xRotMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, modelMatrix);

        gl.clearColor(0.1, 0.2, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.activeTexture(gl.TEXTURE0);

        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}
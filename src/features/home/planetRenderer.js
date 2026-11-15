import rings from './planet-textures/saturn-rings.png';

const vertexSource = `
  attribute vec2 position;
  varying vec2 pixel;

  void main() {
    pixel = position;
    gl_Position = vec4(position, 0., 1.);
  }
`;

const fragmentSource = `
  precision mediump float;

  uniform sampler2D surface;
  uniform sampler2D rings;
  uniform float longitude;
  uniform float ringed;
  uniform float edgeWidth;
  varying vec2 pixel;

  const float PI = 3.14159265;
  const vec3 light = vec3(-.47, .50, .73);

  void main() {
    vec2 p = pixel * mix(1.015, 2.27, ringed);
    float r = length(p);
    float z = sqrt(max(1. - r * r, 0.));
    vec3 normal = vec3(p, z);
    float alpha = 1. - smoothstep(1. - edgeWidth, 1., r);
    vec4 planet = vec4(0.);

    if (alpha > 0.) {
      vec3 tilted = vec3(normal.x, .982 * normal.y + .189 * normal.z, .982 * normal.z - .189 * normal.y);
      vec2 uv = vec2(.5 + (atan(tilted.x, tilted.z) + longitude) / (2. * PI),
                     .5 - asin(clamp(tilted.y, -1., 1.)) / PI);
      vec3 albedo = texture2D(surface, uv).rgb;
      float diffuse = max(dot(light, normal), 0.);
      float rim = pow(1. - z, 3.);
      vec3 lit = albedo * (.33 + .78 * diffuse) + albedo * rim * .1;
      planet = vec4(lit, alpha);
    }

    vec4 belt = vec4(0.);
    if (ringed > .5) {
      // Intersect the ray with Saturn's tilted ring plane, in sphere radii.
      float depth = (.29 * p.x - p.y) / .58;
      float radius = length(vec3(p, depth));
      if (radius > 1.23 && radius < 2.17) {
        belt = texture2D(rings, vec2((radius - 1.23) / .94, .5));
        float shade = mix(.54, 1.1, smoothstep(-2., 1.4, -p.x));
        belt.rgb *= vec3(1.28, 1.18, 1.08) * shade;
        if (depth > z && alpha > 0.) {
          float combined = belt.a + planet.a * (1. - belt.a);
          vec3 color = belt.rgb * belt.a + planet.rgb * planet.a * (1. - belt.a);
          gl_FragColor = vec4(color / combined, combined);
          return;
        }
      }
    }
    float combined = planet.a + belt.a * (1. - planet.a);
    vec3 color = planet.rgb * planet.a + belt.rgb * belt.a * (1. - planet.a);
    gl_FragColor = vec4(color / max(combined, .001), combined);
  }
`;

function makeShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createPlanetRenderer(onTextureReady) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false, depth: false });
  if (!gl) return null;

  const vertex = makeShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = makeShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (vertex && fragment) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
  }
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniforms = Object.fromEntries(['surface', 'rings', 'longitude', 'ringed', 'edgeWidth']
    .map(name => [name, gl.getUniformLocation(program, name)]));
  gl.uniform1i(uniforms.surface, 0);
  gl.uniform1i(uniforms.rings, 1);

  const textures = new Map();
  let disposed = false;
  function loadTexture(url, wrap) {
    const entry = { texture: null, image: new Image() };
    textures.set(url, entry);
    entry.image.onload = () => {
      if (disposed || gl.isContextLost()) return;
      const texture = gl.createTexture();
      if (!texture) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, entry.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      entry.texture = texture;
      onTextureReady();
    };
    entry.image.src = url;
  }

  loadTexture(rings, gl.CLAMP_TO_EDGE);

  return {
    canvas,
    preload(world) {
      if (!textures.has(world.texture)) loadTexture(world.texture, gl.REPEAT);
    },
    draw(world, size, longitude) {
      const surface = textures.get(world.texture)?.texture;
      const ringTexture = textures.get(rings)?.texture;
      const ringed = world.id === 'saturn' && Boolean(ringTexture);
      if (!surface || gl.isContextLost()) return false;
      gl.viewport(0, 0, size, size);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, surface);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, ringTexture || surface);
      gl.uniform1f(uniforms.longitude, longitude);
      gl.uniform1f(uniforms.ringed, Number(ringed));
      gl.uniform1f(uniforms.edgeWidth, (ringed ? 4.5 : 2) / size);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return true;
    },
    destroy() {
      disposed = true;
      for (const { texture, image } of textures.values()) {
        image.onload = null;
        if (texture) gl.deleteTexture(texture);
      }
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

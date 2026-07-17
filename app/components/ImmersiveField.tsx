"use client";

import { useEffect, useRef } from "react";

export type ImmersivePhase = "idle" | "processing" | "ready";

const vertexShader = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_phase;

float sdSphere(vec3 p, float radius) {
  return length(p) - radius;
}

float scene(vec3 p) {
  float pulse = sin(u_time * 1.1) * .07;
  vec3 core = p - vec3((u_pointer.x - .5) * .45, (u_pointer.y - .5) * -.32, -3.3);
  float d = sdSphere(core, .72 + pulse);
  vec3 satellite = p - vec3(sin(u_time * .55) * 1.15, cos(u_time * .45) * .48, -3.55 + sin(u_time * .35) * .25);
  d = min(d, sdSphere(satellite, .13));
  return d;
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / resolution.y;
  vec2 drift = (u_pointer - .5) * vec2(.22, -.16);
  uv += drift;

  float travel = smoothstep(.0, 1.0, u_phase);
  vec3 ro = vec3(0.0, 0.0, .15 + travel * .72);
  vec3 rd = normalize(vec3(uv, -1.72 + travel * .28));
  float distanceTravelled = 0.0;
  float glow = 0.0;
  float hit = 0.0;

  for (int i = 0; i < 52; i++) {
    vec3 p = ro + rd * distanceTravelled;
    float d = scene(p);
    glow += .011 / (.035 + abs(d));
    if (d < .006) {
      hit = 1.0;
      break;
    }
    distanceTravelled += max(d * .68, .012);
    if (distanceTravelled > 7.0) break;
  }

  vec3 midnight = vec3(.008, .012, .035);
  vec3 indigo = vec3(.16, .11, .58);
  vec3 cyan = vec3(.12, .72, .92);
  vec3 mint = vec3(.18, .92, .68);
  vec3 color = midnight;
  color += indigo * pow(max(0.0, 1.0 - length(uv) * .48), 3.0) * .28;
  color += mix(indigo, cyan, .42 + .35 * sin(u_time * .22)) * glow * .042;
  color += hit * mix(cyan, vec3(.88, .93, 1.0), .58) * .68;
  color += mint * travel * glow * .018;

  float rings = abs(sin(length(uv + vec2(.08, -.03)) * 11.0 - u_time * (1.0 + travel * 2.4)));
  color += mix(indigo, cyan, travel) * smoothstep(.985, 1.0, rings) * (.03 + travel * .07);
  float vignette = smoothstep(1.72, .28, length(uv));
  color *= .64 + vignette * .48;
  color += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .012;

  gl_FragColor = vec4(color, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ImmersiveField({ phase }: { phase: ImmersivePhase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const position = gl.getAttribLocation(program, "a_position");
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const pointerUniform = gl.getUniformLocation(program, "u_pointer");
    const timeUniform = gl.getUniformLocation(program, "u_time");
    const phaseUniform = gl.getUniformLocation(program, "u_phase");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const pointer = { x: .5, y: .5, targetX: .5, targetY: .5 };
    let phaseValue = 0;
    let raf = 0;
    let active = true;

    const onPointer = (event: PointerEvent) => {
      pointer.targetX = event.clientX / Math.max(window.innerWidth, 1);
      pointer.targetY = event.clientY / Math.max(window.innerHeight, 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.floor(canvas.clientWidth * ratio);
      const height = Math.floor(canvas.clientHeight * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const render = (now: number) => {
      if (!active) return;
      resize();
      pointer.x += (pointer.targetX - pointer.x) * .035;
      pointer.y += (pointer.targetY - pointer.y) * .035;
      const targetPhase = phaseRef.current === "processing" ? 1 : phaseRef.current === "ready" ? .46 : 0;
      phaseValue += (targetPhase - phaseValue) * .035;

      gl.useProgram(program);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform2f(pointerUniform, pointer.x, pointer.y);
      gl.uniform1f(timeUniform, now * .001);
      gl.uniform1f(phaseUniform, phaseValue);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };

    const onVisibility = () => {
      active = !document.hidden;
      if (active) raf = requestAnimationFrame(render);
      else cancelAnimationFrame(raf);
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(render);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} className="immersiveField" aria-hidden="true" />;
}

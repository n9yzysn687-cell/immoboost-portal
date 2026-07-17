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
uniform float u_focus;

#define PI 3.14159265359

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

mat2 rotate2d(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

float sdSphere(vec3 p, float radius) {
  return length(p) - radius;
}

float smoothUnion(float a, float b, float k) {
  float h = clamp(.5 + .5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

vec2 focusPosition(float focus) {
  if (focus < -.5) return vec2(0.0);
  if (focus < .5) return vec2(-.72, .45);
  if (focus < 1.5) return vec2(.72, .3);
  if (focus < 2.5) return vec2(-.68, -.45);
  return vec2(.7, -.42);
}

float world(vec3 p) {
  float selected = step(-.5, u_focus);
  float process = smoothstep(.12, .92, u_phase) * (1.0 - smoothstep(1.15, 1.9, u_phase));
  vec2 target = focusPosition(u_focus) * selected;
  vec3 q = p;
  q.xy += target * .27;
  q.xy *= rotate2d(-.08 + sin(u_time * .15) * .025);

  float organic = sin(q.x * 4.2 + u_time * .7) * sin(q.y * 4.7 - u_time * .45) * sin(q.z * 4.0) * .035;
  float core = sdSphere(q - vec3(.46, .02, -3.55 + process * .45), .76 + organic + process * .2);

  float orbitTime = u_time * .24;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float angle = orbitTime + fi * PI * .5;
    vec3 satellitePosition = vec3(cos(angle) * 1.58 + .45, sin(angle) * .78, -3.7 + sin(angle * 1.7) * .36);
    float active = 1.0 - smoothstep(.1, .55, abs(u_focus - fi));
    satellitePosition.xy = mix(satellitePosition.xy, vec2(.12, .02), active * selected * .7);
    satellitePosition.z += active * selected * .8;
    float satellite = sdSphere(p - satellitePosition, .105 + active * .075);
    core = smoothUnion(core, satellite, .08 + active * .08);
  }

  return core;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(.006, 0.0);
  return normalize(vec3(
    world(p + e.xyy) - world(p - e.xyy),
    world(p + e.yxy) - world(p - e.yxy),
    world(p + e.yyx) - world(p - e.yyx)
  ));
}

void main() {
  vec2 resolution = max(u_resolution, vec2(1.0));
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / resolution.y;
  vec2 pointer = (u_pointer - .5) * vec2(.18, -.14);
  uv += pointer;

  float selected = step(-.5, u_focus);
  float process = smoothstep(.05, .95, u_phase) * (1.0 - smoothstep(1.05, 1.95, u_phase));
  float ready = smoothstep(1.15, 2.0, u_phase);
  vec2 focusDrift = focusPosition(u_focus) * selected;

  vec3 ro = vec3(-.1 - focusDrift.x * .16, focusDrift.y * -.11, .35 + process * .85 - ready * .08);
  vec3 rd = normalize(vec3(uv, -1.72 + process * .42));
  float travelled = 0.0;
  float glow = 0.0;
  float hit = 0.0;
  vec3 hitPoint = vec3(0.0);

  for (int i = 0; i < 48; i++) {
    vec3 p = ro + rd * travelled;
    float d = world(p);
    glow += .0105 / (.055 + abs(d));
    if (d < .006) {
      hit = 1.0;
      hitPoint = p;
      break;
    }
    travelled += max(d * .63, .012);
    if (travelled > 7.0) break;
  }

  vec3 midnight = vec3(.006, .009, .026);
  vec3 indigo = vec3(.21, .12, .67);
  vec3 violet = vec3(.43, .28, .95);
  vec3 cyan = vec3(.16, .72, .96);
  vec3 mint = vec3(.22, .94, .7);
  vec3 color = midnight;

  float radial = max(0.0, 1.0 - length(uv * vec2(.82, 1.0)) * .55);
  color += mix(indigo, cyan, .2 + .25 * sin(u_time * .11)) * pow(radial, 4.0) * .17;
  color += mix(violet, cyan, .43 + process * .32) * glow * (.027 + process * .014);

  if (hit > .5) {
    vec3 n = normalAt(hitPoint);
    vec3 lightDirection = normalize(vec3(-.7, .85, .45));
    float diffuse = max(dot(n, lightDirection), 0.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.8);
    float bands = .5 + .5 * sin(hitPoint.y * 8.0 + hitPoint.x * 4.0 - u_time * .5);
    vec3 surface = mix(indigo, cyan, diffuse * .72 + bands * .13);
    surface = mix(surface, mint, process * .25 + ready * .08);
    color += surface * (.42 + diffuse * .9) + rim * mix(cyan, violet, .42) * .9;
  }

  float ringRadius = length((uv - vec2(.19, .0)) * vec2(1.0, 1.72));
  float ringA = 1.0 - smoothstep(.006, .018, abs(ringRadius - .74 - sin(u_time * .35) * .015));
  float ringB = 1.0 - smoothstep(.006, .018, abs(ringRadius - 1.05 + cos(u_time * .28) * .02));
  color += (ringA * .055 + ringB * .026) * mix(violet, cyan, .5 + process * .3);

  vec2 starCell = floor((uv + 3.0) * 37.0);
  vec2 starLocal = fract((uv + 3.0) * 37.0) - .5;
  float starSeed = hash21(starCell);
  float stars = smoothstep(.055, 0.0, length(starLocal)) * step(.972, starSeed);
  color += stars * (.25 + .5 * sin(u_time * (starSeed + .2) + starSeed * 10.0)) * mix(cyan, vec3(1.0), .65);

  color *= .66 + smoothstep(1.75, .22, length(uv)) * .44;
  color *= 1.0 - ready * .34;
  color += (hash21(gl_FragCoord.xy + u_time) - .5) * .009;
  gl_FragColor = vec4(color, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ImmersiveField({ phase, focus = -1 }: { phase: ImmersivePhase; focus?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  const focusRef = useRef(focus);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { focusRef.current = focus; }, [focus]);

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
    const focusUniform = gl.getUniformLocation(program, "u_focus");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const pointer = { x: .5, y: .5, targetX: .5, targetY: .5 };
    let phaseValue = 0;
    let focusValue = -1;
    let raf = 0;
    let active = true;
    let previousFrame = 0;

    const onPointer = (event: PointerEvent) => {
      pointer.targetX = event.clientX / Math.max(window.innerWidth, 1);
      pointer.targetY = event.clientY / Math.max(window.innerHeight, 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.4);
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
      const mobile = window.innerWidth < 700;
      if (mobile && now - previousFrame < 32) {
        raf = requestAnimationFrame(render);
        return;
      }
      previousFrame = now;
      resize();
      pointer.x += (pointer.targetX - pointer.x) * .035;
      pointer.y += (pointer.targetY - pointer.y) * .035;
      const targetPhase = phaseRef.current === "processing" ? 1 : phaseRef.current === "ready" ? 2 : 0;
      phaseValue += (targetPhase - phaseValue) * .028;
      focusValue += (focusRef.current - focusValue) * .035;

      gl.useProgram(program);
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform2f(pointerUniform, pointer.x, pointer.y);
      gl.uniform1f(timeUniform, now * .001);
      gl.uniform1f(phaseUniform, phaseValue);
      gl.uniform1f(focusUniform, focusValue);
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

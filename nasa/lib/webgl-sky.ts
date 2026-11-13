import type { Camera } from './sky';

export type SkyRenderState = { width: number; height: number; ratio: number; camera: Camera; frame: number; selected: number; bandCount: number; infrared: boolean; grid: boolean };
const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
const background = `precision highp float;
uniform vec2 resolution,pan; uniform float zoom,ratio,frame,variable,infrared,grid;
void main(){
  vec2 p=vec2(gl_FragCoord.x/ratio,resolution.y-gl_FragCoord.y/ratio);
  vec2 world=(p-pan)/zoom;
  vec3 color=vec3(.0196,.0392,.0784);
  for(int i=0;i<8;i++){
    float f=float(i);vec2 center=resolution*vec2(.12+f*.13,.65-f*.065);
    float glow=max(0.,1.-distance(world,center)/(resolution.x*.38));
    color+=mix(vec3(.008,.016,.025),vec3(.023,.014,.03),infrared)*glow*glow;
  }
  vec2 line=abs(mod(world+72.5,145.)-72.5)*zoom;
  float g=1.-smoothstep(.3,1.,min(line.x,line.y));color+=vec3(.03,.05,.07)*g*grid;
  vec2 target=(resolution*vec2(.49,.39)+vec2(21.+frame*7.,27.-frame*3.))*zoom+pan;
  vec2 d=p-target;float r=length(d);
  float pulse=mix(1.,1.+sin(frame*1.4)*.5,variable);
  color+=vec3(.7,.4,.35)*exp(-r*r/200.)*.35+vec3(1.,.9,.8)*exp(-r*r/(5.*pulse));
  float cross=(1.-smoothstep(.3,1.,min(abs(d.x),abs(d.y))))*(1.-smoothstep(10.,15.,max(abs(d.x),abs(d.y))));
  color+=vec3(.35,.3,.26)*cross;
  vec2 trail=vec2(92.,-39.)*zoom;vec2 from=d-vec2(-48.,20.)*zoom;
  float t=clamp(dot(from,trail)/dot(trail,trail),0.,1.);
  float dash=step(.5,fract(t*12.));float motion=(1.-smoothstep(.3,1.,length(from-t*trail)))*dash;
  color+=vec3(.15,.24,.32)*motion;
  gl_FragColor=vec4(color,1.);
}`;
const starVertex = `precision highp float;
attribute vec4 star; attribute vec2 tile; attribute float tint;
uniform vec2 resolution,pan;uniform float zoom,ratio,infrared,bands,maxPoint;
varying vec3 color;varying float opacity,core;
void main(){
  vec2 span=resolution*zoom;
  vec2 p=mod(star.xy*span+pan,span)+tile*span;
  gl_Position=vec4(p.x/resolution.x*2.-1.,1.-p.y/resolution.y*2.,0.,1.);
  float radius=(.25+pow(star.z,6.)*1.9)*sqrt(zoom);
  float halo=step(.94,star.z);float diameter=radius*mix(2.5,14.,halo);
  gl_PointSize=min(maxPoint,max(1.,diameter*ratio));core=mix(.8,.13,halo);
  color=tint<.2?vec3(.624,.753,.937):(tint>.85&&infrared>.5?vec3(.953,.71,.573):vec3(.855,.875,.937));
  opacity=(.15+star.w*.8)*mix(1.,.4+.6*sqrt(bands/102.),infrared);
}`;
const starFragment = `precision mediump float; varying vec3 color;varying float opacity,core;
void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
float light=exp(-r*r/(core*core))+.15*exp(-r*r*5.);
gl_FragColor=vec4(color,opacity*light);}`;

export function createWebGLSky(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const shaders: WebGLShader[] = [], programs: WebGLProgram[] = [], buffers: WebGLBuffer[] = [];
  function dispose() { buffers.forEach(buffer => gl!.deleteBuffer(buffer)); programs.forEach(program => gl!.deleteProgram(program)); shaders.forEach(shader => gl!.deleteShader(shader)); }
  function program(v: string, f: string) {
    const result = gl!.createProgram(); if (!result) throw new Error('Unable to create shader program'); programs.push(result);
    for (const [type, source] of [[gl!.VERTEX_SHADER, v], [gl!.FRAGMENT_SHADER, f]] as const) {
      const shader = gl!.createShader(type); if (!shader) throw new Error('Unable to create shader'); shaders.push(shader);
      gl!.shaderSource(shader, source); gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) throw new Error('Sky shader compilation failed');
      gl!.attachShader(result, shader);
    }
    gl!.linkProgram(result); if (!gl!.getProgramParameter(result, gl!.LINK_STATUS)) throw new Error('Sky shader linking failed');
    return result;
  }
  try {
    const sky = program(vertex, background), points = program(starVertex, starFragment);
    function buffer(data: Float32Array) { const b = gl!.createBuffer(); if (!b) throw new Error('Unable to create buffer'); buffers.push(b); gl!.bindBuffer(gl!.ARRAY_BUFFER, b); gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW); return b; }
    const quad = buffer(new Float32Array([-1,-1,1,-1,-1,1,1,1]));
    let seed = 8239; const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    const stars = Array.from({ length: 2300 }, () => [random(),random(),random(),random(),random()]);
    const data: number[] = [];
    for (let x = -1; x <= 2; x++) for (let y = -1; y <= 2; y++) for (const star of stars) data.push(...star,x,y);
    const starBuffer = buffer(new Float32Array(data));
    const maxPoint = (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array)[1];
    function attribute(p: WebGLProgram, name: string, length: number, stride: number, offset: number) {
      const location = gl!.getAttribLocation(p,name); gl!.enableVertexAttribArray(location); gl!.vertexAttribPointer(location,length,gl!.FLOAT,false,stride,offset); return location;
    }
    const skyUniforms = Object.fromEntries(['resolution','pan','zoom','ratio','frame','variable','infrared','grid'].map(name => [name,gl.getUniformLocation(sky,name)]));
    const pointUniforms = Object.fromEntries(['resolution','pan','zoom','ratio','infrared','bands','maxPoint'].map(name => [name,gl.getUniformLocation(points,name)]));
    return {
      dispose,
      draw(state: SkyRenderState) {
        if (gl.isContextLost() || !state.width || !state.height) return;
        const { width, height, ratio, camera } = state;
        const w = Math.round(width*ratio), h = Math.round(height*ratio);
        if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
        gl.viewport(0,0,w,h); gl.disable(gl.BLEND); gl.useProgram(sky);
        gl.bindBuffer(gl.ARRAY_BUFFER,quad); const quadLocation=attribute(sky,'position',2,0,0);
        gl.uniform2f(skyUniforms.resolution,width,height);gl.uniform2f(skyUniforms.pan,camera.pan.x,camera.pan.y);
        for (const [name,value] of Object.entries({zoom:camera.zoom,ratio,frame:state.frame,variable:state.selected>2?1:0,infrared:state.infrared?1:0,grid:state.grid?1:0})) gl.uniform1f(skyUniforms[name],value);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.disableVertexAttribArray(quadLocation);
        gl.useProgram(points);gl.bindBuffer(gl.ARRAY_BUFFER,starBuffer);
        const attributes=[attribute(points,'star',4,28,0),attribute(points,'tint',1,28,16),attribute(points,'tile',2,28,20)];
        gl.uniform2f(pointUniforms.resolution,width,height);gl.uniform2f(pointUniforms.pan,camera.pan.x,camera.pan.y);
        for(const [name,value] of Object.entries({zoom:camera.zoom,ratio,infrared:state.infrared?1:0,bands:state.bandCount,maxPoint}))gl.uniform1f(pointUniforms[name],value);
        gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.drawArrays(gl.POINTS,0,data.length/7);
        attributes.forEach(location=>gl.disableVertexAttribArray(location));gl.disable(gl.BLEND);
      },
    };
  } catch { dispose(); return null; }
}

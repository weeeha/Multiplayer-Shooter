import type { Rect, Vec2 } from './model';

export function segmentRectFraction(a: Vec2, b: Vec2, r: Rect): number | null {
  let near = 0, far = 1;
  for (const [p, d, min, max] of [[a.x,b.x-a.x,r.x,r.x+r.w],[a.y,b.y-a.y,r.y,r.y+r.h]]) {
    if (Math.abs(d) < 1e-10) { if (p < min || p > max) return null; continue; }
    let t0=(min-p)/d, t1=(max-p)/d;
    if(t0>t1) [t0,t1]=[t1,t0];
    near=Math.max(near,t0); far=Math.min(far,t1);
    if(near>far) return null;
  }
  return near;
}

export function segmentCircleFraction(a: Vec2,b: Vec2,c: Vec2,radius: number): number|null {
  const x=a.x-c.x,y=a.y-c.y,dx=b.x-a.x,dy=b.y-a.y;
  const c0=x*x+y*y-radius*radius;
  if(c0<=0) return 0;
  const aa=dx*dx+dy*dy;
  if(aa<1e-12) return null;
  const bb=2*(x*dx+y*dy),discriminant=bb*bb-4*aa*c0;
  if(discriminant<0) return null;
  const t=(-bb-Math.sqrt(discriminant))/(2*aa);
  return t>=0&&t<=1 ? t : null;
}

export function closestPoint(p: Vec2,r: Rect): Vec2 {
  return {x:Math.max(r.x,Math.min(r.x+r.w,p.x)),y:Math.max(r.y,Math.min(r.y+r.h,p.y))};
}
export function circleTouchesRect(p: Vec2,radius:number,r:Rect):boolean {
  const q=closestPoint(p,r);
  return (p.x-q.x)**2+(p.y-q.y)**2 < radius*radius-1e-7;
}
export function moveCircle(pos:Vec2,delta:Vec2,radius:number,walls:Rect[]):Vec2 {
  const out={...pos};
  const count=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.y)/(radius/2)));
  for(let i=0;i<count;i++) {
    for(const axis of ['x','y'] as const) {
      const step=delta[axis]/count;
      if(!step) continue;
      const next={...out,[axis]:out[axis]+step};
      if(!walls.some(w=>circleTouchesRect(next,radius,w))) {out[axis]=next[axis];continue;}
      // Binary-search the collision boundary, retaining the other axis for sliding.
      let low=0,high=1;
      for(let j=0;j<18;j++) {
        const mid=(low+high)/2;
        const probe={...out,[axis]:out[axis]+step*mid};
        if(walls.some(w=>circleTouchesRect(probe,radius,w))) high=mid; else low=mid;
      }
      out[axis]+=step*low;
    }
  }
  return out;
}
export function normalized(v:Vec2):Vec2 {
  const n=Math.hypot(v.x,v.y);
  return n>1e-9 ? {x:v.x/n,y:v.y/n} : {x:0,y:0};
}
export const distance=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.y-b.y);

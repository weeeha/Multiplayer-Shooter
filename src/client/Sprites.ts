import type Phaser from 'phaser';
export const WALK_TYPES=['player-pistol','player-ar','player-shotgun','robot','scav-ar','scav-shotgun','dog','zombie'] as const;

export function preloadArt(scene:Phaser.Scene):void {
  for(const name of ['characters-key','armed-characters-key','props-key','surfaces'])scene.load.image(name,`/art/cold-relay/${name}.png`);
  for(const name of WALK_TYPES)scene.load.image(`walk-source-${name}`,`/art/cold-relay/walk/${name}.png`);
}
export const armedOrigins=new Map<string,number>();

// Color-keyed sprite atlases are converted to engine textures once, at load time.
// The generated originals remain untouched and are retained with their provenance.
function keyedAtlas(scene:Phaser.Scene,source:string,key:string,cols:number,rows:number,rowStops?:number[],autoRows=false):void {
  if(scene.textures.exists(key))return;
  const sourceImage=scene.textures.get(source).getSourceImage() as HTMLImageElement;
  const texture=scene.textures.createCanvas(key,sourceImage.width,sourceImage.height)!;
  const c=texture.context;c.drawImage(sourceImage,0,0);
  const pixels=c.getImageData(0,0,sourceImage.width,sourceImage.height),data=pixels.data;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2];
    if(r>85&&b>70&&g<Math.min(r,b)*.67)data[i+3]=0;
  }
  c.putImageData(pixels,0,0);texture.refresh();
  if(autoRows){
    const bands:{start:number;end:number}[]=[];
    for(let y=0;y<sourceImage.height;y++){
      let count=0;for(let x=0;x<sourceImage.width;x++)if(data[(y*sourceImage.width+x)*4+3]>128)count++;
      if(count>8){const last=bands.at(-1);if(last&&y-last.end<6)last.end=y;else bands.push({start:y,end:y});}
    }
    if(bands.length===rows)rowStops=[0,...bands.slice(1).map((b,i)=>(bands[i].end+b.start)/2/sourceImage.height),1];
  }
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const left=Math.floor(col*sourceImage.width/cols),right=Math.floor((col+1)*sourceImage.width/cols);
    const top=Math.floor((rowStops?.[row]??row/rows)*sourceImage.height),bottom=Math.floor((rowStops?.[row+1]??(row+1)/rows)*sourceImage.height);
    let minX=right,minY=bottom,maxX=left,maxY=top;
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*sourceImage.width+x)*4+3]>128){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    if(maxX>minX&&maxY>minY)texture.add(`${row}-${col}`,0,minX,minY,maxX-minX+1,maxY-minY+1);
  }
}
export function prepareArt(scene:Phaser.Scene):void {
  for(const name of WALK_TYPES){
    const atlasKey=`walk-atlas-${name}`;keyedAtlas(scene,`walk-source-${name}`,atlasKey,4,5,undefined,true);
    const atlas=scene.textures.get(atlasKey);
    for(let pose=0;pose<5;pose++){
      const frames=Array.from({length:4},(_,i)=>atlas.get(`${pose}-${i}`));
      const scale=(name==='dog'?28:48)/Math.max(...frames.map(f=>f.cutHeight));
      for(let phase=0;phase<4;phase++){
        const key=`walk-${name}-${pose}-${phase}`;if(scene.textures.exists(key))continue;
        const f=frames[phase],width=Math.ceil(f.cutWidth*scale),height=Math.ceil(f.cutHeight*scale);
        const texture=scene.textures.createCanvas(key,width,height)!,c=texture.context;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
        c.drawImage(f.source.image as HTMLCanvasElement,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,width,height);texture.refresh();
        const pixels=c.getImageData(0,0,width,height).data;let min=width,max=0;
        // Head/torso anchor stays stable while the feet extend on opposite steps.
        for(let y=0;y<Math.ceil(height*.28);y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>160){min=Math.min(min,x);max=Math.max(max,x);}
        armedOrigins.set(key,name==='dog'?.5:(min+max+1)/2/width);
      }
    }
  }
  keyedAtlas(scene,'characters-key','characters',3,6);
  keyedAtlas(scene,'props-key','props',2,3);
  // The generated robot antenna crosses the nominal equal-row boundary.
  keyedAtlas(scene,'armed-characters-key','armed-characters',5,6,[0,230,455,667,887,1108,1373].map(y=>y/1373));
  const armed=scene.textures.get('armed-characters');
  for(let row=0;row<6;row++)for(let pose=0;pose<5;pose++){
    const key=`armed-${row}-${pose}`;if(scene.textures.exists(key))continue;
    const f=armed.get(`${row}-${pose}`),height=48,width=Math.ceil(height*f.cutWidth/f.cutHeight);
    const texture=scene.textures.createCanvas(key,width,height)!,c=texture.context;
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.drawImage(f.source.image as HTMLCanvasElement,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,width,height);texture.refresh();
    // Anchor at the boots so longer barrels do not shift the actor's ground position.
    const pixels=c.getImageData(0,0,width,height).data;let min=width,max=0;
    for(let y=height-7;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>160){min=Math.min(min,x);max=Math.max(max,x);}
    armedOrigins.set(key,(min+max+1)/2/width);
  }
  const atlas=scene.textures.get('characters');
  for(let row=0;row<6;row++)for(let pose=0;pose<3;pose++){
    const key=`character-${row}-${pose}`;if(scene.textures.exists(key))continue;
    const f=atlas.get(`${row}-${pose}`),height=row===4?28:48,width=Math.ceil(height*f.cutWidth/f.cutHeight);
    const texture=scene.textures.createCanvas(key,width,height)!,c=texture.context;
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.drawImage(f.source.image as HTMLCanvasElement,f.cutX,f.cutY,f.cutWidth,f.cutHeight,0,0,width,height);texture.refresh();
  }

}
export function spriteSource(scene:Phaser.Scene,key:string,frame:string):{image:CanvasImageSource;x:number;y:number;w:number;h:number} {
  const f=scene.textures.getFrame(key,frame);
  return {image:f.source.image as CanvasImageSource,x:f.cutX,y:f.cutY,w:f.cutWidth,h:f.cutHeight};
}

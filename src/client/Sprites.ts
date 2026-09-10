import type Phaser from 'phaser';

export function preloadArt(scene:Phaser.Scene):void {
  for(const name of ['characters-key','props-key','surfaces'])scene.load.image(name,`/art/cold-relay/${name}.png`);
}

// Color-keyed sprite atlases are converted to engine textures once, at load time.
// The generated originals remain untouched and are retained with their provenance.
function keyedAtlas(scene:Phaser.Scene,source:string,key:string,cols:number,rows:number):void {
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
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const left=Math.floor(col*sourceImage.width/cols),right=Math.floor((col+1)*sourceImage.width/cols);
    const top=Math.floor(row*sourceImage.height/rows),bottom=Math.floor((row+1)*sourceImage.height/rows);
    let minX=right,minY=bottom,maxX=left,maxY=top;
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*sourceImage.width+x)*4+3]>128){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    if(maxX>minX&&maxY>minY)texture.add(`${row}-${col}`,0,minX,minY,maxX-minX+1,maxY-minY+1);
  }
}
export function prepareArt(scene:Phaser.Scene):void {
  keyedAtlas(scene,'characters-key','characters',3,6);
  keyedAtlas(scene,'props-key','props',2,3);
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

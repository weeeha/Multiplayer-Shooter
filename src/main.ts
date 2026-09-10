import Phaser from 'phaser';
import {PlayScene} from './client/PlayScene';
import './style.css';
new Phaser.Game({
  type:Phaser.WEBGL,parent:'game',width:960,height:540,backgroundColor:'#101712',
  pixelArt:true,roundPixels:true,
  render:{preserveDrawingBuffer:new URLSearchParams(location.search).get('test')==='1'},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[PlayScene],
  banner:false,
});

export function updateStartup(progress:number):void {
  const root=document.querySelector<HTMLElement>('#startup');
  if(!root||root.dataset.state==='error')return;
  const percent=Math.round(Math.max(0,Math.min(1,progress))*100);
  root.querySelector<HTMLProgressElement>('#startup-progress')!.value=percent;
  root.querySelector('#startup-message')!.textContent=percent===100?'Preparing the map…':`Loading artwork… ${percent}%`;
}

export function failStartup(message='The game could not finish loading. Check your connection and reload to try again.'):void {
  const root=document.querySelector<HTMLElement>('#startup');
  if(!root)return;
  root.dataset.state='error';
  root.querySelector('#startup-title')!.textContent='Loading interrupted.';
  root.querySelector('#startup-message')!.textContent=message;
  root.querySelector<HTMLProgressElement>('#startup-progress')!.hidden=true;
}

export function finishStartup():void {
  const root=document.querySelector<HTMLElement>('#startup');
  if(root?.dataset.state!=='error')root?.remove();
}

import './style.css';
import {failStartup} from './client/startup';

window.addEventListener('error',()=>failStartup());
window.addEventListener('unhandledrejection',()=>failStartup());
// Keep the loading screen responsive while the larger game bundle downloads.
void import('./game').catch(error=>{console.error(error);failStartup();});

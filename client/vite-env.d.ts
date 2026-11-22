/// <reference types="vite/client" />
interface Window { gameWindow?: { configure(settings: {size:string; fullscreen:boolean}): Promise<boolean> } }

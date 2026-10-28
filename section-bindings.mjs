import {SECTIONS} from './public/section-data.js';
console.log(JSON.stringify(Object.fromEntries(Object.entries(SECTIONS).map(([key,s])=>[key,s.features.flatMap(f=>[f.id,...f.aliases||[]])]))));

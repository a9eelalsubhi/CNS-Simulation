import {readdir,readFile,writeFile,mkdir,cp,rm,stat} from 'node:fs/promises';
import path from 'node:path';

// GitHub Pages serves this repository below a subdirectory. Keep the authored
// root-relative URLs for the Worker, and rewrite only the static distribution.
const base='/CNS-Simulation/';
const output=path.resolve('.pages-dist');
if(path.dirname(output)!==process.cwd())throw Error('Unsafe output directory');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp('public',output,{recursive:true});
const rootAsset=/(["'`])\/(?!\/)(?=(?:data|models|slides|vendor|branding)\/|[\w.-]+\.(?:js|css)(?:[?"'`])|\?lecture=)/g;
let files=0;
async function visit(folder){
 for(const entry of await readdir(folder,{withFileTypes:true})){
  const file=path.join(folder,entry.name);
  if(entry.isDirectory()){await visit(file);continue;}
  if(!/\.(?:js|mjs|json|html|css)$/.test(entry.name))continue;
  let text=await readFile(file,'utf8');
  if(entry.name==='index.html')text=text.replace(/<script\s+defer\s+src="\/analytics-client\.js"><\/script>\s*/,'');
  text=text.replace(rootAsset,(_,quote)=>quote+base).replace(/url\(\/(?!\/)/g,'url('+base);
  await writeFile(file,text);files++;
 }
}
await visit(output);
await rm(path.join(output,'analytics-client.js'),{force:true});
await writeFile(path.join(output,'.nojekyll'),'');
// Verify every lecture's registered data, source model and slide assets exist.
const local=url=>path.join(output,url.slice(base.length).split('?')[0]);
const registry=JSON.parse(await readFile(path.join(output,'data/lectures.json'),'utf8'));
for(const lecture of registry){
 if(!lecture.path.startsWith(base))throw Error('Unprefixed registry path');
 const data=JSON.parse(await readFile(local(lecture.path),'utf8'));
 await stat(local(lecture.inventory));await stat(local(data.model));
 const template=data.slide_template||base+'slides/lecture-{page}.jpg';
 for(const page of data.source_pages)await stat(local(template.replace('{page}',String(page).padStart(2,'0'))));
}
const html=await readFile(path.join(output,'index.html'),'utf8');
if(html.includes('analytics-client.js')||!html.includes(base+'app.js'))throw Error('Invalid Pages entrypoint');
console.log(`GitHub Pages ready: ${registry.length} lectures, ${files} rewritten text assets, base ${base}`);

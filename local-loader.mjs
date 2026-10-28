// Local checks resolve the same Three.js import map as the browser.
export async function resolve(specifier,context,next){
 if(specifier==='three')return {url:new URL('./public/vendor/three.module.js',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}

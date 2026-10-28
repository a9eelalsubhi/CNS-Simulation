import assert from 'node:assert/strict';
import {BrainViewer} from './public/scene.js';
const v=Object.create(BrainViewer.prototype);let frames=0,updates=0;
Object.assign(v,{module:'cortex',host:{clientWidth:1000,clientHeight:700},renderer:{setSize(){}},camera:{aspect:1,updateProjectionMatrix(){updates++;}},state:{presentation:'map',view:'lateral'},ready:true,step:{},frame(){frames++;},onChange(){},stopTrace(){},apply(){},bodyContext:null});
v.resize();assert.equal(frames,0,'Canvas resize reset the user camera');assert.equal(updates,1);assert.equal(v.camera.aspect,1000/700);
v.show({view:'medial'},[],{});assert.equal(frames,0,'Cortex point calculates an extra camera fit before the callout layout');assert.equal(v.state.view,'medial');
console.log('PASS: cortex resize preserves the camera; point setup defers fitting to the final callout layout.');

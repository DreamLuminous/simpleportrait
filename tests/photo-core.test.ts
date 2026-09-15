import assert from "node:assert/strict";
import { buildFilename, calculatePrintLayout, cet46Capture, cet46ImagingArea, mmToPixels, normalizeTransform, pixelsToMm, sanitizeFilename } from "../lib/photo-core.ts";

assert.equal(mmToPixels(25,300),295);
assert.ok(Math.abs(pixelsToMm(295,300)-24.9767)<0.001);
assert.equal(sanitizeFilename('证件:照?.jpg'),'证件_照_.jpg');
assert.equal(buildFilename('{规格}_{宽}x{高}_{日期}',{spec:'一寸',width:295,height:413,background:'#fff'},new Date('2026-09-14T08:09:10Z')),'一寸_295x413_20260914');
const layout=calculatePrintLayout(25,35,152,102,300,5,2);
assert.deepEqual({columns:layout.columns,rows:layout.rows,count:layout.count},{columns:5,rows:2,count:10});
console.log('photo-core: 5 checks passed');
assert.deepEqual(cet46Capture,{widthPx:144,heightPx:192});
assert.deepEqual(cet46ImagingArea,{widthMm:33,heightMm:48,linkedToCapture:false});
assert.deepEqual(normalizeTransform({centerX:1.4,centerY:-.2,scale:0,rotationDeg:240}),{centerX:1,centerY:0,scale:.01,rotationDeg:180});
console.log('photo-core: independent CET dimensions and normalized transform passed');

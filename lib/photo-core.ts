export type LengthUnit = "px" | "mm" | "cm";
export type ExportFormat = "jpeg" | "png" | "webp" | "pdf";

export interface CaptureSpec {
  widthPx: number;
  heightPx: number;
}

export interface ImagingAreaSpec {
  widthMm: number;
  heightMm: number;
  /** Kept explicit so a UI cannot accidentally infer pixels from millimetres. */
  linkedToCapture: false;
}

export const cet46Capture: CaptureSpec = { widthPx: 144, heightPx: 192 };
export const cet46ImagingArea: ImagingAreaSpec = { widthMm: 33, heightMm: 48, linkedToCapture: false };

export interface PhotoSpec {
  id: string;
  name: string;
  canvas: { widthPx:number; heightPx:number; widthMm?:number; heightMm?:number; dpi:number };
  portraitGuide: { headTopY:number; eyeLineY:number; chinY:number; headWidthRatio?:number; headHeightRatio?:number; shoulderBottomMinY?:number };
  allowedBackgrounds?: string[];
  exportRules?: { formats?:ExportFormat[]; maxBytes?:number; minBytes?:number };
}

export interface PhotoProject {
  version:number; sourceAssetId:string; spec:PhotoSpec;
  transform:{centerX:number;centerY:number;scale:number;rotationDeg:number};
  background:{type:"solid"|"transparent"|"image";value:string};
  retouch:{brightness:number;contrast:number;saturation:number;warmth:number;smoothing:number};
  exportPreset:{format:ExportFormat;quality:number;filenameTemplate:string;maxBytes?:number};
  createdAt:string; updatedAt:string;
}

export function clampNormalized(value:number){ return Math.max(0,Math.min(1,value)); }

export function normalizeTransform(transform:{centerX:number;centerY:number;scale:number;rotationDeg:number}){
  return {
    centerX: clampNormalized(transform.centerX),
    centerY: clampNormalized(transform.centerY),
    scale: Math.max(0.01, transform.scale),
    rotationDeg: Math.max(-180, Math.min(180, transform.rotationDeg)),
  };
}

export const mmToPixels=(mm:number,dpi:number)=>Math.max(1,Math.round(mm/25.4*dpi));
export const pixelsToMm=(pixels:number,dpi:number)=>pixels/dpi*25.4;

export function sanitizeFilename(value:string){
  const clean=value.replace(/[<>:"/\\|?*\u0000-\u001f]/g,"_").replace(/[. ]+$/g,"").trim();
  return clean||"证件照";
}

export function buildFilename(template:string,values:{spec:string;width:number;height:number;background:string},date=new Date()){
  const datePart=date.toISOString().slice(0,10).replaceAll("-","");
  const timePart=date.toTimeString().slice(0,8).replaceAll(":","");
  return sanitizeFilename(template.replaceAll("{规格}",values.spec).replaceAll("{宽}",String(values.width)).replaceAll("{高}",String(values.height)).replaceAll("{背景}",values.background.replace("#","")).replaceAll("{日期}",datePart).replaceAll("{时间}",timePart));
}

export function calculatePrintLayout(photoWidthMm:number,photoHeightMm:number,sheetWidthMm:number,sheetHeightMm:number,dpi:number,marginMm:number,gapMm:number){
  const px=(mm:number)=>mmToPixels(mm,dpi); const usableW=sheetWidthMm-marginMm*2; const usableH=sheetHeightMm-marginMm*2;
  const columns=Math.max(1,Math.floor((usableW+gapMm)/(photoWidthMm+gapMm))); const rows=Math.max(1,Math.floor((usableH+gapMm)/(photoHeightMm+gapMm)));
  return {columns,rows,count:columns*rows,sheetWidthPx:px(sheetWidthMm),sheetHeightPx:px(sheetHeightMm),photoWidthPx:px(photoWidthMm),photoHeightPx:px(photoHeightMm),marginPx:px(marginMm),gapPx:px(gapMm)};
}

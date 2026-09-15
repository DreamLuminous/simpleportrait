"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Camera, Check, ChevronRight, CloudOff, Download, FileImage, Globe2, ImageDown, ImagePlus, LockKeyhole, Move, Pipette, RotateCcw, RotateCw, ScanLine, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, Upload, WandSparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildFilename, calculatePrintLayout, mmToPixels, pixelsToMm, sanitizeFilename } from "@/lib/photo-core";

type Spec = { id: string; name: string; width: number; height: number; mm: string };
const specs: Spec[] = [
  { id: "cet46", name: "四六级默认照片", width: 144, height: 192, mm: "成像区 33 × 48 mm" },
  { id: "one", name: "一寸", width: 295, height: 413, mm: "25 × 35 mm" },
  { id: "small-one", name: "小一寸", width: 260, height: 378, mm: "22 × 32 mm" },
  { id: "two", name: "二寸", width: 413, height: 579, mm: "35 × 49 mm" },
  { id: "id", name: "身份证", width: 358, height: 441, mm: "26 × 32 mm" },
  { id: "passport", name: "护照", width: 390, height: 567, mm: "33 × 48 mm" },
  { id: "exam", name: "考试报名照", width: 295, height: 413, mm: "25 × 35 mm" },
  { id: "driver", name: "驾驶证照片", width: 260, height: 378, mm: "22 × 32 mm" },
  { id: "social", name: "社保卡照片", width: 358, height: 441, mm: "26 × 32 mm" },
  { id: "square", name: "方形证件照", width: 600, height: 600, mm: "51 × 51 mm" },
  { id: "custom", name: "自定义", width: 600, height: 800, mm: "自由尺寸" },
];
const colors = ["#d8f0ff", "#ffffff", "#4f9ef8", "#e84f5f", "#e8edf3"];
const specNamesEn:Record<string,string>={cet46:"CET-4 / CET-6",one:"1-inch","small-one":"Small 1-inch",two:"2-inch",id:"National ID",passport:"Passport",exam:"Exam registration",driver:"Driving licence",social:"Social security card",square:"Square ID photo",custom:"Custom"};
type Lang = "zh" | "en";
const copy = {
  zh: {
    product: "证件照制作", privacy: "照片仅在本机处理", history: "历史记录", settings: "设置",
    idPhoto: "证件照制作", compress: "照片压缩", matting: "抠像换背景", start: "已阅读并开始使用",
    introTitle: "一张照片，适配每一种尺寸", introText: "裁剪、换底、压缩与冲印排版均可在本机完成。尺寸可精确到像素和毫米，照片无需上传服务器。",
    guide: "使用说明", disclaimer: "免责声明", back: "返回首页", language: "语言",
  },
  en: {
    product: "ID Photo Studio", privacy: "Photos stay on this device", history: "History", settings: "Settings",
    idPhoto: "ID Photo", compress: "Compress", matting: "Remove Background", start: "I understand · Start",
    introTitle: "One photo, every required size", introText: "Crop, replace backgrounds, compress and create print sheets locally. Set exact pixels and millimetres without uploading your photo.",
    guide: "How to use", disclaimer: "Disclaimer", back: "Home", language: "Language",
  },
};

declare global { interface Document { modelContext?: { registerTool(tool:{name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute(input:unknown):unknown},options?:{signal:AbortSignal}):void|Promise<void> } } }

export default function Home({initialView="home"}:{initialView?:"home"|"studio"}) {
  const [view, setView] = useState<"home" | "studio">(initialView);
  const [lang, setLang] = useState<Lang>("zh");
  const [playIntro, setPlayIntro] = useState(false);
  const [expertMode, setExpertMode] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const workflow = expertMode ? "full" : "wizard";
  const [spec, setSpec] = useState(specs[0]);
  const [width, setWidth] = useState(specs[0].width);
  const [height, setHeight] = useState(specs[0].height);
  const [dpi, setDpi] = useState(300);
  const [areaWidthMm, setAreaWidthMm] = useState(33);
  const [areaHeightMm, setAreaHeightMm] = useState(48);
  const [background, setBackground] = useState("#d8f0ff");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mattedUrl, setMattedUrl] = useState<string | null>(null);
  const [mattingMode, setMattingMode] = useState<"remove" | "keep" | "skip">("remove");
  const [mattingPreviewOriginal, setMattingPreviewOriginal] = useState(false);
  const [mattingTolerance, setMattingTolerance] = useState(58);
  const [mattingFeather, setMattingFeather] = useState(18);
  const [mattingRevision, setMattingRevision] = useState(0);
  const [mattingProcessing, setMattingProcessing] = useState(false);
  const [mattingStatus, setMattingStatus] = useState("上传照片后自动识别连续背景");
  const [zoom, setZoom] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [quality, setQuality] = useState(100);
  const [filename, setFilename] = useState("");
  const [minSizeKb, setMinSizeKb] = useState(25);
  const [maxSizeKb, setMaxSizeKb] = useState(35);
  const [headTop, setHeadTop] = useState(10);
  const [eyeLine, setEyeLine] = useState(35);
  const [headRegion, setHeadRegion] = useState(70);
  const [shoulderRegion, setShoulderRegion] = useState(20);
  const [sideSpace, setSideSpace] = useState(10);
  const [status, setStatus] = useState("等待选择照片");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{x:number;y:number;offsetX:number;offsetY:number}|null>(null);
  const pointersRef=useRef(new Map<number,{x:number;y:number}>());
  const pinchRef=useRef<{distance:number;zoom:number;midX:number;midY:number;offsetX:number;offsetY:number}|null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("jianzhao-language");
    if (savedLang === "en") setLang("en");
    setExpertMode(localStorage.getItem("jianzhao-expert-mode") === "1");
    const hasPlayed = localStorage.getItem("jianzhao-intro-played") || sessionStorage.getItem("jianzhao-intro-played");
    if (!hasPlayed) {
      setPlayIntro(true);
      localStorage.setItem("jianzhao-intro-played", "1");
      sessionStorage.setItem("jianzhao-intro-played", "1");
      const timer=window.setTimeout(()=>setPlayIntro(false),1800);
      return()=>window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("jianzhao-language", lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);
  useEffect(() => { localStorage.setItem("jianzhao-expert-mode", expertMode ? "1" : "0"); }, [expertMode]);
  useEffect(() => { if (background === "transparent" && mattingMode === "remove" && format !== "png") setFormat("png"); }, [background, mattingMode, format]);

  useEffect(()=>{
    const context=document.modelContext; if(!context?.registerTool) return;
    const lifecycle=new AbortController();
    const register=(tool:Parameters<typeof context.registerTool>[0])=>{try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}};
    register({name:"configure_photo_spec",title:"设置证件照规格",description:"设置当前证件照的名称、宽高像素与 DPI，并立即更新制作台。",inputSchema:{type:"object",properties:{name:{type:"string"},width:{type:"integer",minimum:64,maximum:6000},height:{type:"integer",minimum:64,maximum:6000},dpi:{type:"integer",minimum:72,maximum:600}},required:["width","height","dpi"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){const value=input as {name?:string;width:number;height:number;dpi:number};if(!Number.isInteger(value.width)||!Number.isInteger(value.height)||!Number.isInteger(value.dpi))throw new Error("宽度、高度和 DPI 必须是整数");if(value.width<64||value.width>6000||value.height<64||value.height>6000||value.dpi<72||value.dpi>600)throw new Error("规格超出允许范围");setSpec({id:"custom",name:value.name||"自定义",width:value.width,height:value.height,mm:"自由尺寸"});setWidth(value.width);setHeight(value.height);setDpi(value.dpi);return {status:"configured",width:value.width,height:value.height,dpi:value.dpi}}});
    register({name:"configure_export",title:"设置导出选项",description:"设置当前证件照的导出格式、质量与文件名模板。",inputSchema:{type:"object",properties:{format:{type:"string",enum:["jpeg","png","webp"]},quality:{type:"integer",minimum:50,maximum:100},filename:{type:"string",minLength:1,maxLength:120}},required:["format","quality","filename"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){const value=input as {format:"jpeg"|"png"|"webp";quality:number;filename:string};if(!["jpeg","png","webp"].includes(value.format)||value.quality<50||value.quality>100||!value.filename.trim())throw new Error("导出参数无效");setFormat(value.format);setQuality(value.quality);setFilename(value.filename);return {status:"configured",format:value.format,quality:value.quality,filename:sanitizeFilename(value.filename)}}});
    return()=>lifecycle.abort();
  },[]);

  const chooseSpec = (next: Spec) => {
    setSpec(next); setWidth(next.width); setHeight(next.height);
    const physicalSize = next.mm.match(/([\d.]+)\s*×\s*([\d.]+)/);
    if (physicalSize && next.id !== "cet46") { setAreaWidthMm(Number(physicalSize[1])); setAreaHeightMm(Number(physicalSize[2])); }
    if(next.id==="cet46"){
      setAreaWidthMm(33);setAreaHeightMm(48);setDpi(300);setBackground("#d8f0ff");
      setHeadTop(10);setHeadRegion(70);setShoulderRegion(20);setSideSpace(10);setEyeLine(35);
      setFormat("jpeg");setQuality(100);setMinSizeKb(25);setMaxSizeKb(35);setFilename("证件照_{规格}_{日期}");
      setStatus(lang==="zh"?"已应用四六级推荐设置，所有参数均可继续修改":"CET-4 / CET-6 recommendations applied · every setting remains editable");
    }else if(!filename){setFilename("证件照_{规格}_{日期}")}
  };
  const pickImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setStatus(lang==="zh"?"请选择 JPEG、PNG 或 WebP 图片":"Choose a JPEG, PNG or WebP image"); return; }
    const url = URL.createObjectURL(file);
    setImageUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
    setMattedUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
    setMattingPreviewOriginal(false);
    setOffsetX(0); setOffsetY(0); setZoom(100); setRotation(0);
    setStatus(lang==="zh"?"照片已载入，可继续调整":"Photo loaded · ready to adjust");
  };

  useEffect(() => {
    if (!imageUrl) {
      setMattingProcessing(false);
      setMattedUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
      setMattingStatus(lang==="zh"?"上传照片后自动识别连续背景":"Upload a photo to detect its connected background");
      return;
    }
    if (mattingMode !== "remove") {
      setMattingProcessing(false);
      setMattedUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
      setMattingStatus(mattingMode === "keep" ? (lang==="zh"?"保留原照片背景":"Keeping original background") : (lang==="zh"?"已跳过抠图处理":"Matting skipped"));
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setMattingProcessing(true);
      setMattingStatus(lang==="zh"?"正在识别与画面边缘连通的背景…":"Detecting background connected to the image edges…");
      const image = new Image();
      image.onload = () => {
        if (cancelled) return;
        try {
          const work = document.createElement("canvas");
          const result = renderBackgroundRemoval(image, work, "transparent", mattingTolerance, mattingFeather);
          work.toBlob((blob) => {
            if (cancelled || !blob) return;
            const next = URL.createObjectURL(blob);
            setMattedUrl((old) => { if (old) URL.revokeObjectURL(old); return next; });
            const percent = Math.round(result.removed / (result.width * result.height) * 100);
            setMattingStatus(lang==="zh"?`抠图完成 · 已识别约 ${percent}% 的连续背景`:`Matting complete · about ${percent}% of connected background detected`);
            setMattingProcessing(false);
          }, "image/png");
        } catch (error) {
          setMattingProcessing(false);
          setMattingStatus(error instanceof Error ? error.message : (lang==="zh"?"抠图失败，可选择保留原背景":"Matting failed · keep the original background instead"));
        }
      };
      image.onerror = () => { if (!cancelled) { setMattingProcessing(false); setMattingStatus(lang==="zh"?"照片读取失败，请重新选择":"Could not read this photo"); } };
      image.src = imageUrl;
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [imageUrl, mattingMode, mattingTolerance, mattingFeather, mattingRevision, lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = Math.max(1, width); canvas.height = Math.max(1, height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    const showMattingResult = mattingMode === "remove" && !mattingPreviewOriginal;
    if (showMattingResult && background !== "transparent") { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * zoom / 100;
      const dw = img.width * scale; const dh = img.height * scale;
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.save();
      ctx.translate(canvas.width / 2 + offsetX * canvas.width, canvas.height / 2 + offsetY * canvas.height);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
      ctx.filter = "none";
    };
    img.src = showMattingResult && mattedUrl ? mattedUrl : imageUrl;
  }, [imageUrl, mattedUrl, mattingMode, mattingPreviewOriginal, width, height, background, zoom, brightness, contrast, offsetX, offsetY, rotation]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageUrl) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointersRef.current.size===2){const [a,b]=[...pointersRef.current.values()];pinchRef.current={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom,midX:(a.x+b.x)/2,midY:(a.y+b.y)/2,offsetX,offsetY};dragRef.current=null;return}
    dragRef.current = { x:event.clientX, y:event.clientY, offsetX, offsetY };
  };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(event.pointerId)) event.preventDefault();
    if(pointersRef.current.has(event.pointerId))pointersRef.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointersRef.current.size===2&&pinchRef.current){const [a,b]=[...pointersRef.current.values()];const rect=event.currentTarget.getBoundingClientRect();const distance=Math.hypot(a.x-b.x,a.y-b.y);const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2;setZoom(Math.max(50,Math.min(300,pinchRef.current.zoom*distance/Math.max(1,pinchRef.current.distance))));setOffsetX(pinchRef.current.offsetX+(midX-pinchRef.current.midX)/rect.width);setOffsetY(pinchRef.current.offsetY+(midY-pinchRef.current.midY)/rect.height);return}
    if (!dragRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setOffsetX(dragRef.current.offsetX + (event.clientX-dragRef.current.x)/rect.width);
    setOffsetY(dragRef.current.offsetY + (event.clientY-dragRef.current.y)/rect.height);
  };
  const endDrag = (event:React.PointerEvent<HTMLDivElement>) => { pointersRef.current.delete(event.pointerId);dragRef.current=null;pinchRef.current=null; };
  const zoomAtPointer = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!imageUrl) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const pointX = (event.clientX - rect.left) / rect.width - .5;
    const pointY = (event.clientY - rect.top) / rect.height - .5;
    const nextZoom = Math.max(50, Math.min(300, zoom + (event.deltaY < 0 ? 6 : -6)));
    const ratio = nextZoom / zoom;
    setOffsetX(pointX - ratio * (pointX - offsetX));
    setOffsetY(pointY - ratio * (pointY - offsetY));
    setZoom(nextZoom);
  };

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) { setStatus(lang==="zh"?"请先选择一张照片":"Choose a photo first"); return; }
    const link = document.createElement("a");
    const safeName = buildFilename(filename || "证件照_{规格}_{日期}", { spec: spec.name, width, height, background });
    if (minSizeKb > maxSizeKb) { setStatus(lang==="zh"?"文件大小下限不能大于上限":"Minimum file size cannot exceed maximum"); return; }
    const result = await canvasToTargetBlob(canvas, format, quality, minSizeKb, maxSizeKb);
    link.download = `${safeName}.${format === "jpeg" ? "jpg" : format}`;
    link.href = URL.createObjectURL(result.blob); link.click(); setTimeout(()=>URL.revokeObjectURL(link.href),1000);
    const item = { name: safeName, spec: spec.name, createdAt: new Date().toISOString(), width, height };
    const history = JSON.parse(localStorage.getItem("jianzhao-history") || "[]");
    localStorage.setItem("jianzhao-history", JSON.stringify([item, ...history].slice(0, 12)));
    setStatus(result.inRange ? (lang==="zh"?`已保存，约 ${Math.round(result.blob.size/1024)} KB`:`Saved · about ${Math.round(result.blob.size/1024)} KB`) : (lang==="zh"?`已保存，约 ${Math.round(result.blob.size/1024)} KB；当前尺寸无法完全满足区间`:`Saved · about ${Math.round(result.blob.size/1024)} KB; this size cannot fully meet the range`));
  };

  const optimize = () => { setBrightness(104); setContrast(103); setStatus(lang==="zh"?"已应用自然优化，可随时重置":"Natural enhancement applied · reset anytime"); };
  const resetPhoto = () => { setZoom(100); setOffsetX(0); setOffsetY(0); setRotation(0); setBrightness(100); setContrast(100); setStatus(imageUrl ? (lang==="zh"?"照片位置与画面效果已重置":"Photo position and appearance reset") : (lang==="zh"?"等待选择照片":"Waiting for a photo")); };
  const updateMaxSizeKb = (value:number) => {
    const next = Math.max(1, Math.round(value || 1));
    setMaxSizeKb(next);
    if (next < minSizeKb) setMinSizeKb(next > 5 ? next - 5 : next);
  };
  const resetGuides = () => { setHeadTop(10); setHeadRegion(70); setShoulderRegion(20); setSideSpace(10); setEyeLine(35); setStatus(lang==="zh"?"成像要求已恢复为 1/10、7/10、1/5、左右各 1/10":"Composition restored to 10%, 70%, 20% and 10% side margins"); };
  const makePrintSheet = () => {
    const source = canvasRef.current;
    if (!source || !imageUrl) { setStatus(lang==="zh"?"请先选择一张照片":"Choose a photo first"); return; }
    const sheet = document.createElement("canvas"); const layout = calculatePrintLayout(areaWidthMm, areaHeightMm, 152, 102, 300, 5, 2);
    sheet.width = layout.sheetWidthPx; sheet.height = layout.sheetHeightPx;
    const ctx = sheet.getContext("2d")!; ctx.fillStyle="#fff"; ctx.fillRect(0,0,sheet.width,sheet.height);
    for (let row=0;row<layout.rows;row++) for(let col=0;col<layout.columns;col++) {
      const x=layout.marginPx+col*(layout.photoWidthPx+layout.gapPx); const y=layout.marginPx+row*(layout.photoHeightPx+layout.gapPx);
      ctx.drawImage(source,x,y,layout.photoWidthPx,layout.photoHeightPx); ctx.strokeStyle="#b8c2bf"; ctx.setLineDash([6,5]); ctx.strokeRect(x,y,layout.photoWidthPx,layout.photoHeightPx);
    }
    const link=document.createElement("a"); link.download=`${sanitizeFilename(spec.name)}_6寸排版.jpg`; link.href=sheet.toDataURL("image/jpeg",.94); link.click();
    setStatus(lang==="zh"?`已生成 6 寸排版，共 ${layout.count} 张`:`6-inch print sheet created with ${layout.count} copies`);
  };

  const t = copy[lang];
  if (view === "home") return <Landing lang={lang} setLang={setLang} playIntro={playIntro} onStart={()=>{setPlayIntro(false);setView("studio")}}/>;

  const showLeftPanel = true;
  const showStagePanel = expertMode || wizardStep >= 1;
  const showRightPanel = expertMode || wizardStep >= 1;
  const renderSpecCard = (item:Spec) => <button key={item.id} onClick={()=>chooseSpec(item)} className={"spec-card "+(item.id==="cet46"?"featured-spec ":"")+(spec.id===item.id?"selected":"")}><span className="paper-icon" style={{aspectRatio:item.width+"/"+item.height}}/><span><b>{lang==="zh"?item.name:specNamesEn[item.id]}</b><small>{item.id==="cet46"?(lang==="zh"?"浅蓝底 · JPG · 约 30 KB":"Light blue · JPG · about 30 KB"):item.width+" × "+item.height+"px"}</small></span>{item.id==="cet46"&&<em className="quick-badge">{lang==="zh"?"快捷":"PRESET"}</em>}{spec.id===item.id&&<Check className="spec-check" size={14}/>}</button>;

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand brand-button" onClick={()=>setView("home")} aria-label={t.back}><span className="brand-mark"><span /></span><span>简照</span><span className="brand-tag">{t.product}</span></button>
      <div className="privacy-pill"><LockKeyhole size={15} /> {t.privacy}</div>
      <nav className="top-actions" aria-label="辅助功能">
        <label className="language-select compact-language"><Globe2 size={15}/><select aria-label={t.language} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="zh">中文</option><option value="en">English</option></select></label>
        <div className="mode-choice"><div className="mode-switch" role="group" aria-label={lang==="zh"?"制作模式":"Creation mode"}><button className={!expertMode?"active":""} onClick={()=>setExpertMode(false)}>{lang==="zh"?"普通模式":"Basic"}</button><button className={expertMode?"active":""} onClick={()=>setExpertMode(true)}>{lang==="zh"?"专业模式":"Pro"}</button></div></div>
        <Dialog><DialogTrigger asChild><button className="quiet-button">{t.history}</button></DialogTrigger><HistoryDialog lang={lang} /></Dialog>
        <Dialog><DialogTrigger asChild><button className="settings-button" aria-label={t.settings}><SlidersHorizontal size={16}/> {t.settings}</button></DialogTrigger><SettingsDialog lang={lang} /></Dialog>
      </nav>
    </header>
    {!expertMode&&<section className="progress-wrap basic-progress" aria-label={lang==="zh"?"制作进度":"Progress"}><div className="progress-line" />
      {(lang==="zh"?["选择规格","上传与构图","背景与画面","检查与保存"]:["Choose size","Upload & compose","Background & look","Review & save"]).map((label,index)=><div className={`progress-step ${index===wizardStep?"active":""}`} key={label}><span>{index===0&&imageUrl?<Check size={14}/>:index+1}</span><b>{label}</b></div>)}
    </section>}
    <section className="workspace" data-editor-mode={expertMode?"professional":"basic"} data-workflow={workflow} data-step={wizardStep}>
      {expertMode&&<div className="pro-workbench-head"><div><span className="eyebrow">PRO WORKBENCH</span><h1>{lang==="zh"?"专业证件照工作台":"Professional ID photo workbench"}</h1></div><p>{lang==="zh"?"规格、精确构图、抠图、画面和输出参数在同一工作台内完整显示。":"Spec, composition, matting, appearance and export controls are all visible in one workbench."}</p></div>}
      <aside className="panel left-panel" hidden={!showLeftPanel} aria-hidden={!showLeftPanel}>
        <div className="panel-heading"><div><span className="eyebrow">{expertMode?"SPEC & COMPOSITION":"STEP 01"}</span><h1>{expertMode?(lang==="zh"?"规格与成像要求":"Spec & composition"):(lang==="zh"?"选择照片规格":"Choose a photo size")}</h1></div></div>
        <div className="spec-settings-group"><div className="spec-grid">{specs.slice(0,4).map(renderSpecCard)}</div><details className="spec-library"><summary><span>{lang==="zh"?"更多证件照模板":"More ID photo templates"}</span><em>{specs.slice(4).some(item=>item.id===spec.id)?(lang==="zh"?spec.name:specNamesEn[spec.id]):(lang==="zh"?(specs.length-4)+" 个模板":(specs.length-4)+" templates")}</em></summary><div className="spec-grid more-spec-grid">{specs.slice(4).map(renderSpecCard)}</div></details>
        {spec.id==="cet46"&&<div className="cet-preset-card"><div><b>{lang==="zh"?"四六级快捷设置":"CET-4 / CET-6 quick preset"}</b><span>{lang==="zh"?"推荐值，均可继续修改":"Recommended values · all editable"}</span></div><dl><div><dt>{lang==="zh"?"背景":"Background"}</dt><dd><i/> {lang==="zh"?"浅蓝色":"Light blue"}</dd></div><div><dt>{lang==="zh"?"采集":"Pixels"}</dt><dd>{lang==="zh"?"高 192 × 宽 144 px":"H 192 × W 144 px"}</dd></div><div><dt>{lang==="zh"?"成像区":"Area"}</dt><dd>{lang==="zh"?"高 48 × 宽 33 mm":"H 48 × W 33 mm"}</dd></div><div><dt>{lang==="zh"?"构图":"Composition"}</dt><dd>10% / 70% / 20% · {lang==="zh"?"左右 10%":"Sides 10%"}</dd></div><div><dt>{lang==="zh"?"输出":"Output"}</dt><dd>推荐 JPG · 25—35 KB</dd></div></dl></div>}
        <div className="section-rule"/><label className="field-label expert-only">{lang==="zh"?"采集图像大小":"Captured image"} <em>{lang==="zh"?"高 × 宽":"H × W"}</em></label>
        <div className="dimension-row expert-only"><label><span>高度</span><input aria-label="采集图像高度 PX" value={height} min={64} max={6000} type="number" onChange={e=>setHeight(Number(e.target.value))}/></label><span className="times">×</span><label><span>宽度</span><input aria-label="采集图像宽度 PX" value={width} min={64} max={6000} type="number" onChange={e=>setWidth(Number(e.target.value))}/></label><span className="unit">PX</span></div>
        <label className="field-label independent-label expert-only">{lang==="zh"?"成像区大小":"Imaging area"} <em>{lang==="zh"?"独立设置，不与 PX 联动":"Independent from PX"}</em></label>
        <div className="dimension-row expert-only"><label><span>高度</span><input aria-label="成像区高度 mm" value={areaHeightMm} min={5} max={500} step="0.1" type="number" onChange={e=>setAreaHeightMm(Number(e.target.value))}/></label><span className="times">×</span><label><span>宽度</span><input aria-label="成像区宽度 mm" value={areaWidthMm} min={5} max={500} step="0.1" type="number" onChange={e=>setAreaWidthMm(Number(e.target.value))}/></label><span className="unit">MM</span></div>
        <div className="dimension-row compact expert-only"><label><span>分辨率</span><input value={dpi} min={72} max={600} type="number" onChange={e=>setDpi(Number(e.target.value))}/></label><span className="unit">DPI</span><span className="measure">仅写入导出信息</span></div></div>
        <div className="composition-settings-group">
        {expertMode&&<div className="advanced-fields"><div className="composition-rule"><span><b>{headTop}%</b>{lang==="zh"?"头部上空":"Top space"}</span><span><b>{headRegion}%</b>{lang==="zh"?"头部区域":"Head area"}</span><span><b>{shoulderRegion}%</b>{lang==="zh"?"肩部区域":"Shoulders"}</span><span><b>{sideSpace}%</b>{lang==="zh"?"左右各留空":"Side margin"}</span></div><label>{lang==="zh"?"头部上空":"Top space"}<input type="number" min="0" max="35" value={headTop} onChange={e=>setHeadTop(Number(e.target.value))}/><span>%</span></label><label>{lang==="zh"?"头部区域":"Head area"}<input type="number" min="30" max="90" value={headRegion} onChange={e=>setHeadRegion(Number(e.target.value))}/><span>%</span></label><label>{lang==="zh"?"肩部区域":"Shoulders"}<input type="number" min="0" max="45" value={shoulderRegion} onChange={e=>setShoulderRegion(Number(e.target.value))}/><span>%</span></label><label>{lang==="zh"?"左右各留空":"Each side"}<input type="number" min="0" max="30" value={sideSpace} onChange={e=>setSideSpace(Number(e.target.value))}/><span>%</span></label><label>{lang==="zh"?"眼睛参考线":"Eye line"}<input type="number" min="10" max="75" value={eyeLine} onChange={e=>setEyeLine(Number(e.target.value))}/><span>%</span></label><div className={`guide-total ${headTop+headRegion+shoulderRegion===100?"valid":"warning"}`}>{lang==="zh"?"纵向合计":"Vertical total"} {headTop+headRegion+shoulderRegion}% {headTop+headRegion+shoulderRegion===100?(lang==="zh"?"· 比例完整":"· Complete"):(lang==="zh"?"· 建议调整为 100%":"· Adjust to 100%")}</div><button className="reset-subtle" onClick={resetGuides}><RotateCcw size={14}/>{lang==="zh"?"恢复默认成像要求":"Restore defaults"}</button></div>}</div>
        {!expertMode&&<div className="basic-detail-groups"><p>详细设置 <span>按需展开</span></p><details><summary>尺寸与 DPI <em>可修改</em></summary><label>输出宽度 PX<input type="number" min="64" max="6000" value={width} onChange={e=>setWidth(Number(e.target.value))}/></label><label>输出高度 PX<input type="number" min="64" max="6000" value={height} onChange={e=>setHeight(Number(e.target.value))}/></label><label>成像区宽度 MM<input type="number" min="5" value={areaWidthMm} onChange={e=>setAreaWidthMm(Number(e.target.value))}/></label><label>成像区高度 MM<input type="number" min="5" value={areaHeightMm} onChange={e=>setAreaHeightMm(Number(e.target.value))}/></label><label>DPI<input type="number" min="72" max="600" value={dpi} onChange={e=>setDpi(Number(e.target.value))}/></label></details><details><summary>人像成像要求 <em>{headTop!==10||headRegion!==70||shoulderRegion!==20||sideSpace!==10?"已自定义":"默认"}</em></summary><label>头部上空 %<input type="number" value={headTop} onChange={e=>setHeadTop(Number(e.target.value))}/></label><label>头部区域 %<input type="number" value={headRegion} onChange={e=>setHeadRegion(Number(e.target.value))}/></label><label>肩部区域 %<input type="number" value={shoulderRegion} onChange={e=>setShoulderRegion(Number(e.target.value))}/></label><label>左右留空 %<input type="number" value={sideSpace} onChange={e=>setSideSpace(Number(e.target.value))}/></label><button onClick={resetGuides}>恢复本组默认值</button></details><details><summary>画面调整 <em>{brightness!==100||contrast!==100||rotation!==0?"已自定义":"默认"}</em></summary><label>亮度 %<input type="number" value={brightness} onChange={e=>setBrightness(Number(e.target.value))}/></label><label>对比度 %<input type="number" value={contrast} onChange={e=>setContrast(Number(e.target.value))}/></label><label>旋转角度<input type="number" value={rotation} onChange={e=>setRotation(Number(e.target.value))}/></label></details><details><summary>文件大小与格式 <em>可修改</em></summary><label>格式<select value={format} onChange={e=>setFormat(e.target.value as typeof format)}><option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select></label><label>最小 KB<input type="number" value={minSizeKb} onChange={e=>setMinSizeKb(Number(e.target.value))}/></label><label>最大 KB<input type="number" value={maxSizeKb} onChange={e=>updateMaxSizeKb(Number(e.target.value))}/></label><label>质量 %<input type="number" min="50" max="100" value={quality} onChange={e=>setQuality(Number(e.target.value))}/></label></details><details><summary>冲印排版 <em>6 寸</em></summary><p>使用当前照片和实体尺寸自动生成 6 寸冲印排版。</p><button onClick={makePrintSheet}>生成冲印版</button></details></div>}
      </aside>
      <section className="stage-panel" hidden={!showStagePanel} aria-hidden={!showStagePanel}>
        <div className="stage-head"><div><span className="eyebrow">{lang==="zh"?"工作区":"CANVAS"}</span><h2>{imageUrl?(lang==="zh"?"在照片内拖动，滚轮或双指缩放":"Drag inside the photo · wheel or pinch to zoom"):(lang==="zh"?"添加一张正面照片":"Add a front-facing photo")}</h2></div><div className="stage-tools"><button onClick={resetPhoto}><RotateCcw size={16}/>{lang==="zh"?"重置照片":"Reset photo"}</button></div></div>
        <div className="canvas-stage"><div className="measurement top-measure">{width} px</div><div className="measurement side-measure">{height} px</div>
          <div className={`photo-frame ${imageUrl?"is-draggable":""} ${background==="transparent"&&mattingMode==="remove"?"checker":""}`} data-zoom={zoom} data-offset-x={offsetX} data-offset-y={offsetY} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={zoomAtPointer} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();pickImage(e.dataTransfer.files[0])}} style={{aspectRatio:`${width}/${height}`,background:background==="transparent"?"#fff":background}}><canvas ref={canvasRef} className={imageUrl?"visible":""}/>
            {imageUrl?<div className="guides" aria-hidden="true"><span className="guide" style={{top:`${headTop}%`}}>{lang==="zh"?"上空":"Top"} {headTop}%</span><span className="guide" style={{top:`${eyeLine}%`}}>{lang==="zh"?"眼睛":"Eyes"} {eyeLine}%</span><span className="guide shoulder-guide" style={{top:`${Math.min(100,headTop+headRegion)}%`,height:`${Math.max(0,Math.min(shoulderRegion,100-headTop-headRegion))}%`}}>{lang==="zh"?"肩部":"Shoulders"} {shoulderRegion}%</span><i className="center-line"/><i className="side-guide" style={{left:`${sideSpace}%`}}>{lang==="zh"?"左空":"Left"} {sideSpace}%</i><i className="side-guide" style={{right:`${sideSpace}%`}}>{lang==="zh"?"右空":"Right"} {sideSpace}%</i><span className="drag-hint"><Move size={13}/>{lang==="zh"?"拖动照片调整位置":"Drag to reposition"}</span></div>:<div className="upload-zone"><span className="upload-icon"><ImagePlus size={29}/></span><b>{lang==="zh"?"拍照或上传正面照片":"Take or upload a front-facing photo"}</b><span>{lang==="zh"?"请选择光线均匀、面部无遮挡的照片":"Use even lighting and keep the face unobstructed"}</span><div className="upload-actions"><button onClick={e=>{e.stopPropagation();cameraRef.current?.click()}}><Camera size={16}/>{lang==="zh"?"拍照":"Camera"}</button><button onClick={e=>{e.stopPropagation();fileRef.current?.click()}}><Upload size={16}/>{lang==="zh"?"上传照片":"Upload"}</button></div><small>{lang==="zh"?"支持 JPG、PNG、WebP · 采集标准为高 192 × 宽 144 px":"JPG, PNG, WebP · default H 192 × W 144 px"}</small></div>}
            <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>pickImage(e.target.files?.[0])}/>
            <input ref={cameraRef} hidden type="file" accept="image/*" capture="user" onChange={e=>pickImage(e.target.files?.[0])}/>
          </div>
        </div>
        <div className="stage-status"><span><ShieldCheck size={15}/> {status}</span><button onClick={()=>fileRef.current?.click()}><FileImage size={15}/>{lang==="zh"?"更换照片":"Replace photo"}</button></div>
      </section>
      <aside className="panel right-panel" hidden={!showRightPanel} aria-hidden={!showRightPanel}>
        <div className="panel-heading"><div><span className="eyebrow">{expertMode?(lang==="zh"?"完整参数":"ALL CONTROLS"):(lang==="zh"?`第 ${wizardStep+1} 步设置`:`STEP ${wizardStep+1}`)}</span><h2>{expertMode?(lang==="zh"?"调整与输出":"Adjust & export"):(['',lang==="zh"?"构图操作":"Composition",lang==="zh"?"背景与画面":"Background & look",lang==="zh"?"检查与保存":"Review & save"][wizardStep])}</h2></div><Sparkles size={20} className="sparkle"/></div>
        <div className="control-group background-control"><div className="control-label"><b>{lang==="zh"?"抠图与背景":"Matting & background"}</b><span>{mattingProcessing?(lang==="zh"?"处理中":"Processing"):mattingMode==="remove"?(lang==="zh"?"自动抠图":"Auto remove"):mattingMode==="keep"?(lang==="zh"?"保留原背景":"Original"):(lang==="zh"?"跳过处理":"Skipped")}</span></div><div className="background-mode-row three"><button className={mattingMode==="remove"?"active":""} onClick={()=>{setMattingMode("remove");setMattingPreviewOriginal(false)}}>{lang==="zh"?"自动抠图":"Auto"}</button><button className={mattingMode==="keep"?"active":""} onClick={()=>{setMattingMode("keep");setMattingPreviewOriginal(false)}}>{lang==="zh"?"保留原背景":"Keep"}</button><button className={mattingMode==="skip"?"active":""} onClick={()=>{setMattingMode("skip");setMattingPreviewOriginal(false)}}>{lang==="zh"?"跳过处理":"Skip"}</button></div>{mattingMode==="remove"&&<><div className="color-row">{colors.map(color=><button key={color} onClick={()=>setBackground(color)} aria-label={`${lang==="zh"?"背景":"Background"} ${color}`} className={background===color?"active":""} style={{background:color}}/>)}<label className="eyedropper-button"><Pipette size={14}/><span>{lang==="zh"?"取色器":"Color picker"}</span><input type="color" value={background==="transparent"?"#ffffff":background} onChange={e=>setBackground(e.target.value)}/></label><button className={`transparent ${background==="transparent"?"active":""}`} onClick={()=>{setBackground("transparent");setFormat("png")}} aria-label={lang==="zh"?"透明背景":"Transparent background"}/></div><div className="control-label second"><b>{lang==="zh"?"背景识别范围":"Detection range"}</b><span>{mattingTolerance}</span></div><Slider value={[mattingTolerance]} min={12} max={180} step={1} onValueChange={v=>setMattingTolerance(v[0])}/><small className="range-tip">{lang==="zh"?"残留背景多就调高；人物被误删就调低":"Raise for leftovers; lower if the subject is removed"}</small><div className="control-label second"><b>{lang==="zh"?"边缘柔化":"Edge feather"}</b><span>{mattingFeather}</span></div><Slider value={[mattingFeather]} min={0} max={72} step={1} onValueChange={v=>setMattingFeather(v[0])}/><div className={`matting-inline-status ${mattingProcessing?"is-processing":""}`}>{mattingProcessing&&<span className="mini-spinner"/>}{mattingStatus}</div><div className="matting-control-actions"><button onClick={()=>setMattingPreviewOriginal(value=>!value)}>{mattingPreviewOriginal?(lang==="zh"?"查看抠图结果":"Show result"):(lang==="zh"?"对比原图":"Compare original")}</button><button onClick={()=>setMattingRevision(value=>value+1)}><RotateCw size={14}/>{lang==="zh"?"重新处理":"Reprocess"}</button></div></>}</div>
        {expertMode?<div className="control-group transform-control"><div className="control-label"><b>{lang==="zh"?"精确构图":"Precise composition"}</b><span>{lang==="zh"?"与画布操作同步":"Synced with canvas"}</span></div><div className="transform-fields"><label>{lang==="zh"?"缩放":"Zoom"}<span><input type="number" min="50" max="300" value={zoom} onChange={e=>setZoom(Math.max(50,Math.min(300,Number(e.target.value))))}/><b>%</b></span></label><label>X<span><input type="number" step="0.01" value={Number(offsetX.toFixed(2))} onChange={e=>setOffsetX(Number(e.target.value))}/></span></label><label>Y<span><input type="number" step="0.01" value={Number(offsetY.toFixed(2))} onChange={e=>setOffsetY(Number(e.target.value))}/></span></label><label>{lang==="zh"?"旋转":"Rotate"}<span><input type="number" min="-15" max="15" value={rotation} onChange={e=>setRotation(Number(e.target.value))}/><b>°</b></span></label></div></div>:wizardStep===1?<div className="gesture-card"><Move size={20}/><div><b>{lang==="zh"?"直接在照片上调整":"Adjust directly on the photo"}</b><span>{lang==="zh"?"电脑在画面内拖动、滚轮缩放；画面外正常滚动页面。手机单指拖动、双指缩放。":"Drag and wheel inside the photo on desktop. Drag with one finger and pinch with two on mobile."}</span></div></div>:null}
        <div className="control-group appearance-control"><div className="control-label"><b>{lang==="zh"?"画面亮度":"Brightness"}</b><span>{brightness}%</span></div><Slider value={[brightness]} min={70} max={140} step={1} onValueChange={v=>setBrightness(v[0])}/><div className="control-label second"><b>{lang==="zh"?"对比度":"Contrast"}</b><span>{contrast}%</span></div><Slider value={[contrast]} min={70} max={140} step={1} onValueChange={v=>setContrast(v[0])}/></div>
        <div className="dual-actions appearance-actions"><button className="magic-button" onClick={optimize}><Sparkles size={17}/>{lang==="zh"?"自然优化":"Auto enhance"}<span>{lang==="zh"?"推荐":"AUTO"}</span></button><button className="photo-reset-button" onClick={resetPhoto}><RotateCcw size={16}/>{lang==="zh"?"重置照片设置":"Reset photo"}</button></div>
        <div className="export-options output-controls"><label>{lang==="zh"?"文件格式":"Format"}<select value={format} onChange={e=>setFormat(e.target.value as typeof format)}><option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select></label><label>{lang==="zh"?"初始质量":"Quality"}<input type="number" min="50" max="100" value={quality} onChange={e=>setQuality(Number(e.target.value))}/><span>%</span></label><label className="size-limit-field">{lang==="zh"?"文件大小区间":"File-size range"}<span className="size-inputs"><input aria-label="minimum KB" type="number" min="1" value={minSizeKb} onChange={e=>setMinSizeKb(Number(e.target.value))}/><i>—</i><input aria-label="maximum KB" type="number" min="1" value={maxSizeKb} onChange={e=>updateMaxSizeKb(Number(e.target.value))}/><b>KB</b></span></label><label className="filename-field">{lang==="zh"?"文件名":"Filename"}<input value={filename} maxLength={120} placeholder={lang==="zh"?"例如：证件照_用途_日期":"For example: ID-photo_purpose_date"} onChange={e=>setFilename(e.target.value)}/></label></div>
        <div className="summary-card output-summary"><div className="summary-head"><b>{lang==="zh"?"导出摘要":"Export summary"}</b><span className="ready-dot">● {lang==="zh"?"就绪":"Ready"}</span></div><dl><div><dt>{lang==="zh"?"采集像素":"Pixels"}</dt><dd>{lang==="zh"?"高":"H"} {height} × {lang==="zh"?"宽":"W"} {width} px</dd></div><div><dt>{lang==="zh"?"成像区":"Imaging area"}</dt><dd>{lang==="zh"?"高":"H"} {areaHeightMm} × {lang==="zh"?"宽":"W"} {areaWidthMm} mm</dd></div><div><dt>{lang==="zh"?"大小区间":"File range"}</dt><dd>{minSizeKb}—{maxSizeKb} KB</dd></div><div><dt>{lang==="zh"?"格式":"Format"}</dt><dd>{format.toUpperCase()} · {quality}%</dd></div></dl></div>
        <button className="export-button" onClick={download}><Download size={19}/>{lang==="zh"?"保存电子证件照":"Save ID photo"}</button><button className="print-button" onClick={makePrintSheet}><Camera size={17}/>{lang==="zh"?"生成 6 寸冲印排版照":"Create 6-inch print sheet"}</button><p className="offline-note"><CloudOff size={14}/>{lang==="zh"?"断网也能完成裁剪和保存":"Crop and save while offline"}</p>
      </aside>
      {!expertMode&&<div className="wizard-nav"><button disabled={wizardStep===0} onClick={()=>setWizardStep(step=>Math.max(0,step-1))}>← {lang==="zh"?"上一步":"Back"}</button><span>{lang==="zh"?`第 ${wizardStep+1} / 4 步`:`Step ${wizardStep+1} / 4`}</span><button disabled={wizardStep===3} onClick={()=>setWizardStep(step=>Math.min(3,step+1))}>{lang==="zh"?"下一步":"Next"} →</button></div>}
    </section>
  </main>;
}

function Landing({lang,setLang,playIntro,onStart}:{lang:Lang;setLang:(lang:Lang)=>void;playIntro:boolean;onStart:()=>void}){
  const t=copy[lang];
  const isZh=lang==="zh";
  return <main className={`landing ${playIntro?"first-visit":""}`}>
    <header className="landing-nav">
      <div className="brand"><span className="brand-mark"><span /></span><span>简照</span><span className="brand-tag">{t.product}</span></div>
      <nav><a href="/tools"><ImageDown size={16}/>{isZh?"图片工具":"Tools"}</a><a href="#guide"><BookOpen size={16}/>{t.guide}</a><a href="#disclaimer"><ShieldCheck size={16}/>{t.disclaimer}</a><label className="language-select"><Globe2 size={16}/><select aria-label={t.language} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="zh">中文</option><option value="en">English</option></select></label></nav>
    </header>
    <section className="landing-hero">
      <div className="hero-light" aria-hidden="true"/><div className="hero-grid" aria-hidden="true"/>
      <div className="hero-copy">
        <span className="hero-kicker"><LockKeyhole size={15}/>{t.privacy}</span>
        <h1>{t.introTitle}</h1><p>{t.introText}</p>
        <div className="hero-actions"><a className="start-button" href="/id-photo">{t.start}<ChevronRight size={19}/></a><a href="/tools">{isZh?"打开图片小工具":"Open image tools"}</a></div>
        <div className="hero-facts"><span><b>192 × 144</b>{isZh?"默认采集像素":"Default pixels"}</span><span><b>48 × 33 mm</b>{isZh?"独立成像区":"Independent area"}</span><span><b>{isZh?"全程本地":"Local only"}</b>{isZh?"无需上传原图":"No photo upload"}</span></div>
      </div>
      <div className="hero-device" aria-label={isZh?"证件照构图示意":"ID photo composition preview"}>
        <div className="device-top"><span/><span/><span/></div><div className="device-photo"><i className="glow-orb"/><div className="person-silhouette"><span/><b/></div><em className="demo-line line-top">10%</em><em className="demo-line line-head">70%</em><em className="demo-line line-shoulder">20%</em><i className="demo-side side-a"/><i className="demo-side side-b"/></div>
        <div className="device-caption"><span><Check size={14}/>{isZh?"尺寸与构图可自定义":"Custom size and guides"}</span><b>{isZh?"准备制作":"Ready"}</b></div>
      </div>
    </section>
    <section className="landing-section" id="guide"><span className="section-kicker">01 · {t.guide}</span><h2>{isZh?"三步完成一张证件照":"Create an ID photo in three steps"}</h2><div className="instruction-grid">
      <article><span>1</span><WandSparkles size={22}/><h3>{isZh?"拍照或上传":"Take or upload"}</h3><p>{isZh?"选择光线均匀、面部无遮挡的正面照片。复杂背景可先进入“抠像换背景”。":"Choose a clear, front-facing portrait. Use Remove Background first for a busy scene."}</p></article>
      <article><span>2</span><Move size={22}/><h3>{isZh?"拖动并校准":"Move and align"}</h3><p>{isZh?"拖动人物、滚轮或滑杆缩放，并按头顶、头部、肩部和左右安全线调整。":"Drag, zoom and align the subject with the top, head, shoulder and side guides."}</p></article>
      <article><span>3</span><Download size={22}/><h3>{isZh?"检查并保存":"Review and save"}</h3><p>{isZh?"确认像素、毫米、格式与文件大小区间，再保存电子照或生成冲印版。":"Confirm pixels, millimetres, format and file-size range, then save or create a print sheet."}</p></article>
    </div></section>
    <section className="disclaimer-section" id="disclaimer"><div><span className="section-kicker">02 · {t.disclaimer}</span><h2>{isZh?"使用与隐私说明":"Use and privacy notice"}</h2><p className="disclaimer-lead">{isZh?"请在正式提交照片前阅读。":"Please read before submitting a photo."}</p></div><div className="disclaimer-copy"><div className="disclaimer-grid"><article><b>{isZh?"工具性质与结果":"Purpose and results"}</b><p>{isZh?"本工具仅提供证件照裁剪、抠图、换底、压缩和排版辅助，与政府机关、学校、考试机构、签证机构及其他受理单位无隶属或授权关系。模板是便捷参考，不承诺照片一定通过审核；请以实际受理方最新要求为准。":"This tool only assists with cropping, matting, background replacement, compression and layout. It is not affiliated with or authorised by any authority, school, examination body, visa service or recipient. Templates are references and do not guarantee acceptance."}</p></article><article><b>{isZh?"照片与个人信息":"Photos and personal data"}</b><p>{isZh?"当前照片处理默认在浏览器本地完成，选择照片不会自动上传到简照服务器。托管服务可能按其安全策略记录必要的访问日志，例如访问时间、IP 地址、浏览器类型和请求状态。若以后增加云端处理，必须另行告知处理目的、范围、保存期限和第三方，并取得适用的授权或同意。":"Photo processing currently happens in your browser, and selecting a photo does not automatically upload it to SimplePortrait. Hosting providers may keep necessary security logs such as time, IP address, browser type and request status. Any future cloud processing must provide a separate notice and obtain applicable authorisation or consent."}</p></article><article><b>{isZh?"安全使用与责任":"Safe use and responsibility"}</b><p>{isZh?"自动抠图与构图参考可能受头发、服装、光线和复杂背景影响。用户应检查最终图片，并确保有权处理所选照片，不得将本工具用于冒用身份、侵害他人权益或其他违法用途。因用户提交错误规格、违规使用或第三方审核标准变化产生的后果，由实际责任方依法承担。":"Automatic matting and guides can be affected by hair, clothing, lighting and complex backgrounds. Check the final image, make sure you have the right to use it, and do not use this tool for impersonation, infringement or unlawful purposes."}</p></article><article><b>{isZh?"中国大陆服务器部署":"Mainland China deployment"}</b><p>{isZh?"使用中国大陆境内服务器正式提供服务前，网站运营者应根据实际主体、域名和服务性质办理适用的 ICP 备案或许可、公安联网备案及其他必要手续；只展示已经取得且与实际运营主体一致的备案信息。正式上线前还应补充运营主体、有效联系方式、投诉渠道、数据保存期限和第三方服务清单。本说明不构成法律意见。":"Before operating on servers in mainland China, the operator should complete applicable ICP filing or licensing, public-security network filing and other required procedures based on the actual entity, domain and service. Display only valid filing details that match the operator, and add operator identity, contact, complaint channel, retention periods and third-party services before launch. This notice is not legal advice."}</p></article></div><div className="compliance-links">{isZh?<><a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">工信部 ICP 备案系统</a><a href="https://ywtb.mps.gov.cn/" target="_blank" rel="noreferrer">公安部政务服务平台</a></>:<><a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">MIIT filing system</a><a href="https://ywtb.mps.gov.cn/" target="_blank" rel="noreferrer">MPS service portal</a></>}</div><button onClick={onStart}>{t.start}<ChevronRight size={18}/></button></div></section>
    <section className="creator-section"><div className="creator-mark">L</div><div><span className="section-kicker">03 · {isZh?"关于项目":"ABOUT"}</span><h2>{isZh?"简照 SimplePortrait":"SimplePortrait"}</h2><p>{isZh?"由 Luminous 设计与制作，专注于简单、免费和隐私友好的本地证件照处理。":"Designed and built by Luminous, SimplePortrait focuses on simple, free and privacy-friendly ID photo processing on your device."}</p></div></section>
    <footer><span>简照 SimplePortrait · {isZh?"制作者 Luminous · 本地优先":"by Luminous · Local-first ID photo tools"}</span><button onClick={onStart}>{isZh?"进入制作台":"Open studio"}</button></footer>
  </main>
}

async function canvasToTargetBlob(canvas:HTMLCanvasElement,format:"jpeg"|"png"|"webp",quality:number,minKb:number,maxKb:number){
  const mime=`image/${format}`;
  const encode=(q:number)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("图片编码失败")),mime,q));
  if(format==="png"){const blob=await encode(1);return{blob,inRange:blob.size>=minKb*1024&&blob.size<=maxKb*1024,quality:100}}
  let low=.15,high=Math.max(.15,quality/100),best=await encode(high);
  for(let i=0;i<8;i++){const q=(low+high)/2;const blob=await encode(q);if(blob.size>maxKb*1024)high=q;else{best=blob;low=q}}
  return{blob:best,inRange:best.size>=minKb*1024&&best.size<=maxKb*1024,quality:Math.round(low*100)};
}

export function CompressionTool({lang="zh"}:{lang?:Lang}){
  const [url,setUrl]=useState<string|null>(null);
  const [sourceName,setSourceName]=useState("");
  const [originalBytes,setOriginalBytes]=useState(0);
  const [sourceSize,setSourceSize]=useState({width:0,height:0});
  const [minKb,setMinKb]=useState(50);
  const [maxKb,setMaxKb]=useState(300);
  const [format,setFormat]=useState<"jpeg"|"png"|"webp">("jpeg");
  const [status,setStatus]=useState("选择照片后即可压缩");
  const inputRef=useRef<HTMLInputElement>(null);
  const previewRef=useRef<HTMLImageElement>(null);
  const pick=(file?:File)=>{if(!file)return;if(!file.type.startsWith("image/")){setStatus("请选择图片文件");return}const next=URL.createObjectURL(file);setUrl(old=>{if(old)URL.revokeObjectURL(old);return next});setSourceName(file.name);setOriginalBytes(file.size);const img=new Image();img.onload=()=>{setSourceSize({width:img.width,height:img.height});setFormat(file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpeg");setStatus("照片已载入，可设置压缩区间")};img.src=next};
  const compress=async()=>{const img=previewRef.current;if(!img||!url){setStatus("请先选择照片");return}if(minKb>maxKb){setStatus("文件大小下限不能大于上限");return}const canvas=document.createElement("canvas");canvas.width=sourceSize.width;canvas.height=sourceSize.height;canvas.getContext("2d")!.drawImage(img,0,0,sourceSize.width,sourceSize.height);const result=await canvasToTargetBlob(canvas,format,95,minKb,maxKb);const href=URL.createObjectURL(result.blob);const link=document.createElement("a");const base=sanitizeFilename(sourceName.replace(/\.[^.]+$/,""));link.download=`${base}_压缩.${format==="jpeg"?"jpg":format}`;link.href=href;link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);setStatus(`压缩完成：${Math.round(originalBytes/1024)} KB → ${Math.round(result.blob.size/1024)} KB${result.inRange?"":"（当前尺寸未能完全达到区间）"}`)};
  const isZh=lang==="zh";
  return <section className="compress-workspace">
    <aside className="compress-intro"><span className="compress-badge"><ImageDown size={18}/></span><span className="eyebrow">{isZh?"独立工具":"STANDALONE TOOL"}</span><h1>{isZh?"照片压缩":"Photo compressor"}</h1><p>{isZh?"只调整照片文件大小，原始像素、比例和格式保持不变。照片始终在本机处理。":"Reduce file size while preserving original pixels, aspect ratio and format. Processing stays on this device."}</p><ul><li><Check size={14}/>{isZh?"设置目标 KB 区间":"Set a target KB range"}</li><li><Check size={14}/>{isZh?"保持原始像素":"Keep original pixels"}</li><li><Check size={14}/>{isZh?"保持原始格式":"Keep original format"}</li></ul></aside>
    <section className="compress-preview" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();pick(e.dataTransfer.files[0])}}>
      {url?<><img ref={previewRef} src={url} alt={isZh?"待压缩照片预览":"Photo preview"}/><button onClick={()=>inputRef.current?.click()}>{isZh?"更换照片":"Replace"}</button></>:<button className="compress-upload" onClick={()=>inputRef.current?.click()}><span><ImagePlus size={30}/></span><b>{isZh?"选择需要压缩的照片":"Choose a photo to compress"}</b><small>{isZh?"支持 JPG、PNG、WebP，也可拖放到这里":"JPG, PNG and WebP · drag and drop supported"}</small></button>}
      <input hidden ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>pick(e.target.files?.[0])}/>
    </section>
    <aside className="compress-controls">
      <div className="panel-heading"><div><span className="eyebrow">{isZh?"压缩参数":"COMPRESSION"}</span><h2>{isZh?"只设置文件大小":"Output settings"}</h2></div><span className="local-chip"><LockKeyhole size={13}/>{isZh?"本机":"Local"}</span></div>
      <div className="source-meta"><span>原始文件</span><b>{sourceName||"尚未选择"}</b><small>{url?`${sourceSize.width} × ${sourceSize.height} px · ${Math.round(originalBytes/1024)} KB`:"—"}</small></div>
      <label className="field-label">照片大小区间</label>
      <div className="compress-range"><input aria-label="压缩最小 KB" type="number" min="1" value={minKb} onChange={e=>setMinKb(Number(e.target.value))}/><span>至</span><input aria-label="压缩最大 KB" type="number" min="1" value={maxKb} onChange={e=>setMaxKb(Number(e.target.value))}/><b>KB</b></div>
      <div className="compress-status">{status}</div>
      <button className="export-button compress-submit" onClick={compress}><Download size={18}/> 压缩并保存</button>
    </aside>
  </section>
}

function median(values:number[]){const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)]||0}
function softenMask(mask:Uint8Array,width:number,height:number,radius:number){
  if(radius<1)return mask;const horizontal=new Uint8Array(mask.length);const result=new Uint8Array(mask.length);
  for(let y=0;y<height;y++){let sum=0;for(let x=-radius;x<=radius;x++)sum+=mask[y*width+Math.max(0,Math.min(width-1,x))];for(let x=0;x<width;x++){horizontal[y*width+x]=Math.round(sum/(radius*2+1));sum-=mask[y*width+Math.max(0,x-radius)];sum+=mask[y*width+Math.min(width-1,x+radius+1)]}}
  for(let x=0;x<width;x++){let sum=0;for(let y=-radius;y<=radius;y++)sum+=horizontal[Math.max(0,Math.min(height-1,y))*width+x];for(let y=0;y<height;y++){result[y*width+x]=Math.round(sum/(radius*2+1));sum-=horizontal[Math.max(0,y-radius)*width+x];sum+=horizontal[Math.min(height-1,y+radius+1)*width+x]}}
  return result;
}
function renderBackgroundRemoval(image:HTMLImageElement,canvas:HTMLCanvasElement,replacement:string,tolerance:number,feather:number){
  const maxEdge=2200;const ratio=Math.min(1,maxEdge/Math.max(image.naturalWidth,image.naturalHeight));const width=Math.max(1,Math.round(image.naturalWidth*ratio));const height=Math.max(1,Math.round(image.naturalHeight*ratio));
  const work=document.createElement("canvas");work.width=width;work.height=height;const ctx=work.getContext("2d",{willReadFrequently:true});if(!ctx)throw new Error("当前浏览器无法创建图像处理画布");ctx.drawImage(image,0,0,width,height);const pixels=ctx.getImageData(0,0,width,height);const data=pixels.data;
  const rs:number[]=[],gs:number[]=[],bs:number[]=[];const step=Math.max(1,Math.floor(Math.min(width,height)/90));const collect=(x:number,y:number)=>{const i=(y*width+x)*4;rs.push(data[i]);gs.push(data[i+1]);bs.push(data[i+2])};for(let x=0;x<width;x+=step){collect(x,0);collect(x,height-1)}for(let y=step;y<height-step;y+=step){collect(0,y);collect(width-1,y)}const br=median(rs),bg=median(gs),bb=median(bs);
  const count=width*height;const visited=new Uint8Array(count);const queue=new Uint32Array(count);let read=0,write=0;const matches=(index:number)=>{const i=index*4;const dr=data[i]-br,dg=data[i+1]-bg,db=data[i+2]-bb;return Math.sqrt(dr*dr+dg*dg+db*db)<=tolerance};const enqueue=(index:number)=>{if(!visited[index]&&matches(index)){visited[index]=1;queue[write++]=index}};
  for(let x=0;x<width;x++){enqueue(x);enqueue((height-1)*width+x)}for(let y=1;y<height-1;y++){enqueue(y*width);enqueue(y*width+width-1)}while(read<write){const index=queue[read++],x=index%width,y=Math.floor(index/width);if(x>0)enqueue(index-1);if(x<width-1)enqueue(index+1);if(y>0)enqueue(index-width);if(y<height-1)enqueue(index+width)}
  const alpha=new Uint8Array(count);for(let i=0;i<count;i++)alpha[i]=visited[i]?0:255;const softened=softenMask(alpha,width,height,Math.min(14,Math.round(feather/6)));for(let i=0;i<count;i++)data[i*4+3]=softened[i];ctx.putImageData(pixels,0,0);
  canvas.width=width;canvas.height=height;const out=canvas.getContext("2d");if(!out)throw new Error("当前浏览器无法输出图片");out.clearRect(0,0,width,height);if(replacement!=="transparent"){out.fillStyle=replacement;out.fillRect(0,0,width,height)}out.drawImage(work,0,0);return{width,height,background:[br,bg,bb],removed:write};
}

export function MattingTool({lang="zh"}:{lang?:Lang}){
  const [url,setUrl]=useState<string|null>(null);
  const [background,setBackground]=useState("#4f9ef8");
  const [tolerance,setTolerance]=useState(58);
  const [feather,setFeather]=useState(18);
  const [revision,setRevision]=useState(0);
  const [showOriginal,setShowOriginal]=useState(false);
  const [mattingMode,setMattingMode]=useState<"remove"|"keep"|"skip">("remove");
  const [processing,setProcessing]=useState(false);
  const [status,setStatus]=useState(lang==="zh"?"上传照片后，从画面边缘自动识别连续背景":"Upload a photo to detect the connected background from its edges");
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const uploadRef=useRef<HTMLInputElement>(null);
  const cameraRef=useRef<HTMLInputElement>(null);
  const pick=(file?:File)=>{if(!file)return;if(!file.type.startsWith("image/")){setStatus(lang==="zh"?"请选择图片文件":"Please choose an image file");return}const next=URL.createObjectURL(file);setUrl(old=>{if(old)URL.revokeObjectURL(old);return next});setShowOriginal(false);setStatus(lang==="zh"?"正在分析连续背景区域…":"Detecting connected background…")};
  useEffect(()=>{if(!url)return;let cancelled=false;setProcessing(true);const image=new Image();image.onload=()=>{requestAnimationFrame(()=>{if(cancelled)return;const canvas=canvasRef.current;if(!canvas)return;try{if(showOriginal||mattingMode!=="remove"){const ratio=Math.min(1,2200/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.round(image.naturalWidth*ratio);canvas.height=Math.round(image.naturalHeight*ratio);canvas.getContext("2d")?.drawImage(image,0,0,canvas.width,canvas.height);setStatus(lang==="zh"?"正在查看原图，点击“查看效果”返回":"Showing original · choose Result to return")}else{const result=renderBackgroundRemoval(image,canvas,background,tolerance,feather);const percent=Math.round(result.removed/(result.width*result.height)*100);setStatus(lang==="zh"?`处理完成 · 已识别约 ${percent}% 的边缘背景`:`Done · about ${percent}% of connected background detected`)}setProcessing(false)}catch(error){setProcessing(false);setStatus(error instanceof Error?error.message:(lang==="zh"?"处理失败，请更换照片重试":"Processing failed. Try another photo"))}})};image.onerror=()=>{setProcessing(false);setStatus(lang==="zh"?"照片读取失败，请换一张照片":"Could not read this image")};image.src=url;return()=>{cancelled=true}},[url,background,tolerance,feather,revision,showOriginal,mattingMode,lang]);
  const save=()=>{const canvas=canvasRef.current;if(!canvas||!url){setStatus(lang==="zh"?"请先拍照或上传照片":"Take or upload a photo first");return}const transparent=mattingMode==="remove"&&background==="transparent";canvas.toBlob(blob=>{if(!blob)return;const href=URL.createObjectURL(blob);const link=document.createElement("a");link.download=`${lang==="zh"?"抠像换背景":"background_removed"}_${new Date().toISOString().slice(0,10)}.${transparent?"png":"jpg"}`;link.href=href;link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);setStatus(lang==="zh"?"换背景照片已保存":"Background-replaced photo saved")},transparent?"image/png":"image/jpeg",.94)};
  const isZh=lang==="zh";
  return <section className="matting-workspace">
    <aside className="matting-controls"><div className="matting-mode-row three"><button onClick={()=>{setMattingMode("remove");setShowOriginal(false)}} className={mattingMode==="remove"?"active":""}>{isZh?"自动抠像":"Auto remove"}</button><button onClick={()=>{setMattingMode("keep");setShowOriginal(false)}} className={mattingMode==="keep"?"active":""}>{isZh?"保留原背景":"Keep original"}</button><button onClick={()=>{setMattingMode("skip");setShowOriginal(false)}} className={mattingMode==="skip"?"active":""}>{isZh?"跳过处理":"Skip"}</button></div>
      <span className="eyebrow">{isZh?"独立工具":"STANDALONE TOOL"}</span><h1>{isZh?"抠像换背景":"Remove background"}</h1><p className="tool-help">{isZh?"新版只移除与画面边缘连通的相近颜色，能更好保留人物内部细节。全程本机处理。":"The new detector removes only similar colours connected to image edges, preserving more subject detail. Local processing only."}</p>
      <div className="capture-rule-card"><b><ScanLine size={15}/>{isZh?"推荐工作流程":"Recommended flow"}</b><span>{isZh?"1. 上传后先查看自动效果":"1. Upload and review the automatic result"}</span><span>{isZh?"2. 调整识别范围与柔化":"2. Adjust detection and feathering"}</span><small>{isZh?"背景越干净、与人物反差越大，效果越好":"Clean, contrasting backgrounds work best"}</small></div>
      <label className="field-label spaced">{isZh?"替换背景":"New background"}</label><div className="color-row matting-colors">{colors.map(color=><button key={color} className={background===color?"active":""} style={{background:color}} onClick={()=>setBackground(color)} aria-label={`${isZh?"背景":"Background"} ${color}`}/>)}<label className="eyedropper-button"><Pipette size={14}/><span>{isZh?"取色器":"Color picker"}</span><input type="color" value={background==="transparent"?"#ffffff":background} onChange={e=>setBackground(e.target.value)}/></label><button className={background==="transparent"?"transparent active":"transparent"} onClick={()=>setBackground("transparent")} aria-label={isZh?"透明背景":"Transparent background"}/></div>
      <div className="control-group"><div className="control-label"><b>{isZh?"背景识别范围":"Detection range"}</b><span>{tolerance}</span></div><Slider value={[tolerance]} min={12} max={180} onValueChange={v=>setTolerance(v[0])}/><small className="range-tip">{isZh?"残留背景多就调高；人物被误删就调低":"Raise for leftover background; lower if the subject is removed"}</small></div>
      <div className="control-group"><div className="control-label"><b>{isZh?"边缘柔化":"Edge feather"}</b><span>{feather}</span></div><Slider value={[feather]} min={0} max={72} onValueChange={v=>setFeather(v[0])}/></div>
      <div className={`compress-status ${processing?"is-processing":""}`}>{processing&&<span className="mini-spinner"/>}{status}</div><div className="matting-control-actions"><button onClick={()=>setShowOriginal(v=>!v)}>{showOriginal?(isZh?"查看效果":"Result"):(isZh?"对比原图":"Original")}</button><button onClick={()=>setRevision(v=>v+1)}><RotateCw size={14}/>{isZh?"重新处理":"Reprocess"}</button></div><button className="export-button" onClick={save} disabled={processing}><Download size={18}/>{isZh?"保存换背景照片":"Save result"}</button>
    </aside>
    <section className="matting-stage">
      <div className="matting-actions"><button onClick={()=>cameraRef.current?.click()}><Camera size={16}/>{isZh?"拍照":"Camera"}</button><button onClick={()=>uploadRef.current?.click()}><Upload size={16}/>{isZh?"上传照片":"Upload"}</button></div>
      <div className={`matting-canvas-wrap ${background==="transparent"?"checker":""}`}>
        {url?<canvas ref={canvasRef}/>:<button className="matting-empty" onClick={()=>uploadRef.current?.click()}><span><WandSparkles size={30}/></span><b>{isZh?"上传照片开始抠像":"Upload to remove background"}</b><small>{isZh?"支持渐变与轻微阴影背景，复杂场景请适当调节":"Handles mild gradients and shadows; adjust for complex scenes"}</small></button>}
      </div>
      <input hidden ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>pick(e.target.files?.[0])}/><input hidden ref={cameraRef} type="file" accept="image/*" capture="user" onChange={e=>pick(e.target.files?.[0])}/>
    </section>
  </section>
}

function HistoryDialog({lang}:{lang:Lang}){
  const [items,setItems]=useState<Array<{name:string;spec:string;createdAt:string;width:number;height:number}>>([]);
  useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem("jianzhao-history")||"[]"))}catch{}},[]);
  const clear=()=>{localStorage.removeItem("jianzhao-history");setItems([])};
  const isZh=lang==="zh";return <DialogContent className="dialog-card"><DialogHeader><DialogTitle>{isZh?"本机制作记录":"Local history"}</DialogTitle><DialogDescription>{isZh?"仅保存在当前设备，不会上传到云端。":"Saved only on this device and never uploaded."}</DialogDescription></DialogHeader>{items.length?<div className="history-list">{items.map((item,i)=><div key={`${item.createdAt}-${i}`}><span className="history-thumb"><FileImage size={18}/></span><span><b>{item.name}</b><small>{item.spec} · {item.width} × {item.height}px</small></span><time>{new Date(item.createdAt).toLocaleDateString(isZh?"zh-CN":"en-US")}</time></div>)}</div>:<div className="empty-history"><FileImage size={28}/><b>{isZh?"还没有制作记录":"No history yet"}</b><span>{isZh?"导出照片后会显示在这里":"Exports will appear here"}</span></div>}<button className="danger-quiet" onClick={clear} disabled={!items.length}><Trash2 size={15}/>{isZh?"清空记录":"Clear history"}</button></DialogContent>;
}

function SettingsDialog({lang}:{lang:Lang}){const isZh=lang==="zh";return <DialogContent className="dialog-card"><DialogHeader><DialogTitle>{isZh?"设置与隐私":"Settings & privacy"}</DialogTitle><DialogDescription>{isZh?"简照默认在本机处理和保存照片。":"Jianzhao processes and saves photos locally by default."}</DialogDescription></DialogHeader><div className="settings-list"><div><span><b>{isZh?"原图保留时间":"Keep originals"}</b><small>{isZh?"到期后自动从本机缓存移除":"Remove from local cache after this period"}</small></span><select defaultValue="7"><option value="0">{isZh?"不保留":"Do not keep"}</option><option value="7">{isZh?"7 天":"7 days"}</option><option value="forever">{isZh?"长期保留":"Keep indefinitely"}</option></select></div><div><span><b>{isZh?"默认分辨率":"Default resolution"}</b><small>{isZh?"用于实体尺寸与像素换算":"Used for physical-size conversion"}</small></span><select defaultValue="300"><option>150</option><option>300</option><option>600</option></select></div><div><span><b>{isZh?"隐私承诺":"Privacy"}</b><small>{isZh?"普通裁剪、调色和导出无需联网":"Cropping, colour and export work offline"}</small></span><ShieldCheck size={22}/></div></div></DialogContent>}

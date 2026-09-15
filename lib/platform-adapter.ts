import type { PhotoProject } from "./photo-core";

export interface SourceImage { id:string; name:string; mimeType:string; url:string; width:number; height:number }
export interface GeneratedFile { name:string; mimeType:string; blob:Blob }
export interface SavedFile { name:string; uri:string }
export interface ClearDataOptions { projects?:boolean; sourceImages?:boolean; preferences?:boolean }

export interface PlatformAdapter {
  pickImage():Promise<SourceImage>;
  captureImage():Promise<SourceImage>;
  saveFile(file:GeneratedFile):Promise<SavedFile>;
  shareFile?(file:GeneratedFile):Promise<void>;
  readLocalProject(id:string):Promise<PhotoProject|null>;
  writeLocalProject(project:PhotoProject):Promise<void>;
  clearLocalData(options:ClearDataOptions):Promise<void>;
}

export const platformCapabilities={web:{camera:true,fileSystem:true,share:navigatorShareAvailable()},wechat:{camera:true,fileSystem:true,share:true},ios:{camera:true,fileSystem:true,share:true,heic:true},android:{camera:true,fileSystem:true,share:true,heic:true},desktop:{camera:false,fileSystem:true,share:false}} as const;
function navigatorShareAvailable(){return typeof navigator!=="undefined"&&"share" in navigator}

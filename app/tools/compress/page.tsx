"use client";
import Link from "next/link";
import { CompressionTool } from "../../page";
export default function CompressPage(){return <main className="standalone-page"><header className="standalone-nav"><Link href="/">SimplePortrait 简照</Link><nav><Link href="/id-photo">证件照制作</Link><Link href="/tools">全部工具</Link></nav></header><CompressionTool/></main>}

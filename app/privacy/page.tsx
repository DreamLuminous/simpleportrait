import Link from "next/link";
import { ArrowLeft, Database, Eraser, LockKeyhole, Server, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "隐私政策与使用条款｜SimplePortrait 简照",
  description: "SimplePortrait 简照关于图片处理、本地数据、访问日志、用户权利及服务使用边界的说明。",
};

const privacyItems = [
  {
    icon: LockKeyhole,
    title: "1. 图片处理方式",
    body: "当前 Web / PWA 版本的图片解码、裁剪、构图、背景处理、尺寸换算和导出默认在浏览器内执行。本站前端代码当前未设置把用户所选图片主动发送到 SimplePortrait 简照业务服务器的功能。若以后增加需要联网传输图片的能力，将在启用前另行告知处理目的、范围、保存期限和接收方，并依法取得必要授权。",
  },
  {
    icon: Database,
    title: "2. 本地保存的信息",
    body: "浏览器可能保存语言、编辑模式、参数偏好、保留天数以及导出记录摘要。当前历史记录仅包含文件名、规格、像素尺寸和时间等摘要，不保存原始图片内容。用户可在设置中调整保留偏好，也可通过浏览器的清除网站数据功能删除本地记录。",
  },
  {
    icon: Server,
    title: "3. 访问与运行日志",
    body: "为保障网络安全、排查故障和维持服务，网站托管、域名解析或内容分发服务商可能按照其服务规则处理访问时间、IP 地址、浏览器类型、请求地址、响应状态和错误信息等必要日志。本站不利用上述日志对用户进行广告画像；实际日志范围和保存期限以正式部署时使用的服务商配置为准。",
  },
  {
    icon: ShieldCheck,
    title: "4. 提供、委托与转移",
    body: "SimplePortrait 简照不出售用户图片或本地编辑记录。除依法履行义务、保护网络安全或用户主动启用并同意的第三方处理功能外，不向其他主体提供用户图片。发生服务商、处理目的或跨境传输安排的实质变化时，将依法更新说明并履行相应告知、同意或评估义务。",
  },
  {
    icon: Eraser,
    title: "5. 保存期限与删除",
    body: "页面关闭或刷新后，浏览器内存中的临时图片通常会被释放；浏览器缓存的实际清理时间受设备和浏览器策略影响。下载到设备的成品由用户自行管理。对于服务端必要访问日志，将在满足网络安全、运维和法定义务所需的最短期限内保存，并按实际部署规则处理。",
  },
  {
    icon: Database,
    title: "6. 用户权利",
    body: "用户可以选择不上传图片、停止编辑、清除本地记录或撤回尚未执行的可选授权。对服务端可能处理的个人信息，用户可通过下方联系渠道提出查阅、更正、删除、解释或注销相关请求；项目维护者将在核验请求与适用法律要求后处理。",
  },
  {
    icon: ShieldCheck,
    title: "7. 未成年人保护",
    body: "不满十四周岁的未成年人应在父母或其他监护人指导下使用。请勿在无法获得监护人同意的情况下处理未成年人的照片。若发现可能未经适当授权处理未成年人信息，请通过联系渠道反馈。",
  },
];

export default function PrivacyPage() {
  return <main className="privacy-page">
    <header className="privacy-hero">
      <Link className="privacy-back" href="/"><ArrowLeft size={18}/> 返回主页</Link>
      <span className="eyebrow">PRIVACY POLICY & TERMS</span>
      <h1>隐私政策与使用条款</h1>
      <p>本政策说明 SimplePortrait 简照 当前网页版处理图片和相关信息的方式，以及用户使用本工具时需要了解的权利、责任和服务边界。</p>
      <div className="privacy-meta"><span>生效日期：2026 年 9 月 16 日</span><span>当前版本：Web / PWA</span></div>
    </header>

    <section className="privacy-operator" aria-label="服务提供者与联系信息">
      <div><span>产品名称</span><b>SimplePortrait 简照</b></div>
      <div><span>项目维护者</span><b>Luminous</b></div>
      <div><span>联系邮箱</span><a href="mailto:Dreamluminous@163.com">Dreamluminous@163.com</a></div>
      <div><span>开源项目</span><a href="https://gitee.com/luminousone/simpleportrait" target="_blank" rel="noreferrer">Gitee · luminousone/simpleportrait</a></div>
      <p>联系方式与开源入口集中展示于此。欢迎访问仓库 Star、提交建议与反馈；备案主体及编号将在相关手续完成后按实际信息公示。</p>
    </section>

    <section className="privacy-summary">
      <h2>重要提示</h2>
      <p>人像照片可能包含能够识别特定个人的信息；证件照片、身份证件图像、身份证号码以及不满十四周岁未成年人的信息需要更谨慎地处理。当前版本不进行身份核验或人脸身份识别。请仅处理本人照片或已获得合法授权的照片，不要上传含有不必要证件号码、住址等信息的证件扫描件。</p>
    </section>

    <section className="privacy-grid" aria-label="个人信息处理说明">
      {privacyItems.map(({icon:Icon,title,body})=><article className="privacy-card" key={title}><Icon size={22}/><div><h2>{title}</h2><p>{body}</p></div></article>)}
    </section>

    <section className="privacy-notice">
      <h2>服务使用与结果说明</h2>
      <ul>
        <li>SimplePortrait 简照是通用图片编辑与证件照辅助制作工具，不代表或隶属于政府机关、考试机构、学校、签证机构、证件签发机构或其他受理单位。</li>
        <li>内置规格和快捷参数用于提高制作效率，不等同于受理单位的正式标准。用户应在提交前核对目标机构当期公布的尺寸、背景、文件大小和构图要求。</li>
        <li>自动背景处理、文件体积优化、构图参考和质量提示会受到原图、设备性能、浏览器能力及参数设置影响，本站不对第三方审核或受理结果作保证。</li>
        <li>用户应保证对所处理图片具有合法使用权限，不得利用本工具实施身份冒用、侵犯肖像权和隐私权、伪造材料或其他违法违规行为。</li>
        <li>因用户自行选择参数、设备或浏览器故障、第三方规则调整及不可抗力产生的影响，按照适用法律和各方过错依法承担责任。</li>
      </ul>
    </section>

    <section className="privacy-filing-placeholder" aria-label="备案信息预留">
      <div><span>FILING INFORMATION</span><h2>备案公示预留</h2></div>
      <p>备案编号及相关公示信息将在手续完成后于此处和网站首页底部更新。</p>
    </section>

    <section className="privacy-update">
      <h2>政策更新</h2>
      <p>功能、处理方式或适用规则发生重要变化时，本政策将同步更新；涉及个人信息处理目的、方式、种类或接收方发生实质变化的，将依法重新履行告知并在需要时取得同意。继续使用前请留意本页生效日期。</p>
    </section>

    <div className="privacy-actions"><Link className="primary-link" href="/id-photo">开始制作证件照</Link><Link className="secondary-link" href="/">返回主页</Link></div>
  </main>;
}

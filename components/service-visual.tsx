import type { Service } from "@/lib/content";

export function ServiceVisual({ mode, title }: Pick<Service, "mode" | "title">) {
  return (
    <div className={`service-visual mode-${mode}`} aria-label={`${title} interface preview`} role="img">
      <div className="visual-meta"><span>PREVIEW / ACTIVE</span><span>0.0{["browser", "landing", "dashboard", "mobile", "automation", "system"].indexOf(mode) + 1}</span></div>
      {mode === "browser" && (
        <div className="browser-ui visual-frame">
          <div className="ui-top"><i /><i /><i /><span>hoza.site</span></div>
          <div className="browser-hero"><b>MOVE<br />FORWARD.</b><span /></div>
          <div className="browser-columns"><i /><i /><i /></div>
        </div>
      )}
      {mode === "landing" && (
        <div className="landing-ui visual-frame">
          <div className="landing-nav"><span>BRAND</span><i /></div>
          <div className="landing-copy"><b>BUILT<br />TO CONVERT.</b><span /></div>
          <div className="landing-meter"><i /></div>
        </div>
      )}
      {mode === "dashboard" && (
        <div className="dashboard-ui visual-frame">
          <div className="dash-side"><i /><i /><i /><i /></div>
          <div className="dash-main">
            <div className="dash-stats"><span /><span /><span /></div>
            <div className="dash-chart"><svg viewBox="0 0 400 140"><path d="M0 120 C55 100 80 118 122 78 S210 95 250 52 S330 35 400 5" /></svg></div>
          </div>
        </div>
      )}
      {mode === "mobile" && (
        <div className="mobile-ui-wrap">
          <div className="phone-ui visual-frame"><i className="phone-notch" /><div className="phone-hero" /><div className="phone-list"><span /><span /><span /></div><div className="phone-nav"><i /><i /><i /></div></div>
          <div className="phone-card"><span>LIVE UPDATE</span><b>READY</b></div>
        </div>
      )}
      {mode === "automation" && (
        <div className="automation-ui visual-frame">
          <svg viewBox="0 0 600 360" preserveAspectRatio="none">
            <path d="M85 180 C170 180 145 75 245 75 S315 285 410 285 S445 180 520 180" />
            <path d="M85 180 C160 180 180 285 245 285" />
          </svg>
          <i className="auto-node a1">FORM</i><i className="auto-node a2">CHECK</i><i className="auto-node a3">CRM</i><i className="auto-node a4">NOTIFY</i><i className="auto-node a5">REPORT</i>
        </div>
      )}
      {mode === "system" && (
        <div className="system-ui visual-frame">
          <div className="system-module m1"><span>CORE</span><i /></div>
          <div className="system-module m2"><span>DATA</span><i /></div>
          <div className="system-module m3"><span>OPS</span><i /></div>
          <div className="system-module m4"><span>API</span><i /></div>
          <div className="system-center">H</div>
        </div>
      )}
      <div className="visual-scan" />
    </div>
  );
}

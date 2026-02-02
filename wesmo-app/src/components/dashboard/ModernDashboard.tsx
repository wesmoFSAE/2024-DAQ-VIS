import React from "react";
import {
  useTelemetryConnection,
  useMetric,
  useFaults,
  useStatuses,
  useHottestTemp,
} from "./TelemetryProvider.tsx";
import "./modern-dashboard.css";

/* ----------------- Small UI primitives ----------------- */

type StatusKind = "ok" | "warn" | "fault" | "neutral";

function statusFromMap(s?: string): StatusKind {
  if (!s) return "neutral";
  const k = s.toUpperCase();
  if (k.includes("FAULT") || k.includes("ERROR")) return "fault";
  if (k.includes("WARN")) return "warn";
  if (k.startsWith("OK")) return "ok";
  return "neutral";
}

const StatusDot: React.FC<{ kind: StatusKind }> = ({ kind }) => (
  <span className={`mds-status-dot mds-status-${kind}`} aria-hidden="true" />
);

type CardProps = {
  title: string;
  status?: StatusKind;
  children?: React.ReactNode;
  onClick?: () => void;
};

const Card: React.FC<CardProps> = ({
  title,
  status = "neutral",
  children,
  onClick,
}) => {
  const clickable = typeof onClick === "function";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <section
      className={`mds-card${clickable ? " mds-card-clickable" : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <header className="mds-card-header">
        <span className="mds-card-title">{title}</span>
        <StatusDot kind={status} />
      </header>
      <div className="mds-card-body">{children}</div>
    </section>
  );
};

type BigNumberProps = {
  value?: number;
  unit?: string;
  precision?: number;
};

const BigNumber: React.FC<BigNumberProps> = ({
  value,
  unit,
  precision = 0,
}) => {
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const formatted = hasValue ? value!.toFixed(precision) : "—";

  return (
    <div className="mds-bignum">
      <span className="mds-bignum-value">{formatted}</span>
      {unit ? <span className="mds-bignum-unit">{unit}</span> : null}
    </div>
  );
};

const ProgressBar: React.FC<{ value?: number; min?: number; max?: number }> = ({
  value,
  min = 0,
  max = 100,
}) => {
  if (!Number.isFinite(value ?? NaN) || max <= min) {
    return <div className="mds-progress mds-progress-empty" />;
  }
  const ratio = ((value! - min) / (max - min)) * 100;
  const clamped = Math.max(0, Math.min(100, ratio));

  return (
    <div className="mds-progress">
      <div className="mds-progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
};

const GaugeRing: React.FC<{
  value?: number;
  min?: number;
  max?: number;
  unit?: string;
}> = ({ value, min = 0, max = 140, unit = "°C" }) => {
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const safe = hasValue ? Math.min(Math.max(value!, min), max) : (min + max) / 2;
  const pct = ((safe - min) / (max - min)) * 100;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const warn = pct >= 75;

  return (
    <div className="mds-gauge" aria-label="Motor temperature">
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle className="mds-gauge-bg" cx="70" cy="70" r={radius} />
        <circle
          className={`mds-gauge-fg ${warn ? "mds-gauge-fg-warn" : ""}`}
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="mds-gauge-center">
        <div className="mds-gauge-value">
          {hasValue ? value!.toFixed(0) : "—"}
          <span className="mds-gauge-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
};

/* ----------------- Helpers ----------------- */

type HistoryPoint = { ts: number; value: number };

type ChartConfig = {
  title: string;
  unit?: string;
  series: HistoryPoint[];
};

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/* ----------------- History chart modal ----------------- */

const ChartModal: React.FC<{ config: ChartConfig | null; onClose: () => void }> =
  ({ config, onClose }) => {
    const scrollRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (config && scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    }, [config]);

    if (!config) return null;

    const { title, unit, series } = config;

    const data = series
      .filter((p) => Number.isFinite(p.value))
      .sort((a, b) => a.ts - b.ts);

    const hasData = data.length > 0;

    let path = "";
    let minVal = 0;
    let maxVal = 0;
    let latest: HistoryPoint | undefined;
    let width = 400;

    if (hasData) {
      const maxPoints = 800;
      const stepPick = Math.max(1, Math.floor(data.length / maxPoints));
      const sampled = data.filter((_, i) => i % stepPick === 0);

      const ys = sampled.map((p) => p.value);
      minVal = Math.min(...ys);
      maxVal = Math.max(...ys);
      latest = data[data.length - 1];

      if (minVal === maxVal) {
        const delta = Math.abs(minVal) || 1;
        minVal -= delta * 0.1;
        maxVal += delta * 0.1;
      }

      const left = 40;
      const right = 20;
      const stepX = 14;
      width = Math.max(420, left + right + stepX * Math.max(sampled.length - 1, 1));

      const toX = (_ts: number, idx: number) => left + idx * stepX;
      const toY = (v: number) => {
        const vNorm = (v - minVal) / (maxVal - minVal);
        const y = 80 - vNorm * 60;
        return y;
      };

      path = sampled
        .map((p, idx) => {
          const x = toX(p.ts, idx);
          const y = toY(p.value);
          return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
    }

    const handleBackdropClick = () => onClose();
    const handleDialogClick = (e: React.MouseEvent<HTMLDivElement>) =>
      e.stopPropagation();

    return (
      <div className="mds-chart-backdrop" onClick={handleBackdropClick}>
        <div
          className="mds-chart-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} history`}
          onClick={handleDialogClick}
        >
          <header className="mds-chart-header">
            <div>
              <div className="mds-chart-title">{title}</div>
              <div className="mds-chart-subtitle">
                {hasData ? "Recent history" : "No history for this metric yet."}
              </div>
            </div>
            <button
              type="button"
              className="mds-chart-close"
              onClick={onClose}
              aria-label="Close history"
            >
              ×
            </button>
          </header>

          <div className="mds-chart-body">
            {hasData ? (
              <>
                <div
                  className="mds-chart-scroll"
                  ref={scrollRef}
                  aria-label="Scroll horizontally to see more history"
                >
                  <svg
                    viewBox={`0 0 ${width} 100`}
                    className="mds-chart-svg"
                    aria-hidden="true"
                    style={{ minWidth: `${width}px` }}
                  >
                    <line
                      x1="40"
                      y1="80"
                      x2={width - 20}
                      y2="80"
                      className="mds-chart-axis"
                    />
                    <line
                      x1="40"
                      y1="20"
                      x2="40"
                      y2="80"
                      className="mds-chart-axis"
                    />
                    <rect
                      x="40"
                      y="20"
                      width={width - 60}
                      height="60"
                      className="mds-chart-band"
                    />
                    <path d={path} className="mds-chart-line" />
                  </svg>
                </div>

                <div className="mds-chart-meta">
                  <div>
                    <span className="mds-chart-label">Min</span>
                    <span className="mds-chart-value">
                      {minVal.toFixed(2)} {unit ?? ""}
                    </span>
                  </div>
                  <div>
                    <span className="mds-chart-label">Max</span>
                    <span className="mds-chart-value">
                      {maxVal.toFixed(2)} {unit ?? ""}
                    </span>
                  </div>
                  {latest && (
                    <div>
                      <span className="mds-chart-label">Latest</span>
                      <span className="mds-chart-value">
                        {latest.value.toFixed(2)} {unit ?? ""}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mds-chart-empty">
                No history yet for this metric.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

/* ----------------- Faults / warnings modal ----------------- */

type Fault = {
  name: string;
  status?: string;
  ts: number;
  [key: string]: unknown;
};

const FaultsModal: React.FC<{
  open: boolean;
  faults: Fault[];
  onClose: () => void;
}> = ({ open, faults, onClose }) => {
  if (!open) return null;

  const normStatus = (s?: string) => (s ? s.toUpperCase() : "");

  // Build "current state per fault name" (latest event for each name)
  const sorted = [...faults].sort((a, b) => a.ts - b.ts);
  const latestByName = new Map<string, Fault>();
  for (const ev of sorted) {
    latestByName.set(ev.name, ev);
  }
  const current = Array.from(latestByName.values());
  const active = current.filter((f) => f.status !== "RESOLVED");

  // Recent event history (newest first, cap at 80)
  const history = [...sorted].reverse().slice(0, 80);

  const pillClass = (status?: string) => {
    const k = statusFromMap(status);
    return `mds-fault-status-pill mds-fault-${k}`;
  };

  const handleBackdropClick = () => onClose();
  const handleDialogClick = (e: React.MouseEvent<HTMLDivElement>) =>
    e.stopPropagation();

  return (
    <div className="mds-chart-backdrop" onClick={handleBackdropClick}>
      <div
        className="mds-chart-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Fault and warning log"
        onClick={handleDialogClick}
      >
        <header className="mds-chart-header">
          <div>
            <div className="mds-chart-title">Fault &amp; Warning Log</div>
            <div className="mds-chart-subtitle">
              {active.length} active · {history.length} recent events
            </div>
          </div>
          <button
            type="button"
            className="mds-chart-close"
            onClick={onClose}
            aria-label="Close log"
          >
            ×
          </button>
        </header>

        <div className="mds-faults-body">
          <section className="mds-faults-section">
            <div className="mds-faults-section-title">
              Active ({active.length})
            </div>
            {active.length === 0 ? (
              <p className="mds-faults-empty">No active faults or warnings.</p>
            ) : (
              <ul className="mds-faults-list">
                {active
                  .slice()
                  .sort((a, b) => b.ts - a.ts)
                  .map((f, idx) => (
                    <li key={`a-${idx}`} className="mds-fault-item">
                      <div className="mds-fault-main">
                        <div className="mds-fault-name">{f.name}</div>
                        <div className="mds-fault-meta">
                          {f.status && (
                            <span className="mds-fault-status-label">
                              {normStatus(f.status)}
                            </span>
                          )}
                          <span className="mds-fault-time">
                            {fmtTime(f.ts)}
                          </span>
                        </div>
                      </div>
                      <span className={pillClass(String(f.status))}>
                        {normStatus(f.status) || "ACTIVE"}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className="mds-faults-section">
            <div className="mds-faults-section-title">
              Recent Events ({history.length})
            </div>
            {history.length === 0 ? (
              <p className="mds-faults-empty">No fault events yet.</p>
            ) : (
              <ul className="mds-faults-list">
                {history.map((f, idx) => (
                  <li key={`h-${idx}`} className="mds-fault-item">
                    <div className="mds-fault-main">
                      <div className="mds-fault-name">{f.name}</div>
                      <div className="mds-fault-meta">
                        {f.status && (
                          <span className="mds-fault-status-label">
                            {normStatus(f.status)}
                          </span>
                        )}
                        <span className="mds-fault-time">
                          {fmtTime(f.ts)}
                        </span>
                      </div>
                    </div>
                    <span className={pillClass(String(f.status))}>
                      {normStatus(f.status) || "EVENT"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

/* ----------------- Warnings summary card ----------------- */

const WarningsCard: React.FC<{
  faults: Fault[];
  onClick: () => void;
}> = ({ faults, onClick }) => {
  // Same "current state per name" logic as modal so numbers match
  const sorted = [...faults].sort((a, b) => a.ts - b.ts);
  const latestByName = new Map<string, Fault>();
  for (const ev of sorted) {
    latestByName.set(ev.name, ev);
  }
  const current = Array.from(latestByName.values());
  const active = current.filter((f) => f.status !== "RESOLVED");
  const latest =
    active.length === 0
      ? undefined
      : active.reduce((a, b) => (a.ts > b.ts ? a : b));

  let status: StatusKind = "ok";
  if (active.some((f) => statusFromMap(String(f.status)) === "fault")) {
    status = "fault";
  } else if (active.some((f) => statusFromMap(String(f.status)) === "warn")) {
    status = "warn";
  }

  return (
    <Card title="Warnings" status={status} onClick={onClick}>
      <div className="mds-warning">
        {active.length === 0 ? (
          <span className="mds-warning-ok">No active faults</span>
        ) : (
          <>
            <span className="mds-warning-bad">
              {active.length} active fault{active.length > 1 ? "s" : ""}
            </span>
            {latest && (
              <span className="mds-warning-latest">
                {latest.name} · {fmtTime(latest.ts)}
              </span>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

/* ----------------- System health strip ----------------- */

type HealthCategories = {
  battery: StatusKind;
  motor: StatusKind;
  brakes: StatusKind;
  comms: StatusKind;
};

type HealthResult = {
  overall: StatusKind;
  categories: HealthCategories;
};

const severityRank: Record<StatusKind, number> = {
  neutral: 0,
  ok: 1,
  warn: 2,
  fault: 3,
};

function pushSeverity(current: StatusKind, next: StatusKind): StatusKind {
  return severityRank[next] > severityRank[current] ? next : current;
}

function classifyName(label: string): (keyof HealthCategories)[] {
  const out: (keyof HealthCategories)[] = [];
  const u = label.toUpperCase();

  if (
    u.includes("BATTERY") ||
    u.includes("SOC") ||
    u.includes("STATE OF CHARGE") ||
    u.includes("VOLT")
  ) {
    out.push("battery");
  }

  if (
    u.includes("MOTOR") ||
    u.includes("INVERTER") ||
    u.includes("TORQUE") ||
    u.includes("VELOCITY") ||
    u.includes("SPEED")
  ) {
    out.push("motor");
  }

  if (
    u.includes("BRAKE") ||
    u.includes("BREAK") ||
    u.includes("PRESSURE") ||
    u.includes("PEDAL")
  ) {
    out.push("brakes");
  }

  if (
    u.includes("COMMS") ||
    u.includes("COMMUNICATION") ||
    u.includes("VCU") ||
    u.includes("NMT") ||
    u.includes("CAN ")
  ) {
    out.push("comms");
  }

  return out;
}

function deriveHealth(
  faults: Fault[],
  statuses: Record<string, string | undefined>
): HealthResult {
  const cats: HealthCategories = {
    battery: "ok",
    motor: "ok",
    brakes: "ok",
    comms: "ok",
  };

  // From fault events
  for (const f of faults) {
    const label = `${f.name ?? ""} ${String(f.status ?? "")}`.toUpperCase();
    let sev = statusFromMap(typeof f.status === "string" ? f.status : undefined);
    if (sev === "neutral") {
      if (label.includes("FAULT")) sev = "fault";
      else if (label.includes("WARN")) sev = "warn";
    }
    const groups = classifyName(label);
    for (const g of groups) {
      cats[g] = pushSeverity(cats[g], sev);
    }
  }

  // From status map
  for (const [key, val] of Object.entries(statuses ?? {})) {
    const label = `${key} ${val ?? ""}`.toUpperCase();
    let sev = statusFromMap(val);
    if (sev === "neutral") {
      if (label.includes("FAULT")) sev = "fault";
      else if (label.includes("WARN")) sev = "warn";
    }
    const groups = classifyName(label);
    for (const g of groups) {
      cats[g] = pushSeverity(cats[g], sev);
    }
  }

  const values = Object.values(cats);
  let overall: StatusKind = "ok";
  if (values.some((v) => v === "fault")) overall = "fault";
  else if (values.some((v) => v === "warn")) overall = "warn";
  else if (values.every((v) => v === "neutral")) overall = "neutral";
  else overall = "ok";

  return { overall, categories: cats };
}

const healthLabel: Record<StatusKind, string> = {
  ok: "OK",
  warn: "Watch",
  fault: "At risk",
  neutral: "Unknown",
};

type SystemHealthStripProps = {
  overall: StatusKind;
  categories: HealthCategories;
};

const SystemHealthStrip: React.FC<SystemHealthStripProps> = ({
  overall,
  categories,
}) => {
  const label = healthLabel[overall];
  const segments: { key: keyof HealthCategories; label: string }[] = [
    { key: "battery", label: "Battery" },
    { key: "motor", label: "Motor" },
    { key: "brakes", label: "Brakes" },
    { key: "comms", label: "Comms" },
  ];

  // Figure out which categories are problematic for tooltip
  const problemSegments = segments.filter((seg) => {
    const s = categories[seg.key];
    return s === "warn" || s === "fault";
  });

  let tooltip: string;
  if (overall === "fault" || overall === "warn") {
    if (problemSegments.length > 0) {
      const names = problemSegments.map((s) => s.label).join(", ");
      tooltip =
        overall === "fault"
          ? `At risk due to: ${names}`
          : `Watch these systems: ${names}`;
    } else {
      tooltip = label;
    }
  } else if (overall === "ok") {
    tooltip = "All monitored systems OK.";
  } else {
    tooltip =
      "System health unknown – no status or fault information is available yet.";
  }

  return (
    <section
      className="mds-health-strip"
      aria-label="System health overview"
      title={tooltip}
    >
      <div className={`mds-health-pill mds-health-pill-${overall}`}>
        <StatusDot kind={overall} />
        <span className="mds-health-pill-label">System health</span>
        <span className="mds-health-pill-state">{label}</span>
      </div>

      <div className="mds-health-cats">
        {segments.map((seg) => (
          <div className="mds-health-cat" key={seg.key}>
            <StatusDot kind={categories[seg.key]} />
            <span className="mds-health-cat-label">{seg.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ----------------- Main Dashboard ----------------- */

const ModernDashboard: React.FC = () => {
  const connected = useTelemetryConnection();
  const statuses = useStatuses();
  const faults = useFaults() as Fault[];

  // Theme
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("wesmo-theme");
    if (saved === "dark") {
      setIsDark(true);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("wesmo-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Metrics
  const trackTime = useMetric("Track Time");
  const soc = useMetric("SoC");
  const pSoC = useMetric("Predictive State of Charge");
  const batteryCurrent = useMetric("Battery Current");
  const batteryVoltage = useMetric("DC Voltage");

  const motorTempPrimary = useMetric("Motor Temp");
  const motorTempAlt = useMetric("Motor Temperature");
  const hottest = useHottestTemp();

  const motorSpeed = useMetric("Motor Speed");
  const wheelFR = useMetric("Wheel Speed FR");
  const wheelFL = useMetric("Wheel Speed FL");
  const wheelRR = useMetric("Wheel Speed RR");
  const wheelRL = useMetric("Wheel Speed RL");
  const brakeF = useMetric("Brake Pressure Front");
  const brakeR = useMetric("Brake Pressure Rear");
  const pedal1 = useMetric("Pedal Angle 1");
  const pedal2 = useMetric("Pedal Angle 2");

  const motorTempValue =
    Number.isFinite(hottest.val)
      ? hottest.val
      : Number.isFinite(motorTempPrimary.value)
      ? motorTempPrimary.value
      : Number.isFinite(motorTempAlt.value)
      ? motorTempAlt.value
      : undefined;

  const motorTempStatusKey =
    hottest.name ??
    (Number.isFinite(motorTempPrimary.value) ? "Motor Temp" : "Motor Temperature");

  // NEW: treat missing statuses as "ok" for tile dots
  const st = (key: string): StatusKind => {
    const raw = statuses[key];
    if (raw == null) {
      return "ok";
    }
    return statusFromMap(raw);
  };

  const [chartConfig, setChartConfig] = React.useState<ChartConfig | null>(
    null
  );
  const [faultsOpen, setFaultsOpen] = React.useState(false);

  const openChart = (
    title: string,
    unit: string | undefined,
    series: { ts: number; value: number }[] | undefined
  ) => {
    setChartConfig({
      title,
      unit,
      series: series ?? [],
    });
  };

  const health = React.useMemo(
    () => deriveHealth(faults, statuses),
    [faults, statuses]
  );

  return (
    <div className={`mds-root ${isDark ? "mds-root-dark" : ""}`}>
      <header className="mds-header">
        <div>
          <h1 className="mds-title">WESMO · Telemetry</h1>
          <p className="mds-subtitle">Live EV telemetry overview</p>
        </div>
        <div className="mds-header-right">
          <button
            type="button"
            className="mds-theme-toggle"
            onClick={() => setIsDark((d) => !d)}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="mds-theme-toggle-label">
              {isDark ? "Dark" : "Light"}
            </span>
            <span
              className={`mds-theme-toggle-knob ${
                isDark ? "mds-theme-toggle-knob-dark" : ""
              }`}
            />
          </button>
          <div
            className={`mds-conn ${
              connected ? "mds-conn-up" : "mds-conn-down"
            }`}
            aria-live="polite"
          >
            <span className="mds-conn-dot" />
            <span>{connected ? "Connected" : "Waiting for data"}</span>
          </div>
        </div>
      </header>

      <main className="mds-main">
        <section className="mds-grid">
          {/* Row 1 */}
          <Card
            title="Track Time"
            status={st("Track Time")}
            onClick={() =>
              openChart("Track Time", trackTime.unit ?? "s", trackTime.series as any)
            }
          >
            <BigNumber value={trackTime.value} unit={trackTime.unit ?? "s"} />
            <ProgressBar value={trackTime.value} min={0} max={600} />
          </Card>

          <Card
            title="Battery State of Charge"
            status={st("SoC")}
            onClick={() =>
              openChart(
                "Battery State of Charge",
                soc.unit ?? "%",
                soc.series as any
              )
            }
          >
            <BigNumber value={soc.value} unit={soc.unit ?? "%"} />
            <ProgressBar value={soc.value} min={0} max={100} />
          </Card>

          <Card
            title="Predictive State of Charge"
            status={st("Predictive State of Charge")}
            onClick={() =>
              openChart(
                "Predictive State of Charge",
                pSoC.unit ?? "Hours",
                pSoC.series as any
              )
            }
          >
            <BigNumber value={pSoC.value} unit={pSoC.unit ?? "Hours"} />
            <ProgressBar value={pSoC.value} min={0} max={3} />
          </Card>

          <Card
            title="Battery Current"
            status={st("Battery Current")}
            onClick={() =>
              openChart(
                "Battery Current",
                batteryCurrent.unit ?? "A",
                batteryCurrent.series as any
              )
            }
          >
            <BigNumber
              value={batteryCurrent.value}
              unit={batteryCurrent.unit ?? "A"}
              precision={1}
            />
          </Card>

          {/* Row 2 */}
          <Card
            title={
              hottest.name ? `${hottest.name} (Hottest)` : "Motor Temperature"
            }
            status={st(motorTempStatusKey)}
            onClick={() =>
              openChart(
                "Motor / Inverter Temperature",
                "°C",
                (motorTempPrimary.series as any) ?? []
              )
            }
          >
            <GaugeRing value={motorTempValue} />
          </Card>

          <WarningsCard
            faults={faults}
            onClick={() => setFaultsOpen(true)}
          />

          <Card
            title="Battery Voltage"
            status={st("DC Link Circuit Voltage")}
            onClick={() =>
              openChart(
                "Battery Voltage",
                batteryVoltage.unit ?? "V",
                batteryVoltage.series as any
              )
            }
          >
            <BigNumber
              value={batteryVoltage.value}
              unit={batteryVoltage.unit ?? "V"}
              precision={1}
            />
          </Card>

          {/* Row 3 – wheel speeds */}
          <Card
            title="Wheel Speed FL"
            status={st("Wheel Speed FL")}
            onClick={() =>
              openChart(
                "Wheel Speed FL",
                wheelFL.unit || "km/h",
                wheelFL.series as any
              )
            }
          >
            <BigNumber value={wheelFL.value} unit={wheelFL.unit || "km/h"} />
          </Card>

          <Card
            title="Wheel Speed FR"
            status={st("Wheel Speed FR")}
            onClick={() =>
              openChart(
                "Wheel Speed FR",
                wheelFR.unit || "km/h",
                wheelFR.series as any
              )
            }
          >
            <BigNumber value={wheelFR.value} unit={wheelFR.unit || "km/h"} />
          </Card>

          <Card
            title="Wheel Speed RL"
            status={st("Wheel Speed RL")}
            onClick={() =>
              openChart(
                "Wheel Speed RL",
                wheelRL.unit || "km/h",
                wheelRL.series as any
              )
            }
          >
            <BigNumber value={wheelRL.value} unit={wheelRL.unit || "km/h"} />
          </Card>

          <Card
            title="Wheel Speed RR"
            status={st("Wheel Speed RR")}
            onClick={() =>
              openChart(
                "Wheel Speed RR",
                wheelRR.unit || "km/h",
                wheelRR.series as any
              )
            }
          >
            <BigNumber value={wheelRR.value} unit={wheelRR.unit || "km/h"} />
          </Card>

          {/* Row 4 – dynamics & controls */}
          <Card
            title="Motor Speed"
            status={st("Motor Speed")}
            onClick={() =>
              openChart(
                "Motor Speed",
                motorSpeed.unit ?? "rpm",
                motorSpeed.series as any
              )
            }
          >
            <BigNumber
              value={motorSpeed.value}
              unit={motorSpeed.unit ?? "rpm"}
            />
            <ProgressBar value={motorSpeed.value} min={0} max={12000} />
          </Card>

          <Card
            title="Pedal Angle 1"
            status={st("Pedal Angle 1")}
            onClick={() =>
              openChart(
                "Pedal Angle 1",
                pedal1.unit ?? "%",
                pedal1.series as any
              )
            }
          >
            <BigNumber value={pedal1.value} unit={pedal1.unit ?? "%"} />
            <ProgressBar value={pedal1.value} min={0} max={100} />
          </Card>

          <Card
            title="Pedal Angle 2"
            status={st("Pedal Angle 2")}
            onClick={() =>
              openChart(
                "Pedal Angle 2",
                pedal2.unit ?? "%",
                pedal2.series as any
              )
            }
          >
            <BigNumber value={pedal2.value} unit={pedal2.unit ?? "%"} />
            <ProgressBar value={pedal2.value} min={0} max={100} />
          </Card>

          <Card
            title="Brake Pressure Front"
            status={st("Brake Pressure Front")}
            onClick={() =>
              openChart(
                "Brake Pressure Front",
                brakeF.unit ?? "bar",
                brakeF.series as any
              )
            }
          >
            <BigNumber value={brakeF.value} unit={brakeF.unit ?? "bar"} />
          </Card>

          <Card
            title="Brake Pressure Rear"
            status={st("Brake Pressure Rear")}
            onClick={() =>
              openChart(
                "Brake Pressure Rear",
                brakeR.unit ?? "bar",
                brakeR.series as any
              )
            }
          >
            <BigNumber value={brakeR.value} unit={brakeR.unit ?? "bar"} />
          </Card>
        </section>

        {/* System health strip */}
        <SystemHealthStrip
          overall={health.overall}
          categories={health.categories}
        />
      </main>

      <ChartModal config={chartConfig} onClose={() => setChartConfig(null)} />
      <FaultsModal
        open={faultsOpen}
        faults={faults}
        onClose={() => setFaultsOpen(false)}
      />
    </div>
  );
};

export default ModernDashboard;

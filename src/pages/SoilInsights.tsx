import { useState } from 'react';
import {
  Droplets, Thermometer, FlaskConical, Leaf, AlertTriangle, CheckCircle2,
  Info, RefreshCw, Zap, Battery, Signal
} from 'lucide-react';
import { useI18n } from '../i18n';
import { StatCard, StatusChip, timeAgo, formatMetricValue, humanizeMetric } from '../components/ui';
import type { SoilReadingResponse, SoilMetric } from '../components/types';
import { soilData } from '../data/demoData';

type InsightLevel = 'good' | 'warn' | 'info';
interface Insight {
  level: InsightLevel;
  metric: string;
  value: string;
  message: string;
  action?: string;
}

const OPTIMAL: Record<string, [number, number]> = {
  moisture:    [35, 60], temperature: [18, 30], ph:          [6.0, 7.0],
  nitrogen:    [40, 100], phosphorus:  [20, 80], potassium:   [30, 150],
  ec:          [0.8, 2.5], tension:    [10, 40]
};

function buildInsight(m: SoilMetric, t: (k: string) => string): Insight {
  const range = OPTIMAL[m.key];
  const v = m.value;
  const display = formatMetricValue(m.key, v ?? 0);
  const fallback: Insight = {
    level: 'info',
    metric: m.label,
    value: display,
    message: `${m.fromSensorName}.`
  };
  if (v == null || !range) return fallback;
  const [min, max] = range;
  if (v >= min && v <= max) {
    const why: Record<string, string> = {
      moisture: 'OK for sowing.',
      temperature: 'Warm enough for planting.',
      ph: 'Good balance for most crops.',
      nitrogen: 'Enough food for leafy crops.',
      phosphorus: 'Good for roots and fruits.',
      potassium: 'Strong stems and fruits.',
      ec: 'Healthy nutrient level.',
      tension: 'Enough water for plants.'
    };
    return { level: 'good', metric: m.label, value: display, message: why[m.key] ?? 'Reading is in the recommended range.' };
  }
  if (v < min) {
    const acts: Record<string, string> = {
      moisture: 'Irrigate (add water) before planting.',
      temperature: 'Wait 3–5 days until soil warms.',
      nitrogen: 'Add compost or manure.',
      phosphorus: 'Add bone meal.',
      potassium: 'Add wood ash.',
      ph: 'Add lime to raise pH.',
      ec: 'Add fertiliser.',
      tension: 'Soil is dry — irrigate.'
    };
    return { level: 'warn', metric: m.label, value: display, message: `Too low.`, action: acts[m.key] ?? 'Ask your extension officer.' };
  }
  const acts: Record<string, string> = {
    moisture: 'Do not irrigate for 1–2 days.',
    temperature: 'Plant early morning, then mulch.',
    ph: 'Add sulphur or pine leaves.',
    nitrogen: 'No more nitrogen this season.',
    phosphorus: 'Skip P this season.',
    potassium: 'No more K required.',
    ec: 'Leach with clean water.',
    tension: 'Soil is too wet — let it drain.'
  };
  return { level: 'warn', metric: m.label, value: display, message: `Too high.`, action: acts[m.key] };
}

const toneFor = (lvl: InsightLevel) => ({
  good: { bg: 'var(--color-leaf-50)', border: 'var(--color-leaf-200)', text: 'var(--color-leaf-800)', Icon: CheckCircle2 },
  warn: { bg: 'var(--color-sun-100)',  border: 'var(--color-sun-400)',  text: 'var(--color-sun-700)',  Icon: AlertTriangle },
  info: { bg: 'var(--color-sky-100)',  border: 'var(--color-sky-500)',  text: 'var(--color-sky-700)',  Icon: Info }
}[lvl]);

export default function SoilInsights() {
  const { t } = useI18n();
  const [soil, setSoil] = useState<SoilReadingResponse>(soilData);
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});

  const refresh = () => { fetch('/api/soil-readings/latest').then(r => r.json()).then(setSoil); };

  const syncSensor = async (id: string) => {
    setSyncingIds(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/sensors/${id}/sync`, { method: 'POST' });
      if (res.ok) refresh();
    } finally {
      setSyncingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const l = soil?.legacyCompat;
  const knownMetrics: SoilMetric[] = soil?.metrics ?? [];
  const insights = knownMetrics.filter(m => m.value != null).map(m => buildInsight(m, t));

  return (
    <>
      <section className="big-summary">
        <div className="big-tile">
          <div className="big-tile-icon" style={{ background: 'var(--color-sky-100)', color: 'var(--color-sky-700)' }}>
            <Droplets size={28} />
          </div>
          <div>
            <div className="big-tile-label">{t('soil_moisture')}</div>
            <div className="big-tile-value">{l?.moisture != null ? `${l.moisture}%` : '—'}</div>
          </div>
        </div>
        <div className="big-tile">
          <div className="big-tile-icon" style={{ background: 'var(--color-sun-100)', color: 'var(--color-sun-700)' }}>
            <Thermometer size={28} />
          </div>
          <div>
            <div className="big-tile-label">{t('soil_temp')}</div>
            <div className="big-tile-value">{l?.temperature != null ? `${l.temperature} °C` : '—'}</div>
          </div>
        </div>
        <div className="big-tile">
          <div className="big-tile-icon" style={{ background: 'var(--color-leaf-50)', color: 'var(--color-leaf-700)' }}>
            <FlaskConical size={28} />
          </div>
          <div>
            <div className="big-tile-label">{t('soil_ph')}</div>
            <div className="big-tile-value">{l?.ph != null ? l.ph.toFixed(1) : '—'}</div>
          </div>
        </div>
        <div className="big-tile">
          <div className="big-tile-icon" style={{ background: 'var(--color-leaf-50)', color: 'var(--color-leaf-700)' }}>
            <Leaf size={28} />
          </div>
          <div>
            <div className="big-tile-label">{t('soil_n')}</div>
            <div className="big-tile-value">{l?.nitrogen != null ? `${l.nitrogen}` : '—'}</div>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem' }}>
            {soil ? `${soil.sensorsConnected} / ${soil.sensorsTotal} ${t('ui_sensors')}` : ''}
          </h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-neutral-500)', marginTop: 4 }}>
            {t('footer_note')}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={refresh}><RefreshCw size={16} /> {t('ui_refresh')}</button>
      </div>

      <div className="sensors-grid">
        {(soil?.sensors ?? []).map(s => (
          <div key={s.id} className="sensor-tile">
            <div className="sensor-head">
              <div className="sensor-title">
                <div className="sensor-icon"><Zap size={22} /></div>
                <div>
                  <div className="sensor-name">{s.name}</div>
                  <div className="sensor-model">{s.model}</div>
                </div>
              </div>
              <StatusChip status={syncingIds[s.id] ? 'syncing' : s.status} />
            </div>
            <div className="kv">
              <div className="k"><Battery size={11} /> {t('ui_battery')}</div>
              <div className="v" style={{ color: s.batteryPercent < 15 ? 'var(--color-sun-700)' : undefined }}>{s.batteryPercent}%</div>
              <div className="k"><Signal size={11} /> {t('ui_signal')}</div>
              <div className="v">{s.signalStrength}%</div>
              <div className="k">{t('ui_zone')}</div>
              <div className="v">{s.zone}</div>
              <div className="k">{t('ui_updated')}</div>
              <div className="v">{s.lastSyncAt ? timeAgo(s.lastSyncAt) : '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-neutral-500)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                {t('ui_reads')}
              </div>
              <div className="sensor-metrics">
                {s.supportedMetricKeys.map(k => {
                  const v = s.values[k];
                  const hasValue = v != null;
                  return (
                    <span key={k} className={`sensor-metric-chip${hasValue ? '' : ' empty'}`}>
                      {humanizeMetric(k)} {hasValue ? formatMetricValue(k, v as number) : ''}
                    </span>
                  );
                })}
              </div>
            </div>
            <button
              className="btn btn-primary"
              disabled={syncingIds[s.id] || s.status === 'disconnected'}
              onClick={() => syncSensor(s.id)}
            >
              <RefreshCw size={16} /> {t('sensor_sync')}
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2 style={{ fontSize: '1.15rem' }}>{t('ui_interpretation')}</h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-neutral-500)', marginTop: 4 }}>
          {t('ui_legend')}
        </div>
      </div>

      <div className="grid cols-2">
        {insights.map((ins, i) => {
          const { bg, border, text, Icon } = toneFor(ins.level);
          return (
            <div key={i} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Icon size={20} style={{ color: text }} />
                <div style={{ fontWeight: 800, color: text, fontSize: '1rem' }}>{ins.metric}</div>
                <div style={{ marginLeft: 'auto', fontWeight: 800 }}>{ins.value}</div>
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--color-neutral-900)', fontWeight: 600 }}>
                {ins.message}
              </div>
              {ins.action && (
                <div style={{ marginTop: 10, fontSize: '0.95rem', fontWeight: 700, color: text }}>
                  → {ins.action}
                </div>
              )}
            </div>
          );
        })}
        {insights.length === 0 && <div className="empty">{t('ui_empty')}</div>}
      </div>
    </>
  );
}

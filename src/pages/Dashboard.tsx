import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets, Sprout, CalendarDays, History, Hand, Sun, Thermometer, Leaf, Activity, CloudRain,
  Lightbulb, AlertTriangle
} from 'lucide-react';
import { StatusChip, timeAgo } from '../components/ui';
import { useI18n } from '../i18n';
import type { SoilReadingResponse, ForecastResponse } from '../components/types';
import { soilData, weatherData } from '../data/demoData';

const CARDS = [
  { tag: 'card1_tag', title: 'card1_title', body: 'card1_body', to: '/soil',    icon: Droplets,    action: 'card1_action' },
  { tag: 'card2_tag', title: 'card2_title', body: 'card2_body', to: '/crops',   icon: Sprout,      action: 'card2_action' },
  { tag: 'card3_tag', title: 'card3_title', body: 'card3_body', to: '/plan',    icon: CalendarDays, action: 'card3_action' },
  { tag: 'card4_tag', title: 'card4_title', body: 'card4_body', to: '/records', icon: History,     action: 'card4_action' }
];

function formatDayRange(dates: string[]): string {
  if (dates.length === 0) return '';
  if (dates.length === 1) {
    return new Date(dates[0]).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }
  const first = new Date(dates[0]);
  const last = new Date(dates[dates.length - 1]);
  const sameMonth = first.getMonth() === last.getMonth();
  if (sameMonth) {
    return `${first.getDate()}–${last.getDate()} ${first.toLocaleDateString(undefined, { month: 'short' })}`;
  }
  return `${first.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${last.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
}

export default function Dashboard() {
  const { t, tf } = useI18n();
  const [soil] = useState<SoilReadingResponse>(soilData);
  const [weather] = useState<ForecastResponse>(weatherData);

  const l = soil?.legacyCompat;
  const totalRain = weather?.days?.reduce((s, d) => s + d.rainfall, 0) ?? 0;

  const rainyDays = (weather?.days ?? []).filter(d => d.rainfall >= 10).map(d => d.date);
  const anyHeavy = rainyDays.length > 0;
  const anyHot = (weather?.days ?? []).some(d => d.tempMax >= 32);

  let bannerKind: 'rain' | 'good' | 'hot' = 'good';
  let BannerIcon = Lightbulb;
  let bannerTitleKey = 'weather_good_title';
  let bannerBodyKey = 'weather_good_body';
  if (anyHeavy) {
    bannerKind = 'rain';
    BannerIcon = CloudRain;
    bannerTitleKey = 'weather_rain_title';
    bannerBodyKey = 'weather_rain_body';
  } else if (anyHot) {
    bannerKind = 'hot';
    BannerIcon = AlertTriangle;
    bannerTitleKey = 'weather_hot_title';
    bannerBodyKey = 'weather_hot_body';
  }

  const bannerDays = anyHeavy ? formatDayRange(rainyDays) : t('weather_5day');
  const bannerBody = tf(bannerBodyKey, { days: bannerDays });

  return (
    <>
      <div className="next-banner">
        <div className="banner-icon"><Hand size={22} /></div>
        <div className="grow">
          <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>{t('hero_step_next')}</div>
          <div style={{ marginTop: 2 }}>
            <strong>{t('card1_title')}</strong>
          </div>
        </div>
        <Link to="/soil" className="btn" style={{ background: 'var(--color-soil-900)', color: 'var(--color-white)', minHeight: 40 }}>
          {t('card1_action')}
        </Link>
      </div>

      <div className={`insight-banner ${bannerKind}`}>
        <div className="insight-icon">
          <BannerIcon size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="insight-title">{t('weather_insight_title')} · {t(bannerTitleKey)}</div>
          <div className="insight-body">{bannerBody}</div>
        </div>
      </div>

      <div className="big-summary">
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
          <div className="big-tile-icon" style={{ background: 'var(--color-sun-100)', color: 'var(--color-sun-700)' }}>
            <Sun size={28} />
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
            <div className="big-tile-label">{t('plan_title') === t('plan_title') ? t('plan_title') : t('plan_pill')}</div>
            <div className="big-tile-value">
              {soil ? `${soil.sensorsConnected}/${soil.sensorsTotal} ${t('ui_sensors')}` : '—'}
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem' }}>
        {t('hero_title')}
        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-neutral-500)', marginTop: 4 }}>
          {t('hero_lead')}
        </div>
      </h2>

      <div className="steps-grid">
        {CARDS.map(({ tag, title, body, to, icon: Icon, action }, idx) => (
          <Link
            key={to}
            to={to}
            className={`step-card${idx === 0 ? ' next-step' : ''}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="step-icon-card">
              <Icon size={28} />
            </div>
            <div className="step-tag-card">{t(tag)}</div>
            <h3 className="step-title">{t(title)}</h3>
            <div className="step-body">{t(body)}</div>
            <div className="btn btn-primary">
              {t(action)}
            </div>
          </Link>
        ))}
      </div>

      <div style={{
        marginTop: 'auto',
        background: 'var(--color-neutral-100)',
        border: '1px dashed var(--color-neutral-300)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: '0.9rem',
        color: 'var(--color-neutral-700)'
      }}>
        <Activity size={18} style={{ color: 'var(--color-leaf-700)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <strong>{t('footer_note')}</strong>
        </div>
        {soil && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusChip status={soil.overallStatus} />
            <span style={{ fontSize: '0.82rem', color: 'var(--color-neutral-500)' }}>
              {soil.capturedAt ? timeAgo(soil.capturedAt) : ''}
            </span>
          </div>
        )}
        {totalRain != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-sky-700)', fontWeight: 700 }}>
            <CloudRain size={16} />
            <span>{totalRain} mm</span>
          </div>
        )}
      </div>
    </>
  );
}

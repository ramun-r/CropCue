import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Plus, Info, Ban, Users, AlertTriangle, Sprout, Leaf, CircleDot,
  CloudRain, Lightbulb
} from 'lucide-react';
import { useI18n } from '../i18n';
import type { CropRecResponse, ForecastResponse } from '../components/types';
import { cropRecommendations, weatherData } from '../data/demoData';

function cropIconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/maize|corn/.test(n)) return Sprout;
  if (/butternut|squash|pumpkin/.test(n)) return CircleDot;
  if (/spinach|leaf|greens/.test(n)) return Leaf;
  if (/bean|legume/.test(n)) return Leaf;
  return Sprout;
}

function suitLabel(s: 'High' | 'Medium' | 'Low', t: (k: string) => string) {
  if (s === 'High')   return { text: t('crop_high'),   bg: 'var(--color-leaf-50)', fg: 'var(--color-leaf-800)', bd: 'var(--color-leaf-200)' };
  if (s === 'Medium') return { text: t('crop_medium'), bg: 'var(--color-sun-100)',  fg: 'var(--color-sun-700)', bd: 'var(--color-sun-400)' };
  return                    { text: t('crop_low'),    bg: '#fde7e7',                fg: '#a33',                bd: '#f4bfbf' };
}

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

export default function CropRecommendations() {
  const { t, tf } = useI18n();
  const [data] = useState<CropRecResponse>(cropRecommendations);
  const [weather] = useState<ForecastResponse>(weatherData);

  const rainyDays = (weather?.days ?? []).filter(d => d.rainfall >= 10).map(d => d.date);
  const anyHeavy = rainyDays.length > 0;
  const anyHot = (weather?.days ?? []).some(d => d.tempMax >= 32);

  let bannerKind: 'rain' | 'good' | 'hot' = 'good';
  let bannerIcon: LucideIcon = Lightbulb;
  let bannerTitleKey = 'weather_good_title';
  let bannerBodyKey = 'weather_good_body';
  if (anyHeavy) {
    bannerKind = 'rain';
    bannerIcon = CloudRain;
    bannerTitleKey = 'weather_rain_title';
    bannerBodyKey = 'weather_rain_body';
  } else if (anyHot) {
    bannerKind = 'hot';
    bannerIcon = AlertTriangle;
    bannerTitleKey = 'weather_hot_title';
    bannerBodyKey = 'weather_hot_body';
  }
  const bannerDays = anyHeavy ? formatDayRange(rainyDays) : t('weather_5day');
  const bannerBody = tf(bannerBodyKey, { days: bannerDays });
  const BannerIcon = bannerIcon;

  return (
    <>
      <div className={`insight-banner ${bannerKind}`}>
        <div className="insight-icon">
          <BannerIcon size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="insight-title">{t('weather_insight_title')} · {t(bannerTitleKey)}</div>
          <div className="insight-body">{bannerBody}</div>
        </div>
      </div>

      <div style={{
        background: 'var(--color-leaf-50)',
        border: '1px solid var(--color-leaf-200)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: 'var(--color-white)',
          border: '1px solid var(--color-leaf-200)',
          display: 'grid', placeItems: 'center'
        }}>
          <Sprout size={28} color="var(--color-leaf-700)" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem' }}>{t('card2_title')}</h3>
          <div style={{ fontSize: '0.95rem', color: 'var(--color-neutral-700)', marginTop: 2 }}>
            {data ? `${t('crops_intro_body')} ${data.basedOnMetricKeys.join(' · ')}.` : t('card2_body')}
          </div>
        </div>
      </div>

      <div className="grid cols-3">
        {(data?.recommendations ?? []).map((c) => {
          const s = suitLabel(c.suitability as any, t);
          const CropIco = cropIconFor(c.crop);
          return (
            <div key={c.crop} className="crop-tile">
              <div className="head">
                <div className="head" style={{ flex: 1 }}>
                  <div className="crop-icon">
                    <CropIco size={26} color="var(--color-leaf-700)" />
                  </div>
                  <div>
                    <h3>{c.crop}</h3>
                    <div className="win">
                      {t('crop_plant')}: <strong>{c.bestPlanting}</strong>
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  background: s.bg,
                  color: s.fg,
                  border: `1px solid ${s.bd}`,
                  whiteSpace: 'nowrap'
                }}>
                  {s.text}
                </div>
              </div>

              <div className="why">
                <Info size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                <strong>{t('crop_why')}:</strong> {c.why}
              </div>

              {c.caveats && (
                <div className="warn">
                  <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 6 }} />
                  <strong>{t('crop_caveat')}:</strong> {c.caveats}
                </div>
              )}

              <div className="grid cols-2" style={{ gap: 'var(--space-3)' }}>
                <div style={{
                  background: 'var(--color-leaf-50)',
                  border: '1px solid var(--color-leaf-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: '0.78rem', fontWeight: 800,
                    color: 'var(--color-leaf-700)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: 6
                  }}>
                    <Users size={12} /> {t('crop_friends')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.companions.map(x => (
                      <span key={x} className="sensor-metric-chip">{x}</span>
                    ))}
                  </div>
                </div>
                <div style={{
                  background: '#fde7e7',
                  border: '1px solid #f4bfbf',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: '0.78rem', fontWeight: 800,
                    color: '#a33',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: 6
                  }}>
                    <Ban size={12} /> {t('crop_not')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.avoidInRotation.map(x => (
                      <span key={x} style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: '#fff',
                        color: '#a33',
                        border: '1px solid #f4bfbf'
                      }}>{x}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button className="btn btn-primary">
                <Plus size={18} /> {t('crop_add')}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

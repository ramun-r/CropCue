import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2, Circle, Shovel, Sprout, Search, Lightbulb, CloudRain, AlertTriangle, Leaf, CircleDot
} from 'lucide-react';
import { useI18n } from '../i18n';
import type { PlantingPlanResponse, ForecastResponse } from '../components/types';
import { plantingPlan, weatherData } from '../data/demoData';

function cropIconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/maize|corn/.test(n)) return Sprout;
  if (/butternut|squash|pumpkin/.test(n)) return CircleDot;
  if (/spinach|leaf|greens/.test(n)) return Leaf;
  if (/bean|legume/.test(n)) return Leaf;
  return Sprout;
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

export default function PlantingPlan() {
  const { t, tf } = useI18n();
  const [data] = useState<PlantingPlanResponse>(plantingPlan);
  const [weather] = useState<ForecastResponse>(weatherData);
  const [done, setDone] = useState<Record<number, boolean>>({});

  const toggle = (i: number) => setDone(prev => ({ ...prev, [i]: !prev[i] }));

  const iconFor = (i: number) => {
    if (i === 0) return Shovel;
    if (i === 3) return Search;
    return Sprout;
  };

  const tagFor = (i: number) => {
    if (i === 0) return { label: t('plan_tag_prep'),  bg: 'var(--color-soil-100)', fg: 'var(--color-soil-700)', bd: 'var(--color-soil-300)' };
    if (i === 3) return { label: t('plan_tag_check'), bg: 'var(--color-sky-100)',  fg: 'var(--color-sky-700)',  bd: 'var(--color-sky-500)' };
    return            { label: t('plan_tag_plant'),bg: 'var(--color-leaf-50)', fg: 'var(--color-leaf-700)', bd: 'var(--color-leaf-200)' };
  };

  const total = data?.plan.length ?? 0;
  const doneCount = Object.values(done).filter(Boolean).length;

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
  const bannerBody = tf(bannerBodyKey, { days: bannerDays }) + ' ' + t('plan_weather_note');
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

      <div className="next-banner" style={{
        background: 'linear-gradient(135deg, var(--color-leaf-500), var(--color-leaf-700))',
        color: 'var(--color-white)'
      }}>
        <div className="banner-icon"><Shovel size={22} /></div>
        <div className="grow">
          <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
            {t('plan_follow_weeks')}
          </div>
          <div style={{ marginTop: 2, fontSize: '1.05rem' }}>
            {tf('plan_progress', { done: doneCount, total })}
          </div>
        </div>
      </div>

      <div className="simple-list">
        {(data?.plan ?? []).map((row, i) => {
          const Tag = tagFor(i);
          const Ic = iconFor(i);
          const isDone = !!done[i];
          const CropIco = row.crop ? cropIconFor(row.crop) : null;
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="simple-row"
              style={{
                border: `2px solid ${isDone ? 'var(--color-leaf-200)' : 'var(--color-neutral-100)'}`,
                background: isDone ? 'var(--color-leaf-50)' : 'var(--color-white)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isDone
                  ? <CheckCircle2 size={24} color="var(--color-leaf-600)" />
                  : <Circle size={24} color="var(--color-neutral-300)" />}
                <div>
                  <div className="s-week">{t('plan_week')}</div>
                  <div className="s-week" style={{ fontSize: '0.95rem', color: 'var(--color-leaf-900)' }}>
                    {row.week}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: Tag.bg, color: Tag.fg,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  border: `1px solid ${Tag.bd}`
                }}>
                  <Ic size={22} />
                </div>
                <div>
                  <div className="s-do">
                    {CropIco && (
                      <span style={{
                        width: 30, height: 30, borderRadius: 8,
                        display: 'inline-grid', placeItems: 'center',
                        background: 'var(--color-leaf-50)',
                        border: '1px solid var(--color-leaf-200)',
                        marginRight: 8,
                        verticalAlign: 'middle'
                      }}>
                        <CropIco size={18} color="var(--color-leaf-700)" />
                      </span>
                    )}
                    {row.action}
                  </div>
                  <div className="s-note">
                    <Lightbulb size={13} style={{ verticalAlign: '-1px', marginRight: 4 }} />
                    {row.note}
                  </div>
                </div>
              </div>

              <div>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  background: Tag.bg,
                  color: Tag.fg,
                  border: `1px solid ${Tag.bd}`
                }}>
                  {Tag.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

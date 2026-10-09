import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Plus, RotateCcw, History, Package, FileText, Sprout, Leaf, CircleDot } from 'lucide-react';
import { useI18n } from '../i18n';
import type { FarmRecordsResponse } from '../components/types';
import { farmRecords } from '../data/demoData';

function cropIconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/maize|corn/.test(n)) return Sprout;
  if (/butternut|squash|pumpkin/.test(n)) return CircleDot;
  if (/spinach|leaf|greens/.test(n)) return Leaf;
  if (/bean|legume/.test(n)) return Leaf;
  return Sprout;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FarmRecords() {
  const { t } = useI18n();
  const [data] = useState<FarmRecordsResponse>(farmRecords);

  const total = data?.history.reduce((s, r) => s + r.yieldKg, 0) ?? 0;
  const count = data?.history.length ?? 0;

  return (
    <>
      <div className="big-summary">
        <div className="big-tile">
          <div className="big-tile-icon" style={{ background: 'var(--color-soil-100)', color: 'var(--color-soil-700)' }}>
            <History size={28} />
          </div>
          <div>
            <div className="big-tile-label">{t('records_season')}</div>
            <div className="big-tile-value">{count}</div>
          </div>
        </div>
        <div className="big-tile">
          <div className="big-tile-icon" style={{ background: 'var(--color-leaf-50)', color: 'var(--color-leaf-700)' }}>
            <Package size={28} />
          </div>
          <div>
            <div className="big-tile-label">{t('records_yield_total')}</div>
            <div className="big-tile-value">{total.toLocaleString()} kg</div>
          </div>
        </div>
        <div className="big-tile" style={{ gridColumn: 'span 2' }}>
          <div className="big-tile-icon" style={{ background: 'var(--color-leaf-50)', color: 'var(--color-leaf-700)' }}>
            <RotateCcw size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="big-tile-label">{t('records_rotation')}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-soil-700)', marginTop: 4 }}>
              {data?.rotationSuggestion ?? '…'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.15rem' }}>{t('card4_title')}</h2>
        <button className="btn btn-primary"><Plus size={18} /> {t('records_add')}</button>
      </div>

      <div className="simple-list">
        {(data?.history ?? []).map((r, i) => {
          const CropIco = cropIconFor(r.crop);
          return (
            <div key={i} className="record-tile">
              <div>
                <div className="season">{r.season}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)', marginTop: 2 }}>
                  {t('records_season')}
                </div>
              </div>
              <div>
                <div className="crop-line">
                  <span style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--color-leaf-50)',
                    border: '1px solid var(--color-leaf-200)',
                    display: 'grid', placeItems: 'center'
                  }}>
                    <CropIco size={22} color="var(--color-leaf-700)" />
                  </span>
                  {r.crop}
                </div>
                <div className="date" style={{ marginTop: 4 }}>
                  {t('records_planted')}: {fmt(r.planted)}
                </div>
              </div>
              <div>
                <div className="date" style={{ textAlign: 'right' }}>{t('records_harvest')}</div>
                <div className="yield">{fmt(r.harvested)}</div>
              </div>
              <div>
                <div className="date" style={{ textAlign: 'right' }}>{t('records_yield')}</div>
                <div className="yield" style={{ textAlign: 'right', fontSize: '1.3rem' }}>
                  {r.yieldKg.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>kg</span>
                </div>
              </div>
              {r.notes && (
                <div className="notes">
                  <FileText size={14} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--color-neutral-500)' }} />
                  {r.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

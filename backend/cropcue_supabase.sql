-- =====================================================================
-- CropCue · Supabase (Postgres) schema + seed data
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run: drops and recreates the CropCue tables.
-- =====================================================================

drop view  if exists public.latest_sensor_readings cascade;
drop table if exists public.planting_plan_steps    cascade;
drop table if exists public.rotation_suggestions   cascade;
drop table if exists public.farm_records           cascade;
drop table if exists public.crops                  cascade;
drop table if exists public.weather_forecasts      cascade;
drop table if exists public.sensor_readings        cascade;
drop table if exists public.sensor_metrics         cascade;
drop table if exists public.metric_definitions     cascade;
drop table if exists public.sensors                cascade;
drop table if exists public.fields                 cascade;

-- ---------------------------------------------------------------------
-- Fields
-- ---------------------------------------------------------------------
create table public.fields (
  id          text primary key,                 -- e.g. 'field-01'
  name        text not null,
  location    text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Sensors (device registry + runtime state)
-- ---------------------------------------------------------------------
create table public.sensors (
  id               text primary key,            -- e.g. 'sensor-001'
  field_id         text not null references public.fields(id) on delete cascade,
  name             text not null,
  model            text not null,
  zone             text,
  lat              double precision,
  lng              double precision,
  installed_at     date,
  status           text not null default 'connected'
                   check (status in ('connected','disconnected','low_battery','syncing')),
  battery_percent  integer check (battery_percent between 0 and 100),
  signal_strength  integer check (signal_strength between 0 and 100),
  last_sync_at     timestamptz,
  firmware_version text,
  created_at       timestamptz not null default now()
);
create index sensors_field_idx on public.sensors(field_id);

-- ---------------------------------------------------------------------
-- Metric catalogue (what can be measured) + which sensor supports what
-- ---------------------------------------------------------------------
create table public.metric_definitions (
  key    text primary key,                      -- moisture, ph, nitrogen ...
  label  text not null,
  unit   text not null check (unit in ('%','°C','pH','ppm','mS/cm','kPa'))
);

create table public.sensor_metrics (
  sensor_id   text not null references public.sensors(id) on delete cascade,
  metric_key  text not null references public.metric_definitions(key),
  range_min   numeric not null,
  range_max   numeric not null,
  primary key (sensor_id, metric_key),
  check (range_max > range_min)
);

-- ---------------------------------------------------------------------
-- Readings (time series, one row per sensor + metric + timestamp)
-- ---------------------------------------------------------------------
create table public.sensor_readings (
  id           bigint generated always as identity primary key,
  sensor_id    text not null references public.sensors(id) on delete cascade,
  metric_key   text not null references public.metric_definitions(key),
  value        numeric,                          -- null = no reading
  captured_at  timestamptz not null default now(),
  foreign key (sensor_id, metric_key) references public.sensor_metrics(sensor_id, metric_key)
);
create index sensor_readings_lookup_idx
  on public.sensor_readings (sensor_id, metric_key, captured_at desc);

-- Latest value per sensor + metric (replaces READINGS_BY_SENSOR)
create view public.latest_sensor_readings
with (security_invoker = true) as
select distinct on (r.sensor_id, r.metric_key)
  r.sensor_id,
  s.name        as sensor_name,
  s.field_id,
  s.status,
  r.metric_key,
  d.label,
  d.unit,
  sm.range_min,
  sm.range_max,
  r.value,
  r.captured_at
from public.sensor_readings r
join public.sensors            s  on s.id = r.sensor_id
join public.metric_definitions d  on d.key = r.metric_key
join public.sensor_metrics     sm on sm.sensor_id = r.sensor_id and sm.metric_key = r.metric_key
order by r.sensor_id, r.metric_key, r.captured_at desc;

-- ---------------------------------------------------------------------
-- Weather forecast
-- ---------------------------------------------------------------------
create table public.weather_forecasts (
  id             bigint generated always as identity primary key,
  field_id       text not null references public.fields(id) on delete cascade,
  forecast_date  date not null,
  temp_max       numeric not null,
  temp_min       numeric not null,
  rainfall_mm    numeric not null default 0,
  condition      text not null,
  source         text default 'Open-Meteo',
  fetched_at     timestamptz not null default now(),
  unique (field_id, forecast_date)
);

-- ---------------------------------------------------------------------
-- Crop catalogue (drives recommendations)
-- ---------------------------------------------------------------------
create table public.crops (
  id                bigint generated always as identity primary key,
  name              text not null unique,
  best_planting     text,                        -- human-readable window
  companions        text[] not null default '{}',
  avoid_in_rotation text[] not null default '{}',
  min_moisture      numeric,                     -- rule inputs for the recommender
  min_nitrogen      numeric,
  min_potassium     numeric,
  notes             text
);

-- ---------------------------------------------------------------------
-- Farm history
-- ---------------------------------------------------------------------
create table public.farm_records (
  id         bigint generated always as identity primary key,
  field_id   text not null references public.fields(id) on delete cascade,
  season     text not null,
  crop       text not null,
  planted    date,
  harvested  date,
  yield_kg   numeric,
  notes      text,
  created_at timestamptz not null default now(),
  check (harvested is null or planted is null or harvested >= planted)
);
create index farm_records_field_idx on public.farm_records(field_id, planted desc);

create table public.rotation_suggestions (
  field_id    text primary key references public.fields(id) on delete cascade,
  suggestion  text not null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Planting plan
-- ---------------------------------------------------------------------
create table public.planting_plan_steps (
  id          bigint generated always as identity primary key,
  field_id    text not null references public.fields(id) on delete cascade,
  step_order  integer not null,
  week_label  text not null,
  action      text not null,
  crop        text,
  note        text,
  unique (field_id, step_order)
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- The Express server connects with the service role / direct Postgres
-- connection (bypasses RLS). These policies let signed-in users read
-- data directly via supabase-js. Tighten them once you add per-user
-- ownership (e.g. a user_id column on fields).
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'fields','sensors','metric_definitions','sensor_metrics','sensor_readings',
    'weather_forecasts','crops','farm_records','rotation_suggestions','planting_plan_steps'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "authenticated read" on public.%I for select to authenticated using (true)', t);
  end loop;
end $$;

-- =====================================================================
-- Seed data (mirrors the mock data in server/index.ts)
-- =====================================================================
insert into public.fields (id, name, location) values
  ('field-01', 'Field A', 'Limpopo, South Africa');

insert into public.metric_definitions (key, label, unit) values
  ('moisture',    'Volumetric Water Content', '%'),
  ('temperature', 'Soil Temperature',         '°C'),
  ('ec',          'Electrical Conductivity',  'mS/cm'),
  ('ph',          'Soil pH',                  'pH'),
  ('nitrogen',    'Available Nitrogen',       'ppm'),
  ('phosphorus',  'Available Phosphorus',     'ppm'),
  ('potassium',   'Available Potassium',      'ppm'),
  ('tension',     'Soil Water Tension',       'kPa');

insert into public.sensors
  (id, field_id, name, model, zone, lat, lng, installed_at, status, battery_percent, signal_strength, last_sync_at, firmware_version)
values
  ('sensor-001','field-01','Field A · Main Probe','Meter Group 5TE (Soil Moisture + EC + Temp)',
   'North Ridge', -23.9068, 29.4847, '2025-08-12','connected',  84, 72, now() - interval '37 minutes', '2.4.1'),
  ('sensor-002','field-01','Field A · NPK Pod','Atterotech NPK-100 (N + P + K + pH)',
   'Centre Bed',  -23.9070, 29.4851, '2026-02-04','connected',  61, 58, now() - interval '4 hours',    '1.9.0'),
  ('sensor-003','field-01','Field A · Tensiometer','Irrometer LT (Soil Water Tension)',
   'South Low',   -23.9073, 29.4842, '2025-11-19','low_battery',12, 41, now() - interval '22 hours',   '1.3.7');

insert into public.sensor_metrics (sensor_id, metric_key, range_min, range_max) values
  ('sensor-001','moisture',    0,  60),
  ('sensor-001','temperature',-10, 60),
  ('sensor-001','ec',          0,  10),
  ('sensor-002','ph',          3,  10),
  ('sensor-002','nitrogen',    0, 200),
  ('sensor-002','phosphorus',  0, 200),
  ('sensor-002','potassium',   0, 300),
  ('sensor-003','tension',     0, 100);

insert into public.sensor_readings (sensor_id, metric_key, value, captured_at) values
  ('sensor-001','moisture',    42,   now() - interval '37 minutes'),
  ('sensor-001','temperature', 24.6, now() - interval '37 minutes'),
  ('sensor-001','ec',          1.12, now() - interval '37 minutes'),
  ('sensor-002','ph',          6.4,  now() - interval '4 hours'),
  ('sensor-002','nitrogen',    38,   now() - interval '4 hours'),
  ('sensor-002','phosphorus',  22,   now() - interval '4 hours'),
  ('sensor-002','potassium',   31,   now() - interval '4 hours'),
  ('sensor-003','tension',     28,   now() - interval '22 hours');

insert into public.weather_forecasts (field_id, forecast_date, temp_max, temp_min, rainfall_mm, condition) values
  ('field-01','2026-10-09',28,16, 0,'Sunny'),
  ('field-01','2026-10-10',27,17, 2,'Partly Cloudy'),
  ('field-01','2026-10-11',25,15,12,'Showers'),
  ('field-01','2026-10-12',24,14,18,'Rainy'),
  ('field-01','2026-10-13',26,15, 3,'Cloudy');

insert into public.crops (name, best_planting, companions, avoid_in_rotation, min_moisture, min_nitrogen, min_potassium, notes) values
  ('Maize (White Corn)','15 Oct – 5 Nov (after rains settle)', '{Pumpkin,Beans}',     '{Sorghum}', 35, 40, null,
   'Seeds wash out easily in heavy rain; delay sowing ~2 days after heavy showers.'),
  ('Butternut Squash',  '20 Oct – 10 Nov',                     '{Corn,Radish}',       '{Melons}',  null, null, 25,
   'Dislikes cold, wet seedbeds. Plant on raised mounds for drainage.'),
  ('Spinach',           '14 Oct – 25 Oct',                     '{Strawberry,Onion}',  '{Beetroot}', null, 40, null,
   'Tolerates light rain; side-dress nitrogen at 4 weeks if N is low.');

insert into public.farm_records (field_id, season, crop, planted, harvested, yield_kg, notes) values
  ('field-01','2025/26','Maize',   '2025-11-02','2026-04-18',2480,'Late rain reduced final yield'),
  ('field-01','2025/26','Spinach', '2025-09-10','2025-12-04', 620,'Good rotation with previous beans'),
  ('field-01','2024/25','Beans',   '2024-10-22','2025-02-11', 540,'Companion with pumpkin worked well');

insert into public.rotation_suggestions (field_id, suggestion) values
  ('field-01','Consider legumes (beans / cowpeas) next to restore nitrogen — especially after this season''s maize.');

insert into public.planting_plan_steps (field_id, step_order, week_label, action, crop, note) values
  ('field-01',1,'19–25 Oct',     'Apply compost / manure to Field A',            null,        'Apply compost ahead of the 11–12 Oct rains so moisture releases nutrients. Target 40 ppm available N baseline.'),
  ('field-01',2,'26 Oct – 1 Nov','Plant Maize (row spacing 75 cm)',              'Maize',     'Plant 2 days after the heavy rains end so seeds don''t wash out. Row spacing 75 cm.'),
  ('field-01',3,'2–8 Nov',       'Plant Butternut between maize rows',           'Butternut', 'Butternut hates cold wet mounds — delay until the soil has warmed back up. Plant between maize rows for ground cover.'),
  ('field-01',4,'9–15 Nov',      'Moisture check via sensor-001 + top-dress',    null,        'Check sensor-001 moisture is trending below 65% before top-dressing N. If < 30% for 48h, irrigate lightly.');

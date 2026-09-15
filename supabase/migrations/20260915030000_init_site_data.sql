-- ============================================================================
-- TREND CARGO — Supabase Migration (بکند واقعی)
-- اجرای خودکار با: supabase db push
-- (یا دستی در: Supabase Dashboard → SQL Editor → Run)
-- ============================================================================

-- جدول ذخیره داده‌های سایت (کلید/مقدار) — سازگار با کلیدهای localStorage پروژه
create table if not exists public.site_data (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists site_data_updated_at_idx on public.site_data (updated_at);

-- تریگر بروزرسانی خودکار timestamp
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists site_data_touch on public.site_data;
create trigger site_data_touch
  before insert or update on public.site_data
  for each row execute function public.touch_updated_at();

-- Row Level Security: هیچ پالیسی عمومی تعریف نمی‌شود.
-- یعنی فقط کلید service_role (که فقط در تابع Serverless Vercel استفاده می‌شود)
-- به جدول دسترسی دارد و کلید anon/public هیچ دسترسی‌ای ندارد.
alter table public.site_data enable row level security;

-- داده‌های اولیه (اختیاری — می‌توانید حذف کنید)
insert into public.site_data (key, value) values
  ('products', '[]'::jsonb),
  ('invoices', '[]'::jsonb)
on conflict (key) do nothing;

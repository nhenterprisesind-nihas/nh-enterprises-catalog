-- The order API omits created_at and relies on the database default.
-- The database stores timestamp-without-time-zone values as Asia/Kolkata wall time.

CREATE OR REPLACE FUNCTION public.report_sales(
  p_from date,
  p_to date,
  p_group text
)
RETURNS json
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH bounds AS (
    SELECT
      p_from::timestamp AS from_local,
      (p_to + 1)::timestamp AS to_local,
      (p_from - (p_to - p_from + 1))::timestamp AS previous_from_local
  ),
  periods AS (
    SELECT 'current'::text AS period
    UNION ALL
    SELECT 'previous'::text
  ),
  scoped_orders AS (
    SELECT
      o.order_no,
      o.grand_total::numeric AS grand_total,
      COALESCE(o.shipping, 0)::numeric AS shipping,
      CASE
        WHEN lower(btrim(COALESCE(o.status, ''))) IN ('closed', 'complete') THEN 'Complete'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'placed' THEN 'Placed'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'accepted' THEN 'Accepted'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'dispatched' THEN 'Dispatched'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'cancelled' THEN 'Cancelled'
        ELSE btrim(COALESCE(o.status, ''))
      END AS normalized_status,
      o.created_at,
      o.created_at::date AS local_day,
      CASE
        WHEN o.created_at >= b.from_local THEN 'current'
        ELSE 'previous'
      END AS period
    FROM public.orders AS o
    CROSS JOIN bounds AS b
    WHERE o.created_at >= b.previous_from_local
      AND o.created_at < b.to_local
  ),
  order_totals AS (
    SELECT
      p.period,
      (COUNT(s.order_no) FILTER (
        WHERE s.normalized_status <> 'Cancelled'
      ))::bigint AS orders,
      COALESCE(SUM(s.grand_total) FILTER (
        WHERE s.normalized_status <> 'Cancelled'
      ), 0)::numeric AS revenue,
      COALESCE(SUM(s.grand_total) FILTER (
        WHERE s.normalized_status = 'Complete'
      ), 0)::numeric AS complete_revenue,
      (COUNT(s.order_no) FILTER (
        WHERE s.normalized_status = 'Cancelled'
      ))::bigint AS cancelled_orders,
      COALESCE(SUM(s.grand_total) FILTER (
        WHERE s.normalized_status = 'Cancelled'
      ), 0)::numeric AS cancelled_value,
      COALESCE(SUM(s.shipping) FILTER (
        WHERE s.normalized_status <> 'Cancelled'
      ), 0)::numeric AS shipping_total
    FROM periods AS p
    LEFT JOIN scoped_orders AS s ON s.period = p.period
    GROUP BY p.period
  ),
  item_totals AS (
    SELECT
      s.period,
      COALESCE(SUM(oi.quantity), 0)::bigint AS items_sold
    FROM scoped_orders AS s
    JOIN public.order_items AS oi ON oi.order_no = s.order_no
    WHERE s.normalized_status <> 'Cancelled'
    GROUP BY s.period
  ),
  totals AS (
    SELECT
      ot.period,
      ot.orders,
      ot.revenue,
      ot.complete_revenue,
      CASE
        WHEN ot.orders = 0 THEN 0::numeric
        ELSE ROUND(ot.revenue / ot.orders, 2)
      END AS aov,
      COALESCE(it.items_sold, 0)::bigint AS items_sold,
      ot.cancelled_orders,
      ot.cancelled_value,
      ot.shipping_total
    FROM order_totals AS ot
    LEFT JOIN item_totals AS it ON it.period = ot.period
  ),
  bucket_bounds AS (
    SELECT
      CASE p_group
        WHEN 'day' THEN p_from
        WHEN 'week' THEN date_trunc('week', p_from::timestamp)::date
        ELSE date_trunc('month', p_from::timestamp)::date
      END AS first_bucket,
      CASE p_group
        WHEN 'day' THEN p_to
        WHEN 'week' THEN date_trunc('week', p_to::timestamp)::date
        ELSE date_trunc('month', p_to::timestamp)::date
      END AS last_bucket,
      CASE p_group
        WHEN 'day' THEN interval '1 day'
        WHEN 'week' THEN interval '1 week'
        ELSE interval '1 month'
      END AS bucket_step
  ),
  buckets AS (
    SELECT generated.bucket::date AS bucket
    FROM bucket_bounds AS bb
    CROSS JOIN LATERAL generate_series(
      bb.first_bucket::timestamp,
      bb.last_bucket::timestamp,
      bb.bucket_step
    ) AS generated(bucket)
  ),
  series_totals AS (
    SELECT
      CASE p_group
        WHEN 'day' THEN s.local_day
        WHEN 'week' THEN date_trunc('week', s.local_day::timestamp)::date
        ELSE date_trunc('month', s.local_day::timestamp)::date
      END AS bucket,
      COUNT(*)::bigint AS orders,
      COALESCE(SUM(s.grand_total), 0)::numeric AS revenue
    FROM scoped_orders AS s
    WHERE s.period = 'current'
      AND s.normalized_status <> 'Cancelled'
    GROUP BY 1
  )
  SELECT json_build_object(
    'totals', (
      SELECT json_build_object(
        'orders', t.orders,
        'revenue', t.revenue,
        'complete_revenue', t.complete_revenue,
        'aov', t.aov,
        'items_sold', t.items_sold,
        'cancelled_orders', t.cancelled_orders,
        'cancelled_value', t.cancelled_value,
        'shipping_total', t.shipping_total
      )
      FROM totals AS t
      WHERE t.period = 'current'
    ),
    'previous_totals', (
      SELECT json_build_object(
        'orders', t.orders,
        'revenue', t.revenue,
        'complete_revenue', t.complete_revenue,
        'aov', t.aov,
        'items_sold', t.items_sold,
        'cancelled_orders', t.cancelled_orders,
        'cancelled_value', t.cancelled_value,
        'shipping_total', t.shipping_total
      )
      FROM totals AS t
      WHERE t.period = 'previous'
    ),
    'series', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'period', to_char(b.bucket, 'YYYY-MM-DD'),
            'orders', COALESCE(st.orders, 0),
            'revenue', COALESCE(st.revenue, 0)
          )
          ORDER BY b.bucket
        )
        FROM buckets AS b
        LEFT JOIN series_totals AS st ON st.bucket = b.bucket
      ),
      '[]'::json
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.report_products(
  p_from date,
  p_to date,
  p_limit integer
)
RETURNS TABLE(
  product_name text,
  product_id text,
  quantity bigint,
  revenue numeric,
  order_count bigint
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    COALESCE(MAX(NULLIF(btrim(oi.product_name), '')), 'Unknown product') AS product_name,
    oi.product_id::text AS product_id,
    COALESCE(SUM(oi.quantity), 0)::bigint AS quantity,
    COALESCE(SUM(oi.amount), 0)::numeric AS revenue,
    COUNT(DISTINCT o.order_no)::bigint AS order_count
  FROM public.orders AS o
  JOIN public.order_items AS oi ON oi.order_no = o.order_no
  WHERE o.created_at >=
      p_from::timestamp
    AND o.created_at <
      (p_to + 1)::timestamp
    AND CASE
      WHEN lower(btrim(COALESCE(o.status, ''))) IN ('closed', 'complete') THEN 'Complete'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'placed' THEN 'Placed'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'accepted' THEN 'Accepted'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'dispatched' THEN 'Dispatched'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'cancelled' THEN 'Cancelled'
      ELSE btrim(COALESCE(o.status, ''))
    END <> 'Cancelled'
  GROUP BY
    oi.product_id,
    CASE
      WHEN oi.product_id IS NULL
        THEN COALESCE(NULLIF(btrim(oi.product_name), ''), 'Unknown product')
    END
  ORDER BY revenue DESC, quantity DESC, product_name
  LIMIT GREATEST(0, LEAST(COALESCE(p_limit, 20), 10000))
$$;

CREATE OR REPLACE FUNCTION public.report_categories(
  p_from date,
  p_to date
)
RETURNS TABLE(
  category text,
  quantity bigint,
  revenue numeric
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    COALESCE(NULLIF(btrim(oi.category), ''), 'Uncategorised') AS category,
    COALESCE(SUM(oi.quantity), 0)::bigint AS quantity,
    COALESCE(SUM(oi.amount), 0)::numeric AS revenue
  FROM public.orders AS o
  JOIN public.order_items AS oi ON oi.order_no = o.order_no
  WHERE o.created_at >=
      p_from::timestamp
    AND o.created_at <
      (p_to + 1)::timestamp
    AND CASE
      WHEN lower(btrim(COALESCE(o.status, ''))) IN ('closed', 'complete') THEN 'Complete'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'placed' THEN 'Placed'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'accepted' THEN 'Accepted'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'dispatched' THEN 'Dispatched'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'cancelled' THEN 'Cancelled'
      ELSE btrim(COALESCE(o.status, ''))
    END <> 'Cancelled'
  GROUP BY COALESCE(NULLIF(btrim(oi.category), ''), 'Uncategorised')
  ORDER BY revenue DESC, quantity DESC, category
$$;

-- Stale-order thresholds, in hours: Placed 24; Accepted 48; Dispatched 168.
CREATE OR REPLACE FUNCTION public.report_operations(
  p_from date,
  p_to date
)
RETURNS json
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH thresholds AS (
    SELECT
      24::numeric AS placed_hours,
      48::numeric AS accepted_hours,
      168::numeric AS dispatched_hours
  ),
  bounds AS (
    SELECT
      p_from::timestamp AS from_local,
      (p_to + 1)::timestamp AS to_local,
      now() AT TIME ZONE 'Asia/Kolkata' AS local_now
  ),
  scoped_orders AS (
    SELECT
      CASE
        WHEN lower(btrim(COALESCE(o.status, ''))) IN ('closed', 'complete') THEN 'Complete'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'placed' THEN 'Placed'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'accepted' THEN 'Accepted'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'dispatched' THEN 'Dispatched'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'cancelled' THEN 'Cancelled'
        ELSE btrim(COALESCE(o.status, ''))
      END AS normalized_status
    FROM public.orders AS o
    CROSS JOIN bounds AS b
    WHERE o.created_at >= b.from_local
      AND o.created_at < b.to_local
  ),
  status_metrics AS (
    SELECT
      COUNT(*)::bigint AS total_orders,
      (COUNT(*) FILTER (WHERE normalized_status = 'Cancelled'))::bigint
        AS cancelled_orders,
      json_build_object(
        'Placed', COUNT(*) FILTER (WHERE normalized_status = 'Placed'),
        'Accepted', COUNT(*) FILTER (WHERE normalized_status = 'Accepted'),
        'Dispatched', COUNT(*) FILTER (WHERE normalized_status = 'Dispatched'),
        'Complete', COUNT(*) FILTER (WHERE normalized_status = 'Complete'),
        'Cancelled', COUNT(*) FILTER (WHERE normalized_status = 'Cancelled')
      ) AS status_counts
    FROM scoped_orders
  ),
  stale_orders AS (
    SELECT
      o.order_no,
      o.customer_name,
      CASE
        WHEN lower(btrim(COALESCE(o.status, ''))) IN ('closed', 'complete') THEN 'Complete'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'placed' THEN 'Placed'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'accepted' THEN 'Accepted'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'dispatched' THEN 'Dispatched'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'cancelled' THEN 'Cancelled'
        ELSE btrim(COALESCE(o.status, ''))
      END AS normalized_status,
      ROUND(
        EXTRACT(EPOCH FROM (b.local_now - o.created_at)) / 3600.0,
        1
      )::numeric AS age_hours,
      o.grand_total::numeric AS grand_total
    FROM public.orders AS o
    CROSS JOIN bounds AS b
    CROSS JOIN thresholds AS t
    WHERE (
        lower(btrim(COALESCE(o.status, ''))) = 'placed'
        AND o.created_at < b.local_now - interval '1 hour' * t.placed_hours::double precision
      ) OR (
        lower(btrim(COALESCE(o.status, ''))) = 'accepted'
        AND o.created_at < b.local_now - interval '1 hour' * t.accepted_hours::double precision
      ) OR (
        lower(btrim(COALESCE(o.status, ''))) = 'dispatched'
        AND o.created_at < b.local_now - interval '1 hour' * t.dispatched_hours::double precision
      )
  )
  SELECT json_build_object(
    'status_counts', sm.status_counts,
    'cancellation_rate', CASE
      WHEN sm.total_orders = 0 THEN 0::numeric
      ELSE ROUND(sm.cancelled_orders::numeric * 100 / sm.total_orders, 2)
    END,
    'stale_orders', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'order_no', so.order_no,
            'customer_name', so.customer_name,
            'status', so.normalized_status,
            'age_hours', so.age_hours,
            'grand_total', so.grand_total
          )
          ORDER BY so.age_hours DESC
        )
        FROM stale_orders AS so
      ),
      '[]'::json
    )
  )
  FROM status_metrics AS sm
$$;

CREATE OR REPLACE FUNCTION public.report_customers(
  p_from date,
  p_to date
)
RETURNS json
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH bounds AS (
    SELECT
      p_from::timestamp AS from_local,
      (p_to + 1)::timestamp AS to_local
  ),
  range_orders AS (
    SELECT
      o.order_no,
      o.grand_total::numeric AS grand_total,
      COALESCE(NULLIF(btrim(o.pincode::text), ''), 'Unknown') AS pincode,
      right(regexp_replace(COALESCE(o.phone, ''), '[^0-9]', '', 'g'), 10)
        AS phone_key,
      o.created_at::date AS local_day
    FROM public.orders AS o
    CROSS JOIN bounds AS b
    WHERE o.created_at >= b.from_local
      AND o.created_at < b.to_local
      AND CASE
        WHEN lower(btrim(COALESCE(o.status, ''))) IN ('closed', 'complete') THEN 'Complete'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'placed' THEN 'Placed'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'accepted' THEN 'Accepted'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'dispatched' THEN 'Dispatched'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'cancelled' THEN 'Cancelled'
        ELSE btrim(COALESCE(o.status, ''))
      END <> 'Cancelled'
  ),
  prior_customers AS (
    SELECT DISTINCT
      right(regexp_replace(COALESCE(o.phone, ''), '[^0-9]', '', 'g'), 10)
        AS phone_key
    FROM public.orders AS o
    CROSS JOIN bounds AS b
    WHERE o.created_at < b.from_local
      AND CASE
        WHEN lower(btrim(COALESCE(o.status, ''))) IN ('closed', 'complete') THEN 'Complete'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'placed' THEN 'Placed'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'accepted' THEN 'Accepted'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'dispatched' THEN 'Dispatched'
        WHEN lower(btrim(COALESCE(o.status, ''))) = 'cancelled' THEN 'Cancelled'
        ELSE btrim(COALESCE(o.status, ''))
      END <> 'Cancelled'
      AND right(regexp_replace(COALESCE(o.phone, ''), '[^0-9]', '', 'g'), 10) <> ''
  ),
  customer_spend AS (
    SELECT
      ro.phone_key,
      COUNT(*)::bigint AS order_count,
      SUM(ro.grand_total)::numeric AS spend,
      MAX(ro.local_day) AS last_order_date,
      (pc.phone_key IS NOT NULL) AS had_prior_order
    FROM range_orders AS ro
    LEFT JOIN prior_customers AS pc ON pc.phone_key = ro.phone_key
    WHERE ro.phone_key <> ''
    GROUP BY ro.phone_key, pc.phone_key
  ),
  customer_counts AS (
    SELECT
      (COUNT(*) FILTER (
        WHERE had_prior_order OR order_count > 1
      ))::bigint AS repeat_customers,
      (COUNT(*) FILTER (
        WHERE NOT had_prior_order AND order_count = 1
      ))::bigint AS new_customers,
      COUNT(*)::bigint AS total_customers
    FROM customer_spend
  ),
  top_customers AS (
    SELECT json_agg(
      json_build_object(
        'phone', repeat('*', GREATEST(length(cs.phone_key) - 4, 0))
          || right(cs.phone_key, 4),
        'order_count', cs.order_count,
        'spend', cs.spend,
        'last_order_date', cs.last_order_date
      )
      ORDER BY cs.spend DESC, cs.order_count DESC, cs.phone_key
    ) AS customers
    FROM (
      SELECT *
      FROM customer_spend
      ORDER BY spend DESC, order_count DESC, phone_key
      LIMIT 20
    ) AS cs
  ),
  top_pincodes AS (
    SELECT json_agg(
      json_build_object(
        'pincode', p.pincode,
        'orders', p.orders,
        'revenue', p.revenue
      )
      ORDER BY p.orders DESC, p.revenue DESC, p.pincode
    ) AS pincodes
    FROM (
      SELECT
        ro.pincode,
        COUNT(DISTINCT ro.order_no)::bigint AS orders,
        SUM(ro.grand_total)::numeric AS revenue
      FROM range_orders AS ro
      GROUP BY ro.pincode
      ORDER BY orders DESC, revenue DESC, ro.pincode
      LIMIT 20
    ) AS p
  )
  SELECT json_build_object(
    'new_customers', cc.new_customers,
    'repeat_customers', cc.repeat_customers,
    'total_customers', cc.total_customers,
    'repeat_rate', CASE
      WHEN cc.total_customers = 0 THEN 0::numeric
      ELSE ROUND(cc.repeat_customers::numeric * 100 / cc.total_customers, 2)
    END,
    'customers', COALESCE(tc.customers, '[]'::json),
    'pincodes', COALESCE(tp.pincodes, '[]'::json)
  )
  FROM customer_counts AS cc
  CROSS JOIN top_customers AS tc
  CROSS JOIN top_pincodes AS tp
$$;

-- Used only by the admin CSV endpoint when the admin opts into unmasked numbers.
CREATE OR REPLACE FUNCTION public.report_customers_full_phones(
  p_from date,
  p_to date
)
RETURNS TABLE(
  phone text,
  order_count bigint,
  spend numeric,
  last_order_date date
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    MAX(regexp_replace(COALESCE(o.phone, ''), '[^0-9]', '', 'g')) AS phone,
    COUNT(*)::bigint AS order_count,
    SUM(o.grand_total)::numeric AS spend,
    MAX(o.created_at::date) AS last_order_date
  FROM public.orders AS o
  WHERE o.created_at >=
      p_from::timestamp
    AND o.created_at <
      (p_to + 1)::timestamp
    AND CASE
      WHEN lower(btrim(COALESCE(o.status, ''))) IN ('closed', 'complete') THEN 'Complete'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'placed' THEN 'Placed'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'accepted' THEN 'Accepted'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'dispatched' THEN 'Dispatched'
      WHEN lower(btrim(COALESCE(o.status, ''))) = 'cancelled' THEN 'Cancelled'
      ELSE btrim(COALESCE(o.status, ''))
    END <> 'Cancelled'
    AND right(regexp_replace(COALESCE(o.phone, ''), '[^0-9]', '', 'g'), 10) <> ''
  GROUP BY right(regexp_replace(COALESCE(o.phone, ''), '[^0-9]', '', 'g'), 10)
  ORDER BY spend DESC, order_count DESC, phone
  LIMIT 20
$$;

REVOKE ALL ON FUNCTION public.report_sales(date, date, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.report_products(date, date, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.report_categories(date, date)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.report_operations(date, date)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.report_customers(date, date)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.report_customers_full_phones(date, date)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.report_sales(date, date, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.report_products(date, date, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.report_categories(date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.report_operations(date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.report_customers(date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.report_customers_full_phones(date, date) TO service_role;

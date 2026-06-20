-- ============================================================
-- Finanças — Schema do banco de dados (Neon / PostgreSQL)
-- Rodar uma vez para criar as tabelas
-- ============================================================

CREATE TABLE IF NOT EXISTS routes (
  id             SERIAL         PRIMARY KEY,
  day            DATE           NOT NULL,
  name           VARCHAR(255)   NOT NULL,
  km_initial     NUMERIC(10,2)  NOT NULL,
  km_final       NUMERIC(10,2)  NOT NULL,

  -- Calculado automaticamente pelo banco
  km_route       NUMERIC(10,2)  GENERATED ALWAYS AS (km_final - km_initial) STORED,

  route_value    NUMERIC(10,2)  NOT NULL,
  has_backup     BOOLEAN        NOT NULL DEFAULT FALSE,
  backup_value   NUMERIC(10,2)  NOT NULL DEFAULT 0,

  gnv_cost       NUMERIC(10,2)  NOT NULL DEFAULT 0,
  gasoline_cost  NUMERIC(10,2)  NOT NULL DEFAULT 0,

  -- Fórmula: (route_value + backup_value) * 0,875 - gnv_cost - gasoline_cost
  -- backup_value é 0 quando has_backup = false
  final_value    NUMERIC(10,2)  GENERATED ALWAYS AS (
    ROUND(((route_value + backup_value) * 0.875 - gnv_cost - gasoline_cost)::numeric, 2)
  ) STORED,

  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Índice para busca por dia e mês (queries mais frequentes)
CREATE INDEX IF NOT EXISTS idx_routes_day   ON routes (day);
CREATE INDEX IF NOT EXISTS idx_routes_month ON routes ((TO_CHAR(day, 'YYYY-MM')));

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS routes_set_updated_at ON routes;
CREATE TRIGGER routes_set_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

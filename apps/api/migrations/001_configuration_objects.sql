-- FLYX Platform - Konfigürasyon Nesneleri
-- Tum entity, document, register, form, report, workflow tanimlari bu tabloda saklanir.
-- 1C:Enterprise'daki Configuration DB'sine karsilik gelir.
-- Her tenant kendi konfigurasyonunu bu tabloda tutar.

CREATE TABLE IF NOT EXISTS configuration_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Nesne tipi: entity, document, register, form, report, workflow, enum, constant, scheduled_job, integration
  object_type VARCHAR(50) NOT NULL,

  -- Teknik ad (PascalCase): Customer, SalesOrder, StockBalance
  name VARCHAR(200) NOT NULL,

  -- Modul adi: sales, inventory, finance, hr, crm
  module VARCHAR(100),

  -- FSL kaynak kodu (tum tanimlama burda)
  fsl_code TEXT NOT NULL,

  -- Derlenmiş AST (JSON) - her seferinde derlememek icin cache
  compiled_ast JSONB,

  -- Metadata (ek bilgiler - alan sayisi, bagimliliklari vs.)
  metadata JSONB DEFAULT '{}',

  -- Versiyon (her degisiklikte artar)
  version INTEGER DEFAULT 1,

  -- Durum
  is_active BOOLEAN DEFAULT true,

  -- Nesne kilidi (baskasi ayni anda duzenleyemesin)
  locked_by UUID,
  locked_at TIMESTAMP,

  -- Multi-tenant
  tenant_id UUID NOT NULL,

  -- Audit
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMP,

  -- Benzersizlik: ayni tenant'ta ayni tipte ayni isim olamaz
  UNIQUE(tenant_id, object_type, name)
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_config_objects_tenant ON configuration_objects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_objects_type ON configuration_objects(object_type);
CREATE INDEX IF NOT EXISTS idx_config_objects_module ON configuration_objects(module);
CREATE INDEX IF NOT EXISTS idx_config_objects_name ON configuration_objects(name);
CREATE INDEX IF NOT EXISTS idx_config_objects_active ON configuration_objects(is_active);

-- Nesne gecmisi (her degisiklik kaydedilir - versiyon kontrolu)
CREATE TABLE IF NOT EXISTS configuration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES configuration_objects(id),
  version INTEGER NOT NULL,
  fsl_code TEXT NOT NULL,
  compiled_ast JSONB,
  change_description VARCHAR(500),
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_config_history_object ON configuration_history(object_id);

-- Nesne bagimliliklari (hangi nesne hangisine bagli)
CREATE TABLE IF NOT EXISTS configuration_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_object_id UUID NOT NULL REFERENCES configuration_objects(id),
  target_object_name VARCHAR(200) NOT NULL,
  dependency_type VARCHAR(50) NOT NULL, -- 'relation', 'lines_entity', 'form_entity', 'workflow_trigger'
  tenant_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_config_deps_source ON configuration_dependencies(source_object_id);
CREATE INDEX IF NOT EXISTS idx_config_deps_target ON configuration_dependencies(target_object_name);

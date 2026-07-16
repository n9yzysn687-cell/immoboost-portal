PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'BE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= balance),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('etsy', 'lemon', 'manual')),
  order_reference_hash TEXT NOT NULL,
  purchaser_email_hash TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  boost_grant INTEGER NOT NULL CHECK (boost_grant > 0),
  grants_access INTEGER NOT NULL DEFAULT 1 CHECK (grants_access IN (0, 1)),
  duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'active', 'refunded', 'revoked')),
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  activated_at TEXT,
  revoked_at TEXT,
  UNIQUE (source, order_reference_hash)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pilot_invites (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  license_id TEXT NOT NULL UNIQUE REFERENCES licenses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'claimed', 'revoked')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  claimed_at TEXT,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS wallet_operations (
  operation_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  cost INTEGER NOT NULL CHECK (cost > 0),
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'settled', 'released')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('grant', 'reserve', 'debit', 'release', 'refund')),
  amount INTEGER NOT NULL,
  operation_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commerce_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  created_at TEXT NOT NULL,
  processed_at TEXT,
  PRIMARY KEY (provider, event_id)
);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_licenses_account_status ON licenses(account_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_pilot_invites_expiry ON pilot_invites(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_wallet_operations_account ON wallet_operations(account_id, status);
CREATE INDEX IF NOT EXISTS idx_ledger_account_created ON ledger_entries(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_expiry ON rate_limit_buckets(expires_at);

CREATE TRIGGER IF NOT EXISTS accounts_create_wallet
AFTER INSERT ON accounts
BEGIN
  INSERT INTO wallets(account_id, balance, reserved, updated_at)
  VALUES (NEW.id, 0, 0, NEW.created_at);
END;

CREATE TRIGGER IF NOT EXISTS wallet_operation_require_funds
BEFORE INSERT ON wallet_operations
WHEN NOT EXISTS (SELECT 1 FROM wallet_operations WHERE operation_id = NEW.operation_id)
  AND NOT EXISTS (
    SELECT 1 FROM wallets
    WHERE account_id = NEW.account_id AND balance - reserved >= NEW.cost
  )
BEGIN
  SELECT RAISE(ABORT, 'INSUFFICIENT_BOOSTS');
END;

CREATE TRIGGER IF NOT EXISTS wallet_operation_reserved
AFTER INSERT ON wallet_operations
BEGIN
  UPDATE wallets
  SET reserved = reserved + NEW.cost, updated_at = NEW.created_at
  WHERE account_id = NEW.account_id;

  INSERT INTO ledger_entries(id, account_id, idempotency_key, type, amount, operation_id, created_at)
  VALUES ('reserve:' || NEW.operation_id, NEW.account_id, 'reserve:' || NEW.operation_id, 'reserve', NEW.cost, NEW.operation_id, NEW.created_at);
END;

CREATE TRIGGER IF NOT EXISTS wallet_operation_settled
AFTER UPDATE OF status ON wallet_operations
WHEN OLD.status = 'reserved' AND NEW.status = 'settled'
BEGIN
  UPDATE wallets
  SET balance = balance - NEW.cost, reserved = reserved - NEW.cost, updated_at = NEW.updated_at
  WHERE account_id = NEW.account_id;

  INSERT INTO ledger_entries(id, account_id, idempotency_key, type, amount, operation_id, created_at)
  VALUES ('debit:' || NEW.operation_id, NEW.account_id, 'debit:' || NEW.operation_id, 'debit', -NEW.cost, NEW.operation_id, NEW.updated_at);
END;

CREATE TRIGGER IF NOT EXISTS wallet_operation_released
AFTER UPDATE OF status ON wallet_operations
WHEN OLD.status = 'reserved' AND NEW.status = 'released'
BEGIN
  UPDATE wallets
  SET reserved = reserved - NEW.cost, updated_at = NEW.updated_at
  WHERE account_id = NEW.account_id;

  INSERT INTO ledger_entries(id, account_id, idempotency_key, type, amount, operation_id, created_at)
  VALUES ('release:' || NEW.operation_id, NEW.account_id, 'release:' || NEW.operation_id, 'release', NEW.cost, NEW.operation_id, NEW.updated_at);
END;

CREATE TRIGGER IF NOT EXISTS license_grant_boosts
AFTER UPDATE OF status ON licenses
WHEN OLD.status = 'issued' AND NEW.status = 'active'
BEGIN
  UPDATE wallets
  SET balance = balance + NEW.boost_grant, updated_at = NEW.activated_at
  WHERE account_id = NEW.account_id;

  INSERT INTO ledger_entries(id, account_id, idempotency_key, type, amount, operation_id, created_at)
  VALUES ('grant:' || NEW.id, NEW.account_id, 'grant:' || NEW.id, 'grant', NEW.boost_grant, NULL, NEW.activated_at);
END;

CREATE TRIGGER IF NOT EXISTS license_refund_remaining_boosts
AFTER UPDATE OF status ON licenses
WHEN OLD.status = 'active' AND NEW.status IN ('refunded', 'revoked')
BEGIN
  INSERT INTO ledger_entries(id, account_id, idempotency_key, type, amount, operation_id, created_at)
  SELECT
    'refund:' || NEW.id,
    OLD.account_id,
    'refund:' || NEW.id,
    'refund',
    -MIN(balance - reserved, OLD.boost_grant),
    NULL,
    NEW.revoked_at
  FROM wallets
  WHERE account_id = OLD.account_id;

  UPDATE wallets
  SET balance = MAX(reserved, balance - OLD.boost_grant), updated_at = NEW.revoked_at
  WHERE account_id = OLD.account_id;
END;

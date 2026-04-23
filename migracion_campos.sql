-- ============================================================
-- TiendaAero — Migración: +10 campos por tabla
-- Ejecutar sobre la BD existente (no recrea datos):
--   mysql -u root -p tiendaaero < migracion_campos.sql
-- ============================================================

USE tiendaaero;

-- ------------------------------------------------------------
-- CATEGORIAS (+10 campos)
-- ------------------------------------------------------------
ALTER TABLE categorias
    ADD COLUMN imagen_url          VARCHAR(500)   AFTER descripcion,
    ADD COLUMN activa              TINYINT(1)     NOT NULL DEFAULT 1       AFTER imagen_url,
    ADD COLUMN orden               INT            NOT NULL DEFAULT 0       AFTER activa,
    ADD COLUMN color_hex           VARCHAR(7)              DEFAULT '#2563eb' AFTER orden,
    ADD COLUMN icono               VARCHAR(50)             DEFAULT 'tag'   AFTER color_hex,
    ADD COLUMN slug                VARCHAR(100)            AFTER icono,
    ADD COLUMN meta_descripcion    VARCHAR(300)            AFTER slug,
    ADD COLUMN destacada           TINYINT(1)     NOT NULL DEFAULT 0       AFTER meta_descripcion,
    ADD COLUMN fecha_creacion      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER destacada,
    ADD COLUMN comision_porcentaje DECIMAL(5,2)   NOT NULL DEFAULT 0.00   AFTER fecha_creacion,
    ADD UNIQUE KEY uq_categorias_slug (slug);

-- Rellenar slugs para filas existentes (evita error de UNIQUE si es NULL)
UPDATE categorias SET slug = LOWER(REPLACE(nombre, ' ', '-')) WHERE slug IS NULL;

-- ------------------------------------------------------------
-- PRODUCTOS (+10 campos)
-- ------------------------------------------------------------
ALTER TABLE productos
    ADD COLUMN peso             DECIMAL(8,3)   AFTER imagen_url,
    ADD COLUMN dimensiones      VARCHAR(50)    AFTER peso,
    ADD COLUMN codigo_ean       VARCHAR(30)    AFTER dimensiones,
    ADD COLUMN precio_oferta    DECIMAL(10,2)  AFTER codigo_ean,
    ADD COLUMN destacado        TINYINT(1)     NOT NULL DEFAULT 0    AFTER precio_oferta,
    ADD COLUMN num_ventas       INT            NOT NULL DEFAULT 0    AFTER destacado,
    ADD COLUMN valoracion_media DECIMAL(3,2)   NOT NULL DEFAULT 0.00 AFTER num_ventas,
    ADD COLUMN garantia_meses   INT            NOT NULL DEFAULT 12   AFTER valoracion_media,
    ADD COLUMN fecha_creacion   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER garantia_meses,
    ADD COLUMN activo           TINYINT(1)     NOT NULL DEFAULT 1    AFTER fecha_creacion,
    ADD UNIQUE KEY uq_productos_ean (codigo_ean);

-- ------------------------------------------------------------
-- CLIENTES (+10 campos)
-- ------------------------------------------------------------
ALTER TABLE clientes
    ADD COLUMN ciudad         VARCHAR(100)   AFTER direccion,
    ADD COLUMN codigo_postal  VARCHAR(10)    AFTER ciudad,
    ADD COLUMN pais           VARCHAR(50)    NOT NULL DEFAULT 'España' AFTER codigo_postal,
    ADD COLUMN fecha_nacimiento DATE         AFTER pais,
    ADD COLUMN newsletter     TINYINT(1)     NOT NULL DEFAULT 0  AFTER fecha_nacimiento,
    ADD COLUMN vip            TINYINT(1)     NOT NULL DEFAULT 0  AFTER newsletter,
    ADD COLUMN notas          TEXT           AFTER vip,
    ADD COLUMN ultima_compra  DATE           AFTER notas,
    ADD COLUMN total_gastado  DECIMAL(10,2)  NOT NULL DEFAULT 0.00 AFTER ultima_compra,
    ADD COLUMN num_pedidos    INT            NOT NULL DEFAULT 0  AFTER total_gastado;

-- ------------------------------------------------------------
-- PEDIDOS (+10 campos)
-- ------------------------------------------------------------
ALTER TABLE pedidos
    ADD COLUMN direccion_envio     VARCHAR(300)  AFTER total,
    ADD COLUMN metodo_pago         ENUM('tarjeta','transferencia','efectivo','paypal')
                                   NOT NULL DEFAULT 'tarjeta'   AFTER direccion_envio,
    ADD COLUMN numero_seguimiento  VARCHAR(100)  AFTER metodo_pago,
    ADD COLUMN notas               TEXT          AFTER numero_seguimiento,
    ADD COLUMN descuento           DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER notas,
    ADD COLUMN fecha_envio         DATE          AFTER descuento,
    ADD COLUMN fecha_entrega       DATE          AFTER fecha_envio,
    ADD COLUMN transportista       VARCHAR(100)  AFTER fecha_entrega,
    ADD COLUMN facturado           TINYINT(1)    NOT NULL DEFAULT 0 AFTER transportista,
    ADD COLUMN referencia_externa  VARCHAR(50)   AFTER facturado;

-- ------------------------------------------------------------
-- DETALLE_PEDIDOS (+10 campos)
-- ------------------------------------------------------------
ALTER TABLE detalle_pedidos
    ADD COLUMN descuento          DECIMAL(10,2) NOT NULL DEFAULT 0.00  AFTER precio_unitario,
    ADD COLUMN subtotal           DECIMAL(10,2) NOT NULL DEFAULT 0.00  AFTER descuento,
    ADD COLUMN iva_porcentaje     DECIMAL(5,2)  NOT NULL DEFAULT 21.00 AFTER subtotal,
    ADD COLUMN notas              VARCHAR(200)  AFTER iva_porcentaje,
    ADD COLUMN devuelto           TINYINT(1)    NOT NULL DEFAULT 0     AFTER notas,
    ADD COLUMN fecha_devolucion   DATE          AFTER devuelto,
    ADD COLUMN motivo_devolucion  VARCHAR(200)  AFTER fecha_devolucion,
    ADD COLUMN precio_coste       DECIMAL(10,2) AFTER motivo_devolucion,
    ADD COLUMN margen             DECIMAL(10,2) AFTER precio_coste,
    ADD COLUMN numero_serie       VARCHAR(50)   AFTER margen;

-- ------------------------------------------------------------
-- USUARIOS (+10 campos)
-- ------------------------------------------------------------
ALTER TABLE usuarios
    ADD COLUMN email             VARCHAR(150)  AFTER contrasena_hash,
    ADD COLUMN nombre_completo   VARCHAR(200)  AFTER email,
    ADD COLUMN rol               ENUM('admin','empleado') NOT NULL DEFAULT 'empleado' AFTER nombre_completo,
    ADD COLUMN activo            TINYINT(1)    NOT NULL DEFAULT 1  AFTER rol,
    ADD COLUMN ultimo_acceso     DATETIME      AFTER activo,
    ADD COLUMN fecha_creacion    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER ultimo_acceso,
    ADD COLUMN intentos_fallidos INT           NOT NULL DEFAULT 0  AFTER fecha_creacion,
    ADD COLUMN bloqueado         TINYINT(1)    NOT NULL DEFAULT 0  AFTER intentos_fallidos,
    ADD COLUMN avatar_url        VARCHAR(500)  AFTER bloqueado,
    ADD COLUMN notas             TEXT          AFTER avatar_url,
    ADD UNIQUE KEY uq_usuarios_email (email);

-- ------------------------------------------------------------
-- SOCIOS (+10 campos)
-- ------------------------------------------------------------
ALTER TABLE socios
    ADD COLUMN direccion            VARCHAR(300)  AFTER telefono,
    ADD COLUMN ciudad               VARCHAR(100)  AFTER direccion,
    ADD COLUMN fecha_nacimiento     DATE          AFTER ciudad,
    ADD COLUMN nivel                ENUM('bronce','plata','oro','platino')
                                    NOT NULL DEFAULT 'bronce' AFTER fecha_nacimiento,
    ADD COLUMN puntos               INT           NOT NULL DEFAULT 0    AFTER nivel,
    ADD COLUMN descuento_porcentaje DECIMAL(5,2)  NOT NULL DEFAULT 0.00 AFTER puntos,
    ADD COLUMN notas                TEXT          AFTER descuento_porcentaje,
    ADD COLUMN dni                  VARCHAR(15)   AFTER notas,
    ADD COLUMN newsletter           TINYINT(1)    NOT NULL DEFAULT 1    AFTER dni,
    ADD COLUMN referido_por         INT           AFTER newsletter,
    ADD CONSTRAINT fk_socios_referido
        FOREIGN KEY (referido_por) REFERENCES socios (id)
        ON UPDATE CASCADE ON DELETE SET NULL;

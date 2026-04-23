-- ============================================================
-- TiendaAero — Script completo de base de datos
-- Ejecutar en MySQL Workbench o desde la línea de comandos:
--   mysql -u root -p < database.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Base de datos
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS tiendaaero
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tiendaaero;

-- ------------------------------------------------------------
-- 2. Tablas
-- ------------------------------------------------------------

CREATE TABLE categorias (
    id          INT            NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(100)   NOT NULL,
    descripcion TEXT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE productos (
    id           INT            NOT NULL AUTO_INCREMENT,
    nombre       VARCHAR(200)   NOT NULL,
    descripcion  TEXT,
    precio       DECIMAL(10,2)  NOT NULL,
    stock        INT            NOT NULL DEFAULT 0,
    stock_minimo INT            NOT NULL DEFAULT 1,
    categoria_id INT            NOT NULL,
    marca        VARCHAR(100),
    imagen_url   VARCHAR(500),
    PRIMARY KEY (id),
    KEY idx_productos_categoria (categoria_id),
    CONSTRAINT fk_productos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE clientes (
    id              INT          NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    telefono        VARCHAR(20),
    direccion       VARCHAR(300),
    fecha_registro  DATE         NOT NULL DEFAULT (CURRENT_DATE),
    PRIMARY KEY (id),
    UNIQUE KEY uq_clientes_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE pedidos (
    id         INT            NOT NULL AUTO_INCREMENT,
    cliente_id INT            NOT NULL,
    fecha      DATE           NOT NULL DEFAULT (CURRENT_DATE),
    estado     ENUM('pendiente','enviado','entregado') NOT NULL DEFAULT 'pendiente',
    total      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id),
    KEY idx_pedidos_cliente (cliente_id),
    CONSTRAINT fk_pedidos_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE detalle_pedidos (
    id              INT           NOT NULL AUTO_INCREMENT,
    pedido_id       INT           NOT NULL,
    producto_id     INT           NOT NULL,
    cantidad        INT           NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_detalle_pedido   (pedido_id),
    KEY idx_detalle_producto (producto_id),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (pedido_id)   REFERENCES pedidos   (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (producto_id) REFERENCES productos (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE usuarios (
    id               INT          NOT NULL AUTO_INCREMENT,
    nombre_usuario   VARCHAR(50)  NOT NULL,
    contrasena_hash  VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_nombre (nombre_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- 3. Datos de ejemplo
-- ------------------------------------------------------------

INSERT INTO categorias (nombre, descripcion) VALUES
    ('Aviones',      'Aviones de ala fija para radiocontrol'),
    ('Helicopteros', 'Helicopteros RC de distintas escalas'),
    ('Drones',       'Multirrotores FPV y fotografia aerea'),
    ('Radiocontrol', 'Emisoras, receptores y servos'),
    ('Accesorios',   'Baterias, cargadores, helices y herramientas');

-- IDs resultantes: Aviones=1, Helicopteros=2, Drones=3, Radiocontrol=4, Accesorios=5

INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria_id, marca, imagen_url) VALUES
    ('Avion Edge 540 ARF',        'Avion acrobatico 1.2 m envergadura, listo para montar',           189.99,  8,  2, 1, 'Pilot-RC',    'https://placehold.co/400x300?text=Edge+540'),
    ('Cessna 182 RTF',            'Avion entrenador ideal para principiantes, con bateria y cargador', 129.50,  5,  3, 1, 'FMS',         'https://placehold.co/400x300?text=Cessna+182'),
    ('Sukhoi SU-27 EDF',          'Reactor de foam con motor EDF 70 mm, 1.1 m de envergadura',        249.00,  3,  2, 1, 'Freewing',    'https://placehold.co/400x300?text=SU-27'),
    ('Helicoptero Align T-REX 450','Heli de colectivo variable, escala 450, para piloto avanzado',    315.00,  2,  2, 2, 'Align',       'https://placehold.co/400x300?text=T-REX+450'),
    ('Helicoptero Blade 230 S',   'Heli sport 230 mm estabilizado con AS3X y SAFE',                   175.00,  4,  2, 2, 'Blade',       'https://placehold.co/400x300?text=Blade+230S'),
    ('DJI Mini 4 Pro',            'Drone plegable 4K con obstaculizacion omnidireccional',             759.00,  6,  2, 3, 'DJI',         'https://placehold.co/400x300?text=Mini+4+Pro'),
    ('iFlight Nazgul Evoque F5',  'Frame FPV freestyle 5 pulgadas, fibra de carbono',                  89.99, 10,  3, 3, 'iFlight',     'https://placehold.co/400x300?text=Nazgul+F5'),
    ('Emisora Radiomaster TX16S', 'Emisora 16 canales ELRS, pantalla color, OpenTX',                  199.00,  7,  2, 4, 'Radiomaster', 'https://placehold.co/400x300?text=TX16S'),
    ('Receptor FrSky X8R',        'Receptor 8 canales SBUS/CPPM, telemetria',                          29.95, 15,  5, 4, 'FrSky',       'https://placehold.co/400x300?text=X8R'),
    ('Bateria LiPo 4S 1500 mAh',  'Bateria LiPo 4S 14.8V 1500 mAh 100C para FPV',                    24.90, 20,  8, 5, 'GNB',         'https://placehold.co/400x300?text=LiPo+4S'),
    ('Cargador ISDT Q6 Plus',     'Cargador balanceador multiquimica 14 A 300 W',                      49.90,  1,  3, 5, 'ISDT',        'https://placehold.co/400x300?text=ISDT+Q6'),
    ('Helices HQProp 5x4.3x3',   'Set de 4 helices tribala 5 pulgadas para FPV freestyle',              5.50, 50, 15, 5, 'HQProp',      'https://placehold.co/400x300?text=HQProp');

-- IDs resultantes: Edge540=1, Cessna=2, SU27=3, TREX=4, Blade=5,
--                  DJI=6, Nazgul=7, TX16S=8, X8R=9, LiPo=10, ISDT=11, HQProp=12

INSERT INTO clientes (nombre, email, telefono, direccion, fecha_registro) VALUES
    ('Carlos Martinez', 'carlos@ejemplo.com', '612345678', 'Calle Mayor 12, Madrid',     '2024-01-15'),
    ('Ana Garcia',      'ana@ejemplo.com',    '623456789', 'Av. Catalunya 45, Barcelona','2024-02-03'),
    ('Luis Fernandez',  'luis@ejemplo.com',   '634567890', 'Calle Real 8, Sevilla',      '2024-02-20'),
    ('Maria Lopez',     'maria@ejemplo.com',  '645678901', 'Gran Via 100, Bilbao',       '2024-03-01');

-- IDs resultantes: Carlos=1, Ana=2, Luis=3, Maria=4

INSERT INTO pedidos (cliente_id, fecha, estado, total) VALUES
    (1, '2024-03-10', 'entregado', 286.69),  -- id=1 Carlos
    (2, '2024-04-05', 'enviado',   958.00),  -- id=2 Ana
    (3, '2024-04-08', 'pendiente', 374.90);  -- id=3 Luis

-- Pedido 1 (Carlos): Edge540 x1 + LiPo x3 + HQProp x4 = 189.99 + 74.70 + 22.00 = 286.69
-- Pedido 2 (Ana):    DJI x1    + TX16S x1              = 759.00 + 199.00          = 958.00
-- Pedido 3 (Luis):   TREX x1   + X8R x2                = 315.00 + 59.90           = 374.90

CREATE TABLE socios (
    id         INT          NOT NULL AUTO_INCREMENT,
    nombre     VARCHAR(150) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    telefono   VARCHAR(20),
    fecha_alta DATE         NOT NULL DEFAULT (CURRENT_DATE),
    estado     ENUM('activo','baja') NOT NULL DEFAULT 'activo',
    fecha_baja DATE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_socios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO socios (nombre, email, telefono, fecha_alta, estado, fecha_baja) VALUES
    ('Pedro Alonso',      'pedro.alonso@ejemplo.com',   '611223344', '2025-01-10', 'activo', NULL),
    ('Laura Ruiz',        'laura.ruiz@ejemplo.com',     '622334455', '2025-02-14', 'activo', NULL),
    ('Miguel Torres',     'miguel.torres@ejemplo.com',  '633445566', '2025-03-05', 'activo', NULL),
    ('Elena Vega',        'elena.vega@ejemplo.com',     '644556677', '2025-04-20', 'activo', NULL),
    ('David Moreno',      'david.moreno@ejemplo.com',   '655667788', '2025-06-01', 'activo', NULL),
    ('Sofia Navarro',     'sofia.navarro@ejemplo.com',  '666778899', '2025-08-18', 'activo', NULL),
    ('Jorge Castillo',    'jorge.castillo@ejemplo.com', '677889900', '2026-01-07', 'activo', NULL),
    ('Marta Ibañez',      'marta.ibanez@ejemplo.com',   '688990011', '2026-02-22', 'activo', NULL),
    ('Andres Perez',      'andres.perez@ejemplo.com',   '699001122', '2026-03-15', 'activo', NULL),
    ('Carmen Flores',     'carmen.flores@ejemplo.com',  '611334455', '2026-04-01', 'activo', NULL),
    ('Roberto Jimenez',   'roberto.jimenez@ejemplo.com','622445566', '2025-05-10', 'baja',   '2026-01-15'),
    ('Isabel Santos',     'isabel.santos@ejemplo.com',  '633556677', '2025-07-03', 'baja',   '2026-02-28');


INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES
    (1,  1, 1, 189.99),   -- Pedido 1 — Edge 540 ARF
    (1, 10, 3,  24.90),   -- Pedido 1 — Bateria LiPo x3
    (1, 12, 4,   5.50),   -- Pedido 1 — Helices HQProp x4
    (2,  6, 1, 759.00),   -- Pedido 2 — DJI Mini 4 Pro
    (2,  8, 1, 199.00),   -- Pedido 2 — Emisora TX16S
    (3,  4, 1, 315.00),   -- Pedido 3 — Helicoptero T-REX 450
    (3,  9, 2,  29.95);   -- Pedido 3 — Receptor X8R x2

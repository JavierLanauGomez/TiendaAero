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
    id                  INT            NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(100)   NOT NULL,
    descripcion         TEXT,
    imagen_url          VARCHAR(500),
    activa              TINYINT(1)     NOT NULL DEFAULT 1,
    orden               INT            NOT NULL DEFAULT 0,
    color_hex           VARCHAR(7)              DEFAULT '#2563eb',
    icono               VARCHAR(50)             DEFAULT 'tag',
    slug                VARCHAR(100),
    meta_descripcion    VARCHAR(300),
    destacada           TINYINT(1)     NOT NULL DEFAULT 0,
    fecha_creacion      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comision_porcentaje DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categorias_nombre (nombre),
    UNIQUE KEY uq_categorias_slug   (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE productos (
    id              INT            NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(200)   NOT NULL,
    descripcion     TEXT,
    precio          DECIMAL(10,2)  NOT NULL,
    stock           INT            NOT NULL DEFAULT 0,
    stock_minimo    INT            NOT NULL DEFAULT 1,
    categoria_id    INT            NOT NULL,
    marca           VARCHAR(100),
    imagen_url      VARCHAR(500),
    peso            DECIMAL(8,3),
    dimensiones     VARCHAR(50),
    codigo_ean      VARCHAR(30),
    precio_oferta   DECIMAL(10,2),
    destacado       TINYINT(1)     NOT NULL DEFAULT 0,
    num_ventas      INT            NOT NULL DEFAULT 0,
    valoracion_media DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
    garantia_meses  INT            NOT NULL DEFAULT 12,
    fecha_creacion  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo          TINYINT(1)     NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_productos_ean (codigo_ean),
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
    ciudad          VARCHAR(100),
    codigo_postal   VARCHAR(10),
    pais            VARCHAR(50)  NOT NULL DEFAULT 'España',
    fecha_nacimiento DATE,
    newsletter      TINYINT(1)   NOT NULL DEFAULT 0,
    vip             TINYINT(1)   NOT NULL DEFAULT 0,
    notas           TEXT,
    ultima_compra   DATE,
    total_gastado   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    num_pedidos     INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_clientes_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE pedidos (
    id                  INT            NOT NULL AUTO_INCREMENT,
    cliente_id          INT            NOT NULL,
    fecha               DATE           NOT NULL DEFAULT (CURRENT_DATE),
    estado              ENUM('pendiente','enviado','entregado') NOT NULL DEFAULT 'pendiente',
    total               DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    direccion_envio     VARCHAR(300),
    metodo_pago         ENUM('tarjeta','transferencia','efectivo','paypal') NOT NULL DEFAULT 'tarjeta',
    numero_seguimiento  VARCHAR(100),
    notas               TEXT,
    descuento           DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    fecha_envio         DATE,
    fecha_entrega       DATE,
    transportista       VARCHAR(100),
    facturado           TINYINT(1)     NOT NULL DEFAULT 0,
    referencia_externa  VARCHAR(50),
    PRIMARY KEY (id),
    KEY idx_pedidos_cliente (cliente_id),
    CONSTRAINT fk_pedidos_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE detalle_pedidos (
    id               INT           NOT NULL AUTO_INCREMENT,
    pedido_id        INT           NOT NULL,
    producto_id      INT           NOT NULL,
    cantidad         INT           NOT NULL,
    precio_unitario  DECIMAL(10,2) NOT NULL,
    descuento        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    iva_porcentaje   DECIMAL(5,2)  NOT NULL DEFAULT 21.00,
    notas            VARCHAR(200),
    devuelto         TINYINT(1)    NOT NULL DEFAULT 0,
    fecha_devolucion DATE,
    motivo_devolucion VARCHAR(200),
    precio_coste     DECIMAL(10,2),
    margen           DECIMAL(10,2),
    numero_serie     VARCHAR(50),
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
    email            VARCHAR(150),
    nombre_completo  VARCHAR(200),
    rol              ENUM('admin','empleado') NOT NULL DEFAULT 'empleado',
    activo           TINYINT(1)   NOT NULL DEFAULT 1,
    ultimo_acceso    DATETIME,
    fecha_creacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    intentos_fallidos INT         NOT NULL DEFAULT 0,
    bloqueado        TINYINT(1)   NOT NULL DEFAULT 0,
    avatar_url       VARCHAR(500),
    notas            TEXT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_nombre (nombre_usuario),
    UNIQUE KEY uq_usuarios_email  (email)
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

-- 30 productos adicionales
INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria_id, marca, imagen_url) VALUES
    -- Aviones (cat 1)
    ('Extra 300 3D 50cc ARF',     'Avion acrobatico 3D 50cc, 1.88 m envergadura, madera balsa',          379.00,  4,  2, 1, 'Pilot-RC',    'https://placehold.co/400x300?text=Extra+300'),
    ('P-51 Mustang PNP 1.5m',     'Avion warbird escala 1:6, motor brushless incluido, PNP',             259.00,  5,  2, 1, 'FMS',         'https://placehold.co/400x300?text=P51+Mustang'),
    ('F4U Corsair 1.5m PNP',      'Avion warbird con alas plegables, sonido de motor y luces LED',       289.00,  3,  2, 1, 'FMS',         'https://placehold.co/400x300?text=F4U+Corsair'),
    ('Spitfire Mk IX ARF 1.4m',   'Clasico warbird britanico, balsa/contrachapado, tren retractil',      219.00,  4,  2, 1, 'Pilot-RC',    'https://placehold.co/400x300?text=Spitfire'),
    ('Yak 54 3D ARF 1.2m',        'Avion 3D competicion, fibra de vidrio, servo digital Savox',         345.00,  3,  2, 1, 'SebArt',      'https://placehold.co/400x300?text=Yak+54'),
    ('Focke-Wulf FW-190 PNP',     'Avion warbird aleman, escala 1:5.5, retracciones mecanicas',         299.00,  2,  2, 1, 'Freewing',    'https://placehold.co/400x300?text=FW190'),
    -- Helicopteros (cat 2)
    ('Blade 360 CFX BNF',         'Helicoptero 360mm colectivo variable, receptor DSM2 incluido',        389.00,  3,  2, 2, 'Blade',       'https://placehold.co/400x300?text=Blade+360'),
    ('Align T-REX 550X Super Combo','Heli escala 550, super combo con motores y ESC Align',              899.00,  1,  1, 2, 'Align',       'https://placehold.co/400x300?text=TREX+550X'),
    ('Goblin 570 Sport Line KIT',  'Helicoptero de competicion 570mm, KIT sin electronica',              749.00,  2,  1, 2, 'SAB',         'https://placehold.co/400x300?text=Goblin+570'),
    ('XL Power Protos 380 KIT',    'Heli 380mm micro colectivo variable, ideal acrobacia indoor',        389.00,  3,  2, 2, 'XL Power',    'https://placehold.co/400x300?text=Protos+380'),
    -- Drones (cat 3)
    ('DJI Avata 2 FPV Combo',      'Drone FPV de alta velocidad con gafas Goggles 3 y mando',          1199.00,  4,  2, 3, 'DJI',         'https://placehold.co/400x300?text=DJI+Avata+2'),
    ('iFlight Chimera7 LR HD',     'Long range 7 pulgadas HD, fibra carbono, camara DJI O3',             499.00,  3,  2, 3, 'iFlight',     'https://placehold.co/400x300?text=Chimera7'),
    ('Holybro Kopis 2 SE',         'Drone freestyle 5 pulgadas prearmado, F7 FC + ESC 50A',             299.00,  5,  3, 3, 'Holybro',     'https://placehold.co/400x300?text=Kopis2'),
    ('GEPRC Mark4 HD 5inch',       'Freestyle HD 5 pulgadas con DJI Air Unit, carbono 3K',              349.00,  4,  2, 3, 'GEPRC',       'https://placehold.co/400x300?text=Mark4'),
    ('BetaFPV Beta95X Whoop',      'Micro drone indoor 95mm, camara integrada, 2S LiPo',                129.00,  8,  3, 3, 'BetaFPV',     'https://placehold.co/400x300?text=Beta95X'),
    ('Emax Tinyhawk III RTF',      'Micro drone 75mm RTF con gafas y mando, perfecto para principiantes', 179.00, 6,  3, 3, 'Emax',        'https://placehold.co/400x300?text=Tinyhawk3'),
    ('Foxeer Reaper F745 BNF',     'Freestyle 5 pulgadas F7, ESC 45A, camara Foxeer Razer',             279.00,  4,  2, 3, 'Foxeer',      'https://placehold.co/400x300?text=Reaper+F745'),
    -- Radiocontrol (cat 4)
    ('Jumper T20 Pro ELRS',        'Emisora 20 canales ExpressLRS, pantalla OLED, modulo RF integrado',  189.00,  6,  2, 4, 'Jumper',      'https://placehold.co/400x300?text=T20+Pro'),
    ('FrSky X20S ACCESS',          'Emisora 24 canales ACCESS, pantalla color 4.3 pulgadas',             329.00,  4,  2, 4, 'FrSky',       'https://placehold.co/400x300?text=X20S'),
    ('Futaba T16IZ Super',         'Emisora premium 16 canales FASSTest, telemetria avanzada',           749.00,  2,  1, 4, 'Futaba',      'https://placehold.co/400x300?text=T16IZ'),
    ('TBS Tango 2 Pro V4',         'Emisora compacta para FPV, CrossFire integrado, ergonomica',         249.00,  5,  2, 4, 'TBS',         'https://placehold.co/400x300?text=Tango2'),
    ('Receptor TBS Crossfire Nano','Receptor ultra long range Crossfire, hasta 100 km de alcance',        29.90, 20,  5, 4, 'TBS',         'https://placehold.co/400x300?text=CRSF+Nano'),
    ('Receptor FrSky R9 Slim+',    'Receptor 900 MHz largo alcance con telemetria Smart Port',           34.90, 15,  5, 4, 'FrSky',       'https://placehold.co/400x300?text=R9+Slim'),
    -- Accesorios (cat 5)
    ('Bateria LiPo 6S 1300 mAh',   'Bateria 6S 22.2V 1300 mAh 120C para drones freestyle 5 pulgadas',   32.90, 18,  6, 5, 'GNB',         'https://placehold.co/400x300?text=LiPo+6S'),
    ('Cargador SkyRC D100 V2',      'Cargador dual canal 100W+100W, pantalla color, USB-C',              129.00,  5,  2, 5, 'SkyRC',       'https://placehold.co/400x300?text=D100+V2'),
    ('Motor T-Motor F60 Pro IV',    'Motor brushless 2207 1750KV para freestyle, titanio + acero',        39.90, 20,  5, 5, 'T-Motor',     'https://placehold.co/400x300?text=F60+Pro'),
    ('ESC BLHeli_32 45A 4en1',      'ESC 4en1 BLHeli_32 45A con telemetria RPM, para stack 30x30',       49.90, 12,  4, 5, 'Holybro',     'https://placehold.co/400x300?text=45A+4in1'),
    ('Camara Runcam Thumb Pro',     'Camara de accion 4K ultraligera 16g para montaje en dron FPV',       69.90,  8,  3, 5, 'Runcam',      'https://placehold.co/400x300?text=Thumb+Pro'),
    ('VTX Rush Cherry 400mW',       'Transmisor video 5.8 GHz 400 mW, 48 canales, pit mode',              28.90, 15,  5, 5, 'Rush FPV',    'https://placehold.co/400x300?text=Rush+Cherry'),
    ('Gafas FPV Skyzone 04L V2',    'Gafas FPV OLED 1280x960, receptor diversidad, DVR integrado',      429.00,  3,  2, 5, 'Skyzone',     'https://placehold.co/400x300?text=Skyzone+04L');

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
    id                  INT          NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(150) NOT NULL,
    email               VARCHAR(150) NOT NULL,
    telefono            VARCHAR(20),
    direccion           VARCHAR(300),
    ciudad              VARCHAR(100),
    fecha_nacimiento    DATE,
    nivel               ENUM('bronce','plata','oro','platino') NOT NULL DEFAULT 'bronce',
    puntos              INT          NOT NULL DEFAULT 0,
    descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    notas               TEXT,
    dni                 VARCHAR(15),
    newsletter          TINYINT(1)   NOT NULL DEFAULT 1,
    referido_por        INT,
    fecha_alta          DATE         NOT NULL DEFAULT (CURRENT_DATE),
    estado              ENUM('activo','baja') NOT NULL DEFAULT 'activo',
    fecha_baja          DATE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_socios_email (email),
    CONSTRAINT fk_socios_referido
        FOREIGN KEY (referido_por) REFERENCES socios (id)
        ON UPDATE CASCADE ON DELETE SET NULL
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

-- 30 socios activos adicionales
INSERT INTO socios (nombre, email, telefono, fecha_alta, estado, fecha_baja) VALUES
    ('Antonio Gomez',    'antonio.gomez@ejemplo.com',    '611001100', '2024-03-12', 'activo', NULL),
    ('Lucia Martinez',   'lucia.martinez@ejemplo.com',   '622002200', '2024-05-08', 'activo', NULL),
    ('Pablo Herrera',    'pablo.herrera@ejemplo.com',    '633003300', '2024-06-17', 'activo', NULL),
    ('Sara Delgado',     'sara.delgado@ejemplo.com',     '644004400', '2024-07-21', 'activo', NULL),
    ('Francisco Jimenez','francisco.jimenez@ejemplo.com','655005500', '2024-08-03', 'activo', NULL),
    ('Beatriz Molina',   'beatriz.molina@ejemplo.com',   '666006600', '2024-09-14', 'activo', NULL),
    ('Alberto Romero',   'alberto.romero@ejemplo.com',   '677007700', '2024-10-29', 'activo', NULL),
    ('Patricia Alvarez', 'patricia.alvarez@ejemplo.com', '688008800', '2024-11-05', 'activo', NULL),
    ('Raul Ortega',      'raul.ortega@ejemplo.com',      '699009900', '2024-12-20', 'activo', NULL),
    ('Natalia Blanco',   'natalia.blanco@ejemplo.com',   '611010101', '2025-01-18', 'activo', NULL),
    ('Manuel Serrano',   'manuel.serrano@ejemplo.com',   '622020202', '2025-02-09', 'activo', NULL),
    ('Cristina Vargas',  'cristina.vargas@ejemplo.com',  '633030303', '2025-03-22', 'activo', NULL),
    ('Diego Medina',     'diego.medina@ejemplo.com',     '644040404', '2025-04-11', 'activo', NULL),
    ('Irene Suarez',     'irene.suarez@ejemplo.com',     '655050505', '2025-05-30', 'activo', NULL),
    ('Adrian Gil',       'adrian.gil@ejemplo.com',       '666060606', '2025-06-15', 'activo', NULL),
    ('Noelia Campos',    'noelia.campos@ejemplo.com',    '677070707', '2025-07-04', 'activo', NULL),
    ('Victor Cano',      'victor.cano@ejemplo.com',      '688080808', '2025-08-27', 'activo', NULL),
    ('Silvia Ramos',     'silvia.ramos@ejemplo.com',     '699090909', '2025-09-13', 'activo', NULL),
    ('Ivan Mendez',      'ivan.mendez@ejemplo.com',      '611111213', '2025-10-02', 'activo', NULL),
    ('Ana Belen Guerra', 'anabelen.guerra@ejemplo.com',  '622223344', '2025-11-19', 'activo', NULL),
    ('Marcos Prieto',    'marcos.prieto@ejemplo.com',    '633334455', '2025-12-08', 'activo', NULL),
    ('Tamara Lozano',    'tamara.lozano@ejemplo.com',    '644445566', '2026-01-14', 'activo', NULL),
    ('Sergio Iglesias',  'sergio.iglesias@ejemplo.com',  '655556677', '2026-01-28', 'activo', NULL),
    ('Laura Calvo',      'laura.calvo@ejemplo.com',      '666667788', '2026-02-03', 'activo', NULL),
    ('Hugo Reyes',       'hugo.reyes@ejemplo.com',       '677778899', '2026-02-17', 'activo', NULL),
    ('Marina Gallego',   'marina.gallego@ejemplo.com',   '688889900', '2026-03-06', 'activo', NULL),
    ('Daniel Aguilar',   'daniel.aguilar@ejemplo.com',   '699990011', '2026-03-20', 'activo', NULL),
    ('Sandra Marin',     'sandra.marin@ejemplo.com',     '611223301', '2026-04-02', 'activo', NULL),
    ('Eduardo Nieto',    'eduardo.nieto@ejemplo.com',    '622334402', '2026-04-10', 'activo', NULL),
    ('Rocio Vazquez',    'rocio.vazquez@ejemplo.com',    '633445503', '2026-04-18', 'activo', NULL);

-- 10 socios adicionales con baja
INSERT INTO socios (nombre, email, telefono, fecha_alta, estado, fecha_baja) VALUES
    ('Fernando Rubio',   'fernando.rubio@ejemplo.com',   '644556604', '2024-02-10', 'baja', '2025-03-01'),
    ('Gloria Mora',      'gloria.mora@ejemplo.com',      '655667705', '2024-04-22', 'baja', '2025-05-14'),
    ('Ignacio Bravo',    'ignacio.bravo@ejemplo.com',    '666778806', '2024-06-05', 'baja', '2025-07-30'),
    ('Pilar Cabrera',    'pilar.cabrera@ejemplo.com',    '677889907', '2024-08-18', 'baja', '2025-09-10'),
    ('Hector Crespo',    'hector.crespo@ejemplo.com',    '688990008', '2024-10-01', 'baja', '2025-11-22'),
    ('Amelia Pardo',     'amelia.pardo@ejemplo.com',     '699001109', '2024-11-15', 'baja', '2026-01-05'),
    ('Oscar Nunez',      'oscar.nunez@ejemplo.com',      '611334410', '2025-01-28', 'baja', '2026-02-12'),
    ('Esther Dominguez', 'esther.dominguez@ejemplo.com', '622445511', '2025-03-09', 'baja', '2026-02-25'),
    ('Ramon Fuentes',    'ramon.fuentes@ejemplo.com',    '633556612', '2025-06-20', 'baja', '2026-03-18'),
    ('Amparo Rios',      'amparo.rios@ejemplo.com',      '644667713', '2025-09-04', 'baja', '2026-04-05');


INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES
    (1,  1, 1, 189.99),   -- Pedido 1 — Edge 540 ARF
    (1, 10, 3,  24.90),   -- Pedido 1 — Bateria LiPo x3
    (1, 12, 4,   5.50),   -- Pedido 1 — Helices HQProp x4
    (2,  6, 1, 759.00),   -- Pedido 2 — DJI Mini 4 Pro
    (2,  8, 1, 199.00),   -- Pedido 2 — Emisora TX16S
    (3,  4, 1, 315.00),   -- Pedido 3 — Helicoptero T-REX 450
    (3,  9, 2,  29.95);   -- Pedido 3 — Receptor X8R x2

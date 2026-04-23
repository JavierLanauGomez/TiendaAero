-- ============================================================
-- TiendaAero — 15 pedidos nuevos con líneas de detalle
-- Ejecutar sobre la BD existente (requiere migracion_campos.sql
-- ya aplicado):
--   mysql -u root -p tiendaaero < migracion_pedidos.sql
-- ============================================================

USE tiendaaero;

-- ------------------------------------------------------------
-- PEDIDOS 4–18
-- ------------------------------------------------------------
INSERT INTO pedidos
    (cliente_id, fecha, estado, total,
     direccion_envio, metodo_pago, numero_seguimiento,
     descuento, fecha_envio, fecha_entrega,
     transportista, facturado, referencia_externa)
VALUES
--  4: Carlos — P-51 + baterías
(1, '2024-05-15', 'entregado', 308.80,
 'Calle Mayor 12, Madrid', 'tarjeta', 'COR20240516M001',
 0.00, '2024-05-16', '2024-05-19', 'Correos', 1, 'TDA-2024-0001'),

--  5: Maria — DJI Avata + gafas FPV
(4, '2024-06-03', 'entregado', 1628.00,
 'Gran Via 100, Bilbao', 'transferencia', 'DHL20240604B001',
 0.00, '2024-06-04', '2024-06-06', 'DHL', 1, 'TDA-2024-0002'),

--  6: Luis — Blade 360 + cargador + baterías 6S
(3, '2024-07-18', 'enviado', 583.80,
 'Calle Real 8, Sevilla', 'tarjeta', 'MRW20240719S001',
 0.00, '2024-07-19', NULL, 'MRW', 0, 'TDA-2024-0003'),

--  7: Ana — Futaba T16IZ + receptores
(2, '2024-08-05', 'pendiente', 808.90,
 'Av. Catalunya 45, Barcelona', 'transferencia', NULL,
 0.00, NULL, NULL, NULL, 0, 'TDA-2024-0004'),

--  8: Carlos — Chimera7 + VTX + motores
(1, '2024-09-12', 'entregado', 716.40,
 'Calle Mayor 12, Madrid', 'tarjeta', 'GLS20240913M001',
 0.00, '2024-09-13', '2024-09-16', 'GLS', 1, 'TDA-2024-0005'),

--  9: Maria — Kopis 2 + ESC + cámara + hélices
(4, '2024-10-28', 'entregado', 435.30,
 'Gran Via 100, Bilbao', 'tarjeta', 'SEUR20241029B001',
 0.00, '2024-10-29', '2024-11-01', 'SEUR', 1, 'TDA-2024-0006'),

-- 10: Luis — Extra 300 + baterías
(3, '2024-11-15', 'entregado', 478.60,
 'Calle Real 8, Sevilla', 'efectivo', 'COR20241116S001',
 0.00, '2024-11-16', '2024-11-20', 'Correos', 1, 'TDA-2024-0007'),

-- 11: Ana — DJI Mini 4 Pro + emisora + baterías
(2, '2024-12-01', 'entregado', 1007.80,
 'Av. Catalunya 45, Barcelona', 'tarjeta', 'COR20241202B001',
 0.00, '2024-12-02', '2024-12-05', 'Correos', 1, 'TDA-2024-0008'),

-- 12: Carlos — Yak 54 + receptores ELRS
(1, '2025-01-20', 'entregado', 404.80,
 'Calle Mayor 12, Madrid', 'paypal', 'DHL20250121M001',
 0.00, '2025-01-21', '2025-01-23', 'DHL', 1, 'TDA-2025-0001'),

-- 13: Maria — GEPRC Mark4 + motores + ESC
(4, '2025-02-14', 'pendiente', 558.50,
 'Gran Via 100, Bilbao', 'tarjeta', NULL,
 0.00, NULL, NULL, NULL, 0, 'TDA-2025-0002'),

-- 14: Luis — T-REX 550X + cargador ISDT
(3, '2025-03-08', 'enviado', 948.90,
 'Calle Real 8, Sevilla', 'transferencia', 'MRW20253091245',
 0.00, '2025-03-09', NULL, 'MRW', 0, 'TDA-2025-0003'),

-- 15: Ana — FrSky X20S + receptores + baterías 6S
(2, '2025-04-22', 'entregado', 497.50,
 'Av. Catalunya 45, Barcelona', 'tarjeta', 'GLS20250423B001',
 0.00, '2025-04-23', '2025-04-25', 'GLS', 1, 'TDA-2025-0004'),

-- 16: Carlos — BetaFPV x2 + Tinyhawk
(1, '2025-06-10', 'entregado', 437.00,
 'Calle Mayor 12, Madrid', 'tarjeta', 'COR20250611M001',
 0.00, '2025-06-11', '2025-06-14', 'Correos', 1, 'TDA-2025-0005'),

-- 17: Maria — Goblin 570 + emisora Jumper
(4, '2025-08-30', 'enviado', 938.00,
 'Gran Via 100, Bilbao', 'transferencia', 'DHL20250901XY12',
 0.00, '2025-08-31', NULL, 'DHL', 0, 'TDA-2025-0006'),

-- 18: Luis — FW-190 + Spitfire + hélices
(3, '2025-11-05', 'pendiente', 551.00,
 'Calle Real 8, Sevilla', 'tarjeta', NULL,
 0.00, NULL, NULL, NULL, 0, 'TDA-2025-0007');


-- ------------------------------------------------------------
-- DETALLE_PEDIDOS para los pedidos 4–18
-- subtotal = cantidad * precio_unitario (descuento = 0)
-- ------------------------------------------------------------
INSERT INTO detalle_pedidos
    (pedido_id, producto_id, cantidad, precio_unitario,
     descuento, subtotal, iva_porcentaje)
VALUES
-- Pedido 4: P-51 Mustang x1 + Bateria LiPo 4S x2
(4, 14, 1, 259.00, 0.00, 259.00, 21.00),
(4, 10, 2,  24.90, 0.00,  49.80, 21.00),

-- Pedido 5: DJI Avata 2 x1 + Gafas Skyzone x1
(5, 23, 1, 1199.00, 0.00, 1199.00, 21.00),
(5, 42, 1,  429.00, 0.00,  429.00, 21.00),

-- Pedido 6: Blade 360 CFX x1 + Cargador SkyRC x1 + Bateria 6S x2
(6, 19, 1, 389.00, 0.00, 389.00, 21.00),
(6, 37, 1, 129.00, 0.00, 129.00, 21.00),
(6, 36, 2,  32.90, 0.00,  65.80, 21.00),

-- Pedido 7: Futaba T16IZ x1 + Receptor X8R x2
(7, 32, 1, 749.00, 0.00, 749.00, 21.00),
(7,  9, 2,  29.95, 0.00,  59.90, 21.00),

-- Pedido 8: Chimera7 LR x1 + VTX Rush x2 + Motor T-Motor x4
(8, 24, 1, 499.00, 0.00, 499.00, 21.00),
(8, 41, 2,  28.90, 0.00,  57.80, 21.00),
(8, 38, 4,  39.90, 0.00, 159.60, 21.00),

-- Pedido 9: Kopis 2 SE x1 + ESC 4en1 x1 + Camara Runcam x1 + Helices x3
(9, 25, 1, 299.00, 0.00, 299.00, 21.00),
(9, 39, 1,  49.90, 0.00,  49.90, 21.00),
(9, 40, 1,  69.90, 0.00,  69.90, 21.00),
(9, 12, 3,   5.50, 0.00,  16.50, 21.00),

-- Pedido 10: Extra 300 3D x1 + Bateria 4S x4
(10, 13, 1, 379.00, 0.00, 379.00, 21.00),
(10, 10, 4,  24.90, 0.00,  99.60, 21.00),

-- Pedido 11: DJI Mini 4 Pro x1 + Emisora TX16S x1 + Bateria 4S x2
(11,  6, 1, 759.00, 0.00, 759.00, 21.00),
(11,  8, 1, 199.00, 0.00, 199.00, 21.00),
(11, 10, 2,  24.90, 0.00,  49.80, 21.00),

-- Pedido 12: Yak 54 3D x1 + Receptor TBS Crossfire x2
(12, 17, 1, 345.00, 0.00, 345.00, 21.00),
(12, 34, 2,  29.90, 0.00,  59.80, 21.00),

-- Pedido 13: GEPRC Mark4 x1 + Motor T-Motor x4 + ESC 4en1 x1
(13, 26, 1, 349.00, 0.00, 349.00, 21.00),
(13, 38, 4,  39.90, 0.00, 159.60, 21.00),
(13, 39, 1,  49.90, 0.00,  49.90, 21.00),

-- Pedido 14: T-REX 550X x1 + Cargador ISDT x1
(14, 20, 1, 899.00, 0.00, 899.00, 21.00),
(14, 11, 1,  49.90, 0.00,  49.90, 21.00),

-- Pedido 15: FrSky X20S x1 + Receptor R9 Slim x2 + Bateria 6S x3
(15, 31, 1, 329.00, 0.00, 329.00, 21.00),
(15, 35, 2,  34.90, 0.00,  69.80, 21.00),
(15, 36, 3,  32.90, 0.00,  98.70, 21.00),

-- Pedido 16: BetaFPV Beta95X x2 + Tinyhawk III x1
(16, 27, 2, 129.00, 0.00, 258.00, 21.00),
(16, 28, 1, 179.00, 0.00, 179.00, 21.00),

-- Pedido 17: Goblin 570 x1 + Jumper T20 Pro x1
(17, 21, 1, 749.00, 0.00, 749.00, 21.00),
(17, 30, 1, 189.00, 0.00, 189.00, 21.00),

-- Pedido 18: Focke-Wulf FW-190 x1 + Spitfire x1 + Helices x6
(18, 18, 1, 299.00, 0.00, 299.00, 21.00),
(18, 16, 1, 219.00, 0.00, 219.00, 21.00),
(18, 12, 6,   5.50, 0.00,  33.00, 21.00);

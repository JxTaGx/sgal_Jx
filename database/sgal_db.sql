-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-04-2025 a las 05:10:23
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sgal_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ciclo_cultivo`
--

CREATE TABLE `ciclo_cultivo` (
  `id_ciclo` varchar(50) NOT NULL,
  `nombre_ciclo` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `ruta_fotografia` varchar(255) DEFAULT NULL,
  `periodo_siembra` varchar(100) DEFAULT NULL,
  `novedades` varchar(255) DEFAULT NULL,
  `estado` enum('activo','inactivo','pendiente') DEFAULT 'pendiente',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ciclo_cultivo`
--

INSERT INTO `ciclo_cultivo` (`id_ciclo`, `nombre_ciclo`, `descripcion`, `ruta_fotografia`, `periodo_siembra`, `novedades`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
('1232', 'primavera', 'ciclando', NULL, 'primavera', 'Bien', 'activo', '2025-04-18 13:43:53', '2025-04-18 13:43:53'),
('221', 'tomate', 'sadsasd', '/uploads/ciclos/ciclo-1743481948754-686756778.png', 'primavera 2023', 'bien', 'activo', '2025-04-01 04:32:28', '2025-04-01 04:32:28'),
('23223', 'arepa con huevo', 'sadasadsadsdads', '/uploads/ciclos/ciclo-1744050950722-245871497.jpg', 'primavera 2023', 'sin novedad', 'pendiente', '2025-04-07 18:35:50', '2025-04-07 18:35:50'),
('32323', 'sdasdsa', 'sdsdasda', '/uploads/ciclos/ciclo-1745462334082-572339403.jpg', 'dsdasdasda', 'dsdasddsd', 'activo', '2025-04-24 02:38:54', '2025-04-24 02:38:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cultivos`
--

CREATE TABLE `cultivos` (
  `id` int(11) NOT NULL,
  `id_cultivo` varchar(20) NOT NULL COMMENT 'Identificador único del cultivo (ej: CULT-001)',
  `tipo_cultivo` varchar(100) NOT NULL COMMENT 'Tipo de cultivo (ej: Maíz, Café, Arroz)',
  `nombre_cultivo` varchar(150) NOT NULL COMMENT 'Nombre del cultivo (ej: Cultivo de maíz 2024)',
  `tamano` varchar(50) DEFAULT NULL COMMENT 'Tamaño del cultivo (ej: 100 m²)',
  `ubicacion` varchar(150) DEFAULT NULL COMMENT 'Ubicación del cultivo (ej: Finca La Esperanza)',
  `estado` varchar(50) DEFAULT NULL COMMENT 'Estado del cultivo (ej: Activo, En crecimiento)',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción detallada del cultivo',
  `ruta_fotografia` varchar(255) DEFAULT NULL COMMENT 'Ruta de la imagen del cultivo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de creación del registro',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Fecha de última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cultivos`
--

INSERT INTO `cultivos` (`id`, `id_cultivo`, `tipo_cultivo`, `nombre_cultivo`, `tamano`, `ubicacion`, `estado`, `descripcion`, `ruta_fotografia`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'cult-001', 'maiz', 'cultivo ', '100m2', 'finca', 'activo', 'bien', '/uploads/cultivos/cultivo-1743482871494-288639573.png', '2025-04-01 04:47:51', '2025-04-01 04:47:51'),
(2, 'CULT-02', 'maíz', 'Cultivo Maiz', '100m', 'Finca', 'Activo', 'Crecimiento', NULL, '2025-04-18 13:43:02', '2025-04-18 13:43:02'),
(3, 'cafe', 'cafe', 'cafe', '100m', 'Finca', 'Activo', 'a', NULL, '2025-04-18 13:46:04', '2025-04-18 13:46:04'),
(5, 'CULT-002', 'Fruta', 'Tomate', '120m', 'Zona 2', 'Activo', 'CUltivo sembrado ', '/uploads/cultivos/cultivo-1745351558955-213628624.jpg', '2025-04-22 19:52:38', '2025-04-22 19:52:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `insumos`
--

CREATE TABLE `insumos` (
  `id` int(11) NOT NULL,
  `id_insumo` varchar(20) NOT NULL COMMENT 'ID del insumo (Ej: INS-001)',
  `tipo_insumo` varchar(100) NOT NULL COMMENT 'Tipo de insumo (Ej: Material eléctrico)',
  `nombre_insumo` varchar(100) NOT NULL COMMENT 'Nombre del insumo (Ej: Cable UTP)',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción detallada del insumo',
  `unidad_medida` varchar(50) NOT NULL COMMENT 'Unidad de medida (Ej: metros, unidades)',
  `cantidad` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Cantidad disponible',
  `valor_unitario` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Valor por unidad',
  `valor_total` decimal(14,2) GENERATED ALWAYS AS (`cantidad` * `valor_unitario`) STORED COMMENT 'Valor total calculado automáticamente',
  `estado` varchar(50) DEFAULT 'Disponible' COMMENT 'Estado del insumo (Ej: Disponible, Agotado)',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Fecha de creación del registro',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Fecha de última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `insumos`
--

INSERT INTO `insumos` (`id`, `id_insumo`, `tipo_insumo`, `nombre_insumo`, `descripcion`, `unidad_medida`, `cantidad`, `valor_unitario`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'ins-001', 'material', 'utp', 'bien', 'metros', 12.00, 123434.00, 'disponible', '2025-04-01 04:55:19', '2025-04-01 04:55:19'),
(2, 'sdsdsa', 'material ee', 'sadsda', 'sdsda', 'adasda', 0.00, 0.00, 'sada', '2025-04-17 18:40:30', '2025-04-17 18:40:30'),
(3, 'INS-002', 'Pesticida', 'Insumo Zanahoria', 'Muy util', 'Metros', 12.00, 20000.00, 'disponible', '2025-04-17 20:03:38', '2025-04-17 20:03:38'),
(6, 'INS-0034', 'Pesticsds', 'Insumo Zanasd', 'sdsds', 'Metros', 12.00, 203000.00, 'disponible', '2025-04-17 22:17:13', '2025-04-17 22:17:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productions`
--

CREATE TABLE `productions` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `responsible` int(11) NOT NULL,
  `cultivation` varchar(20) NOT NULL,
  `cycle` varchar(50) NOT NULL,
  `sensors` text DEFAULT NULL,
  `supplies` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productions`
--

INSERT INTO `productions` (`id`, `name`, `responsible`, `cultivation`, `cycle`, `sensors`, `supplies`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Hola', 8, 'cult-001', '221', '1', '3', '2025-04-21', '2025-05-09', 'inactive', '2025-04-19 05:11:05', '2025-04-21 16:56:17'),
(2, 'ggggg', 10, 'cult-001', '23223', '1', '3', '0000-00-00', '0000-00-00', 'inactive', '2025-04-19 05:12:17', '2025-04-19 05:13:20'),
(3, 'Prueba', 10, 'cafe', '1232', '2', '6', '2025-04-17', '2025-05-07', 'active', '2025-04-21 16:55:22', '2025-04-21 16:55:22'),
(4, 'Producción de tomate Zona 2', 19, 'CULT-002', '1232', '3', '6', '2025-04-22', '2025-07-23', 'active', '2025-04-22 20:03:54', '2025-04-22 20:06:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sensores`
--

CREATE TABLE `sensores` (
  `id` int(11) NOT NULL,
  `tipo_sensor` varchar(100) NOT NULL,
  `nombre_sensor` varchar(100) NOT NULL,
  `identificador` varchar(50) NOT NULL,
  `referencia_sensor` varchar(100) NOT NULL,
  `unidad_medida` varchar(50) NOT NULL,
  `tiempo_escaneo` varchar(50) NOT NULL,
  `estado` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `ruta_fotografia` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sensores`
--

INSERT INTO `sensores` (`id`, `tipo_sensor`, `nombre_sensor`, `identificador`, `referencia_sensor`, `unidad_medida`, `tiempo_escaneo`, `estado`, `descripcion`, `ruta_fotografia`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 'maquina', 'hola', 'ms-11', 'metros', '12', '12343', 'disponible', 'si', '/uploads/sensores/sensor-1743515195364-577950561.jpg', '2025-04-01 13:46:35', '2025-04-01 13:46:35'),
(2, 'Super', 'Metrica', 'SENS_02', 'MAQUINAs', 'Temp', '232', 'Activo', 'Exceleny', NULL, '2025-04-21 05:13:42', '2025-04-21 05:13:42'),
(3, 'Temperatura', 'Sensor de temperatura', 'SENS_03', 'DHT22', 'Grados Celcius', '2 Segundos', 'Activo', 'Sensor ubicado en zona 2', '/uploads/sensores/sensor-1745351794393-548736599.jpeg', '2025-04-22 19:56:34', '2025-04-22 19:56:34');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `documentType` enum('TI','CC','CE','PPT','PEP') NOT NULL,
  `documentNumber` varchar(20) NOT NULL,
  `userType` varchar(50) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `confirmEmail` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `user`
--

INSERT INTO `user` (`id`, `documentType`, `documentNumber`, `userType`, `firstName`, `lastName`, `phone`, `password`, `email`, `confirmEmail`, `created_at`, `updated_at`) VALUES
(8, 'CC', '10403123', 'suplente', 'jota', 'ramirae', '329484723', '$2b$10$Y/bZubFiVCoghySJsHnBJ.5y0x7KSoEiztn0jW//r6hb1O2WqzmCS', 'jacobohoyoszz@gmail.com', 'jacobohoyoszz@gmail.com', '2025-04-01 03:36:47', '2025-04-01 03:36:47'),
(10, '', '1213223', 'PAP', 'sdsdsdsw', 'ewewewew', '3232323232', '$2b$10$UEEq2celRM9dpFoCEAAVT.bn3T.CTPEAp23uO5wESwvn6Hlbwluki', 'kasdaldsa@haajaak.com', 'kasdaldsa@haajaak.com', '2025-04-03 20:32:57', '2025-04-03 20:32:57'),
(18, 'CC', '1030212393', 'PAP', 'tomas', 'tomate', '232778830', '$2b$10$3xaRHbuW8/ChrsrHeqYIn.5J.RKZd3akVfDasaqmNQaeQeJOWa5oK', 'tomate@gmail.com', 'tomate@gmail.com', '2025-04-21 04:57:17', '2025-04-21 04:57:17'),
(19, 'CC', '18618000', 'PAP', 'Edward', 'Velasquez ', '3165161256', '$2b$10$8/9gZPZ8XId4Ac/H8LxeQuo7ItqA4Ullp/H3xwOTUENrquutf5X.O', 'ricoprogramar@gmail.com', 'ricoprogramar@gmail.com', '2025-04-22 19:46:59', '2025-04-22 19:46:59');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ciclo_cultivo`
--
ALTER TABLE `ciclo_cultivo`
  ADD PRIMARY KEY (`id_ciclo`);

--
-- Indices de la tabla `cultivos`
--
ALTER TABLE `cultivos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_cultivo` (`id_cultivo`);

--
-- Indices de la tabla `insumos`
--
ALTER TABLE `insumos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_insumo` (`id_insumo`),
  ADD KEY `idx_tipo_insumo` (`tipo_insumo`),
  ADD KEY `idx_nombre_insumo` (`nombre_insumo`),
  ADD KEY `idx_estado` (`estado`);

--
-- Indices de la tabla `productions`
--
ALTER TABLE `productions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `responsible` (`responsible`),
  ADD KEY `cultivation` (`cultivation`),
  ADD KEY `cycle` (`cycle`);

--
-- Indices de la tabla `sensores`
--
ALTER TABLE `sensores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identificador` (`identificador`);

--
-- Indices de la tabla `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `documentNumber` (`documentNumber`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cultivos`
--
ALTER TABLE `cultivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `insumos`
--
ALTER TABLE `insumos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `productions`
--
ALTER TABLE `productions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `sensores`
--
ALTER TABLE `sensores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `productions`
--
ALTER TABLE `productions`
  ADD CONSTRAINT `productions_ibfk_1` FOREIGN KEY (`responsible`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `productions_ibfk_2` FOREIGN KEY (`cultivation`) REFERENCES `cultivos` (`id_cultivo`),
  ADD CONSTRAINT `productions_ibfk_3` FOREIGN KEY (`cycle`) REFERENCES `ciclo_cultivo` (`id_ciclo`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

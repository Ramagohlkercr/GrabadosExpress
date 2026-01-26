// Base de datos de sucursales de Correo Argentino
// Datos basados en información pública oficial

export const SUCURSALES_CORREO = {
    // Ciudad Autónoma de Buenos Aires
    C: [
        { code: 'C1000', name: 'Correo Central', locality: 'Microcentro', address: 'Sarmiento 151', cp: '1000' },
        { code: 'C1001', name: 'Retiro', locality: 'Retiro', address: 'Av. Ramos Mejía 1302', cp: '1104' },
        { code: 'C1002', name: 'Once', locality: 'Balvanera', address: 'Bartolomé Mitre 2560', cp: '1039' },
        { code: 'C1003', name: 'Constitución', locality: 'Constitución', address: 'Lima 1798', cp: '1262' },
        { code: 'C1004', name: 'Palermo', locality: 'Palermo', address: 'Av. Santa Fe 5012', cp: '1425' },
        { code: 'C1005', name: 'Belgrano', locality: 'Belgrano', address: 'Av. Cabildo 2040', cp: '1426' },
        { code: 'C1006', name: 'Caballito', locality: 'Caballito', address: 'Av. Rivadavia 5200', cp: '1424' },
        { code: 'C1007', name: 'Villa Urquiza', locality: 'Villa Urquiza', address: 'Triunvirato 4890', cp: '1431' },
        { code: 'C1008', name: 'Flores', locality: 'Flores', address: 'Av. Rivadavia 6899', cp: '1406' },
        { code: 'C1009', name: 'Villa Devoto', locality: 'Villa Devoto', address: 'Av. Francisco Beiró 4080', cp: '1419' },
        { code: 'C1010', name: 'Liniers', locality: 'Liniers', address: 'Av. Rivadavia 11139', cp: '1408' },
        { code: 'C1011', name: 'Villa Lugano', locality: 'Villa Lugano', address: 'Av. Roca 5252', cp: '1439' },
        { code: 'C1012', name: 'Pompeya', locality: 'Nueva Pompeya', address: 'Av. Sáenz 1160', cp: '1437' },
        { code: 'C1013', name: 'Barracas', locality: 'Barracas', address: 'Av. Montes de Oca 1510', cp: '1271' },
        { code: 'C1014', name: 'La Boca', locality: 'La Boca', address: 'Almirante Brown 456', cp: '1160' },
        { code: 'C1015', name: 'San Telmo', locality: 'San Telmo', address: 'Defensa 1038', cp: '1065' },
        { code: 'C1016', name: 'Recoleta', locality: 'Recoleta', address: 'Av. Callao 1234', cp: '1023' },
        { code: 'C1017', name: 'Almagro', locality: 'Almagro', address: 'Av. Rivadavia 3850', cp: '1204' },
        { code: 'C1018', name: 'Paternal', locality: 'La Paternal', address: 'Av. San Martín 4500', cp: '1417' },
        { code: 'C1019', name: 'Núñez', locality: 'Núñez', address: 'Av. Cabildo 4780', cp: '1429' },
        { code: 'C1020', name: 'Saavedra', locality: 'Saavedra', address: 'Av. Crámer 4520', cp: '1430' },
        { code: 'C1021', name: 'Villa Crespo', locality: 'Villa Crespo', address: 'Av. Corrientes 5500', cp: '1414' },
        { code: 'C1022', name: 'Colegiales', locality: 'Colegiales', address: 'Av. Álvarez Thomas 1234', cp: '1427' },
        { code: 'C1023', name: 'Puerto Madero', locality: 'Puerto Madero', address: 'Av. Alicia M. de Justo 500', cp: '1107' },
        { code: 'C1024', name: 'Boedo', locality: 'Boedo', address: 'Av. Boedo 940', cp: '1218' },
    ],

    // Buenos Aires - Zona Sur
    B: [
        { code: 'B1800', name: 'Quilmes Centro', locality: 'Quilmes', address: 'Rivadavia 456', cp: '1878' },
        { code: 'B1801', name: 'Bernal', locality: 'Bernal', address: 'Av. San Martín 123', cp: '1876' },
        { code: 'B1802', name: 'Avellaneda', locality: 'Avellaneda', address: 'Mitre 890', cp: '1870' },
        { code: 'B1803', name: 'Lanús Este', locality: 'Lanús', address: 'H. Yrigoyen 1234', cp: '1824' },
        { code: 'B1804', name: 'Lanús Oeste', locality: 'Lanús Oeste', address: 'Av. Pavón 3456', cp: '1822' },
        { code: 'B1805', name: 'Lomas de Zamora', locality: 'Lomas de Zamora', address: 'Laprida 567', cp: '1832' },
        { code: 'B1806', name: 'Banfield', locality: 'Banfield', address: 'Alsina 321', cp: '1828' },
        { code: 'B1807', name: 'Temperley', locality: 'Temperley', address: 'Av. Meeks 789', cp: '1834' },
        { code: 'B1808', name: 'Adrogué', locality: 'Adrogué', address: 'Espora 456', cp: '1846' },
        { code: 'B1809', name: 'Burzaco', locality: 'Burzaco', address: 'Av. Monteverde 1234', cp: '1852' },
        { code: 'B1810', name: 'Longchamps', locality: 'Longchamps', address: 'Av. San Martín 567', cp: '1854' },
        { code: 'B1811', name: 'Florencio Varela', locality: 'Florencio Varela', address: 'Av. San Martín 2345', cp: '1888' },
        { code: 'B1812', name: 'Berazategui', locality: 'Berazategui', address: 'Av. 14 N° 4567', cp: '1884' },
        { code: 'B1813', name: 'Wilde', locality: 'Wilde', address: 'Av. Mitre 6789', cp: '1875' },
        { code: 'B1814', name: 'Sarandí', locality: 'Sarandí', address: 'Av. Mitre 2300', cp: '1872' },
        { code: 'B1815', name: 'Gerli', locality: 'Gerli', address: 'Av. Crisólogo Larralde 456', cp: '1823' },
        // Zona Norte
        { code: 'B1600', name: 'San Isidro', locality: 'San Isidro', address: 'Av. Centenario 456', cp: '1642' },
        { code: 'B1601', name: 'Martínez', locality: 'Martínez', address: 'Av. Santa Fe 2345', cp: '1640' },
        { code: 'B1602', name: 'Vicente López', locality: 'Vicente López', address: 'Av. Maipú 1234', cp: '1638' },
        { code: 'B1603', name: 'Olivos', locality: 'Olivos', address: 'Av. Maipú 2567', cp: '1636' },
        { code: 'B1604', name: 'Florida', locality: 'Florida', address: 'Av. San Martín 3456', cp: '1602' },
        { code: 'B1605', name: 'Munro', locality: 'Munro', address: 'Av. Vélez Sarsfield 4567', cp: '1605' },
        { code: 'B1606', name: 'San Fernando', locality: 'San Fernando', address: 'Constitución 1234', cp: '1646' },
        { code: 'B1607', name: 'Tigre Centro', locality: 'Tigre', address: 'Av. Cazón 567', cp: '1648' },
        { code: 'B1608', name: 'Don Torcuato', locality: 'Don Torcuato', address: 'Av. Avellaneda 789', cp: '1613' },
        { code: 'B1609', name: 'Pacheco', locality: 'General Pacheco', address: 'Av. del Libertador 1234', cp: '1617' },
        { code: 'B1610', name: 'Pilar Centro', locality: 'Pilar', address: 'Av. Caamaño 456', cp: '1629' },
        { code: 'B1611', name: 'Escobar', locality: 'Escobar', address: 'Tapia de Cruz 789', cp: '1625' },
        // Zona Oeste
        { code: 'B1700', name: 'Morón', locality: 'Morón', address: 'Av. Rivadavia 17890', cp: '1708' },
        { code: 'B1701', name: 'Haedo', locality: 'Haedo', address: 'Av. Rivadavia 16234', cp: '1706' },
        { code: 'B1702', name: 'Ramos Mejía', locality: 'Ramos Mejía', address: 'Av. de Mayo 456', cp: '1704' },
        { code: 'B1703', name: 'Ciudadela', locality: 'Ciudadela', address: 'Av. Rivadavia 11567', cp: '1702' },
        { code: 'B1704', name: 'Caseros', locality: 'Caseros', address: 'Av. San Martín 2345', cp: '1678' },
        { code: 'B1705', name: 'San Martín', locality: 'San Martín', address: 'Belgrano 3456', cp: '1650' },
        { code: 'B1706', name: 'José C. Paz', locality: 'José C. Paz', address: 'Hipólito Yrigoyen 4567', cp: '1665' },
        { code: 'B1707', name: 'San Miguel', locality: 'San Miguel', address: 'Paunero 1234', cp: '1663' },
        { code: 'B1708', name: 'Moreno Centro', locality: 'Moreno', address: 'Av. Libertador 567', cp: '1744' },
        { code: 'B1709', name: 'Merlo', locality: 'Merlo', address: 'Av. San Martín 2345', cp: '1722' },
        { code: 'B1710', name: 'Ituzaingó', locality: 'Ituzaingó', address: 'Av. Zufriategui 678', cp: '1714' },
        { code: 'B1711', name: 'Hurlingham', locality: 'Hurlingham', address: 'Av. Vergara 1234', cp: '1686' },
        // La Plata y alrededores
        { code: 'B1900', name: 'La Plata Centro', locality: 'La Plata', address: 'Calle 7 N° 890', cp: '1900' },
        { code: 'B1901', name: 'La Plata City Bell', locality: 'City Bell', address: 'Cantilo 456', cp: '1896' },
        { code: 'B1902', name: 'La Plata Gonnet', locality: 'Gonnet', address: 'Camino Centenario 5678', cp: '1897' },
        { code: 'B1903', name: 'Ensenada', locality: 'Ensenada', address: 'Ortiz de Rosas 456', cp: '1925' },
        { code: 'B1904', name: 'Berisso', locality: 'Berisso', address: 'Av. Montevideo 1234', cp: '1923' },
    ],

    // Córdoba
    X: [
        { code: 'X5000', name: 'Córdoba Centro', locality: 'Córdoba', address: 'Gral. Paz 70', cp: '5000' },
        { code: 'X5001', name: 'Nueva Córdoba', locality: 'Nueva Córdoba', address: 'Ob. Trejo 890', cp: '5000' },
        { code: 'X5002', name: 'Alberdi', locality: 'Alberdi', address: 'Colón 2345', cp: '5003' },
        { code: 'X5003', name: 'Alta Córdoba', locality: 'Alta Córdoba', address: 'Fragueiro 1234', cp: '5001' },
        { code: 'X5004', name: 'Güemes', locality: 'Güemes', address: 'Marcelo T. de Alvear 567', cp: '5000' },
        { code: 'X5005', name: 'San Vicente', locality: 'San Vicente', address: 'Jujuy 2345', cp: '5006' },
        { code: 'X5006', name: 'Villa Carlos Paz', locality: 'Villa Carlos Paz', address: 'San Martín 456', cp: '5152' },
        { code: 'X5007', name: 'Río Cuarto', locality: 'Río Cuarto', address: 'Gral. Paz 234', cp: '5800' },
        { code: 'X5008', name: 'Villa María', locality: 'Villa María', address: 'Buenos Aires 567', cp: '5900' },
        { code: 'X5009', name: 'San Francisco', locality: 'San Francisco', address: 'Bv. 25 de Mayo 890', cp: '2400' },
        { code: 'X5010', name: 'Bell Ville', locality: 'Bell Ville', address: 'Dorrego 123', cp: '2550' },
        { code: 'X5011', name: 'Jesús María', locality: 'Jesús María', address: 'San Martín 456', cp: '5220' },
        { code: 'X5012', name: 'Cosquín', locality: 'Cosquín', address: 'San Martín 789', cp: '5166' },
        { code: 'X5013', name: 'Alta Gracia', locality: 'Alta Gracia', address: 'Av. Belgrano 1234', cp: '5186' },
    ],

    // Santa Fe
    S: [
        { code: 'S2000', name: 'Rosario Centro', locality: 'Rosario', address: 'Córdoba 721', cp: '2000' },
        { code: 'S2001', name: 'Rosario Norte', locality: 'Rosario', address: 'Ovidio Lagos 1234', cp: '2000' },
        { code: 'S2002', name: 'Rosario Sur', locality: 'Rosario', address: 'Av. Pellegrini 4567', cp: '2000' },
        { code: 'S2003', name: 'Santa Fe Capital', locality: 'Santa Fe', address: '25 de Mayo 2456', cp: '3000' },
        { code: 'S2004', name: 'Rafaela', locality: 'Rafaela', address: 'Bv. Santa Fe 567', cp: '2300' },
        { code: 'S2005', name: 'Reconquista', locality: 'Reconquista', address: 'Patricio Diez 890', cp: '3560' },
        { code: 'S2006', name: 'Venado Tuerto', locality: 'Venado Tuerto', address: 'Belgrano 234', cp: '2600' },
        { code: 'S2007', name: 'Casilda', locality: 'Casilda', address: 'San Martín 567', cp: '2170' },
        { code: 'S2008', name: 'Esperanza', locality: 'Esperanza', address: 'Av. Lehmann 890', cp: '3080' },
        { code: 'S2009', name: 'Villa Constitución', locality: 'Villa Constitución', address: 'Av. San Martín 1234', cp: '2919' },
    ],

    // Mendoza
    M: [
        { code: 'M5500', name: 'Mendoza Centro', locality: 'Mendoza', address: 'San Martín 1201', cp: '5500' },
        { code: 'M5501', name: 'Godoy Cruz', locality: 'Godoy Cruz', address: 'San Martín Sur 456', cp: '5501' },
        { code: 'M5502', name: 'Guaymallén', locality: 'Guaymallén', address: 'Av. Acceso Este 789', cp: '5519' },
        { code: 'M5503', name: 'Las Heras', locality: 'Las Heras', address: 'Av. Acceso Norte 1234', cp: '5539' },
        { code: 'M5504', name: 'Maipú', locality: 'Maipú', address: 'Emilio Civit 567', cp: '5515' },
        { code: 'M5505', name: 'Luján de Cuyo', locality: 'Luján de Cuyo', address: 'San Martín 890', cp: '5507' },
        { code: 'M5506', name: 'San Rafael', locality: 'San Rafael', address: 'Hipólito Yrigoyen 234', cp: '5600' },
        { code: 'M5507', name: 'General Alvear', locality: 'General Alvear', address: 'San Martín 567', cp: '5620' },
        { code: 'M5508', name: 'Tunuyán', locality: 'Tunuyán', address: 'Belgrano 890', cp: '5560' },
        { code: 'M5509', name: 'San Martín', locality: 'San Martín', address: 'Av. Libertador 1234', cp: '5570' },
    ],

    // Tucumán
    T: [
        { code: 'T4000', name: 'Tucumán Centro', locality: 'San Miguel de Tucumán', address: '24 de Septiembre 567', cp: '4000' },
        { code: 'T4001', name: 'Yerba Buena', locality: 'Yerba Buena', address: 'Av. Aconquija 1234', cp: '4107' },
        { code: 'T4002', name: 'Banda del Río Salí', locality: 'Banda del Río Salí', address: 'Av. Belgrano 567', cp: '4109' },
        { code: 'T4003', name: 'Concepción', locality: 'Concepción', address: 'Av. Zorrilla 890', cp: '4146' },
        { code: 'T4004', name: 'Tafí Viejo', locality: 'Tafí Viejo', address: 'San Martín 234', cp: '4103' },
        { code: 'T4005', name: 'Monteros', locality: 'Monteros', address: 'Av. Juan B. Alberdi 567', cp: '4142' },
    ],

    // Salta
    A: [
        { code: 'A4400', name: 'Salta Centro', locality: 'Salta', address: 'España 702', cp: '4400' },
        { code: 'A4401', name: 'San Lorenzo', locality: 'San Lorenzo', address: 'Juan Carlos Dávalos 123', cp: '4401' },
        { code: 'A4402', name: 'Cerrillos', locality: 'Cerrillos', address: 'Av. Argentina 456', cp: '4403' },
        { code: 'A4403', name: 'Tartagal', locality: 'Tartagal', address: 'Warnes 789', cp: '4560' },
        { code: 'A4404', name: 'Orán', locality: 'San Ramón de la Nueva Orán', address: 'Pellegrini 234', cp: '4530' },
        { code: 'A4405', name: 'Metán', locality: 'Metán', address: '20 de Febrero 567', cp: '4440' },
        { code: 'A4406', name: 'Cafayate', locality: 'Cafayate', address: 'Güemes 123', cp: '4427' },
    ],

    // Entre Ríos
    E: [
        { code: 'E3100', name: 'Paraná Centro', locality: 'Paraná', address: 'Urquiza 540', cp: '3100' },
        { code: 'E3101', name: 'Concordia', locality: 'Concordia', address: 'Entre Ríos 456', cp: '3200' },
        { code: 'E3102', name: 'Gualeguaychú', locality: 'Gualeguaychú', address: 'Urquiza 789', cp: '2820' },
        { code: 'E3103', name: 'Concepción del Uruguay', locality: 'Concepción del Uruguay', address: 'Supremo Entrerriano 234', cp: '3260' },
        { code: 'E3104', name: 'Colón', locality: 'Colón', address: '12 de Abril 567', cp: '3280' },
        { code: 'E3105', name: 'Victoria', locality: 'Victoria', address: 'Congreso 890', cp: '3153' },
        { code: 'E3106', name: 'Villaguay', locality: 'Villaguay', address: 'San Martín 123', cp: '3240' },
    ],

    // Misiones
    N: [
        { code: 'N3300', name: 'Posadas Centro', locality: 'Posadas', address: 'Bolívar 1846', cp: '3300' },
        { code: 'N3301', name: 'Oberá', locality: 'Oberá', address: 'San Martín 567', cp: '3360' },
        { code: 'N3302', name: 'Eldorado', locality: 'Eldorado', address: 'Av. San Martín 1234', cp: '3380' },
        { code: 'N3303', name: 'Puerto Iguazú', locality: 'Puerto Iguazú', address: 'Av. Victoria Aguirre 567', cp: '3370' },
        { code: 'N3304', name: 'Apóstoles', locality: 'Apóstoles', address: 'Belgrano 890', cp: '3350' },
        { code: 'N3305', name: 'Leandro N. Alem', locality: 'Leandro N. Alem', address: 'San Martín 234', cp: '3315' },
    ],

    // Chaco
    H: [
        { code: 'H3500', name: 'Resistencia Centro', locality: 'Resistencia', address: 'J. M. Paz 241', cp: '3500' },
        { code: 'H3501', name: 'Barranqueras', locality: 'Barranqueras', address: 'Av. San Martín 567', cp: '3503' },
        { code: 'H3502', name: 'Sáenz Peña', locality: 'Presidencia Roque Sáenz Peña', address: 'San Martín 890', cp: '3700' },
        { code: 'H3503', name: 'Villa Ángela', locality: 'Villa Ángela', address: 'Güemes 234', cp: '3540' },
        { code: 'H3504', name: 'Charata', locality: 'Charata', address: '25 de Mayo 567', cp: '3730' },
    ],

    // Corrientes
    W: [
        { code: 'W3400', name: 'Corrientes Centro', locality: 'Corrientes', address: 'San Juan 789', cp: '3400' },
        { code: 'W3401', name: 'Goya', locality: 'Goya', address: 'Sarmiento 456', cp: '3450' },
        { code: 'W3402', name: 'Mercedes', locality: 'Mercedes', address: 'Pujol 890', cp: '3470' },
        { code: 'W3403', name: 'Curuzú Cuatiá', locality: 'Curuzú Cuatiá', address: 'Berón de Astrada 234', cp: '3460' },
        { code: 'W3404', name: 'Paso de los Libres', locality: 'Paso de los Libres', address: 'Colón 567', cp: '3230' },
    ],

    // San Juan
    J: [
        { code: 'J5400', name: 'San Juan Centro', locality: 'San Juan', address: 'Gral. Acha 123', cp: '5400' },
        { code: 'J5401', name: 'Rawson', locality: 'Rawson', address: 'San Martín 456', cp: '5425' },
        { code: 'J5402', name: 'Chimbas', locality: 'Chimbas', address: 'Av. José I. de la Roza 789', cp: '5413' },
        { code: 'J5403', name: 'Rivadavia', locality: 'Rivadavia', address: 'Maestras Lucio Lucero 234', cp: '5409' },
        { code: 'J5404', name: 'San Martín', locality: 'San Martín', address: 'Av. Libertador 567', cp: '5435' },
    ],

    // San Luis
    D: [
        { code: 'D5700', name: 'San Luis Centro', locality: 'San Luis', address: 'Av. Illia 567', cp: '5700' },
        { code: 'D5701', name: 'Villa Mercedes', locality: 'Villa Mercedes', address: 'Av. Mitre 890', cp: '5730' },
        { code: 'D5702', name: 'Merlo', locality: 'Merlo', address: 'Av. del Sol 234', cp: '5881' },
        { code: 'D5703', name: 'La Punta', locality: 'La Punta', address: 'Av. Universitaria 567', cp: '5710' },
    ],

    // Neuquén
    Q: [
        { code: 'Q8300', name: 'Neuquén Centro', locality: 'Neuquén', address: 'Santa Fe 43', cp: '8300' },
        { code: 'Q8301', name: 'Centenario', locality: 'Centenario', address: 'San Martín 456', cp: '8309' },
        { code: 'Q8302', name: 'Plottier', locality: 'Plottier', address: 'Av. San Martín 789', cp: '8316' },
        { code: 'Q8303', name: 'San Martín de los Andes', locality: 'San Martín de los Andes', address: 'Gral. Roca 234', cp: '8370' },
        { code: 'Q8304', name: 'Villa La Angostura', locality: 'Villa La Angostura', address: 'Av. Arrayanes 567', cp: '8407' },
        { code: 'Q8305', name: 'Zapala', locality: 'Zapala', address: 'Av. San Martín 890', cp: '8340' },
    ],

    // Río Negro
    R: [
        { code: 'R8500', name: 'Viedma', locality: 'Viedma', address: 'Buenos Aires 345', cp: '8500' },
        { code: 'R8501', name: 'Cipolletti', locality: 'Cipolletti', address: 'Roca 456', cp: '8324' },
        { code: 'R8502', name: 'General Roca', locality: 'General Roca', address: 'Av. Roca 789', cp: '8332' },
        { code: 'R8503', name: 'San Carlos de Bariloche', locality: 'San Carlos de Bariloche', address: 'Moreno 234', cp: '8400' },
        { code: 'R8504', name: 'Allen', locality: 'Allen', address: 'Av. Roca 567', cp: '8328' },
        { code: 'R8505', name: 'El Bolsón', locality: 'El Bolsón', address: 'San Martín 890', cp: '8430' },
    ],

    // Chubut
    U: [
        { code: 'U9100', name: 'Rawson', locality: 'Rawson', address: 'Mariano Moreno 38', cp: '9103' },
        { code: 'U9101', name: 'Trelew', locality: 'Trelew', address: 'San Martín 456', cp: '9100' },
        { code: 'U9102', name: 'Puerto Madryn', locality: 'Puerto Madryn', address: 'Roca 789', cp: '9120' },
        { code: 'U9103', name: 'Comodoro Rivadavia', locality: 'Comodoro Rivadavia', address: 'San Martín 1234', cp: '9000' },
        { code: 'U9104', name: 'Esquel', locality: 'Esquel', address: 'Alvear 567', cp: '9200' },
    ],

    // Santa Cruz
    Z: [
        { code: 'Z9400', name: 'Río Gallegos', locality: 'Río Gallegos', address: 'Roca 890', cp: '9400' },
        { code: 'Z9401', name: 'Caleta Olivia', locality: 'Caleta Olivia', address: 'San Martín 234', cp: '9011' },
        { code: 'Z9402', name: 'El Calafate', locality: 'El Calafate', address: 'Av. Libertador 567', cp: '9405' },
        { code: 'Z9403', name: 'Puerto Deseado', locality: 'Puerto Deseado', address: 'San Martín 890', cp: '9050' },
    ],

    // Tierra del Fuego
    V: [
        { code: 'V9410', name: 'Ushuaia', locality: 'Ushuaia', address: 'San Martín 309', cp: '9410' },
        { code: 'V9411', name: 'Río Grande', locality: 'Río Grande', address: 'Belgrano 456', cp: '9420' },
        { code: 'V9412', name: 'Tolhuin', locality: 'Tolhuin', address: 'Av. de los Shelknam 789', cp: '9412' },
    ],

    // Catamarca
    K: [
        { code: 'K4700', name: 'Catamarca Centro', locality: 'San Fernando del Valle de Catamarca', address: 'Rivadavia 750', cp: '4700' },
        { code: 'K4701', name: 'Valle Viejo', locality: 'Valle Viejo', address: 'Av. Virgen del Valle 234', cp: '4701' },
        { code: 'K4702', name: 'Andalgalá', locality: 'Andalgalá', address: 'Belgrano 567', cp: '4740' },
        { code: 'K4703', name: 'Tinogasta', locality: 'Tinogasta', address: 'Constitución 890', cp: '5340' },
    ],

    // La Rioja
    F: [
        { code: 'F5300', name: 'La Rioja Centro', locality: 'La Rioja', address: 'Pelagio B. Luna 567', cp: '5300' },
        { code: 'F5301', name: 'Chilecito', locality: 'Chilecito', address: 'Castro Barros 890', cp: '5360' },
        { code: 'F5302', name: 'Chamical', locality: 'Chamical', address: 'San Martín 234', cp: '5380' },
    ],

    // Jujuy
    Y: [
        { code: 'Y4600', name: 'Jujuy Centro', locality: 'San Salvador de Jujuy', address: 'Lamadrid 456', cp: '4600' },
        { code: 'Y4601', name: 'Palpalá', locality: 'Palpalá', address: 'Av. Savio 789', cp: '4612' },
        { code: 'Y4602', name: 'San Pedro', locality: 'San Pedro de Jujuy', address: 'Belgrano 234', cp: '4500' },
        { code: 'Y4603', name: 'Libertador General San Martín', locality: 'Libertador General San Martín', address: 'San Martín 567', cp: '4512' },
        { code: 'Y4604', name: 'Tilcara', locality: 'Tilcara', address: 'Belgrano 890', cp: '4624' },
        { code: 'Y4605', name: 'Humahuaca', locality: 'Humahuaca', address: 'Buenos Aires 234', cp: '4630' },
        { code: 'Y4606', name: 'La Quiaca', locality: 'La Quiaca', address: 'Av. España 567', cp: '4650' },
    ],

    // Santiago del Estero
    G: [
        { code: 'G4200', name: 'Santiago Centro', locality: 'Santiago del Estero', address: 'Tucumán 250', cp: '4200' },
        { code: 'G4201', name: 'La Banda', locality: 'La Banda', address: 'Av. Belgrano 567', cp: '4300' },
        { code: 'G4202', name: 'Termas de Río Hondo', locality: 'Termas de Río Hondo', address: 'San Martín 890', cp: '4220' },
        { code: 'G4203', name: 'Añatuya', locality: 'Añatuya', address: 'Belgrano 234', cp: '3760' },
        { code: 'G4204', name: 'Frías', locality: 'Frías', address: 'Av. Argentina 567', cp: '4230' },
    ],

    // Formosa
    P: [
        { code: 'P3600', name: 'Formosa Centro', locality: 'Formosa', address: 'Brandsen 601', cp: '3600' },
        { code: 'P3601', name: 'Clorinda', locality: 'Clorinda', address: 'San Martín 456', cp: '3610' },
        { code: 'P3602', name: 'Pirané', locality: 'Pirané', address: 'Belgrano 789', cp: '3620' },
    ],

    // La Pampa
    L: [
        { code: 'L6300', name: 'Santa Rosa', locality: 'Santa Rosa', address: 'Av. San Martín 123', cp: '6300' },
        { code: 'L6301', name: 'General Pico', locality: 'General Pico', address: 'Calle 14 N° 456', cp: '6360' },
        { code: 'L6302', name: 'Toay', locality: 'Toay', address: 'Av. Los Caldenes 789', cp: '6303' },
        { code: 'L6303', name: 'General Acha', locality: 'General Acha', address: 'San Martín 234', cp: '8200' },
    ],
};

// Helper para obtener localidades únicas de una provincia
export function getLocalidadesByProvincia(provinciaCode) {
    const sucursales = SUCURSALES_CORREO[provinciaCode] || [];
    const localidades = [...new Set(sucursales.map(s => s.locality))].sort();
    return localidades;
}

// Helper para obtener sucursales por provincia y opcionalmente localidad
export function getSucursales(provinciaCode, localidad = null) {
    let sucursales = SUCURSALES_CORREO[provinciaCode] || [];

    if (localidad) {
        sucursales = sucursales.filter(s => s.locality === localidad);
    }

    // Formatear para compatibilidad con el componente
    return sucursales.map(s => ({
        agency_id: s.code,
        agency_name: s.name,
        locality: s.locality,
        location: {
            street_name: s.address,
            city: s.locality,
            zip_code: s.cp
        }
    }));
}

// Contar total de sucursales
export function getTotalSucursales() {
    return Object.values(SUCURSALES_CORREO).reduce((acc, arr) => acc + arr.length, 0);
}

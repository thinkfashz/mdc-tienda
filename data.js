/* MDC Ferretería — datos de productos */
const PRODUCTS = [
  { id: "taladro", nombre: "Taladro Percutor 20V", marca: "MDC Pro", cat: "herramientas", precio: 54990, precioAntes: 69990, img: "assets/p-taladro.png", desc: "Taladro percutor a batería 20V con 2 baterías de litio, maletín y cargador rápido. Ideal para concreto, madera y metal." },
  { id: "amoladora", nombre: "Amoladora Angular 900W", marca: "MDC Pro", cat: "herramientas", precio: 32990, precioAntes: null, img: "assets/p-amoladora.png", desc: "Amoladora angular de 900W, disco 115mm. Compacta y potente para corte y desbaste de metal y piedra." },
  { id: "cemento", nombre: "Cemento Mortero 25 Kg", marca: "Cementos Bío Bío", cat: "construccion", precio: 6890, precioAntes: null, img: "assets/p-cemento.png", desc: "Cemento de albañilería en bolsa de 25 kg. Para mezclas, estucos y trabajos generales de construcción." },
  { id: "cable", nombre: "Cable Eléctrico 2x2.5 (100m)", marca: "Condumex", cat: "electricos", precio: 89990, precioAntes: 104990, img: "assets/p-cable.png", desc: "Rollo de cable eléctrico 2x2.5mm de 100 metros, uso domiciliario e industrial. Certificado SEC." },
  { id: "pintura", nombre: "Pintura Interior Blanco 4L", marca: "Pinturas Ceresita", cat: "ferreteria", precio: 22990, precioAntes: null, img: "assets/p-pintura.png", desc: "Pintura látex interior color blanco, bidón de 4 litros. Alto rendimiento y terminación mate premium." },
  { id: "juego-llaves", nombre: "Juego de Llaves Combinadas (12 pzs)", marca: "Stanley", cat: "herramientas", precio: 27990, precioAntes: null, img: "assets/p-herramientas.png", desc: "Set de 12 llaves combinadas de 8 a 19mm en acero cromo vanadio. Estuche compacto incluido." },
  { id: "metalcon", nombre: "Panel Metalcon 2.44m", marca: "Volcán", cat: "construccion", precio: 10990, precioAntes: null, img: "assets/p-metalcon.png", desc: "Panel de metalcon galvanizado de 2.44m para tabiquería y cielos. Perfil 89mm estándar." },
  { id: "valvula", nombre: "Válvula Paso Bronce 1/2\"", marca: "Gentec", cat: "electricos", precio: 4990, precioAntes: null, img: "assets/p-llaves.png", desc: "Válvula de paso en bronce cromado de 1/2 pulgada con manija roja. Para agua fría y caliente." },
  { id: "sierra", nombre: "Sierra Circular 1400W", marca: "MDC Pro", cat: "herramientas", precio: 64990, precioAntes: 79990, img: "assets/p-amoladora.png", desc: "Sierra circular de 1400W con disco 185mm, corte de hasta 65mm de profundidad. Guía paralela incluida." },
  { id: "fierro", nombre: "Fierro Estribo A640-60H", marca: "CAP", cat: "construccion", precio: 3290, precioAntes: null, img: "assets/p-metalcon.png", desc: "Estribo de fierro A640-60H de alta adherencia para hormigonado armado. Medida estándar 25x25cm." },
  { id: "tablero", nombre: "Tablero Eléctrico 12 Polos", marca: "Schneider", cat: "electricos", precio: 15990, precioAntes: null, img: "assets/p-cable.png", desc: "Tablero eléctrico empotrar de 12 polos con puerta transparente y riel DIN. Certificado." },
  { id: "sellante", nombre: "Sellante Acrílico 280ml", marca: "Aguila", cat: "ferreteria", precio: 3490, precioAntes: null, img: "assets/p-pintura.png", desc: "Sellante acrílico pintable de 280ml para juntas y filtraciones. Interior y exterior." },
];

const CATEGORIES = [
  { id: "herramientas", nombre: "Herramientas" },
  { id: "electricos", nombre: "Eléctricos" },
  { id: "construccion", nombre: "Construcción" },
  { id: "ferreteria", nombre: "Ferretería general" },
];
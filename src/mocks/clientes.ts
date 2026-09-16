import type { Cliente, Direccion } from "../types";

export const clientes: Cliente[] = [
  { id_cliente: "c1", nombre: "Laura Gómez", correo: "laura.gomez@gmail.com", telefono: "301 123 4567" },
  { id_cliente: "c2", nombre: "Andrés Ramírez", correo: "andres.ramirez@gmail.com", telefono: "310 987 6543" },
  { id_cliente: "c3", nombre: "Camila Torres", correo: "camila.torres@hotmail.com", telefono: "320 112 2334" },
  { id_cliente: "c4", nombre: "Juan Pablo Rojas", correo: "jp.rojas@gmail.com", telefono: "315 334 4556" },
  { id_cliente: "c5", nombre: "Valentina Suárez", correo: "vale.suarez@gmail.com", telefono: "300 778 8990" },
  { id_cliente: "c6", nombre: "Santiago Moreno", correo: "santiago.moreno@gmail.com", telefono: "318 223 3445" },
  { id_cliente: "c7", nombre: "Mariana Castro", correo: "mariana.castro@outlook.com", telefono: "312 667 7889" },
  { id_cliente: "c8", nombre: "Felipe Herrera", correo: "felipe.herrera@gmail.com", telefono: "319 556 6778" },
  { id_cliente: "c9", nombre: "Daniela Peña", correo: "daniela.pena@gmail.com", telefono: "304 445 5667" },
];

export const direcciones: Direccion[] = [
  { id_direccion: "d1", id_cliente: "c1", direccion: "Calle 85 #14-32, Chapinero", referencia: "Edificio azul, apto 502" },
  { id_direccion: "d2", id_cliente: "c3", direccion: "Carrera 15 #93-47, Chapinero Alto", referencia: "Casa esquinera, portón negro" },
  { id_direccion: "d3", id_cliente: "c5", direccion: "Calle 127 #45-12, Suba", referencia: "Al lado del parque principal" },
  { id_direccion: "d4", id_cliente: "c6", direccion: "Carrera 7 #116-20, Usaquén", referencia: "Torre B, apto 1201" },
  { id_direccion: "d5", id_cliente: "c9", direccion: "Calle 24 #68-55, Teusaquillo", referencia: "Conjunto Los Alpes, torre 3" },
];

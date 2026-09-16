import type { Usuario } from "../types";

export const usuarios: Usuario[] = [
  {
    id_usuario: "u1",
    nombre: "Danny Martínez",
    correo: "danny@dannytacos.co",
    rol: "admin",
  },
  {
    id_usuario: "u2",
    nombre: "Camila Ríos",
    correo: "camila@dannytacos.co",
    rol: "caja",
  },
  {
    id_usuario: "u3",
    nombre: "Andrés Pinzón",
    correo: "andres@dannytacos.co",
    rol: "cocina",
  },
];

export const usuarioActual = usuarios[0];

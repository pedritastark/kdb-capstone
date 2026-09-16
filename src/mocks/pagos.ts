import type { Pago } from "../types";

export const pagos: Pago[] = [
  { id_pago: "pago1", id_pedido: "ped1", medio: "nequi", estado: "reportado", valor: 50000, referencia: "NEQ-88213" },
  { id_pago: "pago2", id_pedido: "ped2", medio: "efectivo", estado: "confirmado", valor: 32000, referencia: "" },
  { id_pago: "pago3", id_pedido: "ped3", medio: "daviplata", estado: "pendiente", valor: 51000, referencia: "" },
  { id_pago: "pago4", id_pedido: "ped4", medio: "efectivo", estado: "confirmado", valor: 57000, referencia: "" },
  { id_pago: "pago5", id_pedido: "ped5", medio: "llave", estado: "reportado", valor: 56500, referencia: "LLV-55210" },
  { id_pago: "pago6", id_pedido: "ped6", medio: "nequi", estado: "confirmado", valor: 40000, referencia: "NEQ-77102" },
  { id_pago: "pago7", id_pedido: "ped7", medio: "efectivo", estado: "confirmado", valor: 48000, referencia: "" },
  { id_pago: "pago8", id_pedido: "ped8", medio: "daviplata", estado: "confirmado", valor: 24000, referencia: "DAV-33110" },
  { id_pago: "pago9", id_pedido: "ped9", medio: "nequi", estado: "reportado", valor: 50000, referencia: "NEQ-91004" },
  { id_pago: "pago10", id_pedido: "ped10", medio: "nequi", estado: "rechazado", valor: 18000, referencia: "NEQ-00021" },
];

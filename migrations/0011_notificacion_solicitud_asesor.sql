-- Danny Tacos — Chatbot: tipo de notificación para "hablar con alguien"
--
-- Cuando el cliente pide hablar con una persona desde el chatbot (/chat),
-- se crea una notificación para caja con este tipo.
-- (No se usa el valor nuevo dentro de esta misma migración, así que es
-- seguro correrla dentro de la transacción de migrate.ts.)

ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'solicitud_asesor';

#!/bin/sh
set -e
# Migraciones: idempotentes (schema_migrations), seguras en cada arranque.
npm run migrate
# Datos demo (menú, usuarios, usuario "Autopedido"). Usa ON CONFLICT DO NOTHING.
if [ "$SEED" = "true" ]; then npm run seed; fi
exec npm run start

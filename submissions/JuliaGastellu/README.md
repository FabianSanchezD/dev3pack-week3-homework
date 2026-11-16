# Mi contador por wallet

Creo un contador en Solana con Anchor y lo uso desde un cliente de consola con
Solana Kit. Cada wallet tiene su propia PDA; solo su autoridad puede incrementarla.

## Cómo lo ejecuto

Trabajo en Ubuntu/WSL con Node.js 24, Anchor 1.2.2, Solana CLI 4.1.2 y Rust estable.
Desde la carpeta `week3/submissions/JuliaGastellu` ejecuto:

```bash
npm ci
npm run build
npm run check
npm test
node scripts/test-local.mjs --demo
```

Para comprobar el desborde también ejecuto:

```bash
cd anchor
cargo +stable test --locked --lib
```

`npm test` y la demo inician un validador temporal, cargan el programa compilado
con `--bpf-program` y lo detienen al terminar. Necesito los puertos 8899, 8900 y
9900 libres. Genero las wallets de prueba en memoria y uso SOL del nodo local.

Compilo con `--no-idl` porque este cliente codifica las dos instrucciones
explícitamente. Uso `--ignore-keys` solo para este flujo local: el validador carga
el programa bajo el identificador fijo declarado en Rust, Anchor.toml y el cliente.
No necesito compartir la clave de despliegue que Anchor genera en `target/`.

## Qué construí

- `anchor/programs/wallet_counter/src/lib.rs`: creo e incremento el estado.
- `app/client.ts`: derivo la PDA, construyo instrucciones, firmo y leo el contador.
- `app/main.ts`: muestro una creación y un incremento de punta a punta.
- `tests/counter.test.ts`: compruebo el comportamiento contra el programa real.
- `scripts/test-local.mjs`: preparo y cierro el nodo de pruebas.

## Qué aprendo

Derivo la PDA con las semillas `counter` y la dirección de la wallet. Guardo el
bump canónico para validar esa misma dirección en las llamadas siguientes.
La cuenta ocupa 49 bytes: 8 del discriminador de Anchor, 32 de la autoridad,
8 del contador y 1 del bump.

Distingo al programa dueño de la cuenta de la wallet autorizada: mi programa
es el owner del estado; la clave guardada en `authority` indica quién puede
pedir cambios. Con `Signer` exijo su firma, con `has_one` compruebo su identidad
y con `seeds` y `bump` verifico la PDA. No confío solamente en el cliente.

Antes de sumar uso `checked_add`, así puedo devolver un error sin modificar el
valor cuando llego al máximo de `u64`. En el cliente uso `bigint` para leerlo.
Identifico cada instrucción y la cuenta con su discriminador de ocho bytes.

## Cómo lo verifiqué

El 16 de noviembre de 2026 compilé el programa y comprobé los tipos sin errores.
Pasaron siete tests contra el validador local y un test Rust de desborde:

1. Creo la PDA en cero con la autoridad, el bump y el tamaño esperados.
2. Incremento el estado hasta dos.
3. Mantengo contadores separados para dos wallets.
4. Rechazo una autoridad diferente.
5. Rechazo una llamada sin la firma de la autoridad.
6. Impido reinicializar una cuenta existente.
7. Envío una transacción cuyo segundo incremento falla: compruebo que el primero
   se revierte, el nodo confirma el fallo y la comisión se cobra igualmente.
8. Rechazo el desborde de `u64` sin cambiar el contador.

Los rechazos de autoridad, firma y reinicialización se comprueban por simulación.
La prueba de atomicidad sí envía una transacción al nodo con `skipPreflight` para
observar un fallo procesado. Uso esa opción solamente en el test negativo.

## Mi salida real de la demo

```text
Mi wallet: FSRZUFmJcBRkC18r84NFjxTJzqfr7KpXrW27u2S2fUaX
Mi PDA: FJq6fYHyniHX4H7hUG7FYHUcc6RAZ6oGzDKrsFfW8yGU
Firma de creación: 3tPsQ1wA2ByN2zp4kEyQyTKmvYy2ziDtBVz3GfxvraaDf83jgqx9LuH45pDh4bzPmerKSDopa3tNPtSeGQrAMNxK
Estado inicial: {
  authority: 'FSRZUFmJcBRkC18r84NFjxTJzqfr7KpXrW27u2S2fUaX',
  count: 0n,
  bump: 255,
  dataLength: 49
}
Firma de incremento: 3Xy7nDYetadMZdhiRoAoKG8VXVLRjwVwtJq6rBcefqyTHGKbnVDoDxcpm6X2aGSHAJF89tNxD5QGdVLRtftzTC9i
Estado final: {
  authority: 'FSRZUFmJcBRkC18r84NFjxTJzqfr7KpXrW27u2S2fUaX',
  count: 1n,
  bump: 255,
  dataLength: 49
}
```

Las direcciones y firmas cambian en cada ejecución. El identificador del programa
es `BLjHbkRuZczQxXeuKYi3jLVjJj6QDxE4YVSKGv487v61`, cargado en mi nodo local.
Esta prueba no es un despliegue en devnet ni una dirección pública para el campo
de certificación del portal.

## Material que consulto

- [Consigna de la semana 3](https://github.com/FabianSanchezD/dev3pack-week3-homework).
- [Restricciones de cuentas en Anchor](https://www.anchor-lang.com/docs/references/account-constraints).
- [Transacciones con Solana Kit](https://www.solanakit.com/docs/advanced-guides/transactions).

Usé IA para preparar esta propuesta y como apoyo para estudiar los conceptos.

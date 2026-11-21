# Museum Guestbook

Programa on-chain desarrollado con **Solana, Anchor y Rust** que permite a los visitantes dejar reseñas de los recorridos de un museo.

## Funcionalidades

- Crear recorridos turísticos mediante cuentas PDA.
- Registrar reseñas asociadas a cada recorrido.
- Almacenar el visitante, mensaje y timestamp de cada reseña.
- Mantener un contador de reseñas por recorrido.
- Validar la longitud de los textos y la duración del recorrido.

## Tecnologías

- Rust
- Solana
- Anchor Framework
- LiteSVM para pruebas

## Requisitos

- Rust y Cargo
- Solana CLI
- Anchor CLI

## Ejecución

Compila el programa:

```bash
anchor build
```

Ejecuta las pruebas:

```bash
cargo test --test museum_guestbook
```

## Estructura principal

```text
programs/
  museum_guestbook/
    src/
      lib.rs
    tests/
      museum_guestbook.rs
```

## Red

Las pruebas se ejecutan localmente mediante LiteSVM.

Además, el contrato se encuentra desplegado en Solana Devnet: https://explorer.solana.com/address/8kXcQPkzwhvKgKxDvhzQgb2dRnAFMi1ZTYz6ARYgSHq7?cluster=devnet

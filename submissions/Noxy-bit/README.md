# Entrega Week 3 - Noxy-bit

## Descripción del Programa

Programa on-chain en Solana desarrollado con **Anchor (v1.2.2)** y **Rust** que gestiona un contador de estado en una cuenta **PDA (Program Derived Address)** junto con transferencias de lamports mediante **CPI (Cross-Program Invocation)** hacia el System Program.

### Funcionalidades principales
- **`initialize`**: Crea e inicializa la cuenta PDA `Counter` derivada con la semilla `counter`, asigna la wallet firmante (`payer`) como `authority`, inicializa `count = 0` y realiza una transferencia de lamports por CPI al System Program.
- **`increment`**: Modifica el estado on-chain incrementando el valor almacenado en la cuenta PDA `Counter`.

## Estructura del Proyecto

~~~text
submissions/Noxy-bit/
├── Anchor.toml
├── Cargo.toml
├── programs/
│   └── guestbook/
│       ├── Cargo.toml
│       ├── src/
│       │   ├── lib.rs
│       │   ├── constants.rs
│       │   ├── error.rs
│       │   ├── state.rs
│       │   └── instructions/
│       │       ├── initialize.rs
│       │       └── increment.rs
│       └── tests/
│           └── test_initialize.rs
└── README.md
~~~

## Cómo compilar y correr los tests

1. Entrar a la carpeta de la entrega:
~~~bash
cd submissions/Noxy-bit
~~~

2. Compilar el programa y ejecutar la suite de pruebas (con `LiteSVM` / `Anchor`):
~~~bash
anchor test
~~~
*(O directamente con `cargo test`)*

## Salida de ejecución del test

~~~text
Finished `test` profile [unoptimized + debuginfo] target(s) in 6m 59s
Running unittests src/lib.rs (target/debug/deps/guestbook-ae286862aa7a5e5d)

running 0 tests
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

Running tests/test_initialize.rs (target/debug/deps/test_initialize-33d372d5d74b02b9)

running 1 test
test test_initialize ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.71s
~~~

# Cómo entregar tu app

Cada estudiante entrega su trabajo con un **pull request** a este repositorio. Todo tu proyecto va dentro de **una carpeta con tu usuario exacto de GitHub** (con sus mayúsculas).

## Estructura

Para el usuario de ejemplo `octocat`:

```text
submissions/
└── octocat/
    ├── README.md      # Qué hace tu app y cómo correrla
    ├── anchor/        # Programa Anchor y sus tests
    └── app/           # Frontend o cliente con Solana Kit
```

Los nombres `anchor/` y `app/` son una sugerencia; lo obligatorio es que **todo** esté dentro de `submissions/TU_USUARIO/` e incluya el `README.md`.

## Pasos

1. Hacé un fork de [este repositorio](https://github.com/FabianSanchezD/dev3pack-week3-homework) y cloná **tu fork**.
2. Creá una rama: `git checkout -b feat/TU_USUARIO`.
3. Creá tu carpeta: `mkdir -p submissions/TU_USUARIO`.
4. Construí tu mini app full stack dentro de esa carpeta.
5. Hacé commit, subí la rama a tu fork y abrí un pull request hacia `main` del repositorio original.
6. Completá el checklist de la plantilla del PR.

## Qué no debe incluir tu PR

- Cambios fuera de `submissions/TU_USUARIO/`.
- `node_modules`, `target/`, builds ni archivos `.env`.
- Claves privadas o wallets exportadas (por ejemplo, `id.json` o keypairs).

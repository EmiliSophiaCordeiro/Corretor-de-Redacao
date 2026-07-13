# Guia de Contribuição — Fluxo Git profissional

Este projeto adota um fluxo baseado em **Git Flow simplificado** com três tipos de branches:

- `main` — Produção. Somente código estável e aprovado manualmente.
- `develop` — Integração e homologação.
- `feature/*` — Toda nova funcionalidade ou correção.

## Regras obrigatórias

- ❌ **Nunca** commitar direto em `main`.
- ❌ **Nunca** commitar direto em `develop` sem Pull Request.
- ✅ Toda alteração nasce em uma branch `feature/*` criada a partir de `develop`.
- ✅ Merge em `main` requer aprovação manual + pipeline verde.

## Fluxo padrão

```text
feature/xyz  ──PR──►  develop  ──PR (release)──►  main
     ▲                   │                          │
     └── criada a partir │                          └── deploy manual em produção
         de develop      └── ambiente de homologação
```

### 1. Criar uma feature

```sh
git checkout develop
git pull origin develop
git checkout -b feature/<nome-descritivo>
# ex.: feature/login, feature/dashboard, feature/redacao,
#      feature/correcao, feature/ia, feature/pagamentos
```

### 2. Desenvolver e enviar

```sh
git add .
git commit -m "feat: descrição objetiva"
git push origin feature/<nome>
```

Abra Pull Request de `feature/*` → `develop`.

### 3. Integração em develop

Após revisão + pipeline verde, faça o merge em `develop`.
`develop` funciona como ambiente de homologação.

### 4. Release para produção

Quando `develop` estiver estável, abra PR de `develop` → `main`.
Merge em `main` **apenas** após aprovação manual.

## Pipelines (GitHub Actions)

| Workflow | Dispara em | Executa |
|---|---|---|
| `feature.yml` | push em `feature/**`, PR para `develop` | install, lint, test, build |
| `develop.yml` | push em `develop`, PR para `main` | install, lint, test, build, typecheck |
| `main.yml` | push em `main` | install, lint, test, build de produção |

Qualquer falha impede o merge (quando proteção de branch estiver ativa).

## Deploy

- ❌ `feature/*` nunca publica.
- ❌ `develop` nunca publica em produção (apenas homologação).
- ✅ Somente `main` publica em produção, **manualmente**.

## Configuração manual necessária no GitHub

O Lovable não consegue aplicar regras de proteção de branch — faça isso em
**Settings → Branches → Add branch protection rule**:

### Regra para `main`
- [x] Require a pull request before merging
- [x] Require approvals (mínimo 1)
- [x] Require status checks to pass before merging
  - Selecionar: `Validar produção`, `Validar develop / PR para main`
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings
- [x] Restrict pushes that create matching branches (bloquear push direto)

### Regra para `develop`
- [x] Require a pull request before merging
- [x] Require status checks to pass before merging
  - Selecionar: `Validar feature`
- [x] Restrict pushes (bloquear commits diretos)

### Criar as branches (se ainda não existirem)

```sh
git checkout main
git checkout -b develop
git push -u origin develop
```

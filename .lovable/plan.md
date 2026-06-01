## Objetivo
Melhorar contraste dos textos da sidebar (navbar lateral) no modo claro, sem alterar o modo escuro.

## Alterações

### 1. `src/index.css` — tokens da sidebar no `:root` (modo claro)
Escurecer as variáveis usadas pelos textos da sidebar:
- `--sidebar-foreground`: de `230 45% 14%` → `230 40% 8%` (quase preto azulado, contraste AAA sobre o fundo claro)
- `--sidebar-accent-foreground`: de `234 80% 22%` → `234 85% 15%` (texto escuro no hover)
- `--sidebar-accent`: manter `234 70% 92%` (fundo de hover suave em tom da paleta roxo/azul)

O bloco `.dark` permanece intacto.

### 2. `src/components/AppSidebar.tsx`
Nenhuma mudança estrutural — os links e botões já usam `text-sidebar-foreground` e `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`, então herdam automaticamente os novos valores.

Apenas reforçar legibilidade nos `SidebarGroupLabel` (rótulos "Principal", "Progresso", etc.):
- Trocar `text-sidebar-foreground/60` → `text-sidebar-foreground/75` para que os títulos de seção também fiquem nítidos no claro (no escuro continuam legíveis pois a base é branca).

### 3. Estado ativo (selected)
Continua usando `gradient-primary` (rosa→roxo) com `text-sidebar-primary-foreground` (branco) — já tem alto contraste em ambos os modos, sem alteração.

## Verificação
- Checar visualmente em desktop (1261px) e mobile (sidebar offcanvas) nos dois temas.
- Confirmar que hover, ativo e seleção continuam destacados.

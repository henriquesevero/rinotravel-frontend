# rinotravel-frontend

App do Rhino Travel, uma plataforma pessoal e colaborativa de gerenciamento de viagens. Um único código em React Native com Expo, publicado como web (SPA/PWA) e preparado para iOS e Android. Consome a API em [rinotravel-api](../rinotravel-api).

## O que já existe

| Área | Telas |
| --- | --- |
| Acesso | login, cadastro com código de convite, sessão persistida (SecureStore no celular, localStorage na web), splash |
| Painel | saudação, viagem em andamento ou próxima com contagem regressiva, agenda de hoje ou dos próximos dias, indicadores, suas viagens |
| Viagens | lista, criação, edição, exclusão, saída, transferência de posse, visão geral com indicadores e "a seguir" |
| Membros | adicionar, mudar papel, remover; a interface só oferece o que o servidor diz que cada papel pode |
| Roteiro | dias da viagem com a linha do tempo unificada (itens, voos, hospedagens, deslocamentos, reservas); criar, editar e excluir itens |
| Lugares | lista de desejos com prioridade, restaurantes com reserva e pratos, busca no Google (quando o servidor tem a chave), agendar um lugar no roteiro |
| Reservas | voos (fusos de cada aeroporto, duração calculada) e hospedagens (noites, código de confirmação) |
| Deslocamentos | deslocamentos em etapas, sugestão de rotas do Google (quando disponível), mapa com a rota A→B, abrir no app de mapas do celular e compartilhar |
| Documentos | envio com SHA-256, armazenamento no MongoDB via link assinado, abrir, renomear, visibilidade, excluir |

Computadores têm menu lateral (que vira uma barra de ícones em janelas estreitas); celulares têm barra inferior própria, que dentro de uma viagem mostra as seções dela e um menu "Mais".

**Ainda não existe:** trabalho offline. Os dados vêm da API por TanStack Query; o protocolo de sincronização do backend (pull por cursor e push de mutations) está pronto e documentado, mas o app ainda não mantém cópia local nem fila de alterações. iOS e Android ainda não foram testados em dispositivo.

## Stack

- Expo SDK 57, React 19, React Native 0.86, React Native Web, TypeScript 6 em modo estrito
- Expo Router (rotas em `src/app`, tipadas), React Compiler
- TanStack Query 5, `openapi-fetch` com tipos gerados de `../rinotravel-api/docs/openapi.yaml`
- react-hook-form e zod 4 nos formulários
- i18next com pt-BR e en; a paridade das chaves é checada em compilação e em teste
- Jest e Testing Library (unitários), Playwright (e2e, desktop e celular)
- ESLint 9 e Prettier

## Estrutura

```
src/
  app/          rotas (Expo Router): (auth), (app), trips/[id]/...
  core/         api, i18n, query, storage, datetime, forms, resource (hooks de CRUD)
  shared/       theme (tokens, breakpoints) e ui (design system)
  features/     auth, shell, dashboard, trips, itinerary, places, bookings,
                transfers, documents, content (peças comuns das seções da viagem)
e2e/            testes de ponta a ponta
```

Cada feature tem `api.ts` (chamadas tipadas), `hooks.ts` (TanStack Query), `schemas.ts` (zod), as folhas de formulário (`*Sheet.tsx`) e a tela. Toda escrita em uma viagem invalida `['content', tripId]`, então lista, linha do tempo e painel se atualizam juntos.

## Rodar

Pré-requisitos: Node (LTS) e a API rodando (`make db-up && make run` em rinotravel-api).

```sh
npm install
cp .env.example .env     # EXPO_PUBLIC_API_URL
npm run web              # ou: npm run ios / npm run android
```

No emulador Android, `localhost` é o próprio emulador: use `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080`.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run check` | formatação, lint, tipos e testes unitários (o gate) |
| `npm run api:types` | regenera `src/core/api/schema.d.ts` a partir do OpenAPI da API |
| `npm run build:web` | exporta o site estático em `dist/` |
| `npm run preview` | serve `dist/` com os mesmos cabeçalhos de segurança da Vercel |
| `npm run e2e` | build web isolado e Playwright (precisa do Mongo; usa API na porta 18080 e site na 3100, sem chave do Google) |

O mapa dos deslocamentos usa a **Maps Embed API** (gratuita e sem limite): é o próprio Google que desenha a rota, então nada de mapa ou rota é guardado no nosso banco, o que os termos do Google exigem. Ela precisa de uma chave de navegador em `EXPO_PUBLIC_GOOGLE_MAPS_EMBED_KEY`, restrita a essa API e aos endereços do site. Sem a chave, ou no app nativo, a tela mostra um cartão que abre o app de mapas com origem e destino preenchidos. Os botões "Abrir no Google Maps", "Abrir no Apple Maps" (só em aparelhos Apple) e "Compartilhar" funcionam sempre e não usam chave. Como o Metro guarda o valor das variáveis `EXPO_PUBLIC_*` no cache, use `expo export --clear` ao trocá-las.

Depois de mudar o OpenAPI da API, rode `npm run api:types`: se um contrato mudou, o `tsc` aponta o que quebrou. Uma mensagem de erro nova do servidor sem tradução também falha na compilação.

## Testes end-to-end

O Playwright usa o Chrome instalado e sobe o site estático em `:3100` e uma API própria em `:18080`, com banco separado (`rinotravel_e2e`) e sem chave do Google, então nunca mexe nos dados de demonstração nem gasta cota. Cada teste cria os próprios usuários pela API. Os projetos `desktop` e `mobile` rodam a mesma suíte.

## Deploy (Vercel)

1. Importe o repositório na Vercel. O `vercel.json` já define instalação, build (`npm run build:web`), saída (`dist`), o rewrite de SPA e os cabeçalhos de segurança.
2. Em *Environment Variables*, defina `EXPO_PUBLIC_API_URL` com a URL pública da API no Railway. Ela é embutida no build: mudar o valor exige novo deploy.
3. No Railway, inclua a URL da Vercel em `CORS_ALLOWED_ORIGINS`.
4. O CSP em `vercel.json` libera `https://*.up.railway.app` em `connect-src`. Se a API tiver domínio próprio, acrescente-o ali.

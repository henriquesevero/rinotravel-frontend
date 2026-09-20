# rinotravel-frontend

App do Rhino Travel, uma plataforma pessoal e colaborativa de gerenciamento de viagens. Um único código em React Native com Expo, publicado como web (SPA/PWA) e preparado para iOS e Android. Consome a API em [rinotravel-api](../rinotravel-api).

## O que já existe

| Área | Telas |
| --- | --- |
| Acesso | login, cadastro com código de convite, sessão persistida (SecureStore no celular, localStorage na web), splash |
| Painel | saudação, viagem em andamento ou próxima com contagem regressiva, agenda de hoje ou dos próximos dias, indicadores, suas viagens |
| Viagens | lista, criação, edição, exclusão, saída, transferência de posse, visão geral com indicadores e "a seguir" |
| Membros | adicionar, mudar papel, remover; a interface só oferece o que o servidor diz que cada papel pode |
| Roteiro | **mapa do dia** (todas as paradas em ordem com o horário de cada uma, o tempo e a distância de cada trajeto, quando sair e aviso de trecho apertado; escolha entre transporte, a pé ou carro); dias da viagem com a linha do tempo unificada (itens, voos, hospedagens, deslocamentos, reservas); criar, visualizar, editar e excluir itens, cada um com o mapa do seu local |
| Lugares | lista de desejos com prioridade, restaurantes com reserva e pratos, busca no Google com mapa do local no formulário (quando o servidor tem a chave), agendar um lugar no roteiro |
| Reservas | voos (fusos de cada aeroporto, duração calculada) e hospedagens (noites, código de confirmação) |
| Deslocamentos | deslocamentos em etapas, sugestão de rotas do Google (quando disponível), sugestões de lugares do Google nos campos, mapa com a rota A→B no formulário, abrir no app de mapas do celular e compartilhar |
| Documentos | envio com SHA-256, armazenamento no MongoDB via link assinado, abrir, renomear, visibilidade, excluir |

**Visualizar antes de editar:** clicar em qualquer registro (item do roteiro, lugar, restaurante, voo, hospedagem, deslocamento, documento) abre uma tela de visualização, com o mapa quando há local e os botões de abrir no app de mapas e compartilhar. O botão "Editar" fica dentro dela e só aparece para quem pode editar a viagem; leitores só visualizam.

Computadores têm menu lateral (que vira uma barra de ícones em janelas estreitas); celulares têm barra inferior própria, que dentro de uma viagem mostra as seções dela e um menu "Mais".

**Ainda não existe:** trabalho offline. Os dados vêm da API por TanStack Query; o protocolo de sincronização do backend (pull por cursor e push de mutations) está pronto e documentado, mas o app ainda não mantém cópia local nem fila de alterações. iOS e Android ainda não foram testados em dispositivo.

## Stack

- Fonte Inter embutida no app (`@expo-google-fonts/inter`), aplicada por um único componente `Text`
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

O mapa dos deslocamentos é uma imagem desenhada pelo servidor (Maps Static API), então a chave do Google fica só no backend e o front não precisa de nenhuma. Ele aparece no próprio formulário: ao escolher origem e destino nas sugestões do Google (busca de lugares), no computador o mapa fica numa coluna fixa ao lado do formulário. Nada do Google é guardado no banco. Os botões "Abrir no Google Maps", "Abrir no Apple Maps" (só em aparelhos Apple) e "Compartilhar" funcionam sempre e não usam chave. Sem a chave no servidor, ou se o Google falhar, aparece uma ilustração da rota no lugar do mapa.

O **mapa do dia** no roteiro tem dois modos. Sem chave de navegador, o servidor desenha o dia como imagem (pinos numerados e rotas), o que já mostra tudo. Com `EXPO_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` (uma chave de **navegador**, restrita à Maps JavaScript API e aos endereços do site, nunca a chave do servidor), o mapa vira o do Google de verdade: dá para mover, ampliar e clicar nos pinos, que se ligam à lista. Se o Google recusar a chave, a tela volta sozinha para a imagem. O servidor calcula os trechos na hora e não guarda nada do Google.

Depois de mudar o OpenAPI da API, rode `npm run api:types`: se um contrato mudou, o `tsc` aponta o que quebrou. Uma mensagem de erro nova do servidor sem tradução também falha na compilação.

## Testes end-to-end

O Playwright usa o Chrome instalado e sobe o site estático em `:3100` e uma API própria em `:18080`, com banco separado (`rinotravel_e2e`) e sem chave do Google, então nunca mexe nos dados de demonstração nem gasta cota. Cada teste cria os próprios usuários pela API. Os projetos `desktop` e `mobile` rodam a mesma suíte.

## Deploy (Vercel)

1. Importe o repositório na Vercel. O `vercel.json` já define instalação, build (`npm run build:web`), saída (`dist`), o rewrite de SPA e os cabeçalhos de segurança.
2. Em *Environment Variables*, defina `EXPO_PUBLIC_API_URL` com a URL pública da API no Railway. Ela é embutida no build: mudar o valor exige novo deploy.
3. No Railway, inclua a URL da Vercel em `CORS_ALLOWED_ORIGINS`.
4. O CSP em `vercel.json` libera `https://*.up.railway.app` em `connect-src`. Se a API tiver domínio próprio, acrescente-o ali.

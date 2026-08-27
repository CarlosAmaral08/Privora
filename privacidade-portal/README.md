# Portal de Conscientização sobre Privacidade e LGPD

Protótipo acadêmico (Projeto Integrador) que educa sobre privacidade e LGPD **enquanto demonstra na
prática** uma coleta de dados mínima, transparente e controlável pelo usuário.

## Objetivo

O site não é um produto comercial. É um sistema pequeno e coerente com a própria mensagem: não coleta
mais dados do que precisa, mostra a qualquer momento o que sabe sobre o visitante, e deixa exportar ou
apagar tudo isso com um clique.

## Arquitetura

```
React/Vite (TypeScript)
       ↓  fetch com cookie de sessão
Spring Boot REST API
       ↓
Controller → Service → Repository (Spring Data JPA)
       ↓
H2 (arquivo local)
```

- **Frontend**: React + Vite + TypeScript, sem biblioteca de UI pesada (CSS simples e responsivo).
- **Backend**: Java 21 + Spring Boot (Web, Data JPA, Bean Validation), API REST.
- **Banco**: H2 em arquivo (`backend/data/privacydb`), para poder inspecionar os dados durante a
  apresentação.
- **Identificação do usuário**: sem login. Na primeira visita o backend gera um UUID anônimo, salva no
  banco e devolve num cookie `HttpOnly`. Nas próximas visitas o mesmo usuário é reconhecido pelo cookie.
  Nenhum dado pessoal (nome, e-mail, CPF, localização, fingerprint) é coletado.

## Stack e dependências

| Camada    | Tecnologia                                              |
|-----------|-----------------------------------------------------------|
| Frontend  | React 19, TypeScript, Vite, react-router-dom               |
| Backend   | Java 21, Spring Boot 3.3, Spring Web, Spring Data JPA, Bean Validation |
| Banco     | H2 (arquivo)                                               |
| Ferramentas | IntelliJ IDEA (backend) e VS Code (frontend)              |

## Como rodar o backend

1. Abra a pasta `backend/` no IntelliJ (ele detecta o `pom.xml` e baixa as dependências do Maven
   Central automaticamente — é preciso estar com internet na primeira vez).
2. Rode a classe `PrivacidadePortalApplication` (botão ▶ do IntelliJ), ou via terminal:
   ```
   cd backend
   mvn spring-boot:run
   ```
3. A API sobe em `http://localhost:8080`. O arquivo do banco é criado em `backend/data/privacydb.mv.db`.

## Como rodar o frontend

1. Pré-requisito: Node.js instalado.
2. No terminal (pode usar o terminal do VS Code):
   ```
   cd frontend
   npm install
   npm run dev
   ```
3. O site abre em `http://localhost:5173`. Ele já está configurado (`.env.example` → copie para `.env`
   se quiser mudar a URL da API) para chamar o backend em `http://localhost:8080/api`.

Rode o backend **antes** do frontend, senão a primeira chamada (`POST /api/session`) vai falhar.

## Como acessar o console do H2

Com o backend rodando, acesse `http://localhost:8080/h2-console` no navegador.

- JDBC URL: `jdbc:h2:file:./data/privacydb`
- Usuário: `sa`
- Senha: (em branco)

O console só fica disponível em desenvolvimento (não é seguro deixar isso ligado em produção).

## Como resetar o banco

Pare o backend e apague a pasta `backend/data/`. Na próxima vez que subir, o Spring recria as tabelas
vazias (`ddl-auto=update`).

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/session` | Cria ou reconhece a sessão anônima (cookie) |
| GET | `/api/me` | Dados básicos da sessão atual |
| GET | `/api/me/data` | Painel completo "o que sabemos sobre você" |
| GET | `/api/me/rfv` | RFV atual do usuário |
| POST | `/api/events` | Registra um evento (recalcula o RFV) |
| GET | `/api/consents` | Lista os consentimentos atuais |
| PUT | `/api/consents` | Atualiza um ou mais consentimentos |
| POST | `/api/quiz` | Envia o resultado do quiz |
| GET | `/api/export` | Exporta todos os dados do usuário (JSON) |
| DELETE | `/api/me` | Apaga todos os dados do usuário e a sessão |
| GET | `/api/dashboard` | Métricas agregadas de todos os usuários |

## RFV (Recência / Frequência / Valor)

RFV adaptado para engajamento educativo, não para valor financeiro. Cada componente vira um dígito de
1 a 5 e o código é posicional — `RFV = R F V` — **não é a soma** dos três números. `155` é um perfil
diferente de `551`, mesmo tendo a mesma soma (igual às permissões `rwx` do Linux, onde a posição
importa).

- **Recência**: dias desde o último evento relevante (5 = até 7 dias ... 1 = mais de 90 dias).
- **Frequência**: quantidade de eventos relevantes (5 = 8+ ... 1 = nenhum).
- **Valor**: profundidade da ação mais avançada já feita (1 = viu conteúdo ... 5 = ação prática como
  mudar consentimento, exportar ou apagar dados).

Segmentos fixos: `555` Campeão, `511` Recém-chegado, `155` Fiel em risco, `551` Engajado superficial,
`111` Inativo. Qualquer outra combinação vira `OUTRO_PERFIL`.

## Consentimento

Banner com três opções de peso visual igual: recusar opcionais, aceitar só preferências, aceitar tudo.
A categoria "Necessários" nunca pode ser desligada (é o que mantém a sessão funcionando). Tudo pode ser
revisto e alterado a qualquer momento na página `/settings`.

## Limitações do protótipo

- Sem autenticação real — é proposital, o projeto usa identificação anônima por design.
- H2 em arquivo não é adequado para produção com múltiplos usuários simultâneos reais; serve bem para
  demonstração e desenvolvimento.
- O dashboard não faz nenhuma anonimização adicional além de já trabalhar só com agregados — com poucos
  usuários de teste, os números tendem a ficar "redondos" (ex.: 100%).
- Não há testes automatizados neste protótipo inicial.

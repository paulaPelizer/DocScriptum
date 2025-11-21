# 🗂️ **DocScriptum — Sistema de Gestão e Controle de Documentos Técnico-científicos**

> 🚀 *Projeto de Conclusão de Curso — + Pra Ti / CODIFICA.Edu*  
> 👩‍💻 **Autora:** Paula Dantas de Oliveira Pelizer
> 📅 **Ano:** 2025  
> 📦 **Repositório:** [github.com/paulaPelizer/DocScriptum](https://github.com/paulaPelizer/DocScriptum)

---

## 📑 **Sumário**

1. [Sobre o projeto](#-sobre-o-projeto)
2. [Arquitetura e tecnologias](#-arquitetura-e-tecnologias)
3. [Regras de negócio e funcionalidades](#-regras-de-negócio-e-funcionalidades)
4. [Automações e validações](#-automações-e-validações)
5. [Layout e design da interface](#-layout-e-design-da-interface)
6. [Estrutura do repositório](#-estrutura-do-repositório)
7. [Requisitos e dependências](#-requisitos-e-dependências)
8. [Como rodar localmente](#-como-rodar-localmente)
9. [Futuras implementações](#-futuras-implementações)
10. [Créditos e autoria](#-créditos-e-autoria)

---

## 🧭 **Sobre o projeto**

O **DocScriptum** é um sistema web completo para **gestão documental e controle de documentos técnico-administrativos e técnico-científicos**, desenvolvido em **Java Spring Boot (backend)** e **React + TypeScript (frontend)**.  

Tem como objetivo **automatizar fluxos de tramitação de documentos técnicos e arquivísticos**, implementando práticas de **governança digital** e **cadeia de custódia informacional**, em conformidade com diretrizes arquivísticas e normas de gestão documental.

### 🎯 Objetivos principais
- Cadastrar, importar e controlar documentos técnicos (técnico-administrativos e técnico-científicos).
- Gerar e versionar **GRDs (Guias de Remessa de Documentação)**.
- Vincular documentos administrativos e técnico-científicos a elementos de composição dos projetos (parceiros, recursos, requests, metadados e padados).
- Automatizar a tramitação documental e seu registro histórico, por meio de conexões entre: dados, metadados e paradados; transações e tramitações.
- Controlar perfis de usuários e fluxos de autorização por rotas (em melhoria).
- Integrar-se futuramente a serviços externos (RDC's, ECM's e ERP's).

Obs.: Futuramente será possível ajustar o fluxo do processo de tramitação de documentos para a gestão de projetos, com import de variados frameworks por áres de negócio, bem como definição de layouts para gerenciamento de documentos com base em modelos de governança arquivística e parâmetros de qualidade de Normas Regulamentadores (ISO's). 

---

## 🧮 **Arquitetura e tecnologias**

| Camada        | Tecnologia / Ferramenta                              | Descrição |
|----------------|------------------------------------------------------|------------|
| **Backend**    | Java 17 / Spring Boot 3                              | API REST principal |
|                | Spring Security + JWT                                | Autenticação e controle de perfis |
|                | Spring Data JPA + Hibernate                          | ORM e persistência |
|                | SQL Server (ou MySQL)                                | Banco de dados relacional |
| **Frontend**   | React + Vite + TypeScript                            | SPA modular e reativa |
|                | Tailwind CSS + ShadCN UI + Lucide Icons              | Layout responsivo e moderno |
| **Infra**      | Maven / Node.js / Git                                | Build e versionamento |
| **Extras**     | Docker, Swagger, Power BI (planejados)               | Implantação e documentação futura |

---

## ⚙️ **Regras de negócio e funcionalidades**

### 🔐 Autenticação e controle de acesso
- Perfis: `DBA`, `ADMIN`, `RESOURCE`, `USER`.
- Cadastro mediante **token de autorização** (configurado no `application.yml`).
- Login com **JWT** e armazenamento seguro no `localStorage`.
- Sessão via cookie como fallback alternativo.

---

### 📁 Módulos principais

#### 🔸 Login e Registro
- Tela inicial de login com fundo em vídeo.
- Modal de registro com:
  - Token de autorização.
  - Usuário (login).
  - E-mail (validação e persistência).
  - Senha e confirmação.
- Criação de perfil automática com base no token (DBA, ADMIN, RESOURCE, USER).

#### 🔸 Projetos
- Cadastro de projetos vinculados a clientes.
- Controle de status, datas de início e previsão de fim.
- Relação 1:N com documentos técnicos.

#### 🔸 Documentos
- Upload e cadastro de documentos vinculados a projetos.
- Campos técnicos e tipologias com validação obrigatória (Seguindo parâmetros de qualidade de cada área de negócio - ISO's).
- Persistência via endpoints REST e integração futura com repositórios externos confiáveis (Seguindo parâmetros e requisitos do Conarq para preservação digital de documentos).

#### 🔸 GRDs (Guias de Remessa de Documentação)
- Geração automática a partir das solicitações (`requests`).
- Associação direta com documentos técnicos (Paradados).
- Controle de versão e histórico de tramitação (Metadados).

#### 🔸 Requests (Solicitações)
- Interface para geração e acompanhamento de GRDs (Documento técnico-administrativo de composição de projetos).
- Controle de status e relatórios de entrega técnica - Dashboards e Proposta de Mensageria (Gestão e Planejamento de projetos alinhados a perspectivas de Escrituração e Fiscalização Financeira).

---

## 🤖 **Automações e validações**

- 🔄 **Validação JWT automática**: expiração limpa `localStorage` e força novo login.  
- 👥 **Controle de perfis (RBAC)**: telas e ações habilitadas conforme o papel.  
- 🧠 **Pós-upload automatizado (em desenvolvimento)**: ML extrai metadados técnicos e preenche informações no banco.  
- 🔁 **Retorno pós-login**: guarda rota anterior (`auth:returnTo`) e redireciona após autenticação.  
- 📨 **Envio de e-mails de redefinição de senha**: integração com spring.mail via Gmail, com suporte a senha de app e token de recuperação.  

---

## 🎨 **Layout e design da interface**

- Design em **glassmorphism** com transparências suaves e gradientes.
- **Vídeo de fundo animado** na tela de login (`public/videos`).
- **Modo claro e escuro** com ajustes personalizados.
- Ícones vetoriais via **Lucide-react**.
- Padrão de tipografia: minimalista e legível.
- Layout modular com navegação por rotas (`react-router-dom`).

---

## 🧩 Requisitos e dependências

🔸 Backend

- Java 17+

- Maven 3.9+

- SQL Server ou MySQL

- Spring Boot 3

- Spring Security

- JWT

🔸 Frontend

- Node.js 18+

- NPM, Yarn ou PNPM

- React 18+

- Vite, Tailwind CSS, TypeScript

## 💻 Como rodar localmente

1️⃣ Clonar o repositório
git clone https://github.com/paulaPelizer/DocScriptum.git
cd DocScriptum/docflow-fullstack

2️⃣ Configurar e rodar o backend
cd backend


Crie um banco no SQL Server e configure o arquivo application.yml:

spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=docflow;encrypt=false
    username: SA
    password: senha123
  jpa:
    hibernate:
      ddl-auto: update
  mail:
    host: smtp.gmail.com
    port: 587
    username: seuemail@dominio.com
    password: token_app
app:
  auth:
    registration:
      dba-token: TOKEN_DBA
      admin-token: TOKEN_ADMIN
      resource-token: TOKEN_RESOURCE


Depois rode:

mvn spring-boot:run


Servidor:

http://localhost:8080

3️⃣ Rodar o frontend
cd ../frontend/apps/web
npm install
npm run dev


Frontend:

http://localhost:5173

4️⃣ Após configurados bancos de dados de ambiente para acesso local, o usuário deve criar suas credenciais de acesso em "Cadastrar Novo Usuário".

- É preciso inserir um dos tokens de acesso para autorização do cadastro (a ideia é que estes tokens sejam enviados formalmente em projetos reais)
- Após o cadastro de usuário, é possível acessar as páginas e realizar procedimentos inerentes ao modelo standard de gestão do sistema 
- O backend deve estar rodando localmente ou hospedado em serviço externo.

## 🧱 **Estrutura do repositório**

```bash
docflow-fullstack/
├── backend/
│   ├── src/main/java/com/adi/docflow/
│   │   ├── model/           # Entidades (AppUser, Project, Document, etc.)
│   │   ├── repository/      # Interfaces JPA
│   │   ├── web/             # Controllers (AuthController, ProjectController, etc.)
│   │   ├── config/          # Segurança, JWT, Beans e filtros
│   │   └── service/         # Regras de negócio e serviços
│   └── src/main/resources/
│       └── application.yml  # Configurações de ambiente
│
└── frontend/
    └── apps/web/
        ├── src/pages/       # Páginas (Login, Projects, Documents, Requests)
        ├── src/services/    # APIs e autenticação
        ├── src/components/  # Componentes UI reutilizáveis
        └── public/videos/   # Vídeos do background
````

# 🧭 **Futuras implementações**


🔐 Expansão do módulo de notificações por e-mail (incluindo: alertas automáticos de tramitação documental, vencimentos de GRD, proximidade de marcos contratuais do projeto, avisos de workflow e prqzos de guarda dos documentos em cada fase do seu ciclo de vida)

📦 Integração com repositórios externos (RDC', ECM', ERP's).

⚙️ Automatização da geração e versionamento de GRDs.

🧠 Inteligência artificial para extração automática de metadados (Hoje o sistema possui um script para leitura superficial, mas futuramente será disponibilizado ML com ampla base de dados de templates de documentos em variadas áreas de negócio).

🧱 Docker Compose para padronizar ambientes dev/prod.

📘 Documentação completa de APIs com Swagger.

📊 Ativação das páginas com dados Mockados (Dashboard, Planejamento, Mensageria).

📁 Conexões com RDC de forma nativa (Sistema Arquivematica em análise - Código Aberto).


# 👩‍💻 **Créditos e autoria**

Desenvolvido por:
👩‍💻 Paula Dantas de Oliveira Pelizer.

🔸 Desenvolvedora Fullstack.

🎓 Graduanda em Engenharia da Computação (FUMEC) e Arquivologia (UFMG).

🎓 Mestre em Educação pela UFMG.

🎓 Graduada em Psicologia (Newton) e Pedagogia (UEMG).

💡 “Ao gerir informações técnico-científicas em diferentes contextos, atuamos como guardiões do patrimônio intelectual da humanidade.”

# 🎮 Games API - CRUD Avançado

API RESTful para gerenciamento de um catálogo de jogos, construída em Node.js com Express e banco de dados SQLite. Este projeto inclui autenticação segura com JWT, relacionamentos entre tabelas (JOINs) e testes automatizados.

---

## 🛠️ Tecnologias Utilizadas
* **Ambiente:** Node.js
* **Framework:** Express
* **Banco de Dados:** SQLite (bibliotecas `sqlite3` e `sqlite`)
* **Segurança:** JSON Web Token (JWT) e BcryptJS
* **Testes:** Jest e Supertest

---

## ⚙️ Instruções de Instalação e Execução

1. **Clone o repositório e acesse a pasta:**
   \`\`\`bash
   git clone https://github.com/EduardoBitto/Trabalho03-API.git
   cd Trabalho03-API
   \`\`\`

2. **Instale as dependências:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Inicie o servidor:**
   \`\`\`bash
   node index.js
   \`\`\`
   *(Na primeira execução, o banco de dados `games_database.db` será criado automaticamente com dados iniciais de desenvolvedoras, jogos e um usuário administrador).*

---

## 🧪 Como Rodar os Testes

O projeto conta com testes automatizados para validar o funcionamento das rotas e a segurança da API. Para executá-los, utilize o comando:

\`\`\`bash
npm test
\`\`\`

---

## 🔐 Autenticação (JWT)

As rotas de criação, edição e exclusão de jogos estão protegidas. Para acessá-las, é necessário gerar um token.

* **Usuário padrão:** `admin`
* **Senha:** `123456`

Faça uma requisição `POST` para `/login` com essas credenciais. O token devolvido deve ser enviado no Header das requisições protegidas da seguinte forma:
* **Key:** `Authorization`
* **Value:** `Bearer SEU_TOKEN_AQUI`

---

## 📌 Documentação das Rotas

### 1. Autenticação
* **POST `/login`**
  * **Body:** `{ "username": "admin", "senha": "123456" }`
  * **Retorno:** Token JWT válido por 1 hora.

### 2. Jogos (Públicas)
* **GET `/jogos`**
  * Lista todos os jogos. Traz o nome da desenvolvedora automaticamente através de um JOIN.
  * **Filtros opcionais (Query Params):** `?genero=RPG&ordem=desc&limite=5`
* **GET `/jogos/:id`**
  * Busca os detalhes de um jogo específico pelo ID.

### 3. Jogos (Protegidas - Requer Token)
* **POST `/jogos`**
  * Adiciona um novo jogo.
  * **Body esperado:**
    \`\`\`json
    {
      "titulo": "Ghost of Tsushima",
      "desenvolvedora_id": 1,
      "ano": 2020,
      "genero": "Ação",
      "nota": 9.5
    }
    \`\`\`
* **PUT `/jogos/:id`**
  * Atualiza as informações de um jogo existente.
* **DELETE `/jogos/:id`**
  * Remove um jogo do banco de dados pelo ID.
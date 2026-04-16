const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 80;
const SECRET_KEY = "chave_super_secreta_api"; // Em produção, use variáveis de ambiente (.env)

app.use(express.json());
app.set('json spaces', 2);

let db;

// --- MIDDLEWARE DE AUTENTICAÇÃO JWT ---
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });

    jwt.verify(token, SECRET_KEY, (err, usuario) => {
        if (err) return res.status(403).json({ erro: "Token inválido ou expirado." });
        req.usuario = usuario;
        next();
    });
}

// --- CONFIGURAÇÃO DO BANCO (Com Relacionamentos e Usuários) ---
async function setupDatabase() {
    db = await open({ filename: './games_database.db', driver: sqlite3.Database });

    // Tabela de Usuários (JWT)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL
        )
    `);

    // Tabela de Desenvolvedoras
    await db.exec(`
        CREATE TABLE IF NOT EXISTS desenvolvedoras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL
        )
    `);

    // Tabela de Jogos com Chave Estrangeira
    await db.exec(`
        CREATE TABLE IF NOT EXISTS jogos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            desenvolvedora_id INTEGER NOT NULL,
            ano INTEGER NOT NULL,
            genero TEXT NOT NULL,
            nota REAL NOT NULL,
            FOREIGN KEY(desenvolvedora_id) REFERENCES desenvolvedoras(id)
        )
    `);

    // Inserir dados iniciais se estiver vazio
    const count = await db.get("SELECT COUNT(*) as total FROM jogos");
    if (count.total === 0) {
        // Criação de usuário Admin padrão (senha: 123456)
        const salt = await bcrypt.genSalt(10);
        const hashSenha = await bcrypt.hash("123456", salt);
        await db.run("INSERT INTO usuarios (username, senha) VALUES (?, ?)", ['admin', hashSenha]);

        // Inserindo Desenvolvedoras
        await db.exec(`
            INSERT INTO desenvolvedoras (id, nome) VALUES 
            (1, 'Nintendo'), (2, 'FromSoftware'), (3, 'CD Projekt Red'), (4, 'Rockstar Games')
        `);

        // Inserindo Jogos (Relacionados às desenvolvedoras)
        await db.exec(`
            INSERT INTO jogos (titulo, desenvolvedora_id, ano, genero, nota) VALUES
            ('Zelda: Breath of the Wild', 1, 2017, 'Aventura', 9.7),
            ('Elden Ring', 2, 2022, 'RPG', 9.6),
            ('The Witcher 3', 3, 2015, 'RPG', 9.5),
            ('Red Dead Redemption 2', 4, 2018, 'Mundo Aberto', 9.7)
        `);
        console.log("✅ Banco recriado com JOINs e Autenticação pronta!");
    }
}

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/login', async (req, res) => {
    const { username, senha } = req.body;
    const usuario = await db.get("SELECT * FROM usuarios WHERE username = ?", [username]);

    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ erro: "Senha incorreta" });

    const token = jwt.sign({ id: usuario.id, username: usuario.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ mensagem: "Login bem-sucedido", token });
});

// --- ROTAS DO CRUD ---

// GET /jogos (Agora com JOIN para buscar o nome da desenvolvedora)
app.get('/jogos', async (req, res) => {
    try {
        const rows = await db.all(`
            SELECT j.id, j.titulo, j.ano, j.genero, j.nota, d.nome AS desenvolvedora 
            FROM jogos j
            JOIN desenvolvedoras d ON j.desenvolvedora_id = d.id
        `);
        res.json({ dados: rows });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao buscar jogos" });
    }
});

// POST /jogos (Protegida)
app.post('/jogos', verificarToken, async (req, res) => {
    const { titulo, desenvolvedora_id, ano, genero, nota } = req.body;
    try {
        const result = await db.run(
            "INSERT INTO jogos (titulo, desenvolvedora_id, ano, genero, nota) VALUES (?, ?, ?, ?, ?)",
            [titulo, desenvolvedora_id, ano, genero, nota]
        );
        res.status(201).json({ id: result.lastID, titulo, mensagem: "Jogo criado com sucesso!" });
    } catch (err) {
        res.status(500).json({ erro: "Erro ao inserir jogo" });
    }
});

// DELETE /jogos/:id (Protegida)
app.delete('/jogos/:id', verificarToken, async (req, res) => {
    const result = await db.run("DELETE FROM jogos WHERE id = ?", [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ erro: "Jogo não encontrado" });
    res.json({ mensagem: "Jogo removido com sucesso!" });
});

// Exporta o app e o banco para testes, ou inicia o servidor se rodar direto
if (require.main === module) {
    setupDatabase().then(() => {
        app.listen(PORT, () => console.log(`🚀 API rodando em http://localhost:${PORT}`));
    });
}

module.exports = { app, setupDatabase };
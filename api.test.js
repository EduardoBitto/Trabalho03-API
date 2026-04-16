const request = require('supertest');
const { app, setupDatabase } = require('./index.js'); // Importa nosso app

beforeAll(async () => {
    // Configura o banco de dados antes de iniciar os testes
    await setupDatabase();
});

describe('Testes da API de Jogos', () => {
    it('Deve listar os jogos com status 200 (GET /jogos)', async () => {
        const res = await request(app).get('/jogos');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('dados');
        expect(Array.isArray(res.body.dados)).toBeTruthy();
    });

    it('Deve negar acesso ao criar um jogo sem Token (POST /jogos)', async () => {
        const res = await request(app).post('/jogos').send({
            titulo: "Novo Jogo", desenvolvedora_id: 1, ano: 2024, genero: "Ação", nota: 9.0
        });
        expect(res.statusCode).toEqual(401); // 401 Unauthorized
    });
});
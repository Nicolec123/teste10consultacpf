const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json()); // Permite requisições com JSON
app.use(express.text()); // Permite body em formato text/plain

const apiUrl = "https://api.jae.com.br/vt-gateway/cadastro/consulta"; // URL da API externa
const PUBLIC_KEY_PATH = "./public_key.pem"; // Caminho para a chave pública

// Rota POST para autenticação
app.post('/api/autenticacao', async (req, res) => {
    console.log('Requisição recebida no proxy:', req.body); // Depuração
    try {
        const response = await axios({
            method: 'POST',
            url: 'https://api.jae.com.br/autenticacao',
            headers: {
                'Content-Type': 'application/json',
            },
            data: req.body,
        });

        console.log('Resposta da API do João:', response.data); // Depuração
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Erro ao redirecionar a requisição:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.message,
        });
    }
});

// Rota POST para consulta
app.post("/vt-gateway/cadastro/consulta", async (req, res) => {
    console.log("Dados recebidos do frontend:", req.body); // Exibe os dados enviados pelo frontend

    // Pega o header Authorization
    const authHeader = req.headers["authorization"];
    let authToken = authHeader;

    // Verifica se o JWT está presente no header
    console.log("Token do backend:", authToken); // Depuração
    if (!authToken) {
        return res.status(400).json({ error: "Requisição inválida. JWT ausente." });
    }

    try {
        // Reencaminha a requisição para a API externa com os dados do frontend
        const response = await axios.post(apiUrl, req.body, {
            headers: {
                "Content-Type": "text/plain",
                Authorization: authToken,
            },
        });

        // Retorna a resposta da API externa para o frontend
        console.log("🔍 Resposta bruta da API externa:", JSON.stringify(response.data, null, 2));
        res.json(response.data);
    } catch (error) {
        console.error("Erro na requisição à API externa:", error.message);
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: "Erro interno no servidor." });
        }
    }
});

// Inicia o servidor na porta 3000 (ou 3001 se preferir)
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

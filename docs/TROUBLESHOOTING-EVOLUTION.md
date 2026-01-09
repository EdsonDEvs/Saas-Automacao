# 🔧 Troubleshooting - Evolution API

## ❌ Erro 401 (Unauthorized)

### Possíveis Causas:

1. **API Key incorreta**
   - Verifique se copiou a chave completa
   - Não deve ter espaços no início ou fim
   - Verifique se está usando a chave correta do servidor

2. **Formato do header incorreto**
   - A Evolution API pode usar diferentes formatos:
     - `apikey: sua-chave` (mais comum)
     - `Authorization: Bearer sua-chave` (algumas versões)
   - O sistema tenta ambos automaticamente

3. **URL incorreta**
   - Verifique se a URL está correta
   - Não deve ter barra no final (ex: `https://evolution.com` ✅, não `https://evolution.com/` ❌)
   - Deve ser acessível publicamente

4. **Servidor Evolution API não configurado**
   - Verifique se o servidor está rodando
   - Verifique se a API Key está configurada no servidor
   - Teste acessando: `https://sua-url/instance/fetchInstances` com a API Key

## ✅ Como Testar a API Key

### Via cURL:
```bash
curl -X GET "https://evolutionapi.alfredoia.com.br/instance/fetchInstances" \
  -H "apikey: SUA_API_KEY_AQUI"
```

### Via Navegador (com extensão):
Use uma extensão como "ModHeader" para adicionar o header `apikey`

### Resposta Esperada:
```json
[
  {
    "instance": {
      "instanceName": "nome-instancia",
      "status": "open"
    }
  }
]
```

## 🔍 Verificar Configuração do Servidor

### 1. Verificar se Evolution API está rodando:
```bash
curl https://evolutionapi.alfredoia.com.br
```

### 2. Verificar API Key no servidor:
- Acesse o arquivo de configuração do servidor
- Verifique a variável `API_KEY` ou `AUTHENTICATION_API_KEY`
- Certifique-se de que está usando a mesma chave

### 3. Verificar logs do servidor:
```bash
# Se estiver usando Docker
docker logs evolution-api -f

# Verifique se há erros de autenticação
```

## 📝 Formato Correto da Requisição

### Endpoint:
```
POST https://evolutionapi.alfredoia.com.br/instance/create
```

### Headers:
```
Content-Type: application/json
apikey: sua-api-key-aqui
```

### Body:
```json
{
  "instanceName": "nome-da-instancia",
  "token": "token-unico",
  "qrcode": true,
  "integration": "WHATSAPP-BAILEYS"
}
```

## 🆘 Soluções Comuns

### Problema: "Unauthorized" mesmo com API Key correta

**Solução 1:** Verifique se o servidor Evolution API está configurado para aceitar requisições externas

**Solução 2:** Verifique se há CORS configurado no servidor

**Solução 3:** Tente usar `Authorization: Bearer` ao invés de `apikey`:
```javascript
headers: {
  "Authorization": `Bearer ${apiKey}`
}
```

### Problema: "Instance already exists"

**Solução:** Delete a instância existente ou use outro nome:
```bash
curl -X DELETE "https://evolutionapi.alfredoia.com.br/instance/delete/nome-instancia" \
  -H "apikey: sua-api-key"
```

### Problema: QR Code não aparece

**Solução 1:** Verifique se a instância foi criada:
```bash
curl -X GET "https://evolutionapi.alfredoia.com.br/instance/fetchInstances" \
  -H "apikey: sua-api-key"
```

**Solução 2:** Busque QR Code manualmente:
```bash
curl -X GET "https://evolutionapi.alfredoia.com.br/instance/connect/nome-instancia" \
  -H "apikey: sua-api-key"
```

## 🔐 Configurar API Key no Servidor Evolution API

### Docker:
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e API_KEY=sua-chave-forte-aqui \
  atendai/evolution-api:latest
```

### Variáveis de Ambiente:
```env
API_KEY=sua-chave-forte-aqui
AUTHENTICATION_API_KEY=sua-chave-forte-aqui
```

## 📞 Ainda com Problemas?

1. **Verifique a documentação oficial**: https://doc.evolution-api.com
2. **Teste a API diretamente** com Postman ou cURL
3. **Verifique os logs** do servidor Evolution API
4. **Confirme** que a URL e API Key estão corretas

## 💡 Dica

Sempre teste a API Key primeiro com uma requisição simples antes de tentar criar instâncias:

```bash
# Teste básico
curl -X GET "https://sua-url/instance/fetchInstances" \
  -H "apikey: sua-chave"
```

Se isso funcionar, a API Key está correta e o problema pode estar no formato da requisição de criação.

# 🔧 Resolver Problemas do ngrok

## ❌ Problema 1: Authtoken Inválido

O token `cr_2q7Iv9MZBh4eDXukeLjdDQ45zmS` não é válido.

### ✅ Solução:

1. **Acesse o dashboard do ngrok:**
   - https://dashboard.ngrok.com/get-started/your-authtoken
   - Faça login (ou crie uma conta gratuita)

2. **Copie o authtoken correto:**
   - O token correto começa com `2` e é muito mais longo
   - Exemplo: `2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

3. **Configure o token:**
   ```powershell
   cd C:\ngrok
   .\ngrok.exe config add-authtoken SEU_TOKEN_CORRETO_AQUI
   ```

---

## ❌ Problema 2: Sessão Já Rodando

Erro: "Your account is limited to 1 simultaneous ngrok agent sessions"

Isso significa que você já tem uma sessão do ngrok rodando em outro lugar.

### ✅ Solução:

#### Opção A: Encontrar e Fechar a Sessão Atual

1. **Verifique se há um processo ngrok rodando:**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*ngrok*"}
   ```

2. **Se encontrar, feche:**
   ```powershell
   Stop-Process -Name "ngrok" -Force
   ```

3. **Ou feche manualmente:**
   - Abra o Gerenciador de Tarefas (Ctrl + Shift + Esc)
   - Procure por "ngrok"
   - Clique com botão direito → "Finalizar tarefa"

#### Opção B: Verificar no Dashboard

1. Acesse: https://dashboard.ngrok.com/agents
2. Veja as sessões ativas
3. Feche as sessões que não precisa

#### Opção C: Reiniciar o Computador

Se nada funcionar, reinicie o computador para limpar todas as sessões.

---

## ✅ Depois de Resolver

### 1. Configure o authtoken correto:
```powershell
cd C:\ngrok
.\ngrok.exe config add-authtoken SEU_TOKEN_CORRETO
```

### 2. Verifique se não há sessões rodando:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*ngrok*"}
```

### 3. Inicie o ngrok:
```powershell
.\ngrok.exe http 3000
```

### 4. Copie a URL e configure o webhook:
- URL aparecerá no terminal (ex: `https://abc123.ngrok-free.app`)
- Configure na Evolution API: `https://SUA-URL.ngrok-free.app/api/webhook/whatsapp`

---

## 🆘 Se Ainda Não Funcionar

### Verificar se ngrok está instalado corretamente:
```powershell
cd C:\ngrok
.\ngrok.exe version
```

### Testar conexão:
```powershell
.\ngrok.exe http 3000
```

Se aparecer a URL, está funcionando!

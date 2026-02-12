# 🪟 Como Instalar ngrok no Windows

## 📥 Método 1: Download Direto (Mais Fácil)

### Passo 1: Baixar ngrok

1. Acesse: https://ngrok.com/download
2. Clique em **"Download for Windows"**
3. Baixe o arquivo ZIP

### Passo 2: Extrair

1. Extraia o arquivo ZIP (ex: `C:\ngrok\`)
2. Você terá o arquivo `ngrok.exe` na pasta

### Passo 3: Configurar Authtoken

Abra o PowerShell na pasta onde está o `ngrok.exe`:

```powershell
# Navegue até a pasta do ngrok
cd C:\ngrok

# Configure seu authtoken (substitua pelo seu token)
.\ngrok.exe config add-authtoken cr_2q7Iv9MZBh4eDXukeLjdDQ45zmS
```

### Passo 4: Testar

```powershell
.\ngrok.exe http 3000
```

Se funcionar, você verá algo como:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

---

## 📦 Método 2: Via Chocolatey (Se tiver instalado)

```powershell
choco install ngrok
```

Depois configure o authtoken:
```powershell
ngrok config add-authtoken cr_2q7Iv9MZBh4eDXukeLjdDQ45zmS
```

---

## 📦 Método 3: Via Scoop (Se tiver instalado)

```powershell
scoop install ngrok
```

Depois configure o authtoken:
```powershell
ngrok config add-authtoken cr_2q7Iv9MZBh4eDXukeLjdDQ45zmS
```

---

## 🔧 Adicionar ao PATH (Opcional mas Recomendado)

Para poder usar `ngrok` de qualquer lugar:

### Passo 1: Copiar o caminho da pasta

Exemplo: `C:\ngrok`

### Passo 2: Adicionar ao PATH

1. Pressione `Win + X` e escolha **"Sistema"**
2. Clique em **"Configurações avançadas do sistema"**
3. Clique em **"Variáveis de Ambiente"**
4. Em **"Variáveis do sistema"**, encontre **"Path"** e clique em **"Editar"**
5. Clique em **"Novo"** e adicione: `C:\ngrok`
6. Clique em **"OK"** em todas as janelas
7. **Feche e reabra o PowerShell**

Agora você pode usar `ngrok` de qualquer lugar!

---

## ✅ Verificar Instalação

Depois de instalar, teste:

```powershell
ngrok version
```

Se mostrar a versão, está funcionando!

---

## 🚀 Usar ngrok

### Iniciar túnel para porta 3000:

```powershell
ngrok http 3000
```

### Ver a URL do túnel:

Acesse: `http://localhost:4040` no navegador

Ou use o script que criamos:
```powershell
.\iniciar-ngrok.ps1
```

---

## 🆘 Problemas Comuns

### "ngrok não é reconhecido"

- Verifique se o arquivo `ngrok.exe` existe na pasta
- Verifique se você está na pasta correta
- Ou adicione ao PATH (veja acima)

### "authtoken inválido"

- Verifique se copiou o token completo
- Acesse https://dashboard.ngrok.com/get-started/your-authtoken
- Copie o token novamente

### "porta já em uso"

- Verifique se já tem algo rodando na porta 3000
- Ou use outra porta: `ngrok http 8080`

---

## 📝 Próximos Passos

Depois de instalar e configurar:

1. ✅ Inicie o ngrok: `ngrok http 3000`
2. ✅ Copie a URL (ex: `https://abc123.ngrok-free.app`)
3. ✅ Configure o webhook na Evolution API com: `https://abc123.ngrok-free.app/api/webhook/whatsapp`
4. ✅ Teste enviando uma mensagem!

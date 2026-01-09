# 🔧 Problemas ao Conectar WhatsApp

## ❌ "Não é possível conectar novos dispositivos no momento"

Este erro aparece quando:

### 1. Limite de Dispositivos Atingido
WhatsApp permite apenas **4 dispositivos conectados** simultaneamente (além do celular principal).

**Solução:**
1. Abra WhatsApp no celular
2. Vá em **Menu** → **Aparelhos conectados**
3. Desconecte dispositivos que não está usando
4. Tente escanear o QR Code novamente

### 2. QR Code Expirado
QR Codes do WhatsApp expiram em aproximadamente **20 segundos**.

**Solução:**
- Clique em **"Atualizar QR Code"** no sistema
- Escaneie o novo QR Code imediatamente
- O sistema atualiza automaticamente quando necessário

### 3. Muitas Tentativas
Se você tentar conectar muitas vezes rapidamente, o WhatsApp pode bloquear temporariamente.

**Solução:**
- Aguarde **5-10 minutos**
- Tente novamente
- Certifique-se de que não há outras tentativas em andamento

### 4. WhatsApp Web Já Conectado
Se você já tem WhatsApp Web aberto em outro navegador/aba, pode causar conflito.

**Solução:**
- Feche todas as abas do WhatsApp Web
- Desconecte dispositivos antigos
- Tente novamente

## ✅ Passo a Passo para Conectar

### 1. Preparar o Celular
- Certifique-se de que o WhatsApp está atualizado
- Verifique sua conexão de internet
- Feche outros apps que possam estar usando a câmera

### 2. Abrir Tela de Conexão
- Abra WhatsApp no celular
- Toque nos **3 pontos** (menu)
- Selecione **"Aparelhos conectados"**
- Toque em **"Conectar um aparelho"**

### 3. Escanear QR Code
- Aponte a câmera para o QR Code na tela
- Mantenha o celular estável
- Aguarde a confirmação

### 4. Se Der Erro
- Clique em **"Atualizar QR Code"** no sistema
- Aguarde o novo QR Code aparecer
- Tente escanear novamente

## 🔄 Atualizar QR Code Manualmente

Se o QR Code não estiver funcionando:

1. Clique no botão **"Atualizar QR Code"**
2. Aguarde o novo QR Code aparecer
3. Escaneie imediatamente (expira em ~20 segundos)
4. Se não funcionar, aguarde 1 minuto e tente novamente

## ⚠️ Dicas Importantes

### ✅ Faça:
- Escaneie o QR Code **imediatamente** após aparecer
- Mantenha o celular **estável** durante o escaneamento
- Certifique-se de que há **boa iluminação**
- Use a **câmera traseira** (geralmente melhor qualidade)

### ❌ Evite:
- Tentar conectar muitos dispositivos ao mesmo tempo
- Deixar o QR Code na tela por muito tempo sem escanear
- Tentar conectar enquanto há outros processos em andamento
- Usar WhatsApp Web em múltiplas abas/navegadores

## 🆘 Ainda Não Funciona?

### Verifique:
1. **Servidor Evolution API está rodando?**
   - Teste acessando a URL no navegador
   - Verifique os logs do servidor

2. **API Key está correta?**
   - Teste com cURL ou Postman
   - Verifique se a chave está configurada no servidor

3. **Instância foi criada?**
   - Verifique no servidor Evolution API
   - Tente criar uma nova instância com outro nome

4. **WhatsApp está funcionando?**
   - Teste enviando uma mensagem normal
   - Verifique se não está bloqueado

### Próximos Passos:
1. Aguarde **10 minutos** e tente novamente
2. Crie uma **nova instância** com outro nome
3. Verifique os **logs do servidor** Evolution API
4. Entre em contato com o suporte se o problema persistir

## 📱 Limites do WhatsApp

- **Máximo de 4 dispositivos** conectados (além do celular)
- **QR Code expira** em ~20 segundos
- **Rate limiting** após muitas tentativas
- **Bloqueio temporário** se detectar atividade suspeita

## 💡 Solução Rápida

Se nada funcionar:

1. **Desconecte todos os dispositivos** do WhatsApp
2. **Aguarde 10 minutos**
3. **Crie uma nova instância** no sistema
4. **Escanee o novo QR Code** imediatamente
5. **Não tente conectar** outros dispositivos durante este processo

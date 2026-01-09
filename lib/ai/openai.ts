/**
 * Função para processar mensagens com OpenAI
 */

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIContext {
  agentName: string
  persona: string
  tone: string
  inventory: string
}

export async function generateAIResponse(
  userMessage: string,
  context: AIContext,
  apiKey?: string
): Promise<string> {
  // Se não tiver API Key do OpenAI, retorna resposta simples
  if (!apiKey) {
    return `Olá! Sou ${context.agentName}. ${context.persona}\n\nSua mensagem: "${userMessage}"\n\nNota: Configure a API Key do OpenAI no arquivo .env.local para usar IA completa.`
  }

  try {
    const messages: AIMessage[] = [
      {
        role: "system",
        content: `${context.persona}\n\nInventário disponível:\n${context.inventory}\n\nVocê é ${context.agentName}. Seja ${context.tone.toLowerCase()} em suas respostas.`
      },
      {
        role: "user",
        content: userMessage
      }
    ]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || "Erro ao chamar OpenAI")
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "Desculpe, não consegui processar sua mensagem."
  } catch (error: any) {
    console.error("Erro ao gerar resposta com IA:", error)
    // Fallback para resposta simples
    return `Olá! Sou ${context.agentName}. ${context.persona}\n\nSua mensagem: "${userMessage}"\n\nErro ao processar com IA: ${error.message}`
  }
}

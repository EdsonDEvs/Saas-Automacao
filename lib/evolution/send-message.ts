type SendMessageParams = {
  baseUrl: string
  apiKey: string
  instanceName: string
  to: string
  text: string
}

export async function sendEvolutionMessage({
  baseUrl,
  apiKey,
  instanceName,
  to,
  text,
}: SendMessageParams) {
  const cleanUrl = baseUrl.replace(/\/$/, "")
  const payload = {
    number: to,
    text,
  }

  let response = await fetch(`${cleanUrl}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok && response.status === 401) {
    response = await fetch(`${cleanUrl}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro ao enviar mensagem: ${response.status} - ${errorText}`)
  }

  return response.json().catch(() => ({}))
}

/**
 * Detecta se a mensagem do usuário contém intenção de agendamento
 */

export interface AppointmentIntent {
  hasIntent: boolean
  date?: string // YYYY-MM-DD
  time?: string // HH:MM
  service?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  missingFields?: string[]
}

export function detectAppointmentIntent(
  message: string,
  customerPhone?: string,
  serviceOptions: string[] = []
): AppointmentIntent {
  const lowerMessage = message.toLowerCase()
  
  // Palavras-chave que indicam intenção de agendamento
  const appointmentKeywords = [
    'agendar', 'agendamento', 'marcar', 'marcação', 'horário', 'horario',
    'consulta', 'atendimento', 'reunião', 'reuniao', 'visita', 'encontro',
    'disponível', 'disponivel', 'livre', 'quando', 'quando posso'
  ]

  const hasIntent = appointmentKeywords.some(keyword => lowerMessage.includes(keyword))

  if (!hasIntent) {
    return { hasIntent: false }
  }

  // Tenta extrair data
  let date: string | undefined
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{1,2})\/(\d{1,2})/, // DD/MM (assume ano atual)
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
    /hoje/i,
    /amanhã|amanha/i,
    /depois de amanhã|depois de amanha/i,
  ]

  for (const pattern of datePatterns) {
    const match = message.match(pattern)
    if (match) {
      if (match[0].toLowerCase() === 'hoje') {
        date = new Date().toISOString().split('T')[0]
      } else if (match[0].toLowerCase().includes('amanhã') || match[0].toLowerCase().includes('amanha')) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        date = tomorrow.toISOString().split('T')[0]
      } else if (match[0].toLowerCase().includes('depois de amanhã') || match[0].toLowerCase().includes('depois de amanha')) {
        const dayAfter = new Date()
        dayAfter.setDate(dayAfter.getDate() + 2)
        date = dayAfter.toISOString().split('T')[0]
      } else if (match[1] && match[2]) {
        // Formato DD/MM/YYYY ou DD/MM
        const day = parseInt(match[1])
        const month = parseInt(match[2]) - 1 // JavaScript months are 0-indexed
        const year = match[3] ? parseInt(match[3]) : new Date().getFullYear()
        const parsedDate = new Date(year, month, day)
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().split('T')[0]
        }
      } else if (match[1] && match[2] && match[3]) {
        // Formato YYYY-MM-DD
        date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      }
      break
    }
  }

  // Tenta extrair horário
  let time: string | undefined
  const timePatterns = [
    /(\d{1,2}):(\d{2})/, // HH:MM
    /(\d{1,2})h(\d{2})?/, // 14h ou 14h30
    /(\d{1,2}) horas?/, // 14 horas
  ]

  for (const pattern of timePatterns) {
    const match = message.match(pattern)
    if (match) {
      const hour = parseInt(match[1])
      const minute = match[2] ? parseInt(match[2]) : 0
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }
      break
    }
  }

  // Tenta detectar serviço com base nos serviços cadastrados
  let service: string | undefined
  if (serviceOptions.length > 0) {
    const normalizedOptions = serviceOptions.map((option) => option.trim()).filter(Boolean)
    const matched = normalizedOptions.find((option) =>
      lowerMessage.includes(option.toLowerCase())
    )
    if (matched) {
      service = matched
    }
  }

  const missingFields: string[] = []
  if (!date) missingFields.push("date")
  if (!time) missingFields.push("time")
  if (!service) missingFields.push("service")

  return {
    hasIntent: true,
    date,
    time,
    service,
    customerPhone,
    missingFields,
  }
}

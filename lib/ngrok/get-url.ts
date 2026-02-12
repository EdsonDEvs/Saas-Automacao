/**
 * Obtém a URL pública do ngrok automaticamente
 * O ngrok expõe uma API local em http://localhost:4040/api/tunnels
 */

export async function getNgrokUrl(): Promise<string | null> {
  try {
    const response = await fetch("http://localhost:4040/api/tunnels", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    // Procura por um túnel HTTP/HTTPS
    if (data.tunnels && Array.isArray(data.tunnels)) {
      const httpsTunnel = data.tunnels.find(
        (tunnel: any) => tunnel.proto === "https"
      )
      
      if (httpsTunnel && httpsTunnel.public_url) {
        return httpsTunnel.public_url
      }
      
      // Fallback para HTTP se não tiver HTTPS
      const httpTunnel = data.tunnels.find(
        (tunnel: any) => tunnel.proto === "http"
      )
      
      if (httpTunnel && httpTunnel.public_url) {
        return httpTunnel.public_url
      }
    }

    return null
  } catch (error) {
    // ngrok não está rodando ou não está acessível
    return null
  }
}

/**
 * Verifica se o ngrok está rodando
 */
export async function isNgrokRunning(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:4040/api/tunnels", {
      method: "GET",
    })
    return response.ok
  } catch {
    return false
  }
}

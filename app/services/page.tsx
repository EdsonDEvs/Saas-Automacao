"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ensureUserProfile } from "@/lib/supabase/ensure-profile"
import { getServicesTable } from "@/lib/supabase/get-services"
import { Plus, Edit, Trash2, Loader2, Calendar } from "lucide-react"

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  stock_status: boolean
  image_url: string | null
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_status: true,
    image_url: "",
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const loadServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Tenta usar 'services', se não existir usa 'products' como fallback
      const tableName = await getServicesTable(supabase)
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar serviços",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        description: service.description || "",
        price: service.price.toString(),
        stock_status: service.stock_status,
        image_url: service.image_url || "",
      })
    } else {
      setEditingService(null)
      setFormData({
        name: "",
        description: "",
        price: "",
        stock_status: true,
        image_url: "",
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Garante que o perfil existe antes de criar o serviço
      await ensureUserProfile()

      // Tenta usar 'services', se não existir usa 'products' como fallback
      const tableName = await getServicesTable(supabase)
      
      const serviceData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock_status: formData.stock_status,
        image_url: formData.image_url || null,
      }

      if (editingService) {
        const { error } = await supabase
          .from(tableName)
          .update(serviceData)
          .eq("id", editingService.id)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Serviço atualizado com sucesso.",
        })
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert(serviceData)

        if (error) throw error

        toast({
          title: "Sucesso",
          description: "Serviço criado com sucesso.",
        })
      }

      setDialogOpen(false)
      loadServices()
    } catch (error: any) {
      let errorMessage = "Erro ao salvar serviço"
      if (error.message) {
        errorMessage = error.message
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return

    try {
      // Tenta usar 'services', se não existir usa 'products' como fallback
      const tableName = await getServicesTable(supabase)
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Serviço excluído com sucesso.",
      })
      loadServices()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir serviço",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu catálogo de serviços para agendamentos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Serviço" : "Novo Serviço"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do serviço
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Corte de Cabelo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descreva o serviço..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">URL da Imagem</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="stock_status"
                    checked={formData.stock_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_status: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="stock_status">Serviço disponível</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum serviço cadastrado ainda.
            </p>
            <Button
              className="mt-4"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Serviço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    <span>{service.name}</span>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {service.description || "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">
                    R$ {service.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      service.stock_status
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {service.stock_status ? "Disponível" : "Indisponível"}
                  </span>
                </div>
                {service.image_url && (
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-48 object-cover rounded mt-4"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

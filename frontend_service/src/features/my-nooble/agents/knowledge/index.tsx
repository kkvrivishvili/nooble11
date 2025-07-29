import { useEffect, useCallback, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { usePageContext } from '@/context/page-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  IconUpload, 
  IconFile, 
  IconFileText,
  IconLink,
  IconTrash,
  IconEdit,
  IconSearch,
  IconPlus,
  IconCheck
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Knowledge {
  id: string
  name: string
  type: 'pdf' | 'text' | 'doc' | 'link'
  size?: number
  url?: string
  uploadedAt: Date
  agentIds: string[]
}

interface Agent {
  id: string
  name: string
  template: string
}

// Mock data
const mockKnowledge: Knowledge[] = [
  {
    id: '1',
    name: 'Manual de Usuario.pdf',
    type: 'pdf',
    size: 2048000,
    uploadedAt: new Date('2024-01-15'),
    agentIds: ['1', '3'],
  },
  {
    id: '2',
    name: 'Preguntas Frecuentes',
    type: 'text',
    size: 15000,
    uploadedAt: new Date('2024-01-20'),
    agentIds: ['3'],
  },
  {
    id: '3',
    name: 'Documentación API',
    type: 'link',
    url: 'https://docs.example.com',
    uploadedAt: new Date('2024-01-22'),
    agentIds: ['2', '3'],
  },
]

const mockAgents: Agent[] = [
  { id: '1', name: 'Receptor', template: 'receptor' },
  { id: '2', name: 'Vendedor', template: 'vendedor' },
  { id: '3', name: 'Soporte', template: 'soporte' },
]

export default function AgentsKnowledgePage() {
  const { setSubPages } = usePageContext()
  const location = useLocation()
  const [knowledge, setKnowledge] = useState<Knowledge[]>(mockKnowledge)
  const [agents] = useState<Agent[]>(mockAgents)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [isDragging, setIsDragging] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null)
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])

  const updateSubPages = useCallback(() => {
    const currentPath = location.pathname
    const subPages = [
      {
        title: 'Team',
        href: '/my-nooble/agents/team',
        isActive: currentPath === '/my-nooble/agents/team'
      },
      {
        title: 'Agents',
        href: '/my-nooble/agents/agents',
        isActive: currentPath === '/my-nooble/agents/agents'
      },
      {
        title: 'Knowledge',
        href: '/my-nooble/agents/knowledge',
        isActive: currentPath === '/my-nooble/agents/knowledge'
      },
      {
        title: 'Tools',
        href: '/my-nooble/agents/tools',
        isActive: currentPath === '/my-nooble/agents/tools'
      }
    ]
    setSubPages(subPages)
  }, [location.pathname, setSubPages])

  useEffect(() => {
    updateSubPages()
    return () => {
      setSubPages([])
    }
  }, [updateSubPages, setSubPages])

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'doc':
        return IconFileText
      case 'text':
        return IconFile
      case 'link':
        return IconLink
      default:
        return IconFile
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      // Aquí procesaríamos el archivo
      const newKnowledge: Knowledge = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.includes('pdf') ? 'pdf' : 'text',
        size: file.size,
        uploadedAt: new Date(),
        agentIds: [],
      }
      setKnowledge(prev => [...prev, newKnowledge])
    })
  }

  const handleEdit = (item: Knowledge) => {
    setEditingKnowledge(item)
    setSelectedAgentIds(item.agentIds)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingKnowledge) return
    
    const updatedKnowledge = knowledge.map(item =>
      item.id === editingKnowledge.id
        ? { ...item, agentIds: selectedAgentIds }
        : item
    )
    setKnowledge(updatedKnowledge)
    setIsEditDialogOpen(false)
    setEditingKnowledge(null)
    setSelectedAgentIds([])
  }

  const handleDelete = (id: string) => {
    setKnowledge(prev => prev.filter(item => item.id !== id))
  }

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  // Filtrado
  const filteredKnowledge = knowledge.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || item.type === filterType
    const matchesAgent = filterAgent === 'all' || item.agentIds.includes(filterAgent)
    return matchesSearch && matchesType && matchesAgent
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 dark:border-gray-700'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <IconUpload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">Arrastra y suelta archivos aquí</p>
            <p className="text-sm text-gray-500 mb-4">
              o haz clic para seleccionar archivos
            </p>
            <Button variant="outline">
              <IconPlus size={16} className="mr-2" />
              Seleccionar archivos
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Formatos soportados: PDF, TXT, DOC, DOCX, HTML
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Buscar conocimiento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="doc">Documento</SelectItem>
                <SelectItem value="link">Enlace</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los agentes</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Knowledge Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Agentes asignados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKnowledge.map((item) => {
                  const FileIcon = getFileIcon(item.type)
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileIcon size={20} className="text-gray-500" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(item.size)}</TableCell>
                      <TableCell>
                        {format(item.uploadedAt, 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {item.agentIds.map((agentId) => {
                            const agent = agents.find(a => a.id === agentId)
                            return agent ? (
                              <Badge key={agentId} variant="outline" className="text-xs">
                                {agent.name}
                              </Badge>
                            ) : null
                          })}
                          {item.agentIds.length === 0 && (
                            <span className="text-sm text-gray-500">Sin asignar</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <IconEdit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(item.id)}
                          >
                            <IconTrash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredKnowledge.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron resultados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar agentes</DialogTitle>
            <DialogDescription>
              Selecciona los agentes que tendrán acceso a este conocimiento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAgentIds.includes(agent.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => toggleAgentSelection(agent.id)}
                >
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-500">{agent.template}</p>
                  </div>
                  {selectedAgentIds.includes(agent.id) && (
                    <IconCheck size={20} className="text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingKnowledge(null)
                setSelectedAgentIds([])
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/*

/my-nooble/agents/knowledge
├── KnowledgeGrid
│   ├── Columnas: Nombre, Tipo, Tamaño, Fecha, Agentes asignados
│   ├── Acciones: Ver, Editar, Eliminar
│   └── Filtros por tipo y agente
│
└── UploadZone
    ├── Drag & drop
    ├── Tipos: PDF, TXT, DOC, Links
    └── Asignación a agentes



*/
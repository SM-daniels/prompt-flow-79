import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, Contact } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, Search, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import starmetaLogo from "@/assets/starmeta-logo.png";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/crm/KanbanColumn";
import { LeadCard } from "@/components/crm/LeadCard";
import { LabelManager, Label } from "@/components/crm/LabelManager";
import { StageEditor, StageConfig } from "@/components/crm/StageEditor";
import { toast } from "sonner";

type Stage = 'novo' | 'contato' | 'qualificado' | 'negociacao' | 'convertido' | 'perdido';
type ChannelFilter = 'all' | 'whatsapp' | 'instagram' | 'site' | 'outro';

const DEFAULT_STAGES: StageConfig[] = [
  { id: 'novo', title: 'Novo', color: 'bg-blue-500' },
  { id: 'contato', title: 'Contato Inicial', color: 'bg-purple-500' },
  { id: 'qualificado', title: 'Qualificado', color: 'bg-yellow-500' },
  { id: 'negociacao', title: 'Negociação', color: 'bg-orange-500' },
  { id: 'convertido', title: 'Convertido', color: 'bg-green-500' },
  { id: 'perdido', title: 'Perdido', color: 'bg-red-500' },
];

const STORAGE_KEYS = {
  STAGES: 'crm-stages',
  LABELS: 'crm-labels',
};

export default function CRM() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Load stages and labels from localStorage
  const [stages, setStages] = useState<StageConfig[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.STAGES);
    return stored ? JSON.parse(stored) : DEFAULT_STAGES;
  });
  
  const [labels, setLabels] = useState<Label[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.LABELS);
    return stored ? JSON.parse(stored) : [];
  });

  // Save to localStorage when stages/labels change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAGES, JSON.stringify(stages));
  }, [stages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(labels));
  }, [labels]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['crm-contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user?.id,
  });

  const updateContactStageMutation = useMutation({
    mutationFn: async ({ contactId, stage }: { contactId: string; stage: Stage }) => {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) throw new Error('Contact not found');

      const updatedMetadata = {
        ...(contact.metadata || {}),
        stage,
      };

      const { error } = await supabase
        .from('contacts')
        .update({ metadata: updatedMetadata })
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      toast.success('Lead movido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao mover lead');
    },
  });

  const updateContactLabelsMutation = useMutation({
    mutationFn: async ({ contactId, labelIds }: { contactId: string; labelIds: string[] }) => {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) throw new Error('Contact not found');

      const updatedMetadata = {
        ...(contact.metadata || {}),
        labels: labelIds,
      };

      const { error } = await supabase
        .from('contacts')
        .update({ metadata: updatedMetadata })
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      toast.success('Etiquetas atualizadas!');
    },
    onError: () => {
      toast.error('Erro ao atualizar etiquetas');
    },
  });

  const handleLabelsChange = (contactId: string, labelIds: string[]) => {
    updateContactLabelsMutation.mutate({ contactId, labelIds });
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = !searchQuery || 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesChannel = channelFilter === 'all' || contact.channel === channelFilter;

      return matchesSearch && matchesChannel;
    });
  }, [contacts, searchQuery, channelFilter]);

  const contactsByStage = useMemo(() => {
    const grouped: Record<Stage, Contact[]> = {
      novo: [],
      contato: [],
      qualificado: [],
      negociacao: [],
      convertido: [],
      perdido: [],
    };

    filteredContacts.forEach(contact => {
      const stage = (contact.metadata?.stage as Stage) || 'novo';
      if (grouped[stage]) {
        grouped[stage].push(contact);
      }
    });

    return grouped;
  }, [filteredContacts]);

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const contactId = active.id as string;

    // Determine destination column (stage) correctly
    const overId = over.id as string;
    const overContainerId = (over.data?.current as any)?.sortable?.containerId as string | undefined;

    let destinationStage: Stage | null = null;

    // 1) If Sortable provides containerId, prefer it
    if (overContainerId && stages.some((s) => s.id === overContainerId)) {
      destinationStage = overContainerId as Stage;
    } 
    // 2) If hovering/dropping over the column itself
    else if (stages.some((s) => s.id === overId)) {
      destinationStage = overId as Stage;
    } 
    // 3) If dropping over another card, find which column contains that card
    else {
      const targetStageEntry = stages.find((s) =>
        contactsByStage[s.id as Stage].some((c) => c.id === overId)
      );
      if (targetStageEntry) destinationStage = targetStageEntry.id as Stage;
    }

    if (!destinationStage) return;

    const contact = contacts.find((c) => c.id === contactId);
    const currentStage = (contact?.metadata?.stage as Stage) || 'novo';

    if (currentStage !== destinationStage) {
      updateContactStageMutation.mutate({ contactId, stage: destinationStage });
    }
  };

  const activeContact = activeId ? contacts.find(c => c.id === activeId) : null;

  return (
    <div className="flex flex-col h-screen bg-bg0">
      {/* Header */}
      <div className="h-16 bg-gradient-to-r from-bg1 via-bg1 to-bg2/80 border-b border-borderc/60 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 shadow-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src={starmetaLogo} alt="Starmeta Logo" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-textc">Starmeta Legacy</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/app')}
                className="text-textdim hover:text-textc"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Inbox
              </Button>
              <Button 
                variant="secondary"
                className="text-textc"
              >
                CRM
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-textdim">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-textdim hover:text-textc">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 space-y-4 shrink-0">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-textc mb-2">CRM - Pipeline de Vendas</h2>
                <p className="text-textdim">Arraste os contatos entre os estágios do funil</p>
              </div>
              <div className="flex gap-2">
                <LabelManager labels={labels} onLabelsChange={setLabels} />
                <StageEditor stages={stages} onStagesChange={setStages} />
              </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textdim" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as ChannelFilter)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os canais</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {stages.map(stage => (
              <Card key={stage.id} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <div className="text-textdim text-xs truncate">{stage.title}</div>
                </div>
                <div className="text-xl font-bold text-textc">{contactsByStage[stage.id as Stage].length}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-textdim">Carregando leads...</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 h-full pb-4">
                  {stages.map(stage => (
                    <KanbanColumn
                      key={stage.id}
                      id={stage.id}
                      title={stage.title}
                      contacts={contactsByStage[stage.id as Stage]}
                      color={stage.color}
                      availableLabels={labels}
                      onLabelsChange={handleLabelsChange}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeContact ? (
                    <LeadCard
                      contact={activeContact}
                      availableLabels={labels}
                      onLabelsChange={handleLabelsChange}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
        </div>
      </div>
    </div>
  );
}

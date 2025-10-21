import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase, Contact } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LogOut, Search, MessageSquare, Mail, Phone, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import starmetaLogo from "@/assets/starmeta-logo.png";

type ChannelFilter = 'all' | 'whatsapp' | 'instagram' | 'site' | 'outro';

export default function CRM() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');

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

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchQuery || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel = channelFilter === 'all' || contact.channel === channelFilter;

    return matchesSearch && matchesChannel;
  });

  const getChannelBadge = (channel: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      whatsapp: { label: "WhatsApp", variant: "default" },
      instagram: { label: "Instagram", variant: "secondary" },
      site: { label: "Site", variant: "outline" },
      outro: { label: "Outro", variant: "outline" },
    };
    
    const config = variants[channel] || { label: channel, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="flex flex-col h-screen bg-bg0">
      {/* Header */}
      <div className="h-16 bg-bg1 border-b border-borderc flex items-center justify-between px-6">
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
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-3xl font-bold text-textc mb-2">CRM - Gestão de Leads</h2>
            <p className="text-textdim">Gerencie e organize seus contatos e leads</p>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-textdim text-sm mb-1">Total de Leads</div>
              <div className="text-2xl font-bold text-textc">{contacts.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-textdim text-sm mb-1">WhatsApp</div>
              <div className="text-2xl font-bold text-textc">
                {contacts.filter(c => c.channel === 'whatsapp').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-textdim text-sm mb-1">Instagram</div>
              <div className="text-2xl font-bold text-textc">
                {contacts.filter(c => c.channel === 'instagram').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-textdim text-sm mb-1">Site</div>
              <div className="text-2xl font-bold text-textc">
                {contacts.filter(c => c.channel === 'site').length}
              </div>
            </Card>
          </div>

          {/* Contacts Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-textdim py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-textdim py-8">
                      {searchQuery || channelFilter !== 'all' 
                        ? "Nenhum lead encontrado com os filtros aplicados" 
                        : "Nenhum lead cadastrado ainda"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium text-textc">
                        {contact.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-textdim">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm text-textdim">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getChannelBadge(contact.channel)}
                      </TableCell>
                      <TableCell className="text-textdim text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(contact.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-textdim text-sm">
                        {formatDistanceToNow(new Date(contact.updated_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/app')}
                          className="text-primary hover:text-primary2"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Ver conversa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Contact } from "@/lib/supabase";
import { LeadCard } from "./LeadCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "./LabelManager";

interface KanbanColumnProps {
  id: string;
  title: string;
  contacts: Contact[];
  color: string;
  availableLabels: Label[];
  onLabelsChange: (contactId: string, labelIds: string[]) => void;
}

export function KanbanColumn({ id, title, contacts, color, availableLabels, onLabelsChange }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h3 className="font-semibold text-textc">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {contacts.length}
          </Badge>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-3 p-2 rounded-lg transition-all ${
          isOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-bg1/50"
        } min-h-[200px]`}
      >
        <SortableContext items={contacts.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {contacts.length === 0 ? (
            <Card className="p-8 text-center border-dashed bg-transparent">
              <p className="text-sm text-textdim">Arraste contatos aqui</p>
            </Card>
          ) : (
            contacts.map((contact) => (
              <LeadCard
                key={contact.id}
                contact={contact}
                availableLabels={availableLabels}
                onLabelsChange={onLabelsChange}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

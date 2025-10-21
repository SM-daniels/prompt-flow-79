import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Check } from "lucide-react";
import { toast } from "sonner";

export type StageConfig = {
  id: string;
  title: string;
  color: string;
};

interface StageEditorProps {
  stages: StageConfig[];
  onStagesChange: (stages: StageConfig[]) => void;
}

export function StageEditor({ stages, onStagesChange }: StageEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleStartEdit = (stage: StageConfig) => {
    setEditingId(stage.id);
    setEditingTitle(stage.title);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingTitle.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }

    onStagesChange(
      stages.map(s => s.id === id ? { ...s, title: editingTitle.trim() } : s)
    );
    setEditingId(null);
    setEditingTitle("");
    toast.success("Etapa renomeada!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 className="w-4 h-4 mr-2" />
          Editar Etapas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Etapas do Funil</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {stages.map(stage => (
            <div
              key={stage.id}
              className="flex items-center gap-2 p-3 rounded-lg bg-bg1 border border-borderc"
            >
              <div className={`w-3 h-3 rounded-full ${stage.color} shrink-0`} />
              {editingId === stage.id ? (
                <>
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(stage.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveEdit(stage.id)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-textc">{stage.title}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleStartEdit(stage)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

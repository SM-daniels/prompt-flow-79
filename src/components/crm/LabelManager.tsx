import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Edit2, Check, Tag } from "lucide-react";
import { toast } from "sonner";

export type Label = {
  id: string;
  name: string;
  color: string;
};

const DEFAULT_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
];

interface LabelManagerProps {
  labels: Label[];
  onLabelsChange: (labels: Label[]) => void;
}

export function LabelManager({ labels, onLabelsChange }: LabelManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAddLabel = () => {
    if (!newLabelName.trim()) {
      toast.error("Digite um nome para a etiqueta");
      return;
    }

    const newLabel: Label = {
      id: Date.now().toString(),
      name: newLabelName.trim(),
      color: selectedColor,
    };

    onLabelsChange([...labels, newLabel]);
    setNewLabelName("");
    setSelectedColor(DEFAULT_COLORS[0]);
    toast.success("Etiqueta criada!");
  };

  const handleDeleteLabel = (id: string) => {
    onLabelsChange(labels.filter(l => l.id !== id));
    toast.success("Etiqueta removida!");
  };

  const handleStartEdit = (label: Label) => {
    setEditingId(label.id);
    setEditingName(label.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }

    onLabelsChange(
      labels.map(l => l.id === id ? { ...l, name: editingName.trim() } : l)
    );
    setEditingId(null);
    setEditingName("");
    toast.success("Etiqueta renomeada!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="w-4 h-4 mr-2" />
          Gerenciar Etiquetas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Etiquetas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add new label */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da etiqueta"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
              />
              <Button onClick={handleAddLabel} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full ${color} transition-all ${
                    selectedColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-bg2" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Existing labels */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <h4 className="text-sm font-medium text-textdim">Etiquetas existentes</h4>
            {labels.length === 0 ? (
              <p className="text-sm text-textdim text-center py-4">
                Nenhuma etiqueta criada ainda
              </p>
            ) : (
              labels.map(label => (
                <div
                  key={label.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-bg1 border border-borderc"
                >
                  <div className={`w-4 h-4 rounded-full ${label.color} shrink-0`} />
                  {editingId === label.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(label.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleSaveEdit(label.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-textc">{label.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(label)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteLabel(label.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

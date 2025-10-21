import { Label } from "./LabelManager";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Check } from "lucide-react";

interface LabelSelectorProps {
  availableLabels: Label[];
  selectedLabelIds: string[];
  onLabelsChange: (labelIds: string[]) => void;
}

export function LabelSelector({ availableLabels, selectedLabelIds, onLabelsChange }: LabelSelectorProps) {
  const toggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onLabelsChange(selectedLabelIds.filter(id => id !== labelId));
    } else {
      onLabelsChange([...selectedLabelIds, labelId]);
    }
  };

  const selectedLabels = availableLabels.filter(l => selectedLabelIds.includes(l.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
          <Tag className="w-3 h-3" />
          {selectedLabels.length > 0 && (
            <span className="text-xs">{selectedLabels.length}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-medium text-textdim">
            Etiquetas
          </div>
          {availableLabels.length === 0 ? (
            <div className="px-2 py-4 text-xs text-textdim text-center">
              Nenhuma etiqueta disponível
            </div>
          ) : (
            availableLabels.map(label => {
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-bg2 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${label.color} shrink-0`} />
                  <span className="flex-1 text-left text-sm text-textc">{label.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

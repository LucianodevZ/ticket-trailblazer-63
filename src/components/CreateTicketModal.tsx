import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateTicketData } from "@/types/ticket";
import { Ticket as TicketIcon, AlertTriangle, Clock, Minus } from "lucide-react";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTicketData) => void;
}

export const CreateTicketModal = ({ isOpen, onClose, onSubmit }: CreateTicketModalProps) => {
  const [formData, setFormData] = useState<CreateTicketData>({
    title: "",
    description: "",
    priority: "medium"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simular envio
    setTimeout(() => {
      onSubmit(formData);
      setFormData({ title: "", description: "", priority: "medium" });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ title: "", description: "", priority: "medium" });
      onClose();
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-danger" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'low':
        return <Minus className="w-4 h-4 text-success" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const getPriorityDescription = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Problema crítico que impede o trabalho (resposta em até 2h)';
      case 'medium':
        return 'Problema que afeta produtividade (resposta em até 8h)';
      case 'low':
        return 'Solicitação geral ou melhoria (resposta em até 24h)';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] animate-slide-up">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <TicketIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>Abrir Novo Chamado</span>
          </DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para registrar seu chamado. 
            Nossa equipe de suporte entrará em contato em breve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Título do Chamado *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Problema com impressora, Solicitação de software..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição Detalhada *
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva o problema ou solicitação de forma detalhada. Inclua informações como: quando ocorreu, mensagens de erro, passos para reproduzir..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[120px] w-full resize-none"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Prioridade *
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high") => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-3 py-1">
                      <AlertTriangle className="w-4 h-4 text-danger" />
                      <div>
                        <div className="font-medium">Alta Prioridade</div>
                        <div className="text-xs text-muted-foreground">
                          Problema crítico (resposta em até 2h)
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-3 py-1">
                      <Clock className="w-4 h-4 text-warning" />
                      <div>
                        <div className="font-medium">Média Prioridade</div>
                        <div className="text-xs text-muted-foreground">
                          Afeta produtividade (resposta em até 8h)
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-3 py-1">
                      <Minus className="w-4 h-4 text-success" />
                      <div>
                        <div className="font-medium">Baixa Prioridade</div>
                        <div className="text-xs text-muted-foreground">
                          Solicitação geral (resposta em até 24h)
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
                {getPriorityIcon(formData.priority)}
                <div className="text-sm text-muted-foreground">
                  {getPriorityDescription(formData.priority)}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="btn-corporate"
              disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
            >
              {isSubmitting ? "Criando Chamado..." : "Criar Chamado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
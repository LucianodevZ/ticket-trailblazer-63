import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Plus, 
  Clock, 
  User, 
  LogOut, 
  HelpCircle,
  Building2,
  Ticket as TicketIcon,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { CreateTicketModal } from "@/components/CreateTicketModal";
import { Ticket, User as UserType } from "@/types/ticket";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockTickets: Ticket[] = [
  {
    id: "1",
    title: "Problema com impressora do 2º andar",
    description: "A impressora HP do segundo andar não está funcionando",
    priority: "medium",
    status: "open",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    userId: "1"
  },
  {
    id: "2", 
    title: "Solicitação de novo software",
    description: "Preciso do Adobe Photoshop para desenvolvimento",
    priority: "low",
    status: "in_progress",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
    userId: "1"
  }
];

const faqData = [
  {
    question: "Como abrir um novo chamado?",
    answer: "Clique no botão 'Abrir Novo Chamado' no dashboard. Preencha o título, descrição detalhada do problema e selecione a prioridade adequada."
  },
  {
    question: "Qual o tempo de resposta para chamados?",
    answer: "Chamados de alta prioridade: até 2 horas. Média prioridade: até 8 horas. Baixa prioridade: até 24 horas."
  },
  {
    question: "Como acompanhar o status do meu chamado?",
    answer: "Você pode visualizar todos os seus chamados na seção 'Meus Chamados' do dashboard, onde mostra o status atual e histórico."
  },
  {
    question: "Posso alterar a prioridade de um chamado?",
    answer: "Não é possível alterar a prioridade após a criação. Se necessário, entre em contato com o suporte."
  }
];

const Dashboard = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate('/');
  };

  const handleCreateTicket = (ticketData: any) => {
    const newTicket: Ticket = {
      id: Date.now().toString(),
      ...ticketData,
      status: 'open' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user?.id || '1'
    };
    
    setTickets(prev => [newTicket, ...prev]);
    setIsCreateModalOpen(false);
    
    toast({
      title: "Chamado criado com sucesso!",
      description: `Chamado #${newTicket.id} foi registrado.`,
    });
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'status-badge-high';
      case 'medium':
        return 'status-badge-medium';
      case 'low':
        return 'status-badge-low';
      default:
        return 'status-badge-low';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-danger" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberto';
      case 'in_progress':
        return 'Em Andamento';
      case 'resolved':
        return 'Resolvido';
      case 'closed':
        return 'Fechado';
      default:
        return 'Desconhecido';
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sistema de Chamados</h1>
              <p className="text-sm text-muted-foreground">Painel de Controle</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{user.name}</span>
              <span className="text-muted-foreground">({user.department})</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Ações Rápidas</h2>
              
              <Card className="corporate-card corporate-card-hover cursor-pointer" 
                    onClick={() => setIsCreateModalOpen(true)}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-3 text-lg">
                    <div className="p-2 bg-gradient-primary rounded-lg">
                      <Plus className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span>Abrir Novo Chamado</span>
                  </CardTitle>
                  <CardDescription>
                    Reporte problemas técnicos ou solicite suporte
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Recent Tickets */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Meus Chamados Recentes</h2>
              
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="corporate-card">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <TicketIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground">
                            #{ticket.id}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityBadgeClass(ticket.priority)}>
                            {ticket.priority === 'high' ? 'Alta' : 
                             ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(ticket.status)}
                            <span className="text-sm text-muted-foreground">
                              {getStatusText(ticket.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-2">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Criado em {ticket.createdAt.toLocaleDateString('pt-BR')}</span>
                        <span>Atualizado em {ticket.updatedAt.toLocaleDateString('pt-BR')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {tickets.length === 0 && (
                  <Card className="corporate-card">
                    <CardContent className="pt-6 text-center py-12">
                      <TicketIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum chamado encontrado. Abra seu primeiro chamado!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* FAQ Sidebar */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Perguntas Frequentes</h2>
            
            <Card className="corporate-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <span>Ajuda Rápida</span>
                </CardTitle>
                <CardDescription>
                  Encontre respostas para dúvidas comuns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqData.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-sm font-medium text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
};

export default Dashboard;
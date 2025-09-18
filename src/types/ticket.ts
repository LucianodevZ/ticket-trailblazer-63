export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}
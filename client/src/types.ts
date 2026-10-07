export interface Client {
  id: number;
  name: string;
  phone: string;
  whatsapp?: string;
  cpf?: string;
  email?: string;
  address?: string;
  notes?: string;
  total_spent?: number;
  vehicle_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  client_id: number;
  client_name?: string;
  client_phone?: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  plate: string;
  mileage: number;
  fuel_level: string;
  notes?: string;
  is_in_workshop?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceCatalog {
  id: number;
  name: string;
  category: string;
  description?: string;
  default_price: number;
  estimated_time?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderService {
  id?: number;
  work_order_id?: number;
  service_catalog_id?: number | null;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
}

export interface WorkOrderPart {
  id?: number;
  work_order_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ChecklistItem {
  id?: number;
  checklist_id?: number;
  category: 'exterior' | 'interior' | 'mecanica';
  item_key: string;
  label: string;
  status: 'OK' | 'Com avaria' | 'Não verificado' | 'Não possui';
  notes?: string;
}

export interface WorkOrderChecklist {
  id?: number;
  work_order_id: number;
  general_notes?: string;
  created_at?: string;
  updated_at?: string;
  items?: ChecklistItem[];
}

export type OSStatus =
  | 'Aguardando avaliação'
  | 'Aguardando aprovação'
  | 'Aprovado'
  | 'Em execução'
  | 'Aguardando peça'
  | 'Concluído'
  | 'Entregue'
  | 'Cancelado';

export type PaymentMethod = 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito' | 'Outro';

export interface WorkOrder {
  id: number;
  os_number: string;
  client_id: number;
  client_name?: string;
  client_phone?: string;
  client_cpf?: string;
  client_email?: string;
  client_address?: string;
  vehicle_id: number;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  vehicle_color?: string;
  vehicle_plate?: string;
  vehicle_fuel?: string;
  entry_date: string;
  mileage: number;
  reported_problem: string;
  notes?: string;
  status: OSStatus;
  payment_method: PaymentMethod;
  services_total: number;
  parts_total: number;
  discount: number;
  final_total: number;
  created_at: string;
  updated_at: string;
  services?: WorkOrderService[];
  parts?: WorkOrderPart[];
  checklist?: WorkOrderChecklist;
  checklistItems?: ChecklistItem[];
}

export interface DashboardMetrics {
  totalOpen: number;
  awaitingApproval: number;
  inProgress: number;
  completed: number;
  inShopVehicles: number;
  todayRevenue: number;
  monthRevenue: number;
  recentWorkOrders: WorkOrder[];
}

export interface SearchResults {
  clients: Client[];
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
}

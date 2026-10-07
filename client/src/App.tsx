import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './components/DashboardPage';
import { ClientsPage } from './components/ClientsPage';
import { VehiclesPage } from './components/VehiclesPage';
import { WorkOrdersPage } from './components/WorkOrdersPage';
import { WorkshopVehiclesPage } from './components/WorkshopVehiclesPage';
import { ServicesPage } from './components/ServicesPage';
import { HistoryPage } from './components/HistoryPage';

// Modals
import { ClientModal } from './components/ClientModal';
import { VehicleModal } from './components/VehicleModal';
import { ServiceModal } from './components/ServiceModal';
import { WorkOrderModal } from './components/WorkOrderModal';
import { ChecklistModal } from './components/ChecklistModal';
import { PrintOSModal } from './components/PrintOSModal';
import { PrintChecklistModal } from './components/PrintChecklistModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

import type { Client, Vehicle, ServiceCatalog, WorkOrder, DashboardMetrics, ChecklistItem, WorkOrderChecklist } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);

  // Core App Data State
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalog[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);

  // Modals Visibility & Edit Targets
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [defaultVehicleClientId, setDefaultVehicleClientId] = useState<number | undefined>(undefined);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(null);

  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistTargetWO, setChecklistTargetWO] = useState<{
    woId: number;
    osNumber: string;
    vehicleInfo: string;
    checklist?: WorkOrderChecklist | null;
    items?: ChecklistItem[];
  } | null>(null);

  const [isPrintOSOpen, setIsPrintOSOpen] = useState(false);
  const [printWOTarget, setPrintWOTarget] = useState<WorkOrder | null>(null);

  const [isPrintChecklistOpen, setIsPrintChecklistOpen] = useState(false);
  const [printChecklistWOTarget, setPrintChecklistWOTarget] = useState<WorkOrder | null>(null);
  const [printChecklistItems, setPrintChecklistItems] = useState<ChecklistItem[]>([]);
  const [printChecklistNotes, setPrintChecklistNotes] = useState<string>('');

  // Global Keyboard Shortcuts (e.g. Ctrl+K for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial system data
  const refreshAllData = async () => {
    try {
      setLoadingMetrics(true);
      const [resMetrics, resClients, resVehicles, resServices] = await Promise.all([
        fetch('/api/dashboard/metrics'),
        fetch('/api/clients'),
        fetch('/api/vehicles'),
        fetch('/api/services?activeOnly=true')
      ]);

      if (resMetrics.ok) setDashboardMetrics(await resMetrics.json());
      if (resClients.ok) setClients(await resClients.json());
      if (resVehicles.ok) setVehicles(await resVehicles.json());
      if (resServices.ok) setServicesCatalog(await resServices.json());
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [currentTab]);

  // Client CRUD Handlers
  const handleSaveClient = async (clientData: Partial<Client>) => {
    const isEdit = !!clientData.id;
    const url = isEdit ? `/api/clients/${clientData.id}` : '/api/clients';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao salvar cliente');
    }

    refreshAllData();
  };

  // Vehicle CRUD Handlers
  const handleSaveVehicle = async (vehicleData: Partial<Vehicle>) => {
    const isEdit = !!vehicleData.id;
    const url = isEdit ? `/api/vehicles/${vehicleData.id}` : '/api/vehicles';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao salvar veículo');
    }

    refreshAllData();
  };

  // Service CRUD Handlers
  const handleSaveService = async (serviceData: Partial<ServiceCatalog>) => {
    const isEdit = !!serviceData.id;
    const url = isEdit ? `/api/services/${serviceData.id}` : '/api/services';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao salvar serviço');
    }

    refreshAllData();
  };

  // Work Order CRUD Handlers
  const handleSaveWorkOrder = async (woData: any) => {
    const isEdit = !!woData.id;
    const url = isEdit ? `/api/work-orders/${woData.id}` : '/api/work-orders';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(woData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao salvar Ordem de Serviço');
    }

    refreshAllData();
  };

  // Fetch single WO and open Edit Modal
  const handleOpenWorkOrderById = async (woId: number) => {
    try {
      const res = await fetch(`/api/work-orders/${woId}`);
      if (res.ok) {
        const fullWO = await res.json();
        setEditingWorkOrder(fullWO);
        setIsWorkOrderModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching work order:', err);
    }
  };

  // Checklist Modal Trigger
  const handleOpenChecklistModal = async (woId?: number) => {
    if (!woId) return;
    try {
      const res = await fetch(`/api/work-orders/${woId}`);
      if (res.ok) {
        const fullWO = await res.json();
        setChecklistTargetWO({
          woId: fullWO.id,
          osNumber: fullWO.os_number,
          vehicleInfo: `${fullWO.vehicle_brand} ${fullWO.vehicle_model} (${fullWO.vehicle_plate}) — ${fullWO.client_name}`,
          checklist: fullWO.checklist,
          items: fullWO.checklistItems
        });
        setIsChecklistModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching WO for checklist:', err);
    }
  };

  const handleSaveChecklist = async (generalNotes: string, items: ChecklistItem[]) => {
    if (!checklistTargetWO) return;
    const res = await fetch(`/api/work-orders/${checklistTargetWO.woId}/checklist`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ general_notes: generalNotes, items })
    });

    if (!res.ok) {
      throw new Error('Erro ao salvar checklist');
    }

    refreshAllData();
  };

  // Print OS Trigger
  const handlePrintWorkOrder = async (wo: WorkOrder) => {
    try {
      const res = await fetch(`/api/work-orders/${wo.id}`);
      if (res.ok) {
        const fullWO = await res.json();
        setPrintWOTarget(fullWO);
        setIsPrintOSOpen(true);
      }
    } catch (err) {
      console.error('Error fetching WO for print:', err);
    }
  };

  // Print Checklist Trigger
  const handlePrintChecklist = async (woId: number) => {
    try {
      const res = await fetch(`/api/work-orders/${woId}`);
      if (res.ok) {
        const fullWO = await res.json();
        setPrintChecklistWOTarget(fullWO);
        setPrintChecklistItems(fullWO.checklistItems || []);
        setPrintChecklistNotes(fullWO.checklist?.general_notes || '');
        setIsPrintChecklistOpen(true);
      }
    } catch (err) {
      console.error('Error fetching WO for checklist print:', err);
    }
  };

  // Backup Handler
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/backup');
      if (res.ok) {
        const backupData = await res.json();
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `eletrica_clean_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading backup:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onNewWorkOrder={() => {
            setEditingWorkOrder(null);
            setIsWorkOrderModalOpen(true);
          }}
          onBackup={handleDownloadBackup}
        />

        {/* Tab Pages Router */}
        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardPage
              metrics={dashboardMetrics}
              loading={loadingMetrics}
              onNewClient={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              onNewVehicle={() => {
                setEditingVehicle(null);
                setDefaultVehicleClientId(undefined);
                setIsVehicleModalOpen(true);
              }}
              onNewWorkOrder={() => {
                setEditingWorkOrder(null);
                setIsWorkOrderModalOpen(true);
              }}
              onNewService={() => {
                setEditingService(null);
                setIsServiceModalOpen(true);
              }}
              onOpenWorkOrder={handleOpenWorkOrderById}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsPage
              onNewClient={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              onEditClient={(client) => {
                setEditingClient(client);
                setIsClientModalOpen(true);
              }}
              onAddVehicleForClient={(clientId) => {
                setEditingVehicle(null);
                setDefaultVehicleClientId(clientId);
                setIsVehicleModalOpen(true);
              }}
              onNewOSForClient={() => {
                setEditingWorkOrder(null);
                setIsWorkOrderModalOpen(true);
              }}
              onOpenWorkOrder={handleOpenWorkOrderById}
            />
          )}

          {currentTab === 'vehicles' && (
            <VehiclesPage
              onNewVehicle={() => {
                setEditingVehicle(null);
                setDefaultVehicleClientId(undefined);
                setIsVehicleModalOpen(true);
              }}
              onEditVehicle={(vehicle) => {
                setEditingVehicle(vehicle);
                setIsVehicleModalOpen(true);
              }}
              onNewOSForVehicle={() => {
                setEditingWorkOrder(null);
                setIsWorkOrderModalOpen(true);
              }}
              onOpenWorkOrder={handleOpenWorkOrderById}
              clients={clients}
            />
          )}

          {currentTab === 'work-orders' && (
            <WorkOrdersPage
              onNewWorkOrder={() => {
                setEditingWorkOrder(null);
                setIsWorkOrderModalOpen(true);
              }}
              onEditWorkOrder={(wo) => {
                handleOpenWorkOrderById(wo.id);
              }}
              onOpenChecklistModal={handleOpenChecklistModal}
              onPrintWorkOrder={handlePrintWorkOrder}
              onPrintChecklist={handlePrintChecklist}
            />
          )}

          {currentTab === 'workshop' && (
            <WorkshopVehiclesPage
              onOpenWorkOrder={handleOpenWorkOrderById}
            />
          )}

          {currentTab === 'services' && (
            <ServicesPage
              onNewService={() => {
                setEditingService(null);
                setIsServiceModalOpen(true);
              }}
              onEditService={(service) => {
                setEditingService(service);
                setIsServiceModalOpen(true);
              }}
            />
          )}

          {currentTab === 'history' && (
            <HistoryPage
              onOpenWorkOrder={handleOpenWorkOrderById}
              onOpenChecklistModal={handleOpenChecklistModal}
              onPrintWorkOrder={handlePrintWorkOrder}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        editingClient={editingClient}
      />

      {/* 2. Vehicle Modal */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
        clients={clients}
        editingVehicle={editingVehicle}
        defaultClientId={defaultVehicleClientId}
      />

      {/* 3. Service Catalog Modal */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        editingService={editingService}
      />

      {/* 4. Work Order Modal */}
      <WorkOrderModal
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
        onSave={handleSaveWorkOrder}
        onOpenChecklistModal={handleOpenChecklistModal}
        clients={clients}
        vehicles={vehicles}
        servicesCatalog={servicesCatalog}
        editingWorkOrder={editingWorkOrder}
        onQuickAddClient={() => {
          setEditingClient(null);
          setIsClientModalOpen(true);
        }}
        onQuickAddVehicle={() => {
          setEditingVehicle(null);
          setIsVehicleModalOpen(true);
        }}
      />

      {/* 5. Checklist Modal */}
      {checklistTargetWO && (
        <ChecklistModal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          onSave={handleSaveChecklist}
          workOrderNumber={checklistTargetWO.osNumber}
          vehicleInfo={checklistTargetWO.vehicleInfo}
          initialChecklist={checklistTargetWO.checklist}
          initialItems={checklistTargetWO.items}
          onPrintChecklist={() => handlePrintChecklist(checklistTargetWO.woId)}
        />
      )}

      {/* 6. Print OS Modal */}
      <PrintOSModal
        isOpen={isPrintOSOpen}
        onClose={() => setIsPrintOSOpen(false)}
        workOrder={printWOTarget}
      />

      {/* 7. Print Checklist Modal */}
      <PrintChecklistModal
        isOpen={isPrintChecklistOpen}
        onClose={() => setIsPrintChecklistOpen(false)}
        workOrder={printChecklistWOTarget}
        checklistItems={printChecklistItems}
        generalNotes={printChecklistNotes}
      />

      {/* 8. Global Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onSelectClient={() => {
          setCurrentTab('clients');
        }}
        onSelectVehicle={() => {
          setCurrentTab('vehicles');
        }}
        onSelectWorkOrder={(woId) => {
          handleOpenWorkOrderById(woId);
        }}
      />
    </div>
  );
}

export default App;

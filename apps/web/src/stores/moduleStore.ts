import { create } from 'zustand';

interface ModuleState {
  entities: string[];
  forms: string[];
  activeModule: string | null;
  setActiveModule: (name: string | null) => void;
  addEntity: (name: string) => void;
  addForm: (name: string) => void;
}

export const useModuleStore = create<ModuleState>((set) => ({
  entities: [],
  forms: [],
  activeModule: null,
  setActiveModule: (name) => set({ activeModule: name }),
  addEntity: (name) => set((state) => ({ entities: [...state.entities, name] })),
  addForm: (name) => set((state) => ({ forms: [...state.forms, name] })),
}));

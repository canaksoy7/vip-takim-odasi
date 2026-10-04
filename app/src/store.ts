import { create } from 'zustand';
import { repo, setCurrentUser } from './data/repo';
import { ROL_KISI } from './data/seed';
import type { Rol } from './data/types';

export type Tema = 'sistem' | 'acik' | 'koyu';

interface AppState {
  rol: Rol;
  kullanici: string;
  tema: Tema;
  hazir: boolean;
  toast: string | null;
  setRol: (r: Rol) => void;
  setTema: (t: Tema) => void;
  showToast: (m: string) => void;
  yukle: () => Promise<void>;
}

function temaUygula(t: Tema) {
  const koyu = t === 'koyu' || (t === 'sistem' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = koyu ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', koyu ? '#06182b' : '#0b2a4a');
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useApp = create<AppState>((set) => ({
  rol: 'Ekip Üyesi',
  kullanici: ROL_KISI['Ekip Üyesi'],
  tema: 'sistem',
  hazir: false,
  toast: null,
  setRol: (rol) => {
    const kullanici = ROL_KISI[rol];
    setCurrentUser(kullanici);
    set({ rol, kullanici });
    void repo.setMeta('rol', rol);
  },
  setTema: (tema) => {
    temaUygula(tema);
    set({ tema });
    void repo.setMeta('tema', tema);
  },
  showToast: (toast) => {
    set({ toast });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
  yukle: async () => {
    const rol = (await repo.getMeta<Rol>('rol')) ?? 'Ekip Üyesi';
    const tema = (await repo.getMeta<Tema>('tema')) ?? 'sistem';
    setCurrentUser(ROL_KISI[rol]);
    temaUygula(tema);
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => temaUygula(useApp.getState().tema));
    set({ rol, tema, kullanici: ROL_KISI[rol], hazir: true });
  },
}));

export const isYonetici = () => useApp.getState().rol === 'Yönetici';

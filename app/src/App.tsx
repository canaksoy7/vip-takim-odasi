import { useEffect, useRef, useState, type ComponentType } from 'react';
import { useApp } from './store';
import { nav, back, useRoute, type Route } from './router';
import { ensureSeeded } from './data/seed';
import { bellekModundaMi, bellekVeritabaninaGec } from './data/repo';
import { gunlukTetikleyicileriCalistir } from './data/notify';
import { useTable } from './data/hooks';
import { DOCK, MODULLER, erisebilir, modul } from './modules/registry';
import { ErrorBoundary, Icon, Loading } from './ui/kit';
import { TumuPage, AraPage, AyarlarPage } from './pages';
import Altyapi from './modules/Altyapi';
import Masa from './modules/Masa';
import TalepMetni from './modules/TalepMetni';
import VipTalep from './modules/VipTalep';
import Taahhut from './modules/Taahhut';
import UstHat from './modules/UstHat';
import Indirim from './modules/Indirim';
import Yonetici from './modules/Yonetici';
import Ohe from './modules/Ohe';
import Kades from './modules/Kades';
import OheYon from './modules/OheYon';
import Rehber from './modules/Rehber';
import Hafiza from './modules/Hafiza';
import Pusula from './modules/Pusula';
import Rapor from './modules/Rapor';
import Studyo from './modules/Studyo';
import Gorev from './modules/Gorev';
import Bildirim from './modules/Bildirim';

const EKRANLAR: Record<string, ComponentType<{ route: Route }>> = {
  altyapi: Altyapi, masa: Masa, 'talep-metni': TalepMetni, 'vip-talep': VipTalep, taahhut: Taahhut, 'ust-hat': UstHat,
  indirim: Indirim, yonetici: Yonetici, ohe: Ohe, kades: Kades, 'ohe-yon': OheYon, rehber: Rehber, hafiza: Hafiza,
  pusula: Pusula, rapor: Rapor, studyo: Studyo, gorev: Gorev, bildirim: Bildirim,
};

export default function App() {
  const { hazir, yukle, rol, toast } = useApp();
  const [hata, setHata] = useState<string | null>(null);
  const route = useRoute();

  useEffect(() => {
    (async () => {
      try {
        if (new URLSearchParams(window.location.search).has('bellek')) throw new Error('bellek modu istendi');
        await ensureSeeded();
      } catch {
        // IndexedDB açılamadı → veriler yalnızca bu sekme açıkken tutulur
        await bellekVeritabaninaGec();
        await ensureSeeded();
      }
      await yukle();
      await gunlukTetikleyicileriCalistir();
    })().catch((e: unknown) => setHata(e instanceof Error ? e.message : String(e)));
  }, [yukle]);

  if (hata) {
    return (
      <div className="state" role="alert" style={{ paddingTop: 80 }}>
        <div className="big">⚠️</div>
        <h3>Demo veritabanı açılamadı</h3>
        <p className="small">{hata}</p>
        <p className="small">Tarayıcının gizli modu IndexedDB'yi engelliyor olabilir.</p>
      </div>
    );
  }
  if (!hazir) {
    return (
      <div className="app">
        <div className="demo-badge">DEMO · Örnek veri</div>
        <main className="content" style={{ paddingTop: 60 }}><Loading rows={5} /></main>
      </div>
    );
  }

  const dock = DOCK[rol];
  const ana = route.path[0] ?? dock[0];
  const izinli = erisebilir(rol, ana);
  const Ekran = EKRANLAR[ana];
  const m = modul(ana);
  const detay = route.path.length > 1;
  const baslik = ana === 'tumu' ? 'Tüm Modüller' : ana === 'ara' ? 'Genel Arama' : ana === 'ayarlar' ? 'Ayarlar' : m?.ad ?? 'VIP Hafıza';

  return (
    <div className="app">
      <div className="demo-badge" role="note">DEMO · Örnek veri</div>
      {bellekModundaMi() && (
        <div className="banner warn" role="status" style={{ borderRadius: 0, justifyContent: 'center' }}>
          <span>⚠️</span><div>Bu tarayıcı yerel veritabanına izin vermedi. Demo çalışıyor, ancak değişiklikler sayfa kapanınca silinir.</div>
        </div>
      )}
      <Header baslik={baslik} detay={detay} geri={() => back(`/${ana}`)} aramaGoster={!detay && ana !== 'ara'} />
      <main className="content">
        <ErrorBoundary key={route.path.join('/')}>
          {ana === 'tumu' ? <TumuPage /> :
            ana === 'ara' ? <AraPage /> :
              ana === 'ayarlar' ? <AyarlarPage /> :
                !izinli ? <YetkiYok /> :
                  Ekran ? <Ekran route={route} /> : <YetkiYok bulunamadi />}
        </ErrorBoundary>
      </main>
      <nav className="dock" aria-label="Ana menü">
        {dock.map((id) => {
          const d = MODULLER.find((x) => x.id === id)!;
          return (
            <button key={id} className={ana === id ? 'on' : ''} onClick={() => nav(`/${id}`)} aria-current={ana === id ? 'page' : undefined}>
              <span className="ico" aria-hidden>{d.ikon}</span>{d.kisa}
            </button>
          );
        })}
        <button className={ana === 'tumu' ? 'on' : ''} onClick={() => nav('/tumu')} aria-current={ana === 'tumu' ? 'page' : undefined}>
          <span className="ico" aria-hidden>▦</span>Tümü
        </button>
      </nav>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Header({ baslik, detay, geri, aramaGoster }: { baslik: string; detay: boolean; geri: () => void; aramaGoster: boolean }) {
  const { rol, kullanici } = useApp();
  const b = useTable('bildirim');
  const okunmamis = (b.data ?? []).filter((x) => !x.Okundu && (rol !== 'ÖHE Ekibi' || ['ohe', 'kades', 'ohe-yon'].includes(x.KaynakModul))).length;
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <header className="header" ref={ref}>
      <div className="header-row">
        {detay && <button className="icon-btn" onClick={geri} aria-label="Geri">{Icon.back}</button>}
        <h1>
          {baslik}
          <div className="sub">{kullanici} · {rol}</div>
        </h1>
        <button className="icon-btn" onClick={() => nav('/bildirim')} aria-label={`Bildirimler, ${okunmamis} okunmamış`}>
          {Icon.bell}
          {okunmamis > 0 && <span className="dot">{okunmamis > 99 ? '99+' : okunmamis}</span>}
        </button>
        <button className="icon-btn" onClick={() => nav('/ayarlar')} aria-label="Ayarlar">{Icon.gear}</button>
      </div>
      {aramaGoster && (
        <button className="search-trigger" onClick={() => nav('/ara')}>
          {Icon.search}<span>Proje ID, müşteri, şehir, kişi ara…</span>
        </button>
      )}
    </header>
  );
}

function YetkiYok({ bulunamadi }: { bulunamadi?: boolean }) {
  const rol = useApp((s) => s.rol);
  return (
    <div className="state">
      <div className="big">{bulunamadi ? '🧭' : '🔐'}</div>
      <h3>{bulunamadi ? 'Sayfa bulunamadı' : 'Bu ekran rolünüze kapalı'}</h3>
      <p className="small">{bulunamadi ? 'Aradığınız ekran yok.' : `${rol} rolü bu modülü göremez. Rolü Ayarlar'dan değiştirebilirsiniz.`}</p>
      <button className="btn" onClick={() => nav('/tumu')}>Tüm modüller</button>
    </div>
  );
}

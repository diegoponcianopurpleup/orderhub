"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PREP_STATUSES } from "@/lib/constants";
import { toMoney } from "@/lib/format";

type KitchenOrder = {
  id: string;
  code: string;
  orderType: "COUNTER" | "PICKUP" | "DELIVERY" | "TABLE";
  status: "OPEN" | "COMPLETED" | "CANCELED";
  prepStatus: "NEW" | "PREPARING" | "READY" | "DELIVERED";
  notes: string | null;
  tableNumber: string | null;
  total: number;
  createdAt: string;
  customer: { id: string; name: string } | null;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    addons: Array<{
      id: string;
      addonName: string;
      quantity: number;
    }>;
  }>;
};

const ORDER_TYPE_LABEL: Record<KitchenOrder["orderType"], string> = {
  COUNTER: "Balcao",
  PICKUP: "Retirada",
  DELIVERY: "Delivery",
  TABLE: "Mesa"
};

const COLUMN_META: Array<{ key: KitchenOrder["prepStatus"]; title: string; accent: string }> = [
  { key: "NEW", title: "Novo", accent: "border-sky-300" },
  { key: "PREPARING", title: "Em preparo", accent: "border-amber-300" },
  { key: "READY", title: "Pronto", accent: "border-emerald-300" },
  { key: "DELIVERED", title: "Entregue", accent: "border-violet-300" }
];

const ALERT_SOUND_PATH = "/sounds/new-order-alert.wav";
const SOUND_STORAGE_KEY = "kitchen_sound_enabled";
const AUTO_PRINT_KITCHEN_KEY = "kitchen_auto_print_enabled";
const MOBILE_MODE_KEY = "kitchen_mobile_mode";

export function KitchenBoard({ initialOrders }: { initialOrders: KitchenOrder[] }) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [mobileMode, setMobileMode] = useState(false);
  const [mobileColumn, setMobileColumn] = useState<KitchenOrder["prepStatus"]>("NEW");
  const alertedOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map((order) => order.id)));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const persistBool = useCallback((key: string, value: boolean) => {
    try {
      window.localStorage.setItem(key, value ? "1" : "0");
    } catch (error) {
      console.error("Nao foi possivel salvar preferencia local.", error);
    }
  }, []);

  const persistSoundPreference = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    persistBool(SOUND_STORAGE_KEY, enabled);
  }, [persistBool]);

  const openPrintPage = useCallback((orderId: string, autoPrint = true) => {
    const query = autoPrint ? "?autoprint=1" : "";
    window.open(`/print/orders/${orderId}${query}`, "_blank", "noopener,noreferrer");
  }, []);

  useEffect(() => {
    const audio = new Audio(ALERT_SOUND_PATH);
    audio.preload = "auto";
    audio.volume = 1;

    if (window.localStorage.getItem(SOUND_STORAGE_KEY) === "1") {
      setSoundEnabled(true);
    }

    if (window.localStorage.getItem(AUTO_PRINT_KITCHEN_KEY) === "1") {
      setAutoPrintEnabled(true);
    }

    if (window.localStorage.getItem(MOBILE_MODE_KEY) === "1") {
      setMobileMode(true);
    }

    const handleCanPlay = () => {
      setAudioReady(true);
    };

    const handleError = () => {
      setAudioReady(false);
      console.error("Erro ao carregar arquivo de alerta.", { src: ALERT_SOUND_PATH, error: audio.error });
    };

    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.load();
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, []);

  const playAlert = useCallback(async (origin: "enable" | "test" | "new-order") => {
    const baseAudio = audioRef.current;
    if (!baseAudio) return false;

    const alertAudio = baseAudio.cloneNode(true) as HTMLAudioElement;
    alertAudio.volume = 1;
    alertAudio.currentTime = 0;

    try {
      console.info("Executando audio.play()", { origin, src: ALERT_SOUND_PATH });
      await alertAudio.play();
      return true;
    } catch (error) {
      console.error("Falha no audio.play().", { origin, error });
      return false;
    }
  }, []);

  const playNewOrderAlert = useCallback((times: number) => {
    if (!soundEnabled || times <= 0) return;

    for (let index = 0; index < times; index += 1) {
      window.setTimeout(() => {
        void playAlert("new-order");
      }, index * 600);
    }
  }, [playAlert, soundEnabled]);

  const toggleSound = useCallback(async () => {
    if (soundEnabled) {
      persistSoundPreference(false);
      return;
    }

    const played = await playAlert("enable");
    if (!played) {
      window.alert("Nao foi possivel ativar o som. Verifique permissoes de audio no navegador.");
      return;
    }

    persistSoundPreference(true);
  }, [persistSoundPreference, playAlert, soundEnabled]);

  const testSound = useCallback(async () => {
    if (!soundEnabled) {
      window.alert("Ative o som antes de testar.");
      return;
    }

    await playAlert("test");
  }, [playAlert, soundEnabled]);

  const toggleAutoPrint = useCallback(() => {
    const next = !autoPrintEnabled;
    setAutoPrintEnabled(next);
    persistBool(AUTO_PRINT_KITCHEN_KEY, next);
  }, [autoPrintEnabled, persistBool]);

  const toggleMobileMode = useCallback(() => {
    const next = !mobileMode;
    setMobileMode(next);
    persistBool(MOBILE_MODE_KEY, next);
  }, [mobileMode, persistBool]);

  const grouped = useMemo(() => {
    return COLUMN_META.map((column) => ({
      ...column,
      orders: orders.filter((order) => order.prepStatus === column.key)
    }));
  }, [orders]);

  const refreshOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders?status=OPEN&view=kitchen", { cache: "no-store" });
      const data = await response.json();

      const normalized = (data as any[])
        .filter((order) => order.status === "OPEN")
        .map((order) => ({
          ...order,
          prepStatus: order.prepStatus || "NEW",
          total: Number(order.total),
          createdAt: new Date(order.createdAt).toISOString()
        }));

      const newOrderIds = normalized
        .filter((order) => order.prepStatus === "NEW" && !alertedOrderIdsRef.current.has(order.id))
        .map((order) => order.id);

      newOrderIds.forEach((orderId) => alertedOrderIdsRef.current.add(orderId));

      if (newOrderIds.length > 0) {
        playNewOrderAlert(newOrderIds.length);

        if (autoPrintEnabled) {
          newOrderIds.forEach((orderId) => openPrintPage(orderId, true));
        }
      }

      setOrders(normalized);
    } catch (error) {
      console.error("Falha ao atualizar pedidos da cozinha.", error);
    }
  }, [autoPrintEnabled, openPrintPage, playNewOrderAlert]);

  useEffect(() => {
    void refreshOrders();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshOrders();
      }
    }, 7000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshOrders();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshOrders]);

  async function updatePrepStatus(orderId: string, prepStatus: KitchenOrder["prepStatus"]) {
    setUpdatingId(orderId);

    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, prepStatus })
      });

      await refreshOrders();
    } finally {
      setUpdatingId(null);
    }
  }

  function renderOrderCard(order: KitchenOrder) {
    return (
      <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-lg font-extrabold">{order.code}</p>
            <p className="text-xs text-slate-500">{ORDER_TYPE_LABEL[order.orderType]} {order.tableNumber ? `- Comanda ${order.tableNumber}` : ""}</p>
            <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <p className="text-sm font-bold text-brand-700 dark:text-brand-100">{toMoney(order.total)}</p>
        </div>

        <div className="mt-2 space-y-1 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
              <p className="font-semibold">{item.quantity}x {item.productName}</p>
              {item.addons.length ? (
                <p className="text-xs text-slate-500">+ {item.addons.map((addon) => `${addon.quantity}x ${addon.addonName}`).join(", ")}</p>
              ) : null}
            </div>
          ))}
        </div>

        {order.notes ? <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">Obs: {order.notes}</p> : null}

        <button className="btn-secondary mt-2 w-full" type="button" onClick={() => openPrintPage(order.id, false)}>Imprimir pedido</button>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {PREP_STATUSES.map((statusOption) => (
            <button
              key={`${order.id}-${statusOption.value}`}
              type="button"
              disabled={updatingId === order.id}
              className={statusOption.value === order.prepStatus ? "btn-primary py-2 text-xs" : "btn-secondary py-2 text-xs"}
              onClick={() => updatePrepStatus(order.id, statusOption.value as KitchenOrder["prepStatus"])}
            >
              {statusOption.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const mobileColumnOrders = grouped.find((column) => column.key === mobileColumn)?.orders || [];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold sm:text-xl">Cozinha / Fila de Preparo</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button className={soundEnabled ? "btn-primary" : "btn-secondary"} type="button" onClick={toggleSound}>
            {soundEnabled ? "Som ON" : "Ativar som"}
          </button>
          <button className="btn-secondary" type="button" onClick={testSound}>Testar som</button>
          <button className={autoPrintEnabled ? "btn-primary" : "btn-secondary"} type="button" onClick={toggleAutoPrint}>
            {autoPrintEnabled ? "Auto print ON" : "Auto print OFF"}
          </button>
          <button className={mobileMode ? "btn-primary" : "btn-secondary"} type="button" onClick={toggleMobileMode}>
            {mobileMode ? "Cozinha mobile ON" : "Cozinha mobile"}
          </button>
          <button className="btn-secondary" type="button" onClick={refreshOrders}>Atualizar</button>
        </div>
      </div>

      {!audioReady ? <p className="text-xs text-amber-600">Aguardando carregamento do som...</p> : null}

      {mobileMode ? (
        <div className="space-y-3">
          <div className="panel">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {grouped.map((column) => (
                <button
                  key={column.key}
                  className={mobileColumn === column.key ? "btn-primary whitespace-nowrap" : "btn-secondary whitespace-nowrap"}
                  type="button"
                  onClick={() => setMobileColumn(column.key)}
                >
                  {column.title} ({column.orders.length})
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {mobileColumnOrders.map((order) => renderOrderCard(order))}
            {!mobileColumnOrders.length ? <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700">Sem pedidos</p> : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {grouped.map((column) => (
            <article key={column.key} className={`panel min-h-[420px] border-2 ${column.accent}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{column.title}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold dark:bg-slate-800">{column.orders.length}</span>
              </div>

              <div className="space-y-3">
                {column.orders.map((order) => renderOrderCard(order))}
                {!column.orders.length ? <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700">Sem pedidos</p> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

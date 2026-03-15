"use client";

import { useEffect, useMemo, useState } from "react";
import { Addon, Category, Customer, Product } from "@/lib/types";
import { ORDER_TYPES, PAYMENT_METHODS } from "@/lib/constants";
import { toMoney } from "@/lib/format";

type OrderRecord = {
  id: string;
  code: string;
  orderType: "COUNTER" | "PICKUP" | "DELIVERY" | "TABLE";
  status: "OPEN" | "COMPLETED" | "CANCELED";
  prepStatus: "NEW" | "PREPARING" | "READY" | "DELIVERED";
  notes: string | null;
  tableNumber: string | null;
  discount: number;
  subtotal: number;
  total: number;
  customerId: string | null;
  customer: Customer | null;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string | null;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    addons: Array<{
      id: string;
      addonId: string | null;
      addonName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }>;
  }>;
  payments: Array<{ id: string; method: string; amount: number }>;
};

type CurrentItem = {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  addons: Array<{
    addonId: string;
    addonName: string;
    unitPrice: number;
    quantity: number;
  }>;
};

const PREP_STATUS_LABEL: Record<OrderRecord["prepStatus"], string> = {
  NEW: "Novo",
  PREPARING: "Em preparo",
  READY: "Pronto",
  DELIVERED: "Entregue"
};

const AUTO_PRINT_ON_SEND_KEY = "orders_auto_print_on_send";

export function OrderManager({
  products,
  addons,
  customers,
  initialOrders
}: {
  products: Product[];
  addons: Addon[];
  customers: Customer[];
  initialOrders: OrderRecord[];
}) {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [currentItems, setCurrentItems] = useState<CurrentItem[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [paymentByOrder, setPaymentByOrder] = useState<Record<string, string>>({});
  const [checkoutPayment, setCheckoutPayment] = useState("PIX");

  const [orderType, setOrderType] = useState<"COUNTER" | "PICKUP" | "DELIVERY" | "TABLE">("COUNTER");
  const [customerId, setCustomerId] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [historyFilter, setHistoryFilter] = useState<"ALL" | "OPEN" | "COMPLETED" | "CANCELED">("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [autoPrintOnSend, setAutoPrintOnSend] = useState(false);

  const availableProducts = useMemo(() => {
    return products.filter((product) => {
      const category = product.category as Category | null | undefined;
      const categoryAllowed = !category || category.isActive;
      return product.isActive && !product.outOfStock && categoryAllowed;
    });
  }, [products]);

  const selectedProduct = availableProducts.find((product) => product.id === selectedProductId) || availableProducts[0];

  const activeAddons = useMemo(() => addons.filter((addon) => addon.isActive && !addon.outOfStock), [addons]);

  const availableAddons = useMemo(() => {
    if (!selectedProduct) return activeAddons;

    return activeAddons.filter((addon) => {
      if (!addon.products || addon.products.length === 0) return true;
      return addon.products.some((link) => link.productId === selectedProduct.id);
    });
  }, [activeAddons, selectedProduct]);

  const selectedItem = useMemo(() => currentItems.find((item) => item.id === selectedItemId) || null, [currentItems, selectedItemId]);

  const addonsForSelectedItem = useMemo(() => {
    if (!selectedItem) return [];
    return activeAddons.filter((addon) => {
      if (!addon.products || addon.products.length === 0) return true;
      return addon.products.some((link) => link.productId === selectedItem.productId);
    });
  }, [activeAddons, selectedItem]);

  const subtotal = useMemo(() => {
    return currentItems.reduce((sum, item) => {
      const addonsTotal = item.addons.reduce((s, addon) => s + addon.unitPrice * addon.quantity, 0);
      return sum + item.unitPrice * item.quantity + addonsTotal;
    }, 0);
  }, [currentItems]);

  const total = Math.max(subtotal - discount, 0);
  useEffect(() => {
    const stored = window.localStorage.getItem(AUTO_PRINT_ON_SEND_KEY);
    setAutoPrintOnSend(stored === "1");
  }, []);

  function persistAutoPrintOnSend(value: boolean) {
    setAutoPrintOnSend(value);

    try {
      window.localStorage.setItem(AUTO_PRINT_ON_SEND_KEY, value ? "1" : "0");
    } catch (error) {
      console.error("NÃ£o foi possÃ­vel salvar preferÃªncia de impressÃ£o automÃ¡tica.", error);
    }
  }

  function openPrintPage(orderId: string, autoPrint = true) {
    const query = autoPrint ? "?autoprint=1" : "";
    window.open(`/print/orders/${orderId}${query}`, "_blank", "noopener,noreferrer");
  }

  const historyOrders = useMemo(() => {
    const normalized = historySearch.trim().toLowerCase();

    return orders.filter((order) => {
      const byStatus = historyFilter === "ALL" ? true : order.status === historyFilter;
      const bySearch =
        !normalized ||
        order.code.toLowerCase().includes(normalized) ||
        (order.customer?.name || "").toLowerCase().includes(normalized) ||
        (order.tableNumber || "").toLowerCase().includes(normalized);
      return byStatus && bySearch;
    });
  }, [orders, historyFilter, historySearch]);

  async function refreshOrders() {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (!response.ok) return;

    const data = await response.json();
    setOrders(
      data.map((order: any) => ({
        ...order,
        discount: Number(order.discount),
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        prepStatus: order.prepStatus || "NEW",
        items: order.items.map((item: any) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          addons: item.addons.map((addon: any) => ({
            ...addon,
            unitPrice: Number(addon.unitPrice),
            subtotal: Number(addon.subtotal)
          }))
        })),
        payments: order.payments.map((payment: any) => ({ ...payment, amount: Number(payment.amount) }))
      }))
    );
  }

  function toggleAddon(addonId: string) {
    setSelectedAddonIds((prev) => (prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]));
  }

  function quickAddProduct(productId: string) {
    const product = availableProducts.find((item) => item.id === productId);
    if (!product) return;

    const newItem: CurrentItem = {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: 1,
      addons: []
    };

    setCurrentItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  }

  function addCurrentItem() {
    if (!selectedProduct) {
      window.alert("Sem produto disponÃ­vel.");
      return;
    }

    const chosenAddons = availableAddons
      .filter((addon) => selectedAddonIds.includes(addon.id))
      .map((addon) => ({ addonId: addon.id, addonName: addon.name, unitPrice: addon.price, quantity: 1 }));

    const newItem: CurrentItem = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unitPrice: selectedProduct.price,
      quantity: selectedQuantity,
      addons: chosenAddons
    };

    setCurrentItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    setSelectedQuantity(1);
    setSelectedAddonIds([]);
  }

  function updateItemQuantity(id: string, delta: number) {
    setCurrentItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)));
  }

  function toggleAddonOnItem(itemId: string, addon: Addon) {
    setCurrentItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const exists = item.addons.some((row) => row.addonId === addon.id);
        if (exists) {
          return { ...item, addons: item.addons.filter((row) => row.addonId !== addon.id) };
        }

        return {
          ...item,
          addons: [...item.addons, { addonId: addon.id, addonName: addon.name, unitPrice: addon.price, quantity: 1 }]
        };
      })
    );
  }

  function removeItem(id: string) {
    setCurrentItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  }

  function resetBuilder() {
    setCurrentItems([]);
    setEditingOrderId(null);
    setOrderType("COUNTER");
    setCustomerId("");
    setTableNumber("");
    setNotes("");
    setDiscount(0);
    setSelectedAddonIds([]);
    setSelectedItemId(null);
    setCheckoutPayment("PIX");
  }

  function buildOrderPayload() {
    return {
      customerId: customerId || null,
      orderType,
      tableNumber: tableNumber || null,
      notes: notes || null,
      discount,
      items: currentItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        addons: item.addons
      }))
    };
  }

  async function saveOrder() {
    if (!currentItems.length) {
      window.alert("Adicione itens no pedido.");
      return;
    }

    const payload = buildOrderPayload();
    let response: Response;

    if (editingOrderId) {
      response = await fetch(`/api/orders/${editingOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      window.alert("NÃ£o foi possÃ­vel salvar o pedido. Tente novamente.");
      return;
    }

    await refreshOrders();
    resetBuilder();
  }

  async function finalizeOrderFromBuilder() {
    if (!currentItems.length) {
      window.alert("Adicione itens no pedido.");
      return;
    }

    if (editingOrderId) {
      await saveOrder();
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildOrderPayload())
    });

    if (!response.ok) {
      window.alert("NÃ£o foi possÃ­vel enviar para preparo. Tente novamente.");
      return;
    }

    const createdOrder = await response.json();

    if (autoPrintOnSend && createdOrder?.id) {
      openPrintPage(createdOrder.id, true);
    }

    await refreshOrders();
    resetBuilder();
  }

  function editOrder(order: OrderRecord) {
    if (order.status !== "OPEN") return;

    setEditingOrderId(order.id);
    setOrderType(order.orderType);
    setCustomerId(order.customerId || "");
    setTableNumber(order.tableNumber || "");
    setNotes(order.notes || "");
    setDiscount(order.discount);

    const loadedItems = order.items.map((item) => ({
      id: item.id,
      productId: item.productId || "",
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      addons: item.addons.map((addon) => ({
        addonId: addon.addonId || "",
        addonName: addon.addonName,
        unitPrice: addon.unitPrice,
        quantity: addon.quantity
      }))
    }));

    setCurrentItems(loadedItems);
    setSelectedItemId(loadedItems[0]?.id || null);
  }

  async function updateOrderStatus(order: OrderRecord, status: "COMPLETED" | "CANCELED") {
    const paymentMethod = status === "COMPLETED" ? (paymentByOrder[order.id] || "PIX") : undefined;

    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: order.id,
        status,
        paymentMethod,
        paymentAmount: order.total
      })
    });

    if (!response.ok) {
      window.alert("NÃ£o foi possÃ­vel atualizar o pedido.");
      return;
    }

    await refreshOrders();
    if (editingOrderId === order.id) resetBuilder();
  }

  const openOrders = historyOrders.filter((order) => order.status === "OPEN");
  const closedOrders = historyOrders.filter((order) => order.status !== "OPEN");

  return (
    <section className="space-y-3">
      <article className="panel space-y-3">
        <h3 className="text-lg font-semibold">{editingOrderId ? "Editar pedido" : "Modo Caixa"}</h3>

        <div className="grid gap-2 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm">Tipo</label>
            <select className="input" value={orderType} onChange={(e) => setOrderType(e.target.value as any)}>
              {ORDER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Cliente</label>
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Sem cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Mesa/Comanda</label>
            <input className="input" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Ex: 12" />
          </div>

          <div>
            <label className="mb-1 block text-sm">Desconto</label>
            <input className="input" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">ObservaÃ§Ãµes</label>
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sem banana, sem gelo..." />
        </div>

        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <h4 className="mb-2 font-semibold">Produtos (clique rÃ¡pido)</h4>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5">
            {availableProducts.map((product) => (
              <button
                key={`quick-${product.id}`}
                className={`min-h-24 rounded-2xl border p-3 text-left transition ${selectedProduct?.id === product.id ? "border-brand-600 bg-brand-50 ring-2 ring-brand-500 dark:bg-slate-800" : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"}`}
                type="button"
                onClick={() => { setSelectedProductId(product.id); quickAddProduct(product.id); }}
              >
                <span className="block truncate text-base font-extrabold md:text-lg">{product.name}</span>
                <span className="mt-2 block text-sm font-semibold text-brand-700 dark:text-brand-100">{toMoney(product.price)}</span>
              </button>
            ))}
          </div>
        </div>

        <details className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <summary className="cursor-pointer font-semibold">Adicionar item detalhado</summary>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm">Produto</label>
              <select className="input" value={selectedProduct?.id || ""} onChange={(e) => setSelectedProductId(e.target.value)}>
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} ({toMoney(product.price)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">Quantidade</label>
              <input className="input" type="number" min={1} value={selectedQuantity} onChange={(e) => setSelectedQuantity(Number(e.target.value))} />
            </div>
            <button className="btn-primary h-fit self-end" onClick={addCurrentItem} type="button">Adicionar item</button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {availableAddons.map((addon) => (
              <label key={addon.id} className="flex min-h-14 items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-semibold dark:border-slate-700">
                <input type="checkbox" checked={selectedAddonIds.includes(addon.id)} onChange={() => toggleAddon(addon.id)} />
                <span className="truncate">{addon.name} ({toMoney(addon.price)})</span>
              </label>
            ))}
          </div>
        </details>

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <h4 className="font-semibold">Carrinho</h4>
          {currentItems.length === 0 ? <p className="text-sm text-slate-500">Nenhum item no pedido.</p> : null}
          <div className="max-h-[44vh] space-y-2 overflow-auto pr-1">
            {currentItems.map((item) => {
              const addonsTotal = item.addons.reduce((sum, addon) => sum + addon.unitPrice * addon.quantity, 0);
              const itemTotal = item.unitPrice * item.quantity + addonsTotal;
              const isSelected = selectedItemId === item.id;

              return (
                <article
                  key={item.id}
                  className={`cursor-pointer rounded-xl border p-3 ${isSelected ? "border-brand-600 bg-brand-50 shadow-sm ring-1 ring-brand-400 dark:bg-slate-800" : "border-slate-200 dark:border-slate-700"}`}
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h5 className="font-semibold">{item.productName}</h5>
                      <p className="text-xs text-slate-500">{item.addons.length ? `Complementos: ${item.addons.map((addon) => addon.addonName).join(", ")}` : "Sem complementos"}</p>
                      <p className="mt-1 text-sm font-bold text-brand-700 dark:text-brand-100">Total item: {toMoney(itemTotal)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary h-10 w-10 p-0 text-lg" onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, -1); }} type="button">-</button>
                      <span className="inline-flex min-w-8 items-center justify-center text-base font-bold">{item.quantity}</span>
                      <button className="btn-secondary h-10 w-10 p-0 text-lg" onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, 1); }} type="button">+</button>
                      <button className="btn-danger" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} type="button">Remover</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {selectedItem ? (
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <h4 className="mb-2 font-semibold">Complementos do item selecionado (1 clique)</h4>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5">
              {addonsForSelectedItem.map((addon) => {
                const active = selectedItem.addons.some((row) => row.addonId === addon.id);
                return (
                  <button
                    key={`item-addon-${addon.id}`}
                    className={active ? "btn-primary min-h-14 text-base" : "btn-secondary min-h-14 text-base"}
                    type="button"
                    onClick={() => toggleAddonOnItem(selectedItem.id, addon)}
                  >
                    {active ? "âœ“ " : "+ "}{addon.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="sticky bottom-0 z-10 rounded-2xl border-2 border-brand-600 bg-white p-4 shadow-lg dark:bg-slate-900">
          <p className="text-sm">Subtotal: <strong>{toMoney(subtotal)}</strong></p>
          <p className="text-5xl font-black tracking-tight text-brand-700 dark:text-brand-100">Total: {toMoney(total)}</p>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            <button className="btn-secondary" onClick={saveOrder} type="button">Salvar em aberto</button>
            <select className="input h-12 text-base font-semibold" value={checkoutPayment} onChange={(e) => setCheckoutPayment(e.target.value)}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
            <button className="btn-primary py-3 text-base font-extrabold shadow-md sm:py-4 sm:text-xl" onClick={finalizeOrderFromBuilder} type="button">
              {editingOrderId ? "Salvar ediÃ§Ã£o" : "Enviar para preparo"}
            </button>
            <button
              className={autoPrintOnSend ? "btn-primary" : "btn-secondary"}
              onClick={() => persistAutoPrintOnSend(!autoPrintOnSend)}
              type="button"
            >
              {autoPrintOnSend ? "AutoimpressÃ£o ON" : "AutoimpressÃ£o OFF"}
            </button>
          </div>

          {editingOrderId ? <button className="btn-secondary mt-2" onClick={resetBuilder} type="button">Cancelar ediÃ§Ã£o</button> : null}
        </div>
      </article>

      <article className="panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Pedidos em aberto e histÃ³rico</h3>
          <input className="input w-full md:w-64" placeholder="Buscar por cÃ³digo, cliente ou comanda" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["ALL", "OPEN", "COMPLETED", "CANCELED"] as const).map((status) => (
            <button key={status} type="button" className={historyFilter === status ? "btn-primary" : "btn-secondary"} onClick={() => setHistoryFilter(status)}>
              {status === "ALL" ? "Todos" : status === "OPEN" ? "Abertos" : status === "COMPLETED" ? "Finalizados" : "Cancelados"}
            </button>
          ))}
        </div>

        {openOrders.length ? <p className="text-sm font-semibold">Em aberto</p> : null}
        {openOrders.map((order) => (
          <div key={order.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{order.code} â€¢ {order.customer?.name || "Sem cliente"}</p>
                <p className="text-xs text-slate-500">Tipo: {order.orderType} â€¢ Comanda: {order.tableNumber || "-"} â€¢ Cozinha: {PREP_STATUS_LABEL[order.prepStatus]}</p>
                <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <p className="text-2xl font-bold text-brand-700 dark:text-brand-100">{toMoney(order.total)}</p>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => editOrder(order)} type="button">Editar</button>
              <button className="btn-secondary" onClick={() => openPrintPage(order.id, false)} type="button">Imprimir pedido</button>
              <select className="input w-40" value={paymentByOrder[order.id] || "PIX"} onChange={(e) => setPaymentByOrder((prev) => ({ ...prev, [order.id]: e.target.value }))}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={() => updateOrderStatus(order, "COMPLETED")} type="button">Fechar</button>
              <button className="btn-danger" onClick={() => updateOrderStatus(order, "CANCELED")} type="button">Cancelar</button>
            </div>
          </div>
        ))}

        {closedOrders.length ? <p className="text-sm font-semibold">HistÃ³rico</p> : null}
        {closedOrders.map((order) => (
          <div key={order.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{order.code} â€¢ {order.customer?.name || "Sem cliente"}</p>
                <p className="text-xs text-slate-500">Status: {order.status} â€¢ Cozinha: {PREP_STATUS_LABEL[order.prepStatus]} â€¢ Pagamento: {order.payments.length ? order.payments.map((p) => p.method).join(", ") : "-"}</p>
                <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <p className="text-2xl font-bold text-brand-700 dark:text-brand-100">{toMoney(order.total)}</p>
            </div>
          </div>
        ))}
      </article>
    </section>
  );
}











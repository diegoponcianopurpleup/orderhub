"use client";

export function PrintActions() {
  return (
    <div className="mt-3 flex gap-2 print:hidden">
      <button className="btn-primary w-full" type="button" onClick={() => window.print()}>Imprimir pedido</button>
      <button className="btn-secondary" type="button" onClick={() => window.close()}>Fechar</button>
    </div>
  );
}

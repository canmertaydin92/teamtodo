"use client";

import { useState } from "react";

interface Payment {
  id: string;
  title: string;
  date: string;
  expense: number;
  income: number;
  createdAt: string;
  author: { id: string; name?: string | null; image?: string | null };
}

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PaymentsClient({ initialPayments }: { initialPayments: Payment[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [expense, setExpense] = useState("");
  const [income, setIncome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalExpense = payments.reduce((s, p) => s + p.expense, 0);
  const totalIncome = payments.reduce((s, p) => s + p.income, 0);
  const totalProfit = totalIncome - totalExpense;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, expense: expense || 0, income: income || 0 }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Bir hata oluştu");
        return;
      }
      const payment = await res.json();
      setPayments((prev) => [payment, ...prev]);
      setTitle("");
      setDate(new Date().toISOString().slice(0, 10));
      setExpense("");
      setIncome("");
    } catch {
      alert("Bağlantı hatası, tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kaydı silmek istediğine emin misin?")) return;
    await fetch(`/api/payments?id=${id}`, { method: "DELETE" });
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Özet kartları */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Toplam Gider</p>
          <p className="text-xl font-bold text-red-400">₺{fmt(totalExpense)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Toplam Gelir</p>
          <p className="text-xl font-bold text-green-400">₺{fmt(totalIncome)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Net Kâr</p>
          <p className={`text-xl font-bold ${totalProfit >= 0 ? "text-indigo-400" : "text-red-400"}`}>
            ₺{fmt(totalProfit)}
          </p>
        </div>
      </div>

      {/* Yeni kayıt formu */}
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-300">Yeni İş Ekle</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="İş adı *"
          className="w-full text-sm bg-gray-800 outline-none text-gray-200 placeholder:text-gray-600 rounded-lg px-3 py-2"
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tarih *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm bg-gray-800 outline-none text-gray-200 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Harcanan (₺)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={expense}
              onChange={(e) => setExpense(e.target.value)}
              placeholder="0.00"
              className="w-full text-sm bg-gray-800 outline-none text-gray-200 placeholder:text-gray-600 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Alınan (₺)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="0.00"
              className="w-full text-sm bg-gray-800 outline-none text-gray-200 placeholder:text-gray-600 rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div className="flex justify-end pt-1 border-t border-gray-800">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !date}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm rounded-lg font-medium transition-colors"
          >
            {submitting ? "Ekleniyor..." : "Ekle"}
          </button>
        </div>
      </form>

      {/* Kayıt listesi */}
      {payments.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-sm">Henüz kayıt yok</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500">
                <th className="text-left px-4 py-3">İş</th>
                <th className="text-left px-4 py-3">Tarih</th>
                <th className="text-right px-4 py-3">Harcanan</th>
                <th className="text-right px-4 py-3">Alınan</th>
                <th className="text-right px-4 py-3">Kâr</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const profit = p.income - p.expense;
                return (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-200">{p.title}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(p.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">₺{fmt(p.expense)}</td>
                    <td className="px-4 py-3 text-right text-green-400">₺{fmt(p.income)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${profit >= 0 ? "text-indigo-400" : "text-red-400"}`}>
                      ₺{fmt(profit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-gray-700 hover:text-red-400 transition-colors"
                        title="Sil"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

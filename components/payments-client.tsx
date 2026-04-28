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

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

export function PaymentsClient({ initialPayments }: { initialPayments: Payment[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [expense, setExpense] = useState("");
  const [income, setIncome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()));
  const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth() + 1));

  // Mevcut yılları hesapla
  const years = Array.from(new Set(payments.map((p) => new Date(p.date).getFullYear())))
    .sort((a, b) => b - a);
  if (!years.includes(now.getFullYear())) years.unshift(now.getFullYear());

  const filtered = payments.filter((p) => {
    const d = new Date(p.date);
    const yearMatch = filterYear === "all" || d.getFullYear() === parseInt(filterYear);
    const monthMatch = filterMonth === "all" || (d.getMonth() + 1) === parseInt(filterMonth);
    return yearMatch && monthMatch;
  });

  const totalExpense = filtered.reduce((s, p) => s + p.expense, 0);
  const totalIncome = filtered.reduce((s, p) => s + p.income, 0);
  const totalProfit = totalIncome - totalExpense;

  const filterLabel = filterYear === "all"
    ? "Tüm Zamanlar"
    : filterMonth === "all"
    ? filterYear
    : `${MONTHS[parseInt(filterMonth) - 1]} ${filterYear}`;

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
      {/* Filtre */}
      <div className="flex items-center gap-3">
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 outline-none border border-gray-700"
        >
          <option value="all">Tüm Yıllar</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 outline-none border border-gray-700"
        >
          <option value="all">Tüm Aylar</option>
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500">{filtered.length} kayıt · {filterLabel}</span>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex sm:block items-center justify-between">
          <p className="text-xs text-gray-500">Toplam Gider</p>
          <p className="text-lg font-bold text-red-400">₺{fmt(totalExpense)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex sm:block items-center justify-between">
          <p className="text-xs text-gray-500">Toplam Gelir</p>
          <p className="text-lg font-bold text-green-400">₺{fmt(totalIncome)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex sm:block items-center justify-between">
          <p className="text-xs text-gray-500">Net Kâr</p>
          <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-indigo-400" : "text-red-400"}`}>
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
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-sm">{payments.length === 0 ? "Henüz kayıt yok" : "Bu dönemde kayıt yok"}</p>
        </div>
      ) : (
        <>
          {/* Masaüstü tablo */}
          <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
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
                {filtered.map((p) => {
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
                        <button onClick={() => handleDelete(p.id)} className="text-gray-700 hover:text-red-400 transition-colors" title="Sil">🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobil kart görünümü */}
          <div className="sm:hidden space-y-3">
            {filtered.map((p) => {
              const profit = p.income - p.expense;
              return (
                <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-200 text-sm">{p.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(p.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(p.id)} className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0" title="Sil">🗑</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800">
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Harcanan</p>
                      <p className="text-sm font-semibold text-red-400">₺{fmt(p.expense)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Alınan</p>
                      <p className="text-sm font-semibold text-green-400">₺{fmt(p.income)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Kâr</p>
                      <p className={`text-sm font-semibold ${profit >= 0 ? "text-indigo-400" : "text-red-400"}`}>₺{fmt(profit)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

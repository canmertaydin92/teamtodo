import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PaymentsClient } from "@/components/payments-client";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const payments = await prisma.payment.findMany({
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Ücretler</h1>
        <p className="text-sm text-gray-500 mt-1">İşlere ait gelir, gider ve kâr takibi</p>
      </div>
      <PaymentsClient initialPayments={JSON.parse(JSON.stringify(payments))} />
    </div>
  );
}

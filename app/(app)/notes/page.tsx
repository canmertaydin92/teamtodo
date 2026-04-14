import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotesClient } from "@/components/notes-client";

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "ADMIN";

  const notes = await prisma.note.findMany({
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Notlar</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? "Not ekleyebilir ve yönetebilirsin." : "Paylaşılan notları buradan okuyabilirsin."}
        </p>
      </div>
      <NotesClient initialNotes={notes} isAdmin={isAdmin} />
    </div>
  );
}

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import DocumentView from "./components/DocumentView.jsx";
import DocumentFormModal from "./components/DocumentFormModal.jsx";
import PendingView from "./components/PendingView.jsx";
import MentorPasswordModal from "./components/MentorPasswordModal.jsx";
import RejectDocModal from "./components/RejectDocModal.jsx";
import {
  fetchDocs,
  fetchPendingDocs,
  createDoc,
  updateDoc,
  deleteDoc,
  publishDoc,
  rejectDoc,
} from "./api.js";

export default function App() {
  const [docs, setDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // "library" = biblioteca pública. "pending" = cola de mentor.
  const [view, setView] = useState("library");
  const [pendingDocs, setPendingDocs] = useState([]);
  const [selectedPendingId, setSelectedPendingId] = useState(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState(null);

  // null = modal cerrado. { mode: "create" } o { mode: "edit", doc }.
  const [formModal, setFormModal] = useState(null);

  // null = modal de rechazo cerrado. Si no, es el doc que se está
  // rechazando (RejectDocModal solo necesita su id/título).
  const [rejectTarget, setRejectTarget] = useState(null);

  // Toast liviano para avisos no bloqueantes (p. ej. si el email de
  // rechazo se mandó o no) — a diferencia de alert(), no corta el flujo.
  // Se limpia solo a los 5s.
  const [toast, setToast] = useState(null); // { tone: "success" | "warning", text }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // "Sesión" de mentor SOLO en memoria — nunca localStorage/sessionStorage,
  // a propósito: cualquier reload de la página la borra, así una recarga o
  // un restart del server/cliente vuelve a pedir credenciales, en vez de
  // arrastrar algo cacheado indefinidamente como hacía el prompt nativo del
  // navegador.
  const [mentorCreds, setMentorCreds] = useState(null);
  // No-null = hay un prompt de credenciales abierto. { message, resolve, reject }.
  // Una credencial equivocada no se detecta acá (recién al pegarle al
  // backend) — el error resultante lo maneja quien llamó a
  // requestMentorCreds, vía dropSessionOn401 más abajo.
  const [authPrompt, setAuthPrompt] = useState(null);

  // force:true ignora la sesión en memoria y pide credenciales sí o sí —
  // usado solo para borrar, como pidió explícitamente. El resto de las
  // acciones de mentor reutiliza la sesión si ya existe.
  function requestMentorCreds({ force = false, message } = {}) {
    if (!force && mentorCreds) return Promise.resolve(mentorCreds);
    return new Promise((resolve, reject) => {
      setAuthPrompt({ message, resolve, reject });
    });
  }

  const handleAuthSubmit = (creds) => {
    // Se guarda como sesión aunque el prompt haya sido forzado (borrado):
    // no hace daño reutilizarla después para algo no destructivo, y evita
    // pedirla de nuevo innecesariamente. Si la credencial resulta ser
    // inválida, dropSessionOn401 la descarta en cuanto el backend responda
    // 401, así que no queda cacheada una mala por mucho tiempo.
    setMentorCreds(creds);
    authPrompt.resolve(creds);
    setAuthPrompt(null);
  };

  const handleAuthCancel = () => {
    authPrompt.reject(new Error("cancelled"));
    setAuthPrompt(null);
  };

  useEffect(() => {
    fetchDocs()
      .then((data) => {
        setDocs(data);
        if (data.length > 0) setSelectedDocId(data[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Si el backend devuelve 401 es que la sesión en memoria tiene una
  // credencial que no sirve (typo, o lo que sea) — se descarta para que la
  // próxima acción vuelva a preguntar en vez de reintentar en silencio con
  // lo mismo que ya falló.
  function dropSessionOn401(err) {
    if (err.status === 401) setMentorCreds(null);
    throw err;
  }

  // Recién acá se piden credenciales — nunca en el load inicial, para no
  // reventarle un prompt a cualquiera que abra la app.
  const loadPending = async () => {
    try {
      const creds = await requestMentorCreds({
        message: "Credenciales de mentor para ver la cola de pendientes.",
      });
      setView("pending");
      setPendingLoading(true);
      setPendingError(null);
      const data = await fetchPendingDocs(creds).catch(dropSessionOn401);
      setPendingDocs(data);
      setSelectedPendingId(data.length > 0 ? data[0].id : null);
    } catch (err) {
      if (err.message === "cancelled") return;
      setView("pending");
      setPendingError(err.message);
    } finally {
      setPendingLoading(false);
    }
  };

  // Único punto que realmente pega contra el backend para crear/editar —
  // DocumentFormModal delega acá y no sabe nada de auth.
  const handleFormSubmit = async (payload) => {
    if (formModal.mode === "create") {
      return createDoc(payload); // público, sin credenciales
    }
    const creds = await requestMentorCreds({
      message: `Credenciales de mentor para guardar cambios en "${formModal.doc.title}".`,
    });
    return updateDoc(formModal.doc.id, payload, creds).catch(dropSessionOn401);
  };

  const handleSaved = (doc) => {
    const wasEditing = formModal?.mode === "edit";
    setFormModal(null);

    if (!wasEditing) {
      if (view === "pending") setPendingDocs((prev) => [...prev, doc]);
      return;
    }

    if (doc.status === "PUBLISHED") {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
    } else {
      setPendingDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
    }
  };

  // force:true — pide contraseña de mentor de nuevo siempre, aunque ya haya
  // una sesión activa. Es la única acción que lo hace.
  const handleDelete = async (doc) => {
    if (!window.confirm(`¿Eliminar "${doc.title}"? Esto no se puede deshacer.`)) return;
    try {
      const creds = await requestMentorCreds({
        force: true,
        message: `Confirmá tu contraseña de mentor para eliminar "${doc.title}".`,
      });
      await deleteDoc(doc.id, creds).catch(dropSessionOn401);
      if (doc.status === "PUBLISHED") {
        setDocs((prev) => prev.filter((d) => d.id !== doc.id));
        setSelectedDocId((cur) => (cur === doc.id ? null : cur));
      } else {
        setPendingDocs((prev) => prev.filter((d) => d.id !== doc.id));
        setSelectedPendingId((cur) => (cur === doc.id ? null : cur));
      }
    } catch (err) {
      if (err.message !== "cancelled") alert(err.message);
    }
  };

  // Abre RejectDocModal en vez de window.prompt — el motivo real (armar
  // creds + pegarle al backend) vive en handleRejectSubmit de acá abajo,
  // que el modal invoca vía su prop onSubmit; este handler solo decide qué
  // doc se está rechazando.
  const handleReject = (doc) => setRejectTarget(doc);

  // Igual que handleFormSubmit para edit: pide credenciales de mentor
  // (reusando la sesión en memoria si ya hay una) y deja que
  // dropSessionOn401 la descarte si resultó inválida. RejectDocModal no
  // sabe nada de esto — solo le importa si la promesa resuelve o
  // rechaza (y con qué status).
  const handleRejectSubmit = async (note) => {
    const creds = await requestMentorCreds({
      message: `Credenciales de mentor para pedir cambios en "${rejectTarget.title}".`,
    });
    return rejectDoc(rejectTarget.id, note, creds).catch(dropSessionOn401);
  };

  // Éxito (200): ya no es PENDING, sale de la cola. El email es best-effort
  // en el backend (nunca bloquea el rechazo) — se lo avisa al mentor por
  // toast en vez de alert() para no interrumpirlo.
  const handleRejected = (doc) => {
    setPendingDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setSelectedPendingId((cur) => (cur === doc.id ? null : cur));
    setToast(
      doc.emailSent
        ? { tone: "success", text: "Rechazado. Se avisó por email al autor." }
        : {
            tone: "warning",
            text: "Rechazado. No se pudo avisar por email al autor — revisá los logs del servidor.",
          }
    );
  };

  // 404 desde RejectDocModal: alguien más ya lo borró/procesó mientras el
  // modal estaba abierto. Mismo tratamiento que un rechazo/borrado exitoso
  // en términos de la lista — ya no corresponde que siga en pendientes.
  const handleRejectDocGone = (docId) => {
    setPendingDocs((prev) => prev.filter((d) => d.id !== docId));
    setSelectedPendingId((cur) => (cur === docId ? null : cur));
  };

  const handlePublish = async (doc) => {
    try {
      const creds = await requestMentorCreds({
        message: `Credenciales de mentor para publicar "${doc.title}".`,
      });
      const published = await publishDoc(doc.id, creds).catch(dropSessionOn401);
      setPendingDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setSelectedPendingId((cur) => (cur === doc.id ? null : cur));
      setDocs((prev) => [...prev, published]);
    } catch (err) {
      if (err.message !== "cancelled") alert(err.message);
    }
  };

  const selectedDoc = docs.find((d) => d.id === selectedDocId);

  return (
    <div className="flex min-h-screen bg-neutral-950">
      <Sidebar
        docs={docs}
        selectedDocId={selectedDocId}
        onSelect={(id) => {
          setView("library");
          setSelectedDocId(id);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewDoc={() => setFormModal({ mode: "create" })}
        onShowPending={loadPending}
      />

      {view === "pending" ? (
        <PendingView
          docs={pendingDocs}
          loading={pendingLoading}
          error={pendingError}
          selectedId={selectedPendingId}
          onSelect={setSelectedPendingId}
          onBack={() => setView("library")}
          onPublish={handlePublish}
          onEdit={(doc) => setFormModal({ mode: "edit", doc })}
          onDelete={handleDelete}
          onReject={handleReject}
        />
      ) : (
        <>
          {loading && (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
              Cargando documentos...
            </div>
          )}

          {!loading && error && (
            <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
              Error al cargar documentos: {error}
            </div>
          )}

          {!loading && !error && selectedDoc && (
            <DocumentView
              doc={selectedDoc}
              onEdit={(doc) => setFormModal({ mode: "edit", doc })}
              onDelete={handleDelete}
            />
          )}

          {!loading && !error && !selectedDoc && (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
              No hay documentos todavía. Crea el primero con "Nuevo documento".
            </div>
          )}
        </>
      )}

      {formModal && (
        <DocumentFormModal
          mode={formModal.mode}
          doc={formModal.doc}
          onClose={() => setFormModal(null)}
          onSubmit={handleFormSubmit}
          onSaved={handleSaved}
        />
      )}

      {authPrompt && (
        <MentorPasswordModal
          message={authPrompt.message}
          onSubmit={handleAuthSubmit}
          onCancel={handleAuthCancel}
        />
      )}

      <RejectDocModal
        docId={rejectTarget?.id}
        docTitle={rejectTarget?.title}
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleRejectSubmit}
        onRejected={handleRejected}
        onDocGone={handleRejectDocGone}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-[80] max-w-sm">
          <div
            className={`rounded-md border px-4 py-3 text-sm shadow-xl ${
              toast.tone === "success"
                ? "bg-emerald-950/90 border-emerald-800 text-emerald-200"
                : "bg-amber-950/90 border-amber-800 text-amber-200"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}

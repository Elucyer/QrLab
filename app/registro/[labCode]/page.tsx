"use client";

import { useState, useEffect } from "react";

interface Laboratorio {
  id: number;
  nombre: string;
  codigo: string;
}

export default function RegistroPage({ params }: { params: Promise<{ labCode: string }> }) {
  const [labCode, setLabCode] = useState<string>("");
  const [lab, setLab] = useState<Laboratorio | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const fechaHoy = now.toISOString().slice(0, 10);
  const horaActual = now.toTimeString().slice(0, 5);

  const [form, setForm] = useState({
    fecha: fechaHoy,
    nombreInvestigador: "",
    actividad: "",
    grupoInvestigacion: "",
    codigoProyecto: "",
    nombreProyecto: "",
    institucionesAsociadas: "",
    horaIngreso: horaActual,
    horaSalida: "",
    recursosUsados: "",
    numAsistentes: "1",
    confirmacionFirma: false,
  });

  const RECURSOS_OPCIONES = ["Cabina 1", "Cabina 2"];
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<string[]>([]);
  const [otroRecurso, setOtroRecurso] = useState("");

  const toggleRecurso = (recurso: string) => {
    setRecursosSeleccionados((prev) => {
      const next = prev.includes(recurso) ? prev.filter((r) => r !== recurso) : [...prev, recurso];
      actualizarRecursosUsados(next, otroRecurso);
      return next;
    });
  };

  const actualizarRecursosUsados = (seleccionados: string[], otro: string) => {
    const partes = [...seleccionados];
    if (otro.trim()) partes.push(otro.trim());
    setForm((prev) => ({ ...prev, recursosUsados: partes.join(", ") }));
  };

  const handleOtroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOtroRecurso(val);
    actualizarRecursosUsados(recursosSeleccionados, val);
  };

  useEffect(() => {
    params.then((p) => setLabCode(p.labCode));
  }, [params]);

  useEffect(() => {
    if (!labCode) return;
    fetch("/api/laboratorios")
      .then((r) => r.json())
      .then((labs: Laboratorio[]) => {
        const found = labs.find((l) => l.codigo === labCode);
        if (found) setLab(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [labCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.confirmacionFirma) {
      setError("Debe confirmar su identidad antes de enviar.");
      return;
    }
    setEnviando(true);
    setError("");

    const res = await fetch("/api/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, laboratorioId: lab!.id, numAsistentes: Number(form.numAsistentes) }),
    });

    if (res.ok) {
      setEnviado(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al enviar el formulario.");
    }
    setEnviando(false);
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Laboratorio no encontrado</h1>
          <p className="text-slate-500 text-sm">El código QR no corresponde a ningún laboratorio registrado.</p>
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-sm mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Registro exitoso</h1>
          <p className="text-slate-500 text-sm mb-1">Tu ingreso al laboratorio ha sido registrado.</p>
          <p className="text-slate-400 text-xs">{lab.nombre}</p>
          <button
            onClick={() => { setEnviado(false); setForm((f) => ({ ...f, nombreInvestigador: "", actividad: "", grupoInvestigacion: "", codigoProyecto: "", nombreProyecto: "", institucionesAsociadas: "", horaSalida: "", recursosUsados: "", confirmacionFirma: false })); }}
            className="mt-6 text-sm text-blue-600 hover:underline"
          >
            Registrar otra persona
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-blue-700 text-white rounded-t-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">FGL 015 · Versión 03</p>
              <h1 className="text-xl font-bold mt-1">Registro de Atención</h1>
              <p className="text-blue-100 text-sm">Investigación Laboratorios</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs">Laboratorio</p>
              <p className="font-semibold text-sm">{lab.nombre}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-b-xl shadow-lg p-6 space-y-5">
          {/* Fila fecha + horas */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Hora ingreso *</label>
              <input
                type="time"
                name="horaIngreso"
                value={form.horaIngreso}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Hora salida</label>
              <input
                type="time"
                name="horaSalida"
                value={form.horaSalida}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Nombre investigador */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del investigador *</label>
            <input
              type="text"
              name="nombreInvestigador"
              value={form.nombreInvestigador}
              onChange={handleChange}
              required
              placeholder="Nombre completo"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actividad */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Actividad *</label>
            <input
              type="text"
              name="actividad"
              value={form.actividad}
              onChange={handleChange}
              required
              placeholder="Describe la actividad a realizar"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Grupo + Código proyecto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Grupo de investigación</label>
              <input
                type="text"
                name="grupoInvestigacion"
                value={form.grupoInvestigacion}
                onChange={handleChange}
                placeholder="Nombre del grupo"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Código del proyecto</label>
              <input
                type="text"
                name="codigoProyecto"
                value={form.codigoProyecto}
                onChange={handleChange}
                placeholder="Ej: PRY-2024-001"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Nombre del proyecto */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del proyecto</label>
            <input
              type="text"
              name="nombreProyecto"
              value={form.nombreProyecto}
              onChange={handleChange}
              placeholder="Título del proyecto de investigación"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Instituciones asociadas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Instituciones asociadas al proyecto</label>
            <input
              type="text"
              name="institucionesAsociadas"
              value={form.institucionesAsociadas}
              onChange={handleChange}
              placeholder="Instituciones participantes"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Recursos usados + N° asistentes */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Recursos usados</label>
              <div className="flex flex-wrap gap-2">
                {RECURSOS_OPCIONES.map((recurso) => (
                  <button
                    key={recurso}
                    type="button"
                    onClick={() => toggleRecurso(recurso)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      recursosSeleccionados.includes(recurso)
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"
                    }`}
                  >
                    {recurso}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    if (recursosSeleccionados.includes("__otro__")) {
                      const next = recursosSeleccionados.filter((r) => r !== "__otro__");
                      setRecursosSeleccionados(next);
                      setOtroRecurso("");
                      actualizarRecursosUsados(next, "");
                    } else {
                      setRecursosSeleccionados((prev) => [...prev, "__otro__"]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    recursosSeleccionados.includes("__otro__")
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-slate-700 border-slate-300 hover:border-blue-400"
                  }`}
                >
                  Otro
                </button>
              </div>
              {recursosSeleccionados.includes("__otro__") && (
                <input
                  type="text"
                  value={otroRecurso}
                  onChange={handleOtroChange}
                  placeholder="Describe el recurso..."
                  className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">N° asistentes</label>
              <input
                type="number"
                name="numAsistentes"
                value={form.numAsistentes}
                onChange={handleChange}
                min="1"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Confirmación firma */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="confirmacionFirma"
                checked={form.confirmacionFirma}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">
                <span className="font-semibold">Confirmación de identidad:</span> Declaro que la información proporcionada es veraz y que soy el investigador indicado. Esta confirmación equivale a mi firma digital en el registro FGL 015.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            {enviando ? "Enviando..." : "Registrar ingreso"}
          </button>

          <p className="text-center text-xs text-slate-400">Código FGL 015 · Versión 03 · 09-07-2024</p>
        </form>
      </div>
    </div>
  );
}

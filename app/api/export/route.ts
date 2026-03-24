import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registros, laboratorios } from "@/lib/schema";
import { isAuthenticated } from "@/lib/auth";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";
import ExcelJS from "exceljs";
import path from "path";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD9E1F2" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

function styleHeader(cell: ExcelJS.Cell, value: string) {
  cell.value = value;
  cell.font = { bold: true, size: 10 };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.fill = HEADER_FILL;
  cell.border = THIN_BORDER;
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const labId = req.nextUrl.searchParams.get("labId");
  const desde = req.nextUrl.searchParams.get("desde");
  const hasta = req.nextUrl.searchParams.get("hasta");

  const conditions = [];
  if (labId) conditions.push(eq(registros.laboratorioId, Number(labId)));
  if (desde) conditions.push(gte(registros.fecha, desde));
  if (hasta) conditions.push(lte(registros.fecha, hasta));

  const rows = await db
    .select({
      id: registros.id,
      fecha: registros.fecha,
      nombreInvestigador: registros.nombreInvestigador,
      actividad: registros.actividad,
      grupoInvestigacion: registros.grupoInvestigacion,
      codigoProyecto: registros.codigoProyecto,
      nombreProyecto: registros.nombreProyecto,
      institucionesAsociadas: registros.institucionesAsociadas,
      horaIngreso: registros.horaIngreso,
      horaSalida: registros.horaSalida,
      recursosUsados: registros.recursosUsados,
      numAsistentes: registros.numAsistentes,
      laboratorioNombre: laboratorios.nombre,
    })
    .from(registros)
    .leftJoin(laboratorios, eq(registros.laboratorioId, laboratorios.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(registros.fecha));

  const labNombre =
    rows.length > 0 && rows[0].laboratorioNombre
      ? rows[0].laboratorioNombre
      : "Laboratorio";

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("FGL 015");

  // Anchos de columna (igual al original)
  ws.getColumn("A").width = 9.71;
  ws.getColumn("B").width = 10.71;
  ws.getColumn("C").width = 10.71;
  ws.getColumn("D").width = 20.71;
  ws.getColumn("E").width = 15.14;
  ws.getColumn("F").width = 11.57;
  ws.getColumn("G").width = 16.86;
  ws.getColumn("H").width = 21.0;
  ws.getColumn("I").width = 7.86;
  ws.getColumn("J").width = 7.57;
  ws.getColumn("K").width = 14.43;
  ws.getColumn("L").width = 10.57;
  ws.getColumn("M").width = 13.71;

  // ── FILAS 1-3: Encabezado del documento ────────────────────────
  ws.getRow(1).height = 17.1;
  ws.getRow(2).height = 17.1;
  ws.getRow(3).height = 17.1;

  // A1:B3 — logo ITM
  ws.mergeCells("A1:B3");
  const logoPath = path.join(process.cwd(), "public", "logo-itm.png");
  const logoId = wb.addImage({
    filename: logoPath,
    extension: "png",
  });
  ws.addImage(logoId, "A1:B3");

  // C1:K3 — título principal
  ws.mergeCells("C1:K3");
  const titleCell = ws.getCell("C1");
  titleCell.value = "REGISTRO DE ATENCIÓN INVESTIGACIÓN LABORATORIOS";
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  // L1-M3 — bloque código / versión / fecha
  ws.getCell("L1").value = "Código";
  ws.getCell("L1").font = { bold: true };
  ws.getCell("M1").value = "FGL 015";

  ws.getCell("L2").value = "Versión";
  ws.getCell("L2").font = { bold: true };
  ws.getCell("M2").value = "03";

  ws.getCell("L3").value = "Fecha";
  ws.getCell("L3").font = { bold: true };
  ws.getCell("M3").value = "09-07-2024";

  // ── FILA 4: Espaciador ─────────────────────────────────────────
  ws.getRow(4).height = 5.1;

  // ── FILA 5: Nombre del laboratorio ─────────────────────────────
  ws.getRow(5).height = 18.0;
  ws.mergeCells("A5:B5");
  ws.getCell("A5").value = "Taller o Laboratorio";
  ws.getCell("A5").font = { bold: true };
  ws.mergeCells("C5:M5");
  ws.getCell("C5").value = labNombre;

  // ── FILA 6: Espaciador ─────────────────────────────────────────
  ws.getRow(6).height = 5.1;

  // ── FILAS 7-8: Encabezados de columna ──────────────────────────
  ws.getRow(7).height = 24.95;
  ws.getRow(8).height = 24.95;

  // Columna A — Fecha (dos celdas separadas: encabezado + formato)
  styleHeader(ws.getCell("A7"), "Fecha");
  styleHeader(ws.getCell("A8"), "AAAA-MM-DD");

  // Columna B:C — Nombre investigador (fusión 2 filas)
  ws.mergeCells("B7:C8");
  styleHeader(ws.getCell("B7"), "Nombre investigador");

  // Columna D
  ws.mergeCells("D7:D8");
  styleHeader(ws.getCell("D7"), "Actividad");

  // Columna E
  ws.mergeCells("E7:E8");
  styleHeader(ws.getCell("E7"), "Grupo de investigación");

  // Columna F
  ws.mergeCells("F7:F8");
  styleHeader(ws.getCell("F7"), "Código del proyecto");

  // Columna G
  ws.mergeCells("G7:G8");
  styleHeader(ws.getCell("G7"), "Nombre del proyecto");

  // Columna H
  ws.mergeCells("H7:H8");
  styleHeader(ws.getCell("H7"), "Instituciones asociadas al proyecto");

  // Columna I
  ws.mergeCells("I7:I8");
  styleHeader(ws.getCell("I7"), "Hora ingreso");

  // Columna J
  ws.mergeCells("J7:J8");
  styleHeader(ws.getCell("J7"), "Hora salida");

  // Columna K
  ws.mergeCells("K7:K8");
  styleHeader(ws.getCell("K7"), "Recursos usados");

  // Columna L
  ws.mergeCells("L7:L8");
  styleHeader(ws.getCell("L7"), "N° asistentes");

  // Columna M
  ws.mergeCells("M7:M8");
  styleHeader(ws.getCell("M7"), "Firma del investigador");

  // ── FILAS DE DATOS (fila 9 en adelante) ───────────────────────
  // Al menos 42 filas pre-dibujadas como en el original (filas 9-50)
  const totalDataRows = Math.max(rows.length, 42);

  for (let i = 0; i < totalDataRows; i++) {
    const rowNum = 9 + i;
    const row = ws.getRow(rowNum);
    row.height = 30.0;

    // Fusionar B:C en cada fila de datos
    ws.mergeCells(`B${rowNum}:C${rowNum}`);

    if (i < rows.length) {
      const r = rows[i];
      row.getCell(1).value = r.fecha;
      row.getCell(2).value = r.nombreInvestigador;
      row.getCell(4).value = r.actividad;
      row.getCell(5).value = r.grupoInvestigacion ?? "";
      row.getCell(6).value = r.codigoProyecto ?? "";
      row.getCell(7).value = r.nombreProyecto ?? "";
      row.getCell(8).value = r.institucionesAsociadas ?? "";
      row.getCell(9).value = r.horaIngreso;
      row.getCell(10).value = r.horaSalida ?? "";
      row.getCell(11).value = r.recursosUsados ?? "";
      row.getCell(12).value = r.numAsistentes ?? 1;
      row.getCell(13).value = "✓ Confirmado digitalmente";
    }

    // Bordes en todas las celdas de la fila
    for (let col = 1; col <= 13; col++) {
      row.getCell(col).border = THIN_BORDER;
    }
  }

  const buf = Buffer.from(await wb.xlsx.writeBuffer());

  // Eliminar de la BD los registros que se acaban de exportar
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    await db.delete(registros).where(inArray(registros.id, ids));
  }

  const filename = `FGL015_${labNombre.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

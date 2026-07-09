import PDFDocument from "pdfkit";
import type { BulletinData, WeatherEntry } from "./types";
import { HAZARDS, REGIONS } from "./constants";
import { regionDisplayLabel } from "./region-prefectures";
import { formatValidityPeriod } from "./validity-period";

type PdfDoc = InstanceType<typeof PDFDocument>;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LABEL_WIDTH = 145;
const VALUE_X = MARGIN + LABEL_WIDTH + 12;
const VALUE_WIDTH = CONTENT_WIDTH - LABEL_WIDTH - 12;
const BODY_COLOR = "#1a1a1a";
const MUTED_COLOR = "#555555";
const BRAND_COLOR = "#0d4f5c";
const SECTION_BG = "#e8f4f6";
const TABLE_HEADER_BG = "#d4e8ec";
const TABLE_ALT_BG = "#f7fafb";

function dash(value: string | undefined | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
}

export function bulletinPdfFilename(bulletinId: string, forecasterName: string): string {
  const name = sanitizeFilenamePart(forecasterName) || "forecaster";
  return `${name}_${bulletinId}.pdf`;
}

function bottomLimit(doc: PdfDoc): number {
  return PAGE_HEIGHT - MARGIN - 24;
}

function ensureSpace(doc: PdfDoc, height: number) {
  if (doc.y + height > bottomLimit(doc)) {
    doc.addPage();
  }
}

function setY(doc: PdfDoc, y: number) {
  doc.y = y;
}

function fillRect(doc: PdfDoc, x: number, y: number, w: number, h: number, color: string) {
  doc.save();
  doc.rect(x, y, w, h).fill(color);
  doc.restore();
}

function sectionTitle(doc: PdfDoc, title: string) {
  ensureSpace(doc, 44);
  doc.moveDown(0.55);
  const y = doc.y;
  fillRect(doc, MARGIN, y, CONTENT_WIDTH, 24, SECTION_BG);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(BRAND_COLOR)
    .text(title, MARGIN + 10, y + 6, { width: CONTENT_WIDTH - 20, align: "left", lineBreak: false });
  setY(doc, y + 32);
  doc.fillColor(BODY_COLOR);
}

function subsectionTitle(doc: PdfDoc, title: string) {
  ensureSpace(doc, 28);
  doc.moveDown(0.2);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND_COLOR).text(title, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: "left",
  });
  doc.moveDown(0.25);
  doc.fillColor(BODY_COLOR);
}

function hazardTitle(doc: PdfDoc, title: string) {
  ensureSpace(doc, 24);
  doc.moveDown(0.15);
  doc.font("Helvetica-BoldOblique").fontSize(9).fillColor("#2d6a78").text(title, MARGIN + 4, doc.y, {
    width: CONTENT_WIDTH - 8,
    align: "left",
  });
  doc.moveDown(0.2);
  doc.fillColor(BODY_COLOR);
}

function fieldRow(doc: PdfDoc, label: string, value: string) {
  const valueText = dash(value);
  doc.font("Helvetica-Bold").fontSize(9);
  const labelHeight = doc.heightOfString(label, { width: LABEL_WIDTH });
  doc.font("Helvetica").fontSize(9);
  const valueHeight = doc.heightOfString(valueText, { width: VALUE_WIDTH, lineGap: 1 });
  const rowHeight = Math.max(labelHeight, valueHeight, 12) + 8;

  ensureSpace(doc, rowHeight);
  const y = doc.y;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED_COLOR).text(label, MARGIN, y, {
    width: LABEL_WIDTH,
    align: "left",
    lineGap: 1,
  });
  doc.font("Helvetica").fontSize(9).fillColor(BODY_COLOR).text(valueText, VALUE_X, y, {
    width: VALUE_WIDTH,
    align: "left",
    lineGap: 1,
  });

  setY(doc, y + rowHeight);
}

function textBlock(doc: PdfDoc, label: string, value: string) {
  const valueText = dash(value);
  doc.font("Helvetica").fontSize(9);
  const valueHeight = doc.heightOfString(valueText, { width: CONTENT_WIDTH - 12, lineGap: 2 });

  ensureSpace(doc, valueHeight + 28);
  doc.moveDown(0.1);

  const y = doc.y;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED_COLOR).text(label, MARGIN, y, {
    width: CONTENT_WIDTH,
    align: "left",
  });

  const afterLabel = doc.y + 4;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(BODY_COLOR)
    .text(valueText, MARGIN + 12, afterLabel, {
      width: CONTENT_WIDTH - 12,
      align: "left",
      lineGap: 2,
    });

  setY(doc, afterLabel + valueHeight + 10);
}

function drawCoverHeader(doc: PdfDoc, bulletinId: string, forecasterName: string, forecastDate: string) {
  const boxY = MARGIN;
  doc.rect(MARGIN, boxY, CONTENT_WIDTH, 88).lineWidth(1).strokeColor("#b8d4da").stroke();
  fillRect(doc, MARGIN, boxY, CONTENT_WIDTH, 88, "#f3f9fa");

  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor(BRAND_COLOR)
    .text("DGM Daily Weather Forecast", MARGIN, boxY + 14, { width: CONTENT_WIDTH, align: "center" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(MUTED_COLOR)
    .text("Climate & Health Early Warning — Central African Republic", MARGIN, boxY + 38, {
      width: CONTENT_WIDTH,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(BODY_COLOR)
    .text(
      `Forecaster: ${dash(forecasterName)}   |   Forecast date: ${dash(forecastDate)}   |   Bulletin ID: ${bulletinId}`,
      MARGIN,
      boxY + 58,
      { width: CONTENT_WIDTH, align: "center" }
    );

  setY(doc, boxY + 100);
  doc.fillColor(BODY_COLOR);
}

function drawRegionForecastTable(doc: PdfDoc, data: BulletinData["regionForecast"]) {
  sectionTitle(doc, "3. Regional weather forecast");

  const cols = [
    { label: "Region", width: 108 },
    { label: "Min", width: 34 },
    { label: "Max", width: 34 },
    { label: "Feel", width: 34 },
    { label: "Hum", width: 34 },
    { label: "Wind", width: 58 },
    { label: "Spd", width: 34 },
    { label: "Rain", width: 34 },
  ];

  const rowHeight = 18;
  const tableHeight = rowHeight * (REGIONS.length + 1);

  ensureSpace(doc, tableHeight + 8);
  const tableTop = doc.y;

  fillRect(doc, MARGIN, tableTop, CONTENT_WIDTH, rowHeight, TABLE_HEADER_BG);

  let x = MARGIN + 4;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND_COLOR);
  for (const col of cols) {
    doc.text(col.label, x, tableTop + 5, { width: col.width - 4, align: "left", lineBreak: false });
    x += col.width;
  }

  REGIONS.forEach((region, index) => {
    const y = tableTop + rowHeight * (index + 1);

    if (index % 2 === 1) {
      fillRect(doc, MARGIN, y, CONTENT_WIDTH, rowHeight, TABLE_ALT_BG);
    }

    doc
      .strokeColor("#d8e4e8")
      .lineWidth(0.5)
      .moveTo(MARGIN, y + rowHeight)
      .lineTo(MARGIN + CONTENT_WIDTH, y + rowHeight)
      .stroke();

    const row = data[region];
    const values = [
      regionDisplayLabel(region),
      dash(row.temp_min_c),
      dash(row.temp_max_c),
      dash(row.temp_ressentie_c),
      dash(row.relative_humidity_pct),
      dash(row.wind_direction),
      dash(row.wind_speed_kmh),
      dash(row.rainfall_mm),
    ];

    x = MARGIN + 4;
    doc.font("Helvetica").fontSize(8).fillColor(BODY_COLOR);
    for (let i = 0; i < cols.length; i += 1) {
      doc.text(values[i], x, y + 5, { width: cols[i].width - 4, align: "left", lineBreak: false });
      x += cols[i].width;
    }
  });

  doc
    .strokeColor("#b8d4da")
    .lineWidth(0.75)
    .rect(MARGIN, tableTop, CONTENT_WIDTH, tableHeight)
    .stroke();

  setY(doc, tableTop + tableHeight + 10);
  doc.fillColor(BODY_COLOR);
}

function weatherSection(doc: PdfDoc, title: string, w: WeatherEntry) {
  sectionTitle(doc, title);
  fieldRow(doc, "Min temp (°C)", w.temp_min_c);
  fieldRow(doc, "Max temp (°C)", w.temp_max_c);
  fieldRow(doc, "Feels-like (°C)", w.temp_ressentie_c);
  fieldRow(doc, "Humidity (%)", w.relative_humidity_pct);
  fieldRow(doc, "Pressure (hPa)", w.pressure_hpa);
  fieldRow(doc, "Wind direction", w.wind_direction);
  fieldRow(doc, "Wind speed (km/h)", w.wind_speed_kmh);
  fieldRow(doc, "Rainfall (mm)", w.rainfall_mm);
  fieldRow(doc, "Sunshine (%)", w.sunshine_pct);
  fieldRow(doc, "Confidence", w.confidence);
  if (w.comment.trim()) textBlock(doc, "Comment", w.comment);
}

export async function generateBulletinPdf(
  bulletin: BulletinData,
  bulletinId: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const m = bulletin.metadata;
    const validityText = formatValidityPeriod(m);

    drawCoverHeader(doc, bulletinId, m.forecaster_name, m.forecast_date);

    sectionTitle(doc, "1. Bulletin metadata");
    fieldRow(doc, "Forecast date", m.forecast_date);
    fieldRow(doc, "Publication time", m.publication_time);
    fieldRow(doc, "Validity period", validityText);
    fieldRow(doc, "Forecaster", m.forecaster_name);
    fieldRow(doc, "Submission status", m.submission_status);
    textBlock(doc, "Data sources", m.data_sources);
    textBlock(doc, "National forecast summary", m.national_forecast_text);
    if (m.general_comment.trim()) textBlock(doc, "General comment", m.general_comment);

    weatherSection(doc, "2. National weather forecast", bulletin.nationalForecast);
    drawRegionForecastTable(doc, bulletin.regionForecast);

    sectionTitle(doc, "4. National climate hazard risks");
    for (const hazard of HAZARDS) {
      const hz = bulletin.nationalHazard[hazard];
      hazardTitle(doc, hazard);
      fieldRow(doc, "Risk level", hz.risk_level);
      if (hz.comment.trim()) textBlock(doc, "Risk comment", hz.comment);
      if (hz.recommendations.trim()) textBlock(doc, "Recommendations", hz.recommendations);
      doc.moveDown(0.15);
    }

    sectionTitle(doc, "5. Regional climate hazard risks");
    for (const region of REGIONS) {
      subsectionTitle(doc, regionDisplayLabel(region));
      for (const hazard of HAZARDS) {
        const hz = bulletin.regionHazard[region][hazard];
        hazardTitle(doc, hazard);
        fieldRow(doc, "Risk level", hz.risk_level);
        fieldRow(
          doc,
          "Affected prefectures",
          hz.affected_prefectures.length > 0 ? hz.affected_prefectures.join(", ") : ""
        );
        if (hz.comment.trim()) textBlock(doc, "Risk comment", hz.comment);
        if (hz.recommendations.trim()) textBlock(doc, "Recommendations", hz.recommendations);
        doc.moveDown(0.1);
      }
      doc.moveDown(0.2);
    }

    const interp = bulletin.interpretation;
    sectionTitle(doc, "6. Meteorological interpretation");
    textBlock(doc, "General situation", interp.general_situation);
    if (interp.expected_conditions.trim()) textBlock(doc, "Expected conditions", interp.expected_conditions);
    if (interp.risk_areas.trim()) textBlock(doc, "Risk areas", interp.risk_areas);
    if (interp.expected_evolution.trim()) textBlock(doc, "Expected evolution", interp.expected_evolution);
    if (interp.recommendations.trim()) textBlock(doc, "Recommendations", interp.recommendations);
    if (interp.additional_notes.trim()) textBlock(doc, "Additional notes", interp.additional_notes);

    const range = doc.bufferedPageRange();
    const footerY = PAGE_HEIGHT - MARGIN - 12;
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#888888")
        .text(`Page ${i - range.start + 1} of ${range.count}`, MARGIN, footerY, {
          width: CONTENT_WIDTH,
          align: "center",
          lineBreak: false,
        });
    }

    doc.end();
  });
}

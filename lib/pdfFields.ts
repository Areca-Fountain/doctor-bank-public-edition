// Builds a text "field map" of a fillable PDF for models that cannot read PDF files.
// pdf-lib (already installed) gives the field names + positions, unpdf gives the printed text + positions,
// and the nearest printed label is attached to each field.

import { PDFCheckBox, PDFDocument, PDFDropdown, PDFRadioGroup, PDFTextField } from "pdf-lib";
import { getDocumentProxy } from "unpdf";

type Label = { x: number; y: number; w: number; text: string };

const MAX_LABEL = 70;

export async function buildFieldMap(pdfBuffer: Buffer): Promise<string> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  // 1) Printed text with positions, per page. Non-ASCII text (the Sinhala/Tamil lines that
  //    extract as garbage) is dropped so the model only sees readable English labels.
  const proxy = await getDocumentProxy(new Uint8Array(pdfBuffer)); // copy: pdf.js may detach the buffer
  const labelsByPage: Label[][] = [];
  for (let p = 1; p <= proxy.numPages; p++) {
    const page = await proxy.getPage(p);
    const content = await page.getTextContent();
    const labels: Label[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const text = item.str.trim();
      if (text.length < 2 || text.length > MAX_LABEL || /[^\x20-\x7E]/.test(text)) continue;
      labels.push({ x: item.transform[4], y: item.transform[5], w: item.width, text });
    }
    labelsByPage.push(labels);
  }

  // 2) Which page each widget sits on
  const pageOfRef = new Map<string, number>();
  pages.forEach((page, index) => {
    const annots = page.node.Annots();
    if (!annots) return;
    for (const ref of annots.asArray()) pageOfRef.set(ref.toString(), index);
  });

  // 3) Nearest label for every field
  type Row = { name: string; page: number; type: string; label: string; x: number; y: number };
  const rows: Row[] = [];
  const form = pdfDoc.getForm();

  for (const field of form.getFields()) {
    const widgets = field.acroField.getWidgets();
    if (widgets.length === 0) continue;

    const widget = widgets[0];
    const rect = widget.getRectangle();
    const ref = pdfDoc.context.getObjectRef(widget.dict);
    const page = (ref && pageOfRef.get(ref.toString())) ?? 0;

    let type = "text";
    let extra = "";
    if (field instanceof PDFCheckBox) type = "checkbox";
    else if (field instanceof PDFRadioGroup) {
      type = "radio";
      extra = ` options: ${field.getOptions().join(" | ")}`;
    } else if (field instanceof PDFDropdown) {
      type = "dropdown";
      extra = ` options: ${field.getOptions().join(" | ")}`;
    } else if (!(field instanceof PDFTextField)) continue;

    const label = nearestLabel(labelsByPage[page] ?? [], rect, type === "checkbox");
    rows.push({
      name: field.getName(),
      page: page + 1,
      type,
      label: (label ?? "no readable label") + extra,
      x: rect.x,
      y: rect.y,
    });
  }

  // Reading order: page, then top to bottom, then left to right
  rows.sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);

  return [
    "FORM FIELD MAP",
    ...rows.map((r) => `- ${r.name} [p${r.page}, ${r.type}]: ${r.label}`),
  ].join("\n");
}

function nearestLabel(
  labels: Label[],
  rect: { x: number; y: number; width: number; height: number },
  isCheckbox: boolean
): string | null {
  const centreY = rect.y + rect.height / 2;
  let best: { score: number; text: string } | null = null;

  const consider = (score: number, text: string) => {
    if (!best || score < best.score) best = { score, text };
  };

  for (const l of labels) {
    const sameRow = Math.abs(l.y - centreY) <= 9 || Math.abs(l.y + 3 - centreY) <= 9;

    // label to the left of the box (most text fields)
    if (sameRow && l.x + l.w <= rect.x + 4 && rect.x - (l.x + l.w) < 250) consider(rect.x - (l.x + l.w), l.text);

    // label to the right of the box (checkboxes: [ ] New)
    if (isCheckbox && sameRow && l.x >= rect.x + rect.width - 3 && l.x - (rect.x + rect.width) < 40)
      consider(l.x - (rect.x + rect.width) - 20, l.text);

    // label just above the box
    const above = l.y - (rect.y + rect.height);
    if (above > -3 && above < 18 && l.x < rect.x + rect.width && l.x + l.w > rect.x) consider(30 + above, l.text);
  }

  return best ? (best as { score: number; text: string }).text : null;
}
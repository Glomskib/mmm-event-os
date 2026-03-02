import PDFDocument from "pdfkit";

interface WaiverPdfData {
  participantName: string;
  participantEmail: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  waiverText: string;
  waiverVersion: string;
  signedAt: string;
  ip: string;
}

export async function generateWaiverPdf(data: WaiverPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("MMM Rider Waiver — Signed Copy", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666666")
      .text(`Version: ${data.waiverVersion}`, { align: "center" });
    doc.moveDown(1);

    // Participant info block
    doc.fillColor("#000000").fontSize(11).font("Helvetica-Bold").text("Participant");
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Name: ${data.participantName}`)
      .text(`Email: ${data.participantEmail}`);
    doc.moveDown(0.8);

    // Emergency contact block
    doc.fontSize(11).font("Helvetica-Bold").text("Emergency Contact");
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Name: ${data.emergencyContactName}`)
      .text(`Phone: ${data.emergencyContactPhone}`);
    doc.moveDown(1);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .strokeColor("#cccccc")
      .stroke();
    doc.moveDown(0.5);

    // Waiver text body
    doc.fontSize(9).font("Helvetica").fillColor("#000000").text(data.waiverText, {
      align: "left",
      lineGap: 2,
    });
    doc.moveDown(1);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .strokeColor("#cccccc")
      .stroke();
    doc.moveDown(0.5);

    // Signature block
    doc.fontSize(11).font("Helvetica-Bold").text("Digital Signature Record");
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Signed by: ${data.participantName}`)
      .text(`Email: ${data.participantEmail}`)
      .text(`Timestamp: ${data.signedAt}`)
      .text(`IP Address: ${data.ip}`)
      .text(`Waiver Version: ${data.waiverVersion}`);

    doc.end();
  });
}

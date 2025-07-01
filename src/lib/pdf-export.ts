import jsPDF from "jspdf";
import { ParsedCV } from "./cv-parser";

export const exportCvDataToPdf = (cvData: ParsedCV, fileName: string) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - 2 * margin;
    let cursorY = margin;

    // --- Helper to check for page breaks and add new pages ---
    const checkPageBreak = (neededHeight: number) => {
      if (cursorY + neededHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
    };

    // --- Draw the Document ---

    // 1. Draw Header
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(cvData.name, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 8;

    checkPageBreak(5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(cvData.contact, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 8;

    checkPageBreak(2);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 10;

    // 2. Draw Sections
    cvData.sections.forEach((section) => {
      checkPageBreak(12); // Check space for section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(section.title.toUpperCase(), margin, cursorY);
      cursorY += 8;

      // --- NEW: Smart Content Renderer ---
      const lines = section.content
        .split("\n")
        .filter((line) => line.trim() !== "");

      lines.forEach((line) => {
        line = line.trim();
        const lineHeight = 5; // Approx height for a line of text
        checkPageBreak(lineHeight);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        // Handle bullet points
        if (line.startsWith("* ") || line.startsWith("- ")) {
          const itemText = line.substring(2);
          const splitText = doc.splitTextToSize(itemText, usableWidth - 5); // Indent bullet text

          doc.text("•", margin, cursorY);
          doc.text(splitText, margin + 5, cursorY);

          cursorY += doc.getTextDimensions(splitText).h;
        }
        // Handle bold text (and nothing else on the line)
        else if (line.startsWith("**") && line.endsWith("**")) {
          const boldText = line.substring(2, line.length - 2);
          doc.setFont("helvetica", "bold");
          doc.text(boldText, margin, cursorY, { maxWidth: usableWidth });
          cursorY += lineHeight;
        }
        // Handle regular text
        else {
          const splitText = doc.splitTextToSize(line, usableWidth);
          doc.text(splitText, margin, cursorY);
          cursorY += doc.getTextDimensions(splitText).h;
        }
        cursorY += 1; // Add a small gap between lines
      });

      cursorY += 5; // Add space after each section
    });

    // 3. Save
    const safeFileName = fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    doc.save(`${safeFileName}.pdf`);
  } catch (error) {
    console.error("Error in exportCvDataToPdf:", error);
    alert("An error occurred while generating the PDF.");
  }
};

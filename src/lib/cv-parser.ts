import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { Node } from "unist";

// Define the structure of our parsed CV object
export interface ParsedCV {
  name: string;
  contact: string;
  sections: Array<{
    title: string;
    content: string; // This will be a Markdown string for the section's content
  }>;
}

// Define the type for the temporary section object
interface TempSection {
  title: string;
  contentNodes: Node[];
}

// Helper to extract text from a node
function getNodeText(node: any): string {
  if (node.type === "text") {
    return (node as any).value || "";
  }
  if (node.children && Array.isArray(node.children)) {
    return (node.children as Node[]).map(getNodeText).join("");
  }
  return "";
}

// The main parsing function
export function parseCVMarkdown(markdown: string): ParsedCV {
  const result: ParsedCV = {
    name: "",
    contact: "",
    sections: [],
  };

  const tree = unified().use(remarkParse).parse(markdown);

  if (!tree.children || tree.children.length === 0) {
    return result;
  }

  let currentSection: TempSection | null = null;

  // Extract Name (assumed to be the first H1)
  const nameNode = tree.children.find(
    (child) => child.type === "heading" && child.depth === 1
  );
  if (nameNode) {
    result.name = getNodeText(nameNode);
  }

  // Extract Contact (assumed to be the first H3 or paragraph after the name)
  const contactNode = tree.children.find(
    (child) =>
      (child.type === "heading" && child.depth === 3) ||
      (child.type === "paragraph" && !result.contact)
  );
  if (contactNode) {
    result.contact = getNodeText(contactNode);
  }

  // --- REPLACED .forEach with a for...of loop for better type inference ---
  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 2) {
      // H2 starts a new section
      if (currentSection) {
        // Finalize the previous section
        const content = unified()
          .use(remarkStringify)
          .stringify({
            type: "root",
            children: currentSection.contentNodes as any,
          });
        result.sections.push({ title: currentSection.title, content });
      }
      // Start a new section
      currentSection = {
        title: getNodeText(node),
        contentNodes: [],
      };
    } else if (currentSection && node !== nameNode && node !== contactNode) {
      // Add node to the content of the current section
      currentSection.contentNodes.push(node);
    }
  }

  // Add the last section if it exists. This will now work correctly.
  if (currentSection) {
    const content = unified()
      .use(remarkStringify)
      .stringify({
        type: "root",
        children: currentSection.contentNodes as any,
      });
    result.sections.push({ title: currentSection.title, content });
  }

  return result;
}

// Now define the function with TypeScript
const extractTextContent = (response: any): string => {
  let textPieces: string[] = [];

  if (response && response.results) {
    response.results.forEach((block: any) => {
      // As TypeScript does not know the exact block type, we need to do a runtime check
      const blockContent = block[block.type];
      if (blockContent && blockContent.rich_text) {
        blockContent.rich_text.forEach((textObject: any) => {
          textPieces.push(textObject.plain_text);
        });
      }
    });
  }

  return textPieces.join(" ");
};

export { extractTextContent };

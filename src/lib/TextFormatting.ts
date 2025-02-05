export function formatModelResponse(text: string): string {
  return text
    // Handle bold text (**text**)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Handle inline formatting (e.g., _italic_, `code`)
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Handle bullet points
    .replace(/\* /g, '<br/>• ')
    // Handle multiple line breaks
    .replace(/\n\n/g, '<br/><br/>')
    // Handle single line breaks
    .replace(/\n/g, '<br/>')
    // Reduce spacing between bold headers and text
    .replace(/<strong>(.*?)<\/strong><br\/>/g, '<strong>$1</strong>');
}
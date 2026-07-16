export function chunkText(text, chunkSize = 200, overlap = 50){
    const words = text.split(/\s+/).filter(Boolean); // Split by whitespace and filter out empty strings
    const chunks = [];

    let start = 0;
    while (start < words.length) {
        const end = Math.min(start + chunkSize, words.length);
        const chunk = words.slice(start, end).join(" ");
        chunks.push(chunk);

        if(end == words.length) break; // If we've reached the end, break the loop
        start += chunkSize - overlap; // Move the start index forward by chunkSize minus overlap
    }
    return chunks;
}
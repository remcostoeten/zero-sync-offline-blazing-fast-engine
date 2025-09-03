function generateNumericId(): number {
  return Math.floor(Math.random() * 1000000) + Date.now();
}

function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export { generateNumericId, generateUniqueId };

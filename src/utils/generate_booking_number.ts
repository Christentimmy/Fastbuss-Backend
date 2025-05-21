

export function generateTicketNumber() {
    const date = new Date();
    const random = Math.floor(Math.random() * 10000);
    return `TKT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${random.toString().padStart(4, '0')}`;
}

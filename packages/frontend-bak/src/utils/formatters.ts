export const formatBounty = (amount?: number | string) => `¥${Number(amount || 0).toFixed(2)}`;

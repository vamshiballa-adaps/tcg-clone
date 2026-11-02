// The departments a project can be filed under (A-26). The catalogue has Admins maintain this list in Administration;
// until that screen exists it is fixed here.
export const DEPARTMENTS = ["Engineering", "Finance", "Product", "QA"] as const;

export type Department = (typeof DEPARTMENTS)[number];

import { signCreditWallet } from "./daily-engine";

export const demoAccounts = [
  { code: "daily-vendeur", name: "Démo Vendeur", role: "Mandats & objections" },
  { code: "daily-growth", name: "Démo Growth", role: "Marketing & prospection" },
  { code: "daily-regulation", name: "Démo Réglementation", role: "Dossiers sensibles" },
];

export function getDemoAccount(code: string) {
  const account = demoAccounts.find((demo) => demo.code === code) ?? demoAccounts[0];
  return { ...account, wallet: signCreditWallet(account.code, 250) };
}

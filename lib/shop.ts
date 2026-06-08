import type { Pet } from "./types";

export type ShopCategory = "food" | "drink" | "toy" | "potion";

export type ShopItem = {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  effect: Partial<Pick<Pet, "hunger" | "thirst" | "happiness" | "energy" | "xp">>;
};

export const shopItems: ShopItem[] = [
  // TODO: Add inventory storage so items can be bought now and used later.
  { id: "apple", name: "Apple", category: "food", price: 10, effect: { hunger: 10 } },
  { id: "fish", name: "Fish", category: "food", price: 25, effect: { hunger: 25 } },
  { id: "premium_meal", name: "Premium Meal", category: "food", price: 50, effect: { hunger: 50 } },
  { id: "milk", name: "Milk", category: "drink", price: 15, effect: { thirst: 20 } },
  { id: "juice", name: "Juice", category: "drink", price: 30, effect: { thirst: 35 } },
  { id: "ball", name: "Ball", category: "toy", price: 40, effect: { happiness: 20 } },
  { id: "teddy", name: "Teddy", category: "toy", price: 80, effect: { happiness: 35 } },
  { id: "energy_potion", name: "Energy Potion", category: "potion", price: 60, effect: { energy: 40 } },
  { id: "growth_potion", name: "Growth Potion", category: "potion", price: 120, effect: { xp: 100 } },
];

export function getShopItem(id: string) {
  return shopItems.find((item) => item.id === id) ?? null;
}

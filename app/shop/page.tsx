"use client";

import { useState } from "react";
import { Coins, ShoppingBag } from "lucide-react";
import { PageTitle } from "@/components/ui";
import { usePetwo } from "@/components/petwo-provider";
import { getPetDisplayName } from "@/lib/pet-assets";
import { shopItems, type ShopCategory } from "@/lib/shop";

const categoryLabels: Record<ShopCategory, string> = {
  food: "Food",
  drink: "Drink",
  toy: "Toy",
  potion: "Potion",
};

export default function ShopPage() {
  const { room, pet, wallet, buyShopItem } = usePetwo();
  const [message, setMessage] = useState("");
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const petName = getPetDisplayName(pet?.name);

  async function handleBuy(itemId: string, itemName: string) {
    if (buyingId) return;

    setBuyingId(itemId);
    setMessage("");
    const bought = await buyShopItem(itemId);
    setMessage(bought ? `${itemName} applied to ${petName}.` : "Could not buy item. Check coins and pet status.");
    setBuyingId(null);
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Shop" subtitle="Buy food, drinks, toys, and potions for your shared pet." />

      <section className="rounded-2xl border border-white/50 bg-primary-container/80 p-5 shadow-cloud">
        <p className="text-xs font-bold uppercase tracking-wider text-primary/80">Room wallet</p>
        <h2 className="mt-2 flex items-center gap-2 font-headline text-4xl font-bold text-primary">
          <Coins size={30} />
          {wallet?.coins ?? 0}
        </h2>
      </section>

      {!room ? <p className="glass-card rounded-2xl p-5 text-sm font-semibold text-on-surface-variant">Connect with someone before using the shop.</p> : null}
      {room && !pet ? <p className="glass-card rounded-2xl p-5 text-sm font-semibold text-on-surface-variant">Hatch your egg first. Shop items apply directly to your pet for now.</p> : null}
      {message ? <p className="glass-card rounded-2xl p-4 text-sm font-bold text-primary">{message}</p> : null}

      {(Object.keys(categoryLabels) as ShopCategory[]).map((category) => (
        <section key={category} className="glass-card rounded-2xl p-5">
          <h2 className="mb-3 font-headline text-xl font-bold text-primary">{categoryLabels[category]}</h2>
          <div className="grid gap-3">
            {shopItems
              .filter((item) => item.category === category)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/50 p-3">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{item.name}</p>
                    <p className="text-xs font-semibold text-on-surface-variant">{describeEffect(item.effect)}</p>
                  </div>
                  <button
                    className="soft-button flex items-center gap-2 px-3 py-2"
                    onClick={() => handleBuy(item.id, item.name)}
                    disabled={!pet || (wallet?.coins ?? 0) < item.price || Boolean(buyingId)}
                    aria-label={pet ? `Buy ${item.name} for ${petName}` : `Buy ${item.name}`}
                  >
                    <ShoppingBag size={16} />
                    {buyingId === item.id ? "..." : item.price}
                  </button>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function describeEffect(effect: Record<string, number | undefined>) {
  return Object.entries(effect)
    .filter(([, value]) => value)
    .map(([key, value]) => `+${value} ${key}`)
    .join(" · ");
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { signUpStoreOwner, type SignupFormState } from "@/lib/store/signup-actions";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BUSINESS_TYPES: { value: string; label: string; hint: string }[] = [
  { value: "artisan", label: "Artesanato", hint: "Bolsas e acessórios feitos à mão" },
  { value: "clothing", label: "Roupas", hint: "Boutique com grade de tamanho (P, M, G...)" },
  { value: "footwear", label: "Calçados", hint: "Numeração (34, 36, 38...)" },
];

const initialState: SignupFormState = {};

export function SignupForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signUpStoreOwner, initialState);
  const [storeName, setStoreName] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState<string>("artisan");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!state.success) return;
    // A sessão já foi gravada via cookies no servidor
    // (createServerSupabaseClient); refresh garante que o Server Component
    // do painel enxergue a sessão nova antes da navegação.
    router.push("/admin");
    router.refresh();
  }, [state.success, router]);

  const effectiveSlug = slugTouched ? slug : slugify(storeName);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="storeName">Nome da loja</Label>
        <Input
          id="storeName"
          name="storeName"
          autoComplete="organization"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">URL da loja</Label>
        <Input
          id="slug"
          name="slug"
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
        <p className="text-xs text-muted-foreground">
          blessingcollection.com/loja/{effectiveSlug || "sua-loja"}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tipo de negócio</Label>
        <div className="flex flex-col gap-2">
          {BUSINESS_TYPES.map((type) => (
            <label
              key={type.value}
              className={`flex cursor-pointer flex-col gap-0.5 rounded-md border px-4 py-3 text-sm transition-colors ${
                businessType === type.value
                  ? "border-[var(--gold)] bg-[var(--gold)]/[0.07]"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              <input
                type="radio"
                name="businessType"
                value={type.value}
                checked={businessType === type.value}
                onChange={() => setBusinessType(type.value)}
                className="sr-only"
              />
              <span className="font-medium">{type.label}</span>
              <span className="text-xs text-muted-foreground">{type.hint}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="whatsappNumber">WhatsApp (com DDI e DDD)</Label>
        <Input id="whatsappNumber" name="whatsappNumber" autoComplete="tel" placeholder="5511999999999" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            tabIndex={-1}
            className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Criando loja..." : "Criar minha loja"}
      </Button>
    </form>
  );
}

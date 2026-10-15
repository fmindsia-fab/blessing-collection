"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createStore, checkSlugAvailability, type CreateStoreFormState } from "@/lib/onboarding/actions";
import { signupSchema, createStoreSchema, slugify } from "@/lib/onboarding/schema";
import { formatCpfCnpj } from "@/lib/br/document";
import { formatWhatsappBR } from "@/lib/customers/phone-mask";
import { CraftProfileFields } from "@/components/shared/craft-profile-fields";
import { MarketplaceProfileFields } from "@/components/shared/marketplace-profile-fields";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupFormValues = z.infer<typeof signupSchema>;
type StoreFormInput = z.input<typeof createStoreSchema>;
type StoreFormOutput = z.output<typeof createStoreSchema>;

const INITIAL_STATE: CreateStoreFormState = {};

export function SignupForm({ platformDomain }: { platformDomain: string }) {
  const [step, setStep] = useState<"account" | "store">("account");
  const [accountError, setAccountError] = useState<string | null>(null);

  const accountForm = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  async function onAccountSubmit(values: SignupFormValues) {
    setAccountError(null);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signUp(values);

    if (error) {
      setAccountError(
        error.message.includes("already registered")
          ? "Este e-mail já tem uma conta. Faça login."
          : "Não foi possível criar sua conta. Tente novamente.",
      );
      return;
    }

    // signUp já autentica a sessão quando a confirmação de e-mail está
    // desligada no projeto; se estiver ligada, o insert de stores (passo
    // seguinte) falha por falta de sessão e o erro orienta a confirmar antes.
    setStep("store");
  }

  if (step === "account") {
    return (
      <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" {...accountForm.register("email")} />
          {accountForm.formState.errors.email ? (
            <p className="text-xs text-destructive">{accountForm.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...accountForm.register("password")}
          />
          {accountForm.formState.errors.password ? (
            <p className="text-xs text-destructive">{accountForm.formState.errors.password.message}</p>
          ) : null}
        </div>

        {accountError ? <p className="text-sm text-destructive">{accountError}</p> : null}

        <Button type="submit" disabled={accountForm.formState.isSubmitting} className="mt-2">
          {accountForm.formState.isSubmitting ? "Criando conta..." : "Continuar"}
        </Button>
      </form>
    );
  }

  return <StoreForm platformDomain={platformDomain} />;
}

function StoreForm({ platformDomain }: { platformDomain: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createStore, INITIAL_STATE);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StoreFormInput, unknown, StoreFormOutput>({
    resolver: zodResolver(createStoreSchema),
  });

  const name = watch("name");
  const slug = watch("slug");

  // Sugere o slug a partir do nome até o usuário editar o campo manualmente.
  const [slugTouched, setSlugTouched] = useState(false);
  useEffect(() => {
    if (!slugTouched && name) setValue("slug", slugify(name));
  }, [name, slugTouched, setValue]);

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      const { available } = await checkSlugAvailability(slug);
      setSlugStatus(available ? "available" : "taken");
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  useEffect(() => {
    if (state.success && state.storeSlug) {
      router.push(`https://${state.storeSlug}.${platformDomain}/admin`);
    }
  }, [state.success, state.storeSlug, platformDomain, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ownerName">Seu nome completo</Label>
        <Input id="ownerName" autoComplete="name" {...register("ownerName")} />
        {errors.ownerName ? (
          <p className="text-xs text-destructive">{errors.ownerName.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ownerDocument">Seu CPF ou CNPJ</Label>
        <Input
          id="ownerDocument"
          inputMode="numeric"
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          {...register("ownerDocument", {
            onChange: (e) => {
              e.target.value = formatCpfCnpj(e.target.value);
            },
          })}
        />
        {errors.ownerDocument ? (
          <p className="text-xs text-destructive">{errors.ownerDocument.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome da loja</Label>
        <Input id="name" placeholder="Ex: Maria Bolsas" {...register("name")} />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Endereço da loja</Label>
        <div className="flex items-center gap-1 text-sm">
          <Input
            id="slug"
            {...register("slug", {
              onChange: () => setSlugTouched(true),
            })}
          />
          <span className="whitespace-nowrap text-muted-foreground">.{platformDomain}</span>
        </div>
        {errors.slug ? (
          <p className="text-xs text-destructive">{errors.slug.message}</p>
        ) : slugStatus === "checking" ? (
          <p className="text-xs text-muted-foreground">Verificando disponibilidade...</p>
        ) : slugStatus === "taken" ? (
          <p className="text-xs text-destructive">Esse nome já está em uso.</p>
        ) : slugStatus === "available" ? (
          <p className="text-xs text-emerald-600">Disponível!</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="whatsappNumber">WhatsApp da loja</Label>
        <Input
          id="whatsappNumber"
          type="tel"
          placeholder="(11) 99999-9999"
          autoComplete="tel-national"
          {...register("whatsappNumber", {
            onChange: (e) => {
              e.target.value = formatWhatsappBR(e.target.value);
            },
          })}
        />
        {errors.whatsappNumber ? (
          <p className="text-xs text-destructive">{errors.whatsappNumber.message}</p>
        ) : null}
      </div>

      <CraftProfileFields required />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instagramUrl">Instagram do ateliê (opcional)</Label>
        <Input id="instagramUrl" name="instagramUrl" placeholder="@meuatelie" autoCapitalize="none" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Conte sobre o seu ateliê (opcional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={160}
          placeholder="Ex: Bolsas de crochê feitas à mão, com carinho, em Londrina."
        />
        <span className="text-xs text-muted-foreground">Até 160 caracteres.</span>
      </div>

      <MarketplaceProfileFields />

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending || slugStatus === "taken"} className="mt-2">
        {isPending ? "Criando loja..." : "Criar minha loja"}
      </Button>
    </form>
  );
}

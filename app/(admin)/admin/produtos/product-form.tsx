"use client";

import { useActionState } from "react";
import { createProduct, updateProduct, type ProductFormState } from "@/lib/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProductStatus } from "@/types/database.types";

type ProductFormProps = {
  categories: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  models: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    materials: string | null;
    weight_kg: number | null;
    length_cm: number | null;
    width_cm: number | null;
    height_cm: number | null;
    status: ProductStatus;
    category_id: string | null;
    collection_id: string | null;
    model_id: string | null;
    is_featured: boolean;
    is_new_arrival: boolean;
  };
};

const initialState: ProductFormState = {};

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "available", label: "Disponível" },
  { value: "made_to_order", label: "Sob encomenda" },
  { value: "sold_out", label: "Esgotado" },
  { value: "inactive", label: "Inativo" },
];

export function ProductForm({ categories, collections, models, product }: ProductFormProps) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={product?.name} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" defaultValue={product?.description ?? ""} rows={4} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Preço base (R$)</Label>
          {/* `key` força remontar quando o preço muda por fora deste form —
              "Usar como preço da peça" (em Formação de preço) grava direto no
              banco e revalida a página, mas `defaultValue` num input não
              controlado é ignorado em updates: sem a `key`, o campo continuaria
              mostrando o valor antigo até a página recarregar de verdade. */}
          <Input
            key={product?.price}
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={product?.status ?? "available"}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* As medidas ficam na seção "Peso e dimensões" abaixo, em campos
          numéricos — o antigo campo de texto livre era redundante. */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="materials">Materiais</Label>
        <Input id="materials" name="materials" defaultValue={product?.materials ?? ""} />
      </div>

      {/* Peso e dimensões numéricos: aparecem em "Mais detalhes" na página da
          peça e servem de base para estimar frete no futuro. O campo de
          medidas acima segue como texto livre para exibição. */}
      <fieldset className="flex flex-col gap-4 rounded-[var(--radius-image)] border border-border bg-card p-5">
        <legend className="sr-only">Peso e dimensões</legend>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Peso e dimensões</span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            Opcional. Aparece na página da peça em &quot;Mais detalhes&quot; e ajuda a calcular o envio.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weightKg">Peso (kg)</Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.001"
              min="0"
              placeholder="0,428"
              defaultValue={product?.weight_kg ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lengthCm">Comprimento (cm)</Label>
            <Input
              id="lengthCm"
              name="lengthCm"
              type="number"
              step="0.01"
              min="0"
              placeholder="28"
              defaultValue={product?.length_cm ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="widthCm">Largura (cm)</Label>
            <Input
              id="widthCm"
              name="widthCm"
              type="number"
              step="0.01"
              min="0"
              placeholder="10"
              defaultValue={product?.width_cm ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="heightCm">Altura (cm)</Label>
            <Input
              id="heightCm"
              name="heightCm"
              type="number"
              step="0.01"
              min="0"
              placeholder="25"
              defaultValue={product?.height_cm ?? ""}
            />
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Categoria</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product?.category_id ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="collectionId">Coleção</Label>
          <select
            id="collectionId"
            name="collectionId"
            defaultValue={product?.collection_id ?? ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Sem coleção</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="modelId">Modelo</Label>
          <select
            id="modelId"
            name="modelId"
            defaultValue={product?.model_id ?? ""}
            className="h-9 border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          >
            <option value="">Sem modelo</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox name="isFeatured" defaultChecked={product?.is_featured} />
          Produto em destaque
        </Label>
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox name="isNewArrival" defaultChecked={product?.is_new_arrival} />
          Lançamento
        </Label>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Salvando..." : product ? "Salvar alterações" : "Criar produto"}
      </Button>
    </form>
  );
}

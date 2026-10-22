"use client";

import { useActionState } from "react";
import { createProduct, updateProduct, type ProductFormState } from "@/lib/products/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { QuickCreateSelect } from "./quick-create-select";
import type { ProductStatus } from "@/types/database.types";
import { FormFooter } from "@/components/admin/form-footer";

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
          <NativeSelect id="status" name="status" defaultValue={product?.status ?? "available"}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
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
        <QuickCreateSelect
          kind="category"
          id="categoryId"
          name="categoryId"
          label="Categoria"
          emptyLabel="Sem categoria"
          noun="categoria"
          options={categories}
          defaultValue={product?.category_id ?? ""}
        />
        <QuickCreateSelect
          kind="collection"
          id="collectionId"
          name="collectionId"
          label="Coleção"
          emptyLabel="Sem coleção"
          noun="coleção"
          options={collections}
          defaultValue={product?.collection_id ?? ""}
        />
        <QuickCreateSelect
          kind="model"
          id="modelId"
          name="modelId"
          label="Modelo"
          emptyLabel="Sem modelo"
          noun="modelo"
          options={models}
          defaultValue={product?.model_id ?? ""}
        />
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

      <FormFooter
        sticky
        isPending={isPending}
        error={state.error}
        submitLabel={product ? "Salvar alterações" : "Criar produto"}
      />
    </form>
  );
}

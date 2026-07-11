"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, ImagePlus, Leaf, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/client";
import { getBranchMenu } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils";
import { DishOptionsEditor } from "@/components/features/menu/dish-options-editor";
import { useAuth } from "@/features/auth/auth-provider";
import type { Category, DishWithRelations } from "@/types/database";

const emptyDish = { name: "", description: "", price: 0, category_id: "", is_veg: true, is_active: true, prep_time_mins: 15 };
const emptyCategory = { name: "", sort_order: 0, is_active: true, station_id: "" };

export default function MenuPage() {
  const { organization, branch } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dishOpen, setDishOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DishWithRelations | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [dishForm, setDishForm] = useState(emptyDish);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const stations = useQuery({
    queryKey: ["stations", branch?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("stations").select("*").eq("branch_id", branch!.id).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!branch,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const menu = useQuery({
    queryKey: ["menu", organization?.id],
    queryFn: () => getBranchMenu(supabase, organization!.id),
    enabled: !!organization,
  });

  const dishes = useMemo(() => {
    return (menu.data?.dishes ?? []).filter((dish) => {
      if (search && !dish.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== "all" && dish.category_id !== categoryFilter) return false;
      return true;
    });
  }, [menu.data?.dishes, search, categoryFilter]);

  const uploadImage = async () => {
    if (!imageFile) return editingDish?.image_url ?? null;
    const ext = imageFile.name.split(".").pop() || "jpg";
    const path = `${organization!.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("dish-images").upload(path, imageFile, { upsert: true });
    if (error) throw error;
    return supabase.storage.from("dish-images").getPublicUrl(path).data.publicUrl;
  };

  const saveDish = useMutation({
    mutationFn: async () => {
      const image_url = await uploadImage();
      const payload = {
        name: dishForm.name,
        description: dishForm.description || null,
        price: dishForm.price,
        category_id: dishForm.category_id || null,
        is_veg: dishForm.is_veg,
        is_active: dishForm.is_active,
        prep_time_mins: dishForm.prep_time_mins,
        image_url,
      };
      if (editingDish) {
        const { error } = await supabase.from("dishes").update(payload).eq("id", editingDish.id);
        if (error) throw error;
        return;
      }
      const { data, error } = await supabase.from("dishes").insert({ ...payload, org_id: organization!.id }).select("*").single();
      if (error) throw error;
      if (data && branch) await supabase.from("branch_dishes").insert({ branch_id: branch.id, dish_id: data.id });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu"] });
      setDishOpen(false);
      setEditingDish(null);
      setDishForm(emptyDish);
      setImageFile(null);
      toast.success("Dish saved");
    },
    onError: (error) => toast.error(error.message),
  });

  const saveCategory = useMutation({
    mutationFn: async () => {
      if (editingCategory) {
        const { error } = await supabase.from("categories").update({ ...categoryForm, station_id: categoryForm.station_id || null }).eq("id", editingCategory.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("categories").insert({ ...categoryForm, station_id: categoryForm.station_id || null, org_id: organization!.id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu"] });
      setCategoryOpen(false);
      setEditingCategory(null);
      setCategoryForm(emptyCategory);
      toast.success("Category saved");
    },
    onError: (error) => toast.error(error.message),
  });

  const removeDish = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dishes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const editDish = (dish: DishWithRelations) => {
    setEditingDish(dish);
    setDishForm({ name: dish.name, description: dish.description ?? "", price: Number(dish.price), category_id: dish.category_id ?? "", is_veg: dish.is_veg, is_active: dish.is_active, prep_time_mins: dish.prep_time_mins });
    setDishOpen(true);
  };

  const editCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      sort_order: category.sort_order,
      is_active: category.is_active ?? true,
      station_id: category.station_id ?? "",
    });
    setCategoryOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Menu" description={`${menu.data?.dishes.length ?? 0} dishes | ${menu.data?.categories.length ?? 0} categories`} actions={<><Button variant="secondary" onClick={() => { setEditingCategory(null); setCategoryForm(emptyCategory); setCategoryOpen(true); }}><Plus className="h-4 w-4" />Category</Button><Button onClick={() => { setEditingDish(null); setDishForm(emptyDish); setDishOpen(true); }}><Plus className="h-4 w-4" />Dish</Button></>} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search dishes" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-48">
          <option value="all">All categories</option>
          {menu.data?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </Select>
      </div>
      {menu.data?.categories.length ? (
        <div className="flex flex-wrap gap-1.5">
          {menu.data.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => editCategory(category)}
              className="group flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              title="Edit category"
            >
              {category.name}
              {stations.data?.find((station) => station.id === category.station_id) ? (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-primary">
                  {stations.data.find((station) => station.id === category.station_id)?.name}
                </span>
              ) : null}
              <Edit2 className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      ) : null}
      {menu.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div>
      ) : dishes.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dishes.map((dish) => (
            <Card key={dish.id}>
              <CardContent className="flex gap-3 p-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
                  {dish.image_url ? <div className="h-full w-full bg-cover bg-center" role="img" aria-label={dish.name} style={{ backgroundImage: `url(${dish.image_url})` }} /> : <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold">{dish.name}</h2>
                    {dish.is_veg ? <Leaf className="h-3.5 w-3.5 text-success" /> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{dish.description || dish.categories?.name || "No description"}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-numbers text-sm font-semibold text-primary">{formatCurrency(dish.price)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => editDish(dish)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeDish.mutate(dish.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={UtensilsCrossed} title="No dishes found" description="Add dishes or adjust the filters." actionLabel="Add dish" onAction={() => setDishOpen(true)} />
      )}
      <Dialog open={dishOpen} title={editingDish ? "Edit dish" : "Add dish"} onOpenChange={setDishOpen}>
        <div className="space-y-3">
          <label className="flex items-center gap-3 rounded-2xl border bg-secondary p-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card"><ImagePlus className="h-5 w-5 text-muted-foreground" /></div>
            <span className="text-sm font-medium">Upload dish image</span>
            <input type="file" accept="image/*" className="hidden" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
          </label>
          <Field label="Name"><Input value={dishForm.name} onChange={(event) => setDishForm({ ...dishForm, name: event.target.value })} /></Field>
          <Field label="Description"><Textarea value={dishForm.description} onChange={(event) => setDishForm({ ...dishForm, description: event.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price"><Input type="number" value={dishForm.price} onChange={(event) => setDishForm({ ...dishForm, price: Number(event.target.value) })} /></Field>
            <Field label="Prep mins"><Input type="number" value={dishForm.prep_time_mins} onChange={(event) => setDishForm({ ...dishForm, prep_time_mins: Number(event.target.value) })} /></Field>
          </div>
          <Field label="Category"><Select value={dishForm.category_id} onChange={(event) => setDishForm({ ...dishForm, category_id: event.target.value })}><option value="">Uncategorized</option>{menu.data?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
          <div className="flex items-center justify-between rounded-xl border p-3 text-sm">Vegetarian<Switch checked={dishForm.is_veg} onCheckedChange={(checked) => setDishForm({ ...dishForm, is_veg: checked })} /></div>
          <div className="flex items-center justify-between rounded-xl border p-3 text-sm">Active<Switch checked={dishForm.is_active} onCheckedChange={(checked) => setDishForm({ ...dishForm, is_active: checked })} /></div>
          {editingDish ? (
            <div className="rounded-2xl border bg-secondary/40 p-3">
              <DishOptionsEditor
                dishId={editingDish.id}
                variants={menu.data?.dishes.find((dish) => dish.id === editingDish.id)?.dish_variants ?? []}
                addons={menu.data?.dishes.find((dish) => dish.id === editingDish.id)?.dish_addons ?? []}
              />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
              Save the dish first, then edit it to add sizes (Half/Full) and add-ons.
            </p>
          )}
          <Button className="w-full" disabled={!dishForm.name || saveDish.isPending} onClick={() => saveDish.mutate()}>Save dish</Button>
        </div>
      </Dialog>
      <Dialog open={categoryOpen} title={editingCategory ? "Edit category" : "Add category"} onOpenChange={setCategoryOpen}>
        <div className="space-y-3">
          <Field label="Name"><Input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /></Field>
          <Field label="Sort order"><Input type="number" value={categoryForm.sort_order} onChange={(event) => setCategoryForm({ ...categoryForm, sort_order: Number(event.target.value) })} /></Field>
          {stations.data?.length ? (
            <Field label="Kitchen station (routes tickets)">
              <Select value={categoryForm.station_id} onChange={(event) => setCategoryForm({ ...categoryForm, station_id: event.target.value })}>
                <option value="">No station</option>
                {stations.data.map((station) => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Button className="w-full" disabled={!categoryForm.name || saveCategory.isPending} onClick={() => saveCategory.mutate()}>Save category</Button>
        </div>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

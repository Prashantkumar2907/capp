"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, ImagePlus, Leaf, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { DishImage } from "@/components/features/menu/dish-image";
import { readApiResponse } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { getBranchMenu } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import { useAuth } from "@/features/auth/auth-provider";
import type { Category, DishWithRelations } from "@/types/database";

const emptyDish = { name: "", description: "", price: 0, category_id: "", is_veg: true, is_active: true, prep_time_mins: 15 };
const emptyCategory = { name: "", sort_order: 0, is_active: true };

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const imagePreviewUrlRef = useRef<string | null>(null);

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

  const pagination = usePagination(dishes, 9);
  const { setPage } = pagination;

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    };
  }, []);

  const updateImageSelection = (file: File | null, error: string | null = null) => {
    if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current);
    const nextPreviewUrl = file ? URL.createObjectURL(file) : null;
    imagePreviewUrlRef.current = nextPreviewUrl;
    setImageFile(file);
    setImagePreviewUrl(nextPreviewUrl);
    setImageError(error);
  };

  const chooseImage = (file: File | null | undefined) => {
    if (!file) {
      updateImageSelection(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      updateImageSelection(null, "Use a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      updateImageSelection(null, "Images must be 5 MB or smaller.");
      return;
    }

    updateImageSelection(file);
  };

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
        branch_id: branch?.id ?? null,
        is_veg: dishForm.is_veg,
        is_active: dishForm.is_active,
        prep_time_mins: dishForm.prep_time_mins,
        image_url,
      };
      if (editingDish) {
        const response = await fetch(`/api/menu/dishes/${editingDish.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await readApiResponse(response);
        return;
      }
      const response = await fetch("/api/menu/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await readApiResponse(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["menu"] });
      setDishOpen(false);
      setEditingDish(null);
      setDishForm(emptyDish);
      updateImageSelection(null);
      toast.success("Dish saved");
    },
    onError: (error) => toast.error(error.message),
  });

  const saveCategory = useMutation({
    mutationFn: async () => {
      const method = editingCategory ? "PATCH" : "POST";
      const url = editingCategory ? `/api/menu/categories/${editingCategory.id}` : "/api/menu/categories";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });
      await readApiResponse(response);
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
      const response = await fetch(`/api/menu/dishes/${id}`, { method: "DELETE" });
      await readApiResponse(response);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const editDish = (dish: DishWithRelations) => {
    setEditingDish(dish);
    setDishForm({ name: dish.name, description: dish.description ?? "", price: Number(dish.price), category_id: dish.category_id ?? "", is_veg: dish.is_veg, is_active: dish.is_active, prep_time_mins: dish.prep_time_mins });
    updateImageSelection(null);
    setDishOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Menu" description={`${menu.data?.dishes.length ?? 0} dishes | ${menu.data?.categories.length ?? 0} categories`} actions={<><Button variant="secondary" onClick={() => { setEditingCategory(null); setCategoryForm(emptyCategory); setCategoryOpen(true); }}><Plus className="h-4 w-4" />Category</Button><Button onClick={() => { setEditingDish(null); setDishForm(emptyDish); updateImageSelection(null); setDishOpen(true); }}><Plus className="h-4 w-4" />Dish</Button></>} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search dishes"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            setPage(1);
          }}
          className="w-48"
        >
          <option value="all">All categories</option>
          {menu.data?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </Select>
      </div>
      {menu.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div>
      ) : dishes.length ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pagination.pageItems.map((dish) => (
              <Card key={dish.id}>
                <CardContent className="flex gap-3 p-3">
                  <DishImage src={dish.image_url} alt={dish.name} className="h-20 w-20 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-semibold">{dish.name}</h2>
                      {dish.is_veg ? <Leaf className="h-3.5 w-3.5 text-success" /> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{dish.description || dish.categories?.name || "No description"}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-numbers text-sm font-semibold text-primary">{formatCurrency(dish.price)}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${dish.name}`} onClick={() => editDish(dish)}><Edit2 className="h-4 w-4" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          aria-label={`Remove ${dish.name}`}
                          onClick={() => {
                            if (window.confirm(`Remove ${dish.name} from the menu?`)) removeDish.mutate(dish.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination
            page={pagination.currentPage}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            pageSizeOptions={[9, 18, 36]}
          />
        </>
      ) : (
        <EmptyState icon={UtensilsCrossed} title="No dishes found" description="Add dishes or adjust the filters." actionLabel="Add dish" onAction={() => setDishOpen(true)} />
      )}
      <Dialog open={dishOpen} title={editingDish ? "Edit dish" : "Add dish"} onOpenChange={setDishOpen}>
        <div className="space-y-3">
          <FormField id="dish-image" label="Dish image" error={imageError} hint={imageFile ? `${imageFile.name} selected` : "JPEG, PNG, or WebP up to 5 MB."}>
            <label className="flex items-center gap-3 rounded-2xl border bg-secondary p-3">
              <DishImage src={imagePreviewUrl ?? editingDish?.image_url ?? null} alt={dishForm.name || "Dish"} className="h-14 w-14 shrink-0 rounded-2xl" />
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                {imageFile ? "Change image" : "Upload dish image"}
              </span>
              <input id="dish-image" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} />
            </label>
          </FormField>
          <FormField id="dish-name" label="Name"><Input id="dish-name" value={dishForm.name} onChange={(event) => setDishForm({ ...dishForm, name: event.target.value })} /></FormField>
          <FormField id="dish-description" label="Description"><Textarea id="dish-description" value={dishForm.description} onChange={(event) => setDishForm({ ...dishForm, description: event.target.value })} /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="dish-price" label="Price"><Input id="dish-price" type="number" value={dishForm.price} onChange={(event) => setDishForm({ ...dishForm, price: Number(event.target.value) })} /></FormField>
            <FormField id="dish-prep-mins" label="Prep mins"><Input id="dish-prep-mins" type="number" value={dishForm.prep_time_mins} onChange={(event) => setDishForm({ ...dishForm, prep_time_mins: Number(event.target.value) })} /></FormField>
          </div>
          <FormField id="dish-category" label="Category"><Select id="dish-category" value={dishForm.category_id} onChange={(event) => setDishForm({ ...dishForm, category_id: event.target.value })}><option value="">Uncategorized</option>{menu.data?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></FormField>
          <div className="flex items-center justify-between rounded-xl border p-3 text-sm">Vegetarian<Switch checked={dishForm.is_veg} onCheckedChange={(checked) => setDishForm({ ...dishForm, is_veg: checked })} /></div>
          <div className="flex items-center justify-between rounded-xl border p-3 text-sm">Active<Switch checked={dishForm.is_active} onCheckedChange={(checked) => setDishForm({ ...dishForm, is_active: checked })} /></div>
          <Button className="w-full" loading={saveDish.isPending} disabled={!dishForm.name || Boolean(imageError)} onClick={() => saveDish.mutate()}>Save dish</Button>
        </div>
      </Dialog>
      <Dialog open={categoryOpen} title={editingCategory ? "Edit category" : "Add category"} onOpenChange={setCategoryOpen}>
        <div className="space-y-3">
          <FormField id="category-name" label="Name"><Input id="category-name" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /></FormField>
          <FormField id="category-sort-order" label="Sort order"><Input id="category-sort-order" type="number" value={categoryForm.sort_order} onChange={(event) => setCategoryForm({ ...categoryForm, sort_order: Number(event.target.value) })} /></FormField>
          <div className="flex items-center justify-between rounded-xl border p-3 text-sm">Active<Switch checked={categoryForm.is_active} onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })} /></div>
          <Button className="w-full" loading={saveCategory.isPending} disabled={!categoryForm.name} onClick={() => saveCategory.mutate()}>Save category</Button>
        </div>
      </Dialog>
    </div>
  );
}

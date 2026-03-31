"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, dishSchema, type CategoryInput, type DishInput } from "@/lib/validations";
import { formatCurrency } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Leaf } from "lucide-react";
import type { Category } from "@/lib/supabase/types";

export default function MenuPage() {
  const { organization, branch } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<any | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ["categories", organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("org_id", organization!.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!organization,
  });

  const { data: dishes, isLoading: dishesLoading } = useQuery({
    queryKey: ["dishes", organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("dishes")
        .select("*, categories(name)")
        .eq("org_id", organization!.id)
        .order("name");
      return data || [];
    },
    enabled: !!organization,
  });

  // Category mutations
  const catForm = useForm({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: editingCat || { name: "", sort_order: 0, is_active: true },
  });

  const saveCat = useMutation({
    mutationFn: async (data: any) => {
      if (editingCat) {
        const { error } = await supabase.from("categories").update(data).eq("id", editingCat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert({ ...data, org_id: organization!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCatDialogOpen(false);
      setEditingCat(null);
      catForm.reset();
      toast.success(editingCat ? "Category updated" : "Category created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
  });

  // Dish mutations
  const dishForm = useForm({
    resolver: zodResolver(dishSchema) as any,
    defaultValues: editingDish || { price: 0, is_veg: false, is_active: true },
  });

  const saveDish = useMutation({
    mutationFn: async (data: any) => {
      if (editingDish) {
        const { error } = await supabase.from("dishes").update(data).eq("id", editingDish.id);
        if (error) throw error;
      } else {
        const { data: newDish, error } = await supabase.from("dishes").insert({ ...data, org_id: organization!.id }).select("id").single();
        if (error) throw error;
        // Auto-add dish to current branch
        if (newDish && branch) {
          await supabase.from("branch_dishes").insert({ branch_id: branch.id, dish_id: newDish.id });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      setDishDialogOpen(false);
      setEditingDish(null);
      dishForm.reset();
      toast.success(editingDish ? "Dish updated" : "Dish created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteDish = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dishes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Dish deleted");
    },
  });

  const toggleDishActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("dishes").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dishes"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-poppins">Menu</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {dishes?.length || 0} dishes in {categories?.length || 0} categories
          </p>
        </div>
      </div>

      <Tabs defaultValue="dishes" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="dishes" className="text-xs">Dishes</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>
        </TabsList>

        {/* Dishes Tab */}
        <TabsContent value="dishes" className="mt-3">
          <div className="flex justify-end mb-3">
            <Dialog open={dishDialogOpen} onOpenChange={(open) => {
              setDishDialogOpen(open);
              if (!open) { setEditingDish(null); dishForm.reset(); }
            }}>
              <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" onClick={() => setDishDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Dish
              </Button>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-sm font-poppins">{editingDish ? "Edit Dish" : "Add Dish"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={dishForm.handleSubmit((d) => saveDish.mutate(d))} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input className="h-8 text-xs" {...dishForm.register("name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea className="text-xs min-h-[60px]" {...dishForm.register("description")} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Price (₹)</Label>
                      <Input className="h-8 text-xs" type="number" step="0.5" {...dishForm.register("price", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category</Label>
                      <select className="w-full h-8 text-xs border rounded-md px-2 bg-transparent" {...dishForm.register("category_id")}>
                        <option value="">None</option>
                        {categories?.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" {...dishForm.register("is_veg")} className="rounded" />
                      Veg
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" {...dishForm.register("is_active")} className="rounded" />
                      Active
                    </label>
                  </div>
                  <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" disabled={saveDish.isPending}>
                    {saveDish.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {editingDish ? "Update" : "Create"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {dishesLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="space-y-1.5">
              {dishes?.map((dish) => (
                <Card key={dish.id} className="border-zinc-200 dark:border-zinc-800">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {dish.is_veg && <Leaf className="h-3 w-3 text-green-600 shrink-0" />}
                        <span className="text-sm font-medium truncate">{dish.name}</span>
                        {!dish.is_active && <Badge variant="secondary" className="text-[9px] h-4">Inactive</Badge>}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        {(dish as any).categories?.name || "Uncategorized"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 shrink-0">
                      {formatCurrency(dish.price)}
                    </span>
                    <Switch
                      checked={dish.is_active}
                      onCheckedChange={(checked) => toggleDishActive.mutate({ id: dish.id, is_active: checked })}
                      className="shrink-0"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setEditingDish(dish);
                        dishForm.reset(dish);
                        setDishDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => {
                        if (confirm("Delete this dish?")) deleteDish.mutate(dish.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {dishes?.length === 0 && (
                <div className="text-center py-12 text-sm text-zinc-400">No dishes yet. Add your first dish above.</div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-3">
          <div className="flex justify-end mb-3">
            <Dialog open={catDialogOpen} onOpenChange={(open) => {
              setCatDialogOpen(open);
              if (!open) { setEditingCat(null); catForm.reset(); }
            }}>
              <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" onClick={() => setCatDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
              </Button>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-sm font-poppins">{editingCat ? "Edit Category" : "Add Category"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={catForm.handleSubmit((d) => saveCat.mutate(d))} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input className="h-8 text-xs" {...catForm.register("name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sort Order</Label>
                    <Input className="h-8 text-xs" type="number" {...catForm.register("sort_order", { valueAsNumber: true })} />
                  </div>
                  <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white h-8 text-xs" disabled={saveCat.isPending}>
                    {saveCat.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {editingCat ? "Update" : "Create"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {catsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="space-y-1.5">
              {categories?.map((cat) => (
                <Card key={cat.id} className="border-zinc-200 dark:border-zinc-800">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-[10px] text-zinc-400 ml-2">order: {cat.sort_order}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                      setEditingCat(cat);
                      catForm.reset(cat);
                      setCatDialogOpen(true);
                    }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => {
                      if (confirm("Delete this category?")) deleteCat.mutate(cat.id);
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {categories?.length === 0 && (
                <div className="text-center py-12 text-sm text-zinc-400">No categories yet.</div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

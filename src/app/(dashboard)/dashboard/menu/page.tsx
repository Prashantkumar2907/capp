"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, dishSchema, type CategoryInput, type DishInput } from "@/lib/validations";
import { formatCurrency } from "@/lib/helpers";
import { SectionHeader } from "@/components/common/section-header";
import { EmptyState } from "@/components/common/empty-state";
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
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, Loader2, Leaf, Search, LayoutGrid, List, UtensilsCrossed,
  ImagePlus,
} from "lucide-react";
import type { Category } from "@/lib/supabase/types";

export default function MenuPage() {
  const { organization, branch } = useAuth();
  const [supabase] = useState(() => createClient());
  const queryClient = useQueryClient();
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [dishDialogOpen, setDishDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<any | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterVeg, setFilterVeg] = useState<"all" | "veg" | "nonveg">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ["categories", organization?.id],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("org_id", organization!.id).order("sort_order");
      return data || [];
    },
    enabled: !!organization,
  });

  const { data: dishes, isLoading: dishesLoading } = useQuery({
    queryKey: ["dishes", organization?.id],
    queryFn: async () => {
      const { data } = await supabase.from("dishes").select("*, categories(name)").eq("org_id", organization!.id).order("name");
      return data || [];
    },
    enabled: !!organization,
  });

  const catForm = useForm({ resolver: zodResolver(categorySchema) as any, defaultValues: { name: "", sort_order: 0, is_active: true } });
  const dishForm = useForm({ resolver: zodResolver(dishSchema) as any, defaultValues: { name: "", description: "", price: 0, category_id: null, is_veg: false, is_active: true } });

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
      setCatDialogOpen(false); setEditingCat(null); catForm.reset();
      toast.success(editingCat ? "Category updated" : "Category created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); toast.success("Category deleted"); },
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("dish-images").upload(fileName, file);
    if (error) { toast.error("Image upload failed"); return null; }
    const { data } = supabase.storage.from("dish-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const saveDish = useMutation({
    mutationFn: async (data: any) => {
      let imageUrl = editingDish?.image_url || null;
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      const payload = { ...data, image_url: imageUrl };
      if (data.category_id === "" || data.category_id === "none") payload.category_id = null;

      if (editingDish) {
        const { error } = await supabase.from("dishes").update(payload).eq("id", editingDish.id);
        if (error) throw error;
      } else {
        const { data: newDish, error } = await supabase.from("dishes").insert({ ...payload, org_id: organization!.id }).select("id").single();
        if (error) throw error;
        if (newDish && branch) {
          await supabase.from("branch_dishes").insert({ branch_id: branch.id, dish_id: newDish.id });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      setDishDialogOpen(false); setEditingDish(null); dishForm.reset(); setImageFile(null);
      toast.success(editingDish ? "Dish updated" : "Dish created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteDish = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dishes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dishes"] }); toast.success("Dish deleted"); },
  });

  const toggleDishActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("dishes").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dishes"] }),
  });

  const filteredDishes = dishes?.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== "all" && d.category_id !== filterCategory) return false;
    if (filterVeg === "veg" && !d.is_veg) return false;
    if (filterVeg === "nonveg" && d.is_veg) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Menu"
        description={`${dishes?.length || 0} dishes in ${categories?.length || 0} categories`}
      />

      <Tabs defaultValue="dishes" className="w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList className="h-9">
            <TabsTrigger value="dishes" className="text-xs">Dishes</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>
          </TabsList>
        </div>

        {/* Dishes Tab */}
        <TabsContent value="dishes" className="mt-4 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-9 text-xs pl-9" placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5">
              {[{ v: "all", l: "All" }, { v: "veg", l: "🟢 Veg" }, { v: "nonveg", l: "🔴 Non-Veg" }].map(f => (
                <button key={f.v} onClick={() => setFilterVeg(f.v as any)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${filterVeg === f.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {f.l}
                </button>
              ))}
            </div>
            <select className="h-9 text-xs border border-border rounded-lg px-2 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex border border-border rounded-lg overflow-hidden ml-auto">
              <button onClick={() => setViewMode("list")} className={`p-1.5 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("grid")} className={`p-1.5 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <Dialog open={dishDialogOpen} onOpenChange={(open) => { setDishDialogOpen(open); if (!open) { setEditingDish(null); dishForm.reset(); setImageFile(null); } }}>
              <Button size="sm" className="h-9 text-xs" onClick={() => setDishDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Dish
              </Button>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="text-sm">{editingDish ? "Edit Dish" : "Add Dish"}</DialogTitle></DialogHeader>
                <form onSubmit={dishForm.handleSubmit((d) => saveDish.mutate(d))} className="space-y-4">
                  {/* Image upload */}
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 shrink-0 overflow-hidden">
                      {imageFile ? (
                        <img src={URL.createObjectURL(imageFile)} alt="" className="h-full w-full object-cover rounded-xl" />
                      ) : editingDish?.image_url ? (
                        <img src={editingDish.image_url} alt="" className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs cursor-pointer text-primary hover:underline">
                        Upload Image
                        <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                      </Label>
                      <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, max 2MB</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input className="h-9 text-xs" {...dishForm.register("name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea className="text-xs min-h-[60px]" {...dishForm.register("description")} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Price (₹)</Label>
                      <Input className="h-9 text-xs" type="number" step="0.5" {...dishForm.register("price", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category</Label>
                      <select className="w-full h-9 text-xs border border-border rounded-md px-2 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring" {...dishForm.register("category_id")}>
                        <option value="">None</option>
                        {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <Switch checked={dishForm.watch("is_veg")} onCheckedChange={(v) => dishForm.setValue("is_veg", v)} /> Vegetarian
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <Switch checked={dishForm.watch("is_active")} onCheckedChange={(v) => dishForm.setValue("is_active", v)} /> Active
                    </label>
                  </div>
                  <Button type="submit" className="w-full h-9 text-xs" disabled={saveDish.isPending || uploading}>
                    {(saveDish.isPending || uploading) && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                    {editingDish ? "Update Dish" : "Create Dish"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {dishesLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : filteredDishes.length === 0 ? (
            <EmptyState icon={UtensilsCrossed} title="No dishes found" description={search ? "Try a different search term" : "Add your first dish to get started"} actionLabel="Add Dish" onAction={() => setDishDialogOpen(true)} />
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {filteredDishes.map((dish, i) => (
                <motion.div key={dish.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="card-hover">
                    <CardContent className="p-3 flex items-center gap-3">
                      {/* Dish image or placeholder */}
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {dish.image_url ? (
                          <img src={dish.image_url} alt={dish.name} className="h-full w-full object-cover" />
                        ) : (
                          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {dish.is_veg ? (
                            <span className="h-3 w-3 rounded-sm border border-green-500 flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /></span>
                          ) : (
                            <span className="h-3 w-3 rounded-sm border border-red-500 flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /></span>
                          )}
                          <span className="text-sm font-medium truncate">{dish.name}</span>
                          {!dish.is_active && <Badge variant="secondary" className="text-[9px] h-4">Inactive</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{(dish as any).categories?.name || "Uncategorized"}</p>
                      </div>
                      <span className="text-sm font-bold text-primary shrink-0">{formatCurrency(dish.price)}</span>
                      <Switch checked={dish.is_active} onCheckedChange={(checked) => toggleDishActive.mutate({ id: dish.id, is_active: checked })} className="shrink-0" />
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingDish(dish); dishForm.reset(dish); setDishDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => { if (confirm("Delete this dish?")) deleteDish.mutate(dish.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredDishes.map((dish, i) => (
                <motion.div key={dish.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                  <Card className="card-hover overflow-hidden group">
                    <div className="h-32 bg-muted flex items-center justify-center relative overflow-hidden">
                      {dish.image_url ? (
                        <img src={dish.image_url} alt={dish.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div className="absolute top-2 left-2">
                        {dish.is_veg ? (
                          <span className="h-5 w-5 rounded border border-green-500 bg-white dark:bg-card flex items-center justify-center"><span className="h-2 w-2 rounded-full bg-green-500" /></span>
                        ) : (
                          <span className="h-5 w-5 rounded border border-red-500 bg-white dark:bg-card flex items-center justify-center"><span className="h-2 w-2 rounded-full bg-red-500" /></span>
                        )}
                      </div>
                      {!dish.is_active && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h4 className="text-sm font-medium truncate">{dish.name}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">{(dish as any).categories?.name || "Uncategorized"}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-primary">{formatCurrency(dish.price)}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingDish(dish); dishForm.reset(dish); setDishDialogOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => { if (confirm("Delete?")) deleteDish.mutate(dish.id); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={catDialogOpen} onOpenChange={(open) => { setCatDialogOpen(open); if (!open) { setEditingCat(null); catForm.reset(); } }}>
              <Button size="sm" className="h-9 text-xs" onClick={() => setCatDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
              </Button>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle className="text-sm">{editingCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
                <form onSubmit={catForm.handleSubmit((d) => saveCat.mutate(d))} className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input className="h-9 text-xs" {...catForm.register("name")} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Sort Order</Label><Input className="h-9 text-xs" type="number" {...catForm.register("sort_order", { valueAsNumber: true })} /></div>
                  <Button type="submit" className="w-full h-9 text-xs" disabled={saveCat.isPending}>
                    {saveCat.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                    {editingCat ? "Update" : "Create"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {catsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-2">
              {categories?.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="card-hover">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><span className="text-sm">{i + 1}</span></div>
                        <div>
                          <span className="text-sm font-medium">{cat.name}</span>
                          <p className="text-[10px] text-muted-foreground">
                            {dishes?.filter(d => d.category_id === cat.id).length || 0} dishes · Order: {cat.sort_order}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingCat(cat); catForm.reset(cat); setCatDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => { if (confirm("Delete?")) deleteCat.mutate(cat.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {categories?.length === 0 && <EmptyState icon={UtensilsCrossed} title="No categories yet" actionLabel="Add Category" onAction={() => setCatDialogOpen(true)} />}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

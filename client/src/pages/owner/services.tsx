import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Salon, Service, ServiceCategory, InsertService } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const serviceSchema = z.object({
  name: z.string().min(2, "اسم الخدمة مطلوب"),
  description: z.string().optional(),
  price: z.coerce.number().min(1, "السعر يجب أن يكون أكبر من 0"),
  durationMinutes: z.coerce.number().min(5, "المدة يجب أن تكون 5 دقائق على الأقل"),
  categoryId: z.coerce.number().min(1, "يرجى اختيار الفئة"),
  femaleStaffOnly: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  salonId: z.number(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function OwnerServices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSalonId, setSelectedSalonId] = useState<number | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  
  // Fetch salons owned by the user
  const {
    data: salons = [],
    isLoading: isLoadingSalons
  } = useQuery<Salon[]>({
    queryKey: ['/api/salons'],
    select: (data) => data.filter(salon => salon.ownerId === user?.id)
  });
  
  // Set selected salon when salons are loaded
  useEffect(() => {
    if (salons.length > 0 && !selectedSalonId) {
      setSelectedSalonId(salons[0].id);
    }
  }, [salons, selectedSalonId]);
  
  // Fetch services for selected salon
  const {
    data: services = [],
    isLoading: isLoadingServices
  } = useQuery<Service[]>({
    queryKey: [`/api/salons/${selectedSalonId}/services`],
    enabled: !!selectedSalonId,
  });
  
  // Fetch service categories
  const {
    data: categories = [],
    isLoading: isLoadingCategories
  } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
  });
  
  // Service form
  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      durationMinutes: 30,
      categoryId: 0,
      femaleStaffOnly: false,
      isActive: true,
      isFeatured: false,
      salonId: selectedSalonId || 0,
    }
  });
  
  // Update form values when selected salon changes
  useEffect(() => {
    if (selectedSalonId) {
      serviceForm.setValue('salonId', selectedSalonId);
    }
  }, [selectedSalonId, serviceForm]);
  
  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: InsertService) => {
      const res = await apiRequest("POST", "/api/services", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${selectedSalonId}/services`] });
      toast({
        title: "تمت إضافة الخدمة بنجاح",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في إضافة الخدمة",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertService> }) => {
      const res = await apiRequest("PATCH", `/api/services/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${selectedSalonId}/services`] });
      toast({
        title: "تم تحديث الخدمة بنجاح",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في تحديث الخدمة",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/services/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${selectedSalonId}/services`] });
      toast({
        title: "تم حذف الخدمة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في حذف الخدمة",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: ServiceFormValues) => {
    if (editingServiceId) {
      updateServiceMutation.mutate({ id: editingServiceId, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };
  
  // Reset form and editing state
  const resetForm = () => {
    serviceForm.reset({
      name: "",
      description: "",
      price: 0,
      durationMinutes: 30,
      categoryId: 0,
      femaleStaffOnly: false,
      isActive: true,
      isFeatured: false,
      salonId: selectedSalonId || 0,
    });
    setEditingServiceId(null);
  };
  
  // Edit service
  const handleEditService = (service: Service) => {
    serviceForm.reset({
      name: service.name,
      description: service.description || "",
      price: service.price,
      durationMinutes: service.durationMinutes,
      categoryId: service.categoryId,
      femaleStaffOnly: service.femaleStaffOnly,
      isActive: service.isActive,
      isFeatured: service.isFeatured,
      salonId: service.salonId,
    });
    setEditingServiceId(service.id);
    setIsDialogOpen(true);
  };
  
  // Delete service
  const handleDeleteService = (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الخدمة؟")) {
      deleteServiceMutation.mutate(id);
    }
  };
  
  // Toggle service active status
  const toggleServiceStatus = (service: Service) => {
    updateServiceMutation.mutate({
      id: service.id,
      data: { isActive: !service.isActive }
    });
  };
  
  // Group services by category
  const servicesByCategory: Record<number, Service[]> = {};
  services.forEach(service => {
    if (!servicesByCategory[service.categoryId]) {
      servicesByCategory[service.categoryId] = [];
    }
    servicesByCategory[service.categoryId].push(service);
  });
  
  if (isLoadingSalons) {
    return (
      <MainLayout title="إدارة الخدمات">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  // If the user doesn't have any salons, show an empty state with an option to create one
  if (salons.length === 0) {
    return (
      <MainLayout title="إدارة الخدمات">
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-primary text-xl">store</span>
          </div>
          <h2 className="text-lg font-bold mb-2">لم تقم بإضافة أي صالون بعد</h2>
          <p className="text-neutral-500 mb-6">لبدء إضافة الخدمات، قم بإضافة صالونك الأول</p>
          <Button className="bg-primary text-white" asChild>
            <a href="/owner/profile">إضافة صالون جديد</a>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="إدارة الخدمات">
      <div className="p-4">
        {/* Salon Selector (if user has multiple salons) */}
        {salons.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">اختر الصالون</label>
            <select 
              className="w-full p-2 border border-neutral-200 rounded-lg"
              value={selectedSalonId || ''}
              onChange={(e) => setSelectedSalonId(Number(e.target.value))}
            >
              {salons.map(salon => (
                <option key={salon.id} value={salon.id}>{salon.name}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Add Service Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-almarai font-bold text-lg">الخدمات المتاحة</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary-dark flex items-center gap-1"
                onClick={() => {
                  resetForm();
                  setEditingServiceId(null);
                }}
              >
                <span className="material-icons text-sm">add</span>
                <span>إضافة خدمة</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingServiceId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
                </DialogTitle>
              </DialogHeader>
              <Form {...serviceForm}>
                <form onSubmit={serviceForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={serviceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الخدمة</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم الخدمة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={serviceForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف الخدمة (اختياري)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="أدخل وصفاً موجزاً للخدمة" 
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={serviceForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>السعر (ريال)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={serviceForm.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدة (دقيقة)</FormLabel>
                          <FormControl>
                            <Input type="number" min="5" step="5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={serviceForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفئة</FormLabel>
                        <select 
                          className="w-full p-2 border border-input rounded-md"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        >
                          <option value={0} disabled>اختر الفئة</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={serviceForm.control}
                    name="femaleStaffOnly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>تقدم بواسطة موظفات فقط</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={serviceForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>الخدمة نشطة</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={serviceForm.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>خدمة مميزة</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}>
                      إلغاء
                    </Button>
                    <Button 
                      type="submit"
                      disabled={
                        createServiceMutation.isPending || 
                        updateServiceMutation.isPending
                      }
                    >
                      {
                        createServiceMutation.isPending || updateServiceMutation.isPending
                          ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          : null
                      }
                      {editingServiceId ? 'تحديث الخدمة' : 'إضافة الخدمة'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Services List */}
        {isLoadingServices || isLoadingCategories ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {Object.keys(servicesByCategory).length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg border border-neutral-100">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="material-icons text-primary text-xl">spa</span>
                </div>
                <h3 className="font-bold mb-2">لا توجد خدمات بعد</h3>
                <p className="text-neutral-500 mb-6">قم بإضافة خدمات لصالونك لتتمكن العميلات من الحجز</p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-primary hover:bg-primary-dark"
                >
                  إضافة خدمة الآن
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(servicesByCategory).map(([categoryId, services]) => {
                  const category = categories.find(c => c.id === parseInt(categoryId));
                  return (
                    <div key={categoryId}>
                      <h3 className="font-bold font-almarai text-primary mb-3">
                        {category?.name || "خدمات"}
                      </h3>
                      <div className="space-y-3">
                        {services.map(service => (
                          <div key={service.id} className="bg-white p-4 rounded-lg border border-neutral-100">
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold">{service.name}</h4>
                                {service.femaleStaffOnly && (
                                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                                    موظفات فقط
                                  </span>
                                )}
                                {service.isFeatured && (
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    مميزة
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  className="text-primary hover:bg-primary/10 p-1 rounded"
                                  onClick={() => handleEditService(service)}
                                >
                                  <span className="material-icons">edit</span>
                                </button>
                                <button 
                                  className="text-error hover:bg-error/10 p-1 rounded"
                                  onClick={() => handleDeleteService(service.id)}
                                >
                                  <span className="material-icons">delete_outline</span>
                                </button>
                              </div>
                            </div>
                            {service.description && (
                              <p className="text-xs text-neutral-600 mb-2">{service.description}</p>
                            )}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <span className="text-sm font-bold">{service.price} ريال</span>
                                <span className="mx-2 px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">
                                  {service.durationMinutes} دقيقة
                                </span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer"
                                  checked={service.isActive}
                                  onChange={() => toggleServiceStatus(service)}
                                />
                                <div className="w-9 h-5 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-1.25rem] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

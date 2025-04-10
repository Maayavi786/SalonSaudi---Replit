import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Salon, InsertSalon } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const salonSchema = z.object({
  name: z.string().min(2, "اسم الصالون مطلوب"),
  description: z.string().optional(),
  address: z.string().min(5, "العنوان مطلوب"),
  city: z.string().min(2, "المدينة مطلوبة"),
  district: z.string().min(2, "الحي مطلوب"),
  phone: z.string().min(10, "رقم الهاتف يجب أن يكون 10 أرقام على الأقل"),
  imageUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  isFemaleOnly: z.boolean().default(false),
  hasPrivateRooms: z.boolean().default(false),
  openingHours: z.record(z.string()).optional(),
});

type SalonFormValues = z.infer<typeof salonSchema>;

const cities = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "جازان",
  "تبوك", "أبها", "الطائف", "حائل", "الجبيل", "نجران", "ينبع", "الأحساء", "القطيف",
  "خميس مشيط", "بريدة", "عرعر", "سكاكا", "الباحة", "الخرج"
];

export default function SalonProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSalonId, setSelectedSalonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("basic");
  
  // Fetch salons owned by the user
  const {
    data: salons = [],
    isLoading: isLoadingSalons
  } = useQuery<Salon[]>({
    queryKey: ['/api/salons'],
    select: (data) => data.filter(salon => salon.ownerId === user?.id)
  });
  
  // Set form default values based on selected salon
  const selectedSalon = salons.find(salon => salon.id === selectedSalonId);
  
  // Set up the form
  const salonForm = useForm<SalonFormValues>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "الرياض",
      district: "",
      phone: "",
      imageUrl: "",
      coverImageUrl: "",
      isFemaleOnly: false,
      hasPrivateRooms: false,
      openingHours: {},
    }
  });
  
  // Update form when selected salon changes
  useEffect(() => {
    if (selectedSalon) {
      salonForm.reset({
        name: selectedSalon.name,
        description: selectedSalon.description || "",
        address: selectedSalon.address,
        city: selectedSalon.city,
        district: selectedSalon.district,
        phone: selectedSalon.phone,
        imageUrl: selectedSalon.imageUrl || "",
        coverImageUrl: selectedSalon.coverImageUrl || "",
        isFemaleOnly: selectedSalon.isFemaleOnly,
        hasPrivateRooms: selectedSalon.hasPrivateRooms,
        openingHours: selectedSalon.openingHours || {},
      });
    } else {
      salonForm.reset({
        name: "",
        description: "",
        address: "",
        city: "الرياض",
        district: "",
        phone: "",
        imageUrl: "",
        coverImageUrl: "",
        isFemaleOnly: false,
        hasPrivateRooms: false,
        openingHours: {},
      });
    }
  }, [selectedSalon, salonForm]);
  
  // Create salon mutation
  const createSalonMutation = useMutation({
    mutationFn: async (data: InsertSalon) => {
      const res = await apiRequest("POST", "/api/salons", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      setSelectedSalonId(data.id);
      toast({
        title: "تم إنشاء الصالون بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في إنشاء الصالون",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update salon mutation
  const updateSalonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertSalon> }) => {
      const res = await apiRequest("PATCH", `/api/salons/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({
        title: "تم تحديث معلومات الصالون بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في تحديث معلومات الصالون",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: SalonFormValues) => {
    if (selectedSalonId) {
      updateSalonMutation.mutate({ id: selectedSalonId, data });
    } else {
      createSalonMutation.mutate({ ...data, ownerId: user!.id });
    }
  };
  
  // Default image URLs
  const defaultProfileImage = "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80";
  const defaultCoverImage = "https://images.unsplash.com/photo-1633681926022-84c23e8cb3af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  
  if (isLoadingSalons) {
    return (
      <MainLayout title="معلومات الصالون">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={selectedSalonId ? "تعديل معلومات الصالون" : "إضافة صالون جديد"}>
      <div className="p-4">
        {/* Salon Selector (if user has existing salons) */}
        {salons.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">اختر الصالون للتعديل</label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedSalonId(null)}
              >
                صالون جديد
              </Button>
            </div>
            <select 
              className="w-full p-2 border border-neutral-200 rounded-lg"
              value={selectedSalonId || ''}
              onChange={(e) => setSelectedSalonId(Number(e.target.value) || null)}
            >
              <option value="">إضافة صالون جديد</option>
              {salons.map(salon => (
                <option key={salon.id} value={salon.id}>{salon.name}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Salon Preview */}
        {selectedSalonId && (
          <div className="mb-6 relative">
            <img 
              src={selectedSalon?.coverImageUrl || defaultCoverImage} 
              alt={selectedSalon?.name} 
              className="w-full h-32 object-cover rounded-t-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white rounded-b-lg">
              <div className="flex items-center">
                {selectedSalon?.isFemaleOnly && (
                  <span className="bg-accent text-white text-xs py-0.5 px-2 rounded-full ml-2">صالون نسائي</span>
                )}
                <div className="flex items-center text-xs">
                  <span className="material-icons text-amber-400 text-xs">star</span>
                  <span className="mx-0.5">{selectedSalon?.rating || "0.0"}</span>
                  <span className="opacity-80">({selectedSalon?.reviewCount || 0} تقييم)</span>
                </div>
              </div>
              <h1 className="text-xl font-bold mt-1 font-almarai">{selectedSalon?.name}</h1>
              <div className="flex items-center text-xs mt-1">
                <span className="material-icons text-xs">location_on</span>
                <span>{selectedSalon?.district}, {selectedSalon?.city}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Form */}
        <Form {...salonForm}>
          <form onSubmit={salonForm.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full mb-4">
                <TabsTrigger value="basic">معلومات أساسية</TabsTrigger>
                <TabsTrigger value="location">الموقع</TabsTrigger>
                <TabsTrigger value="features">المميزات</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={salonForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الصالون</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم الصالون" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={salonForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الصالون</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل وصفاً للصالون" 
                          className="resize-none" 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={salonForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input placeholder="05xxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={salonForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط صورة الصالون (اختياري)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={salonForm.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط صورة الغلاف (اختياري)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="location" className="space-y-4">
                <FormField
                  control={salonForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة</FormLabel>
                      <select 
                        className="w-full p-2 border border-input rounded-md"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        {cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={salonForm.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحي</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم الحي" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={salonForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان التفصيلي</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل العنوان التفصيلي" 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4">
                <FormField
                  control={salonForm.control}
                  name="isFemaleOnly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">صالون نسائي فقط</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          يعرض هذا الخيار شارة "صالون نسائي" على صفحة صالونك
                        </p>
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
                  control={salonForm.control}
                  name="hasPrivateRooms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">غرف خاصة</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          يتيح هذا الخيار خيار الغرف الخاصة عند الحجز
                        </p>
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
              </TabsContent>
            </Tabs>
            
            <div className="mt-8">
              <Button 
                type="submit" 
                className="w-full"
                disabled={
                  createSalonMutation.isPending || 
                  updateSalonMutation.isPending
                }
              >
                {createSalonMutation.isPending || updateSalonMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {selectedSalonId ? 'تحديث معلومات الصالون' : 'إضافة صالون جديد'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}

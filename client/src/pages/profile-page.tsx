import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const profileSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل مطلوب"),
  phone: z.string().min(10, "رقم الجوال يجب أن يكون 10 أرقام على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  prefersFemaleStaff: z.boolean().optional(),
  isPrivacyFocused: z.boolean().optional(),
  preferredLanguage: z.enum(["ar", "en"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("personal");
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      email: user?.email || "",
      prefersFemaleStaff: user?.prefersFemaleStaff || false,
      isPrivacyFocused: user?.isPrivacyFocused || false,
      preferredLanguage: user?.preferredLanguage as "ar" | "en" || "ar",
    }
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "تم تحديث الملف الشخصي بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في تحديث الملف الشخصي",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
    
    // Update language if changed
    if (data.preferredLanguage !== user?.preferredLanguage) {
      i18n.changeLanguage(data.preferredLanguage);
    }
  };
  
  const handleLogout = () => {
    if (window.confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      logoutMutation.mutate();
    }
  };
  
  if (!user) {
    return (
      <MainLayout title="الملف الشخصي">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="حسابي">
      <div className="p-4">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <span className="material-icons text-primary text-4xl">person</span>
          </div>
          <h2 className="font-bold text-xl mb-1">{user.fullName}</h2>
          <p className="text-neutral-500">{user.phone}</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
            <TabsTrigger value="preferences">التفضيلات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخلي الاسم الكامل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الجوال</FormLabel>
                      <FormControl>
                        <Input placeholder="05xxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                      <FormControl>
                        <Input placeholder="example@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-4">
                {user.userType === "customer" && (
                  <>
                    <FormField
                      control={profileForm.control}
                      name="prefersFemaleStaff"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">أفضل التعامل مع موظفات فقط</FormLabel>
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
                      control={profileForm.control}
                      name="isPrivacyFocused"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">أولوية الخصوصية</FormLabel>
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
                  </>
                )}
                
                <FormField
                  control={profileForm.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>اللغة</FormLabel>
                      <div className="flex">
                        <button
                          type="button"
                          className={`flex-1 py-2 px-4 text-center border rounded-r-lg ${
                            field.value === "ar" ? "bg-primary text-white" : "bg-white text-neutral-800"
                          }`}
                          onClick={() => field.onChange("ar")}
                        >
                          العربية
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-2 px-4 text-center border rounded-l-lg ${
                            field.value === "en" ? "bg-primary text-white" : "bg-white text-neutral-800"
                          }`}
                          onClick={() => field.onChange("en")}
                        >
                          English
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ التفضيلات"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-8">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

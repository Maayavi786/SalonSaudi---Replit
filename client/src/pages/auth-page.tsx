import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const loginSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const registerSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(6, "تأكيد كلمة المرور مطلوب"),
  fullName: z.string().min(2, "الاسم الكامل مطلوب"),
  phone: z.string().min(10, "رقم الجوال يجب أن يكون 10 أرقام على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  userType: z.enum(["customer", "salon_owner"]),
  isPrivacyFocused: z.boolean().optional(),
  prefersFemaleStaff: z.boolean().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمة المرور وتأكيدها غير متطابقتين",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    }
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
      email: "",
      userType: "customer",
      isPrivacyFocused: false,
      prefersFemaleStaff: false,
    }
  });
  
  // If user is already logged in, redirect based on user type
  useEffect(() => {
    if (user) {
      console.log("User is already authenticated, redirecting to appropriate dashboard");
      if (user.userType === "salon_owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Direct fetch to verify auth status
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Direct auth check: User is authenticated:", userData);
          // Only redirect if we're not already redirecting from the other effect
          if (!user) {
            if (userData.userType === "salon_owner") {
              navigate("/owner/dashboard");
            } else {
              navigate("/");
            }
          }
        } else {
          console.log("Direct auth check: User is not authenticated");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("Login form submitted:", data);
    
    loginMutation.mutate(data, {
      onSuccess: (responseData) => {
        console.log("Login successful:", responseData);
        window.location.href = responseData.userType === "salon_owner" ? "/owner/dashboard" : "/";
      },
      onError: (error) => {
        console.error("Login error:", error);
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };
  
  const onRegisterSubmit = (data: RegisterFormValues) => {
    console.log("Register form submitted:", data);
    
    // First try a test API call to verify the connection
    fetch("/api/test")
      .then(res => res.json())
      .then(testData => {
        console.log("API test successful:", testData);
        
        // Try direct fetch first (bypassing the mutation to debug)
        console.log("Trying direct fetch to /api/register");
        fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include"
        })
        .then(res => {
          console.log("Direct register fetch response status:", res.status);
          return res.json();
        })
        .then(responseData => {
          console.log("Direct register fetch response data:", responseData);
          if (responseData && !responseData.message) {
            console.log("Registration successful via direct fetch");
            // Refresh page to apply login
            window.location.href = "/";
          } else {
            // Fall back to the mutation approach
            console.log("Direct fetch didn't return user data, trying mutation");
            try {
              registerMutation.mutate(data);
              console.log("Registration mutation called successfully");
            } catch (error) {
              console.error("Registration mutation error:", error);
            }
          }
        })
        .catch(error => {
          console.error("Direct register fetch error:", error);
          // Fall back to the mutation
          console.log("Falling back to mutation after direct fetch error");
          try {
            registerMutation.mutate(data);
            console.log("Registration mutation called successfully");
          } catch (mutError) {
            console.error("Registration mutation error after fetch failure:", mutError);
          }
        });
      })
      .catch(error => {
        console.error("API test failed:", error);
        // Try direct submission anyway
        try {
          console.log("Trying direct registration despite test failure");
          registerMutation.mutate(data);
        } catch (mutationError) {
          console.error("Registration direct mutation error:", mutationError);
        }
      });
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/80 to-primary flex-1 text-white p-6 flex flex-col justify-center items-center md:w-1/2">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-almarai font-bold mb-2">جمالكِ</h1>
          <p className="text-white/90 text-lg">منصة الصالونات النسائية في المملكة</p>
        </div>
        
        <div className="w-full max-w-md bg-white/20 p-4 rounded-xl backdrop-blur-sm">
          <img 
            src="https://images.unsplash.com/photo-1470259078422-826894b933aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
            className="w-full h-48 rounded-lg object-cover mb-4" 
            alt="صالون تجميل للسيدات" 
          />
          <h2 className="text-xl font-bold mb-2 font-almarai">احجزي خدمات التجميل بكل خصوصية</h2>
          <p className="opacity-90">تصفحي واحجزي خدمات صالونات التجميل النسائية في منطقتك بسهولة وأمان تام.</p>
        </div>
      </div>
      
      {/* Form Section */}
      <div className="p-6 flex items-center justify-center flex-1 md:w-1/2">
        <div className="w-full max-w-md">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخلي اسم المستخدم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="أدخلي كلمة المرور" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-dark"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
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
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخلي اسم المستخدم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
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
                    control={registerForm.control}
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
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="أدخلي كلمة المرور" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="أعيدي إدخال كلمة المرور" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الحساب</FormLabel>
                        <div className="flex gap-4">
                          <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                            <input
                              type="radio"
                              className="form-radio text-primary"
                              value="customer"
                              checked={field.value === "customer"}
                              onChange={() => field.onChange("customer")}
                            />
                            <span>عميلة</span>
                          </label>
                          <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                            <input
                              type="radio"
                              className="form-radio text-primary"
                              value="salon_owner"
                              checked={field.value === "salon_owner"}
                              onChange={() => field.onChange("salon_owner")}
                            />
                            <span>مالكة صالون</span>
                          </label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {registerForm.watch("userType") === "customer" && (
                    <>
                      <FormField
                        control={registerForm.control}
                        name="prefersFemaleStaff"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>أفضل التعامل مع موظفات فقط</FormLabel>
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
                        control={registerForm.control}
                        name="isPrivacyFocused"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>أولوية الخصوصية</FormLabel>
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
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-dark"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

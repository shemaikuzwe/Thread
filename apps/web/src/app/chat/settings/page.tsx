"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Edit } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { PushNotificationManager } from "@/components/push-notification";
import { useState, useEffect } from "react";

export default function UserProfile() {
  const session = useSession();
  const user = session?.data?.user;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get("tab") || "profile";
  const [tab, setTab] = useState(currentTab);

  useEffect(() => {
    setTab(currentTab);
  }, [currentTab]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
    setTab(value);
  };

  return (
    <div className="w-full h-full bg-background space-y-4">
      <div className="flex max-sm:flex-col w-full">
        <div className="w-80 p-4 mt-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={user?.image ?? "/default.png"}
                  alt="Profile"
                />
                <AvatarFallback className="text-2xl">
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 w-full">
          <Tabs value={tab} className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Personal Info</TabsTrigger>
              <TabsTrigger value="settings">Account Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          defaultValue={user?.name ?? ""}
                          className="pl-10"
                          placeholder="Enter full name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          defaultValue={user?.email ?? ""}
                          className="pl-10"
                          placeholder="Enter email address"
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button className="px-8">Save</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="settings"
              className="mt-6 space-y-4 flex flex-col gap-4 w-full"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 w-full">
                  <div className="space-y-3 flex gap-2 justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications for important updates and
                        messages
                      </p>
                    </div>
                    <PushNotificationManager />
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-xl text-destructive">
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 w-full">
                  <div className="space-y-2">
                    <h3 className="font-medium">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>
                  </div>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

import type { Story } from "@ladle/react";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";
import { Textarea } from "../../src/components/ui/textarea";
import { Checkbox } from "../../src/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../src/components/ui/card";

export default {
  title: "Patterns/Form",
};

export const LoginForm: Story = () => (
  <Card className="w-[400px]">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>Enter your credentials to access your account.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" placeholder="you@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" placeholder="••••••••" />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="remember" />
        <Label htmlFor="remember" className="font-normal">Remember me</Label>
      </div>
    </CardContent>
    <CardFooter className="flex flex-col gap-4">
      <Button className="w-full">Sign In</Button>
      <Button variant="link" className="text-sm">Forgot password?</Button>
    </CardFooter>
  </Card>
);

export const ContactForm: Story = () => (
  <Card className="w-[500px]">
    <CardHeader>
      <CardTitle>Contact Us</CardTitle>
      <CardDescription>Send us a message and we'll get back to you.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first-name">First Name</Label>
          <Input id="first-name" placeholder="John" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name">Last Name</Label>
          <Input id="last-name" placeholder="Doe" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" type="email" placeholder="john@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" placeholder="How can we help you?" rows={4} />
      </div>
    </CardContent>
    <CardFooter>
      <Button className="ml-auto">Send Message</Button>
    </CardFooter>
  </Card>
);

export const SettingsForm: Story = () => (
  <Card className="w-[500px]">
    <CardHeader>
      <CardTitle>Notification Settings</CardTitle>
      <CardDescription>Choose what notifications you want to receive.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="email-notifications">Email Notifications</Label>
          <p className="text-sm text-muted-foreground">Receive updates via email</p>
        </div>
        <Checkbox id="email-notifications" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="push-notifications">Push Notifications</Label>
          <p className="text-sm text-muted-foreground">Receive push notifications</p>
        </div>
        <Checkbox id="push-notifications" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="marketing">Marketing Emails</Label>
          <p className="text-sm text-muted-foreground">Receive marketing content</p>
        </div>
        <Checkbox id="marketing" />
      </div>
    </CardContent>
    <CardFooter>
      <Button>Save Preferences</Button>
    </CardFooter>
  </Card>
);

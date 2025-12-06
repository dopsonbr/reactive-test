import type { Story } from "@ladle/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";

export default {
  title: "Components/Card",
};

export const Default: Story = () => (
  <Card className="w-[350px]">
    <CardHeader>
      <CardTitle>Card Title</CardTitle>
      <CardDescription>Card description goes here.</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Card content can contain any elements.</p>
    </CardContent>
    <CardFooter>
      <Button>Action</Button>
    </CardFooter>
  </Card>
);

export const WithForm: Story = () => (
  <Card className="w-[350px]">
    <CardHeader>
      <CardTitle>Create Account</CardTitle>
      <CardDescription>Enter your details below to create your account.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="John Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="john@example.com" />
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="outline">Cancel</Button>
      <Button>Submit</Button>
    </CardFooter>
  </Card>
);

export const Simple: Story = () => (
  <Card className="w-[350px] p-6">
    <p className="text-muted-foreground">A simple card without header/footer structure.</p>
  </Card>
);

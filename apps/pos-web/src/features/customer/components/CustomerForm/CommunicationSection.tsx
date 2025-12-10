import { Mail, MessageSquare, FileText } from 'lucide-react';
import type { CommunicationPreferences } from '../../types/customer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
} from '@reactive-platform/shared-ui-components';

interface CommunicationSectionProps {
  value: CommunicationPreferences;
  onChange: (value: CommunicationPreferences) => void;
}

export function CommunicationSection({ value, onChange }: CommunicationSectionProps) {
  const handleChange = (key: keyof CommunicationPreferences, checked: boolean) => {
    onChange({
      ...value,
      [key]: checked,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="emailPromotions"
            checked={value.emailPromotions}
            onCheckedChange={(checked) => handleChange('emailPromotions', !!checked)}
          />
          <div className="space-y-1">
            <Label htmlFor="emailPromotions" className="flex items-center gap-2 cursor-pointer">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Promotions
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive promotional emails about sales and new products
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="smsAlerts"
            checked={value.smsAlerts}
            onCheckedChange={(checked) => handleChange('smsAlerts', !!checked)}
          />
          <div className="space-y-1">
            <Label htmlFor="smsAlerts" className="flex items-center gap-2 cursor-pointer">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              SMS Alerts
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive text messages for order updates and alerts
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="directMail"
            checked={value.directMail}
            onCheckedChange={(checked) => handleChange('directMail', !!checked)}
          />
          <div className="space-y-1">
            <Label htmlFor="directMail" className="flex items-center gap-2 cursor-pointer">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Direct Mail
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive printed catalogs and promotional materials
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

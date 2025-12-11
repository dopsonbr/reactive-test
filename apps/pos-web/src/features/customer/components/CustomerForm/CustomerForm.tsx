import { useState } from 'react';
import { User, Building2, Loader2 } from 'lucide-react';
import type {
  Customer,
  CustomerInput,
  CustomerType,
  AddressInput,
  CommunicationPreferences,
  B2BInfoInput,
} from '../../types/customer';
import { PersonalInfoSection } from './PersonalInfoSection';
import { AddressSection } from './AddressSection';
import { CommunicationSection } from './CommunicationSection';
import { B2BInfoSection } from './B2BInfoSection';
import {
  Button,
  Card,
  CardContent,
  RadioGroup,
  RadioGroupItem,
  Label,
  cn,
} from '@reactive-platform/shared-ui-components';

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: CustomerInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const defaultCommunicationPreferences: CommunicationPreferences = {
  emailPromotions: true,
  smsAlerts: false,
  directMail: false,
};

const defaultB2BInfo: B2BInfoInput = {
  companyInfo: {
    companyName: '',
    taxId: '',
    industry: '',
    website: '',
  },
  accountTier: 'STANDARD',
  creditLimit: 10000,
  paymentTerms: 'NET_30',
};

export function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: CustomerFormProps) {
  const [customerType, setCustomerType] = useState<CustomerType>(
    initialData?.type || 'CONSUMER'
  );
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [addresses, setAddresses] = useState<AddressInput[]>(
    initialData?.addresses || []
  );
  const [communicationPreferences, setCommunicationPreferences] =
    useState<CommunicationPreferences>(
      initialData?.communicationPreferences || defaultCommunicationPreferences
    );
  const [b2bInfo, setB2BInfo] = useState<B2BInfoInput>(() => {
    if (initialData?.b2bInfo) {
      return {
        companyInfo: {
          companyName: initialData.b2bInfo.companyName,
          taxId: initialData.b2bInfo.taxId,
          industry: initialData.b2bInfo.industry || '',
          website: initialData.b2bInfo.website || '',
        },
        accountTier: initialData.b2bInfo.accountTier,
        creditLimit: initialData.b2bInfo.creditLimit,
        paymentTerms: initialData.b2bInfo.paymentTerms,
        parentCustomerId: initialData.b2bInfo.parentCustomerId,
        salesRepId: initialData.b2bInfo.salesRepId,
      };
    }
    return defaultB2BInfo;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (customerType === 'BUSINESS') {
      if (!b2bInfo.companyInfo.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!b2bInfo.companyInfo.taxId.trim()) {
        newErrors.taxId = 'Tax ID is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data: CustomerInput = {
      type: customerType,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      addresses,
      communicationPreferences,
      b2bInfo: customerType === 'BUSINESS' ? b2bInfo : undefined,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Type Selection */}
      <Card>
        <CardContent className="p-6">
          <Label className="text-base font-medium mb-4 block">Customer Type</Label>
          <RadioGroup
            value={customerType}
            onValueChange={(v) => setCustomerType(v as CustomerType)}
            className="flex gap-4"
          >
            <Label
              htmlFor="consumer"
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors flex-1',
                customerType === 'CONSUMER'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent/50'
              )}
            >
              <RadioGroupItem value="CONSUMER" id="consumer" />
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Consumer (D2C)</div>
                <div className="text-sm text-muted-foreground">
                  Individual customer account
                </div>
              </div>
            </Label>
            <Label
              htmlFor="business"
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors flex-1',
                customerType === 'BUSINESS'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent/50'
              )}
            >
              <RadioGroupItem value="BUSINESS" id="business" />
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Business (B2B)</div>
                <div className="text-sm text-muted-foreground">
                  Business/corporate account
                </div>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <PersonalInfoSection
        firstName={firstName}
        lastName={lastName}
        email={email}
        phone={phone}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onEmailChange={setEmail}
        onPhoneChange={setPhone}
        errors={errors}
      />

      {/* B2B Info (conditional) */}
      {customerType === 'BUSINESS' && (
        <B2BInfoSection
          value={b2bInfo}
          onChange={setB2BInfo}
          errors={errors}
        />
      )}

      {/* Addresses */}
      <AddressSection
        addresses={addresses}
        onChange={setAddresses}
      />

      {/* Communication Preferences */}
      <CommunicationSection
        value={communicationPreferences}
        onChange={setCommunicationPreferences}
      />

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Customer'
          )}
        </Button>
      </div>
    </form>
  );
}

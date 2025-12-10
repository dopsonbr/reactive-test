import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCustomer } from '../hooks/useCustomer';
import { CustomerForm } from '../components/CustomerForm';
import type { CustomerInput } from '../types/customer';
import {
  Button,
  Alert,
  AlertDescription,
} from '@reactive-platform/shared-ui-components';

interface CustomerFormPageProps {
  mode?: 'create' | 'edit';
}

export function CustomerFormPage({ mode: propMode }: CustomerFormPageProps) {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Determine mode from props or presence of customerId
  const mode = propMode || (customerId ? 'edit' : 'create');
  const isEdit = mode === 'edit';

  const {
    data: customer,
    isLoading: customerLoading,
    error: customerError,
  } = useCustomer(isEdit ? customerId || '' : '');

  const handleSubmit = async (data: CustomerInput) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(isEdit ? 'Updating customer:' : 'Creating customer:', data);

      // Navigate to customer detail or search after success
      if (isEdit && customerId) {
        navigate(`/customers/${customerId}`);
      } else {
        navigate('/customers');
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEdit && customerId) {
      navigate(`/customers/${customerId}`);
    } else {
      navigate('/customers');
    }
  };

  if (isEdit && customerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isEdit && customerError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {customerError.message || 'Failed to load customer'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Edit Customer' : 'New Customer'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit
              ? `Editing ${customer?.firstName} ${customer?.lastName}`
              : 'Create a new customer account'}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <CustomerForm
        initialData={isEdit ? customer : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

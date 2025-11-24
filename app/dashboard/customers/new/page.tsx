import { NewCustomerForm } from '@/components/customers/new-customer-form';

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Customer</h1>
        <p className="text-muted-foreground">Create a new customer record</p>
      </div>

      <NewCustomerForm />
    </div>
  );
}

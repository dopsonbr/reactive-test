import { CheckCircle, Printer, Mail, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransaction } from '../context/TransactionContext';
import {
  Card,
  CardContent,
  Button,
} from '@reactive-platform/shared-ui-components';

export function CompletePage() {
  const navigate = useNavigate();
  const { transaction, startTransaction } = useTransaction();

  const handlePrintReceipt = () => {
    // Would trigger actual printing
    console.log('Printing receipt...');
  };

  const handleEmailReceipt = () => {
    // Would trigger email dialog
    console.log('Emailing receipt...');
  };

  const handleNewTransaction = async () => {
    await startTransaction();
  };

  if (!transaction || transaction.status !== 'COMPLETE') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No completed transaction</p>
          <Button onClick={() => navigate('/transaction')}>
            Start New Transaction
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Success Message */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Transaction Complete!</h1>
        <p className="text-muted-foreground">
          Transaction #{transaction.id.split('-')[1]}
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between text-lg">
            <span>Total</span>
            <span className="font-bold">${transaction.grandTotal.toFixed(2)}</span>
          </div>

          {transaction.customer && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Customer</span>
              <span>
                {transaction.customer.firstName} {transaction.customer.lastName}
              </span>
            </div>
          )}

          {transaction.pointsEarned > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Points Earned</span>
              <span className="text-amber-600 font-medium">
                +{transaction.pointsEarned} pts
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Items</span>
            <span>
              {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Payment</span>
            <span>
              {transaction.payments.map((p) => p.method).join(', ')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={handlePrintReceipt} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
        <Button variant="outline" onClick={handleEmailReceipt} className="gap-2">
          <Mail className="h-4 w-4" />
          Email Receipt
        </Button>
      </div>

      {/* New Transaction */}
      <Button className="w-full gap-2" size="lg" onClick={handleNewTransaction}>
        <Plus className="h-4 w-4" />
        New Transaction
      </Button>
    </div>
  );
}

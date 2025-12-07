# Troubleshooting

Solutions to common issues in the POS system.

---

## Quick Help

For immediate assistance:
- Press **F1** for context-sensitive help
- Use **Cmd+K** to search for help topics
- Contact your supervisor for process questions
- Contact IT Help Desk for technical issues

---

## Scanner Issues

### Barcode Won't Scan

**Symptoms:** Scanner doesn't beep, item not added.

**Solutions:**

1. **Check scanner power**
   - Look for indicator light on scanner
   - Try unplugging and reconnecting USB

2. **Check barcode condition**
   - Smooth out wrinkled barcodes
   - Clean dirty barcodes
   - Try different barcode on same item (some have multiple)

3. **Adjust scanning**
   - Hold 4-8 inches from scanner
   - Try different angles
   - Ensure barcode faces scanner directly

4. **Use manual entry**
   - Press **F7** for SKU entry
   - Type numbers below barcode

5. **Scanner malfunction**
   - Try barcode on another item to test
   - If scanner doesn't work at all, contact IT

### Wrong Item Scans

**Symptoms:** Different product appears than expected.

**Solutions:**
1. Remove incorrect item
2. Check for multiple barcodes on product
3. Verify correct product - packaging may have changed
4. Use manual SKU entry if issue persists

---

## Payment Issues

### Card Declined

| Decline Code | Meaning | Action |
|--------------|---------|--------|
| Insufficient Funds | Not enough balance | Try different card |
| Invalid Card | Card number error | Re-enter or try another |
| Expired Card | Past expiration | Use valid card |
| Do Not Honor | Bank declined | Customer contacts bank |
| Lost/Stolen | Flagged card | Cannot process |

**What to Say:**
"I'm sorry, the payment wasn't approved. Would you like to try a different card or payment method?"

### Card Reader Not Responding

1. Check cable connection
2. Wait 10 seconds, try again
3. Try different entry method (tap vs insert vs swipe)
4. Restart card reader (supervisor)
5. Process manually (with authorization)

### Payment Processing Timeout

**DO NOT re-process immediately!** This may cause double charge.

1. Wait 30 seconds
2. Check if payment completed in system
3. If unclear, check with payment terminal
4. Contact supervisor before retrying

### Partial Payment Fails

If second payment method fails after first succeeded:

1. Note amount of first successful payment
2. Remaining balance still due
3. Try different method for remainder
4. Can void entire transaction if needed (manager)

---

## Transaction Issues

### Transaction Frozen

**Symptoms:** Screen unresponsive, spinning indicator.

**Solutions:**

1. **Wait 30 seconds** - System may be processing
2. **Check network** - Look for network indicator
3. **Try clicking elsewhere** - Modal may be open
4. **Refresh browser** (if persistent)
   - Press F5 or Cmd+R
   - Transaction should be recoverable
5. **Contact IT** if issue persists

### Lost Transaction

If browser crashed or closed:

1. Log back in
2. Check **Suspended Transactions** (F5)
3. Recent transaction may be there
4. If not, check Order history for completed
5. Start new transaction if truly lost

### Wrong Customer Linked

1. Click **"Change"** next to customer name
2. Search for correct customer
3. Select correct customer
4. Previous discounts may be removed

### Duplicate Items Added

1. Select the duplicate item
2. Adjust quantity to correct amount
3. Or delete and re-add with correct quantity

---

## Customer Lookup Issues

### Customer Not Found

**Possible causes:**
- Typo in search
- Customer not in system
- Different contact information on file

**Solutions:**
1. Try different search method (phone vs email)
2. Try partial search
3. Check for common typos
4. Create new customer if confirmed not in system

### Wrong Customer Profile

If you accidentally linked wrong customer:

1. Click **"Change"** next to customer
2. Clear and search for correct customer
3. Or click **"Remove"** to continue as guest

### Duplicate Customers Found

1. Compare profiles carefully
2. Select the most complete/recent profile
3. Report duplicates to manager for merge

---

## Printer Issues

### Receipt Won't Print

1. **Check printer status**
   - Paper loaded?
   - Power on?
   - Connected?

2. **Check paper**
   - Roll installed correctly?
   - Not jammed?
   - Thermal paper correct side up?

3. **Try reprint**
   - Press Ctrl+P
   - Or select "Print Receipt" again

4. **Offer email receipt**
   - "While we fix the printer, can I email your receipt?"

5. **Contact IT** if issue persists

### Partial Print / Garbled Text

1. Paper may be low - check roll
2. Print head may be dirty - clean with alcohol wipe
3. Wrong paper type - must be thermal paper
4. Printer malfunction - try restart

---

## System Errors

### "Session Expired"

1. Log in again
2. Transaction may be saved in Suspended
3. Resume from where you left off

### "Network Error"

1. Check network indicator in header
2. Wait 30 seconds and retry
3. Save/suspend transaction if possible
4. Contact IT if persistent

### "Server Error" / Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 500 | Server error | Wait and retry |
| 503 | Service unavailable | System may be updating |
| 408 | Timeout | Check network, retry |
| 403 | Permission denied | Contact supervisor |
| 404 | Not found | Item/customer may not exist |

**For any error:**
1. Note the error code/message
2. Screenshot if possible
3. Report to supervisor/IT

---

## Login Issues

### Can't Log In

1. **Check credentials**
   - Caps Lock off?
   - Correct employee ID?
   - Password correct?

2. **Password reset**
   - Contact supervisor
   - They can reset your password

3. **Account locked**
   - Too many failed attempts
   - Contact supervisor to unlock

### Logged Out Unexpectedly

1. Session timed out after inactivity
2. Another device logged in with your ID
3. System maintenance occurred
4. Log back in - work may be recoverable

---

## Markdown/Discount Issues

### Markdown Rejected

**"Exceeds authorization level"**
- Request manager override
- Or reduce to within your limit

**"Invalid reason"**
- Select appropriate markdown type
- Document correctly

### Promo Code Not Working

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid code" | Typo or wrong code | Re-enter carefully |
| "Expired" | Past valid date | Cannot use |
| "Already used" | One-time code | Cannot reuse |
| "Minimum not met" | Cart too small | Add more items |
| "Items not eligible" | Exclusions apply | Check eligible items |

---

## Order Management Issues

### Can't Modify Order

**"Order cannot be modified"**
- Order already shipped
- Order already completed
- Return required for changes

### Can't Process Return

**"Return period expired"**
- Check return policy
- Manager may authorize exception

**"Item not returnable"**
- Some items final sale
- Check policy exceptions

---

## Performance Issues

### System Running Slowly

1. Close unnecessary browser tabs
2. Clear browser cache
3. Check network connection
4. Try different browser
5. Report to IT if persistent

### Screen Not Loading

1. Refresh the page (F5)
2. Clear browser cache
3. Try different browser
4. Check network connection

---

## Escalation Path

### When to Contact Supervisor

- Customer complaints
- Markdown above your limit
- Policy questions
- Suspicious transactions

### When to Contact Manager

- Void requests
- Large discounts
- Customer escalations
- Policy exceptions

### When to Contact IT

- Hardware malfunction
- System errors
- Login issues
- Network problems

---

## Error Reporting

When reporting issues to IT:

**Include:**
1. What you were doing
2. Error message (exact text)
3. Error code (if any)
4. Transaction number
5. Time it occurred
6. Screenshot if possible

**Example:**
"At 2:45 PM, processing payment for transaction #12346, received 'Server Error 500' when clicking Process Payment. Customer's card had not been charged."

---

## Quick Fixes Checklist

Before escalating, try:

- [ ] Wait 30 seconds and retry
- [ ] Refresh the browser (F5)
- [ ] Check cable connections
- [ ] Try a different method (scan vs manual)
- [ ] Log out and back in
- [ ] Clear browser cache
- [ ] Try different browser

---

## Emergency Procedures

### System Completely Down

1. Do NOT process transactions on paper
2. Inform customers of delay
3. Contact IT immediately
4. Follow manager instructions

### Security Incident

If you suspect fraud or security issue:
1. Do not complete the transaction
2. Politely tell customer there's a system issue
3. Contact supervisor immediately
4. Document what happened

---

## Additional Resources

- **IT Help Desk:** ext. 4357 (HELP)
- **Manager on Duty:** Check schedule
- **System Status:** [internal status page]
- **Training Materials:** [training portal]

---

[← Keyboard Shortcuts](keyboard-shortcuts.md) | [Back to Index](index.md)

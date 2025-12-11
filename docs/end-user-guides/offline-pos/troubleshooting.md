# Troubleshooting

Solutions to common issues when using the Offline POS.

---

## Quick Help

For immediate assistance:
- **Technical issues**: IT Help Desk ext. 4357
- **Process questions**: Store Manager
- **Payment issues**: Follow cash handling procedures

---

## Login Issues

### Can't Log In

**Symptoms:** PIN rejected, error message displayed.

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid PIN" | Incorrect PIN | Re-enter your PIN carefully |
| "Operator not found" | PIN not in local database | Contact manager - PIN may need sync |
| "Too many attempts" | Multiple failed logins | Wait 5 minutes, try again |

### Forgot PIN

1. Contact your store manager
2. Manager can look up or reset your PIN
3. Use another operator's login temporarily (with permission)

---

## Scanner Issues

### Scanner Not Working

**Symptoms:** Scanner doesn't beep, no response when scanning.

**Solutions:**

1. **Check power**
   - Look for indicator light on scanner
   - Try unplugging and reconnecting USB

2. **Check connection**
   - Ensure USB is firmly connected
   - Try a different USB port

3. **Restart scanner**
   - Unplug scanner for 10 seconds
   - Plug back in

4. **Use manual search**
   - Type product name or UPC in search box
   - Add items manually while troubleshooting scanner

### Barcode Won't Scan

**Symptoms:** Scanner beeps but product not found.

**Solutions:**

1. **Barcode damage**
   - Smooth out wrinkled barcodes
   - Clean dirty barcodes
   - Try scanning different barcode on same item

2. **Scanning technique**
   - Hold 4-8 inches from scanner
   - Keep barcode flat and visible
   - Try different angles

3. **Use manual search**
   - Enter product name in search box
   - Enter UPC numbers if visible

### Wrong Product Scans

**Symptoms:** Different product appears than expected.

1. Remove incorrect item from cart
2. Check product - packaging may have changed
3. Search manually for correct product
4. Report discrepancy to manager

---

## Product Not Found

### Symptoms

After scanning or searching: "Product not found" or "Not found: [UPC]"

### Causes

1. **Product not in offline catalog**
   - Offline database may not include all products
   - New products may not have synced yet

2. **Wrong barcode**
   - Item has multiple barcodes
   - Barcode for different variant

3. **Misread barcode**
   - Scanner interpreted barcode incorrectly

### Solutions

| Situation | Action |
|-----------|--------|
| Product exists in store | Try alternative barcode, search by name |
| New product | Note SKU, contact manager for guidance |
| Still not found | Cannot sell item through Offline POS |

**Important:** Do NOT manually enter prices. Only sell products that exist in the offline catalog.

---

## Cart Issues

### Can't Adjust Quantity

**Symptoms:** Quantity buttons don't respond.

1. Wait a moment - system may be processing
2. Refresh the page (if in browser)
3. Remove item and re-add with correct quantity

### Item Won't Remove

**Symptoms:** Remove button doesn't work.

1. Wait 5 seconds and try again
2. Refresh the page
3. If persistent, note item and total, continue sale, adjust manually

### Wrong Total

**Symptoms:** Total doesn't match expected.

1. Review each item and quantity
2. Check for duplicate items
3. Verify correct products were added
4. Tax is calculated automatically - verify rate is correct

---

## Payment Issues

### Card Terminal Not Responding

**Symptoms:** "Insert card" message doesn't appear, terminal is blank.

1. **Check terminal power**
   - Power light should be on
   - Try pressing a button to wake

2. **Check connection**
   - Ensure cable to POS device is connected
   - Try unplugging and reconnecting

3. **Restart terminal**
   - Power off/on the terminal
   - Wait 30 seconds

4. **Alternative payment**
   - Use cash payment if terminal won't work
   - Contact IT Help Desk

### Card Declined

| Decline Message | Meaning | Action |
|----------------|---------|--------|
| "Insufficient funds" | Card balance too low | Try different card |
| "Invalid card" | Card unreadable | Try again or different card |
| "Expired" | Card past expiration | Use different card |
| "Do not honor" | Bank declined | Customer contacts bank |

**What to say:** "I'm sorry, the payment wasn't approved. Would you like to try a different card or pay with cash?"

### Payment Processing Timeout

**Symptoms:** "Processing..." message doesn't complete.

1. **Wait 60 seconds** - don't click again
2. Check if payment completed (look for approval message)
3. If unclear, check card terminal display
4. Contact supervisor before retrying

**Warning:** Retrying too quickly may cause double charge.

### Cash Payment Issues

| Issue | Solution |
|-------|----------|
| Gave wrong change | Note amount, adjust at end of shift |
| Customer disputes | Call manager, check receipt |
| Till short | Document discrepancy, report to manager |

---

## Printer Issues

### Receipt Won't Print

1. **Check printer**
   - Power on?
   - Paper loaded?
   - Connected?

2. **Check paper**
   - Roll installed correctly?
   - Not jammed?
   - Right side up (thermal paper)?

3. **Alternative**
   - Note transaction ID for customer
   - Offer to write key details manually

### Partial or Garbled Print

1. Paper may be low - replace roll
2. Print head dirty - clean with alcohol wipe
3. Wrong paper type - use thermal paper only
4. Printer malfunction - contact IT

---

## Connectivity Issues

### Stuck in "Offline" Status

**Symptoms:** Status shows offline even though network should be up.

This is expected behavior. The Offline POS operates independently and syncs periodically.

**If transactions aren't syncing:**
1. Check network cable/WiFi connection
2. Verify other devices can connect
3. Contact IT - may be server-side issue

### "Syncing" Never Completes

1. Large number of pending transactions may take time
2. Network may be slow or unstable
3. Contact IT if syncing takes more than 30 minutes

### Transactions Not Uploading

**Symptoms:** Pending count doesn't decrease after going online.

1. Server may be temporarily unavailable
2. Network issue between POS and server
3. Contact IT Help Desk

**Important:** Don't close application until all transactions sync.

---

## Application Issues

### Application Won't Start

1. Double-click the Offline POS icon
2. Wait 30 seconds
3. If still not starting, contact IT

### Application Freezes

1. Wait 30 seconds - may be processing
2. Click elsewhere to check if dialog is open
3. Close and reopen application
4. Current transaction may be lost - check when reopened

### Data Loss

If a transaction is lost:
1. Note what was in the cart
2. Re-enter items for customer
3. Document incident for manager
4. Contact IT if recurring

---

## Emergency Procedures

### System Completely Down

1. **Stop all transactions**
2. Inform customers of delay
3. Contact IT immediately
4. Follow manager instructions

**Do NOT:**
- Process transactions on paper (reconciliation issues)
- Make promises about when system returns

### Power Outage

1. **Battery backup** may keep system running briefly
2. Complete current transaction if possible
3. Wait for power to return
4. Transactions are saved automatically

### Security Incident

If you suspect fraud:
1. Do not complete the transaction
2. Tell customer "system issue, one moment"
3. Contact manager immediately
4. Document what happened

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| E001 | Database error | Restart application |
| E002 | Network timeout | Check connectivity |
| E003 | Session expired | Log in again |
| E004 | Product lookup failed | Use manual search |
| E005 | Payment timeout | Wait, check terminal |
| E500 | Server error | Contact IT |

---

## Escalation Path

### Contact Your Supervisor When:
- Customer is upset
- Process question
- Need authorization

### Contact Store Manager When:
- Large discrepancy
- Security concern
- Override needed

### Contact IT Help Desk When:
- Hardware malfunction
- Application errors
- Connectivity issues
- Data problems

**IT Help Desk:** ext. 4357 (HELP)

---

## Reporting Issues

When reporting to IT, include:

1. **What happened** - describe the issue
2. **When** - date and time
3. **Transaction ID** - if applicable
4. **Error message** - exact text
5. **Steps tried** - what you already attempted

**Example:**
"At 2:30 PM today, I tried to scan barcode 0012345678905 but got 'Product not found'. The product is on the shelf with that UPC. I tried scanning multiple times and manual search."

---

## Quick Fixes Checklist

Before escalating, try:

- [ ] Wait 30 seconds and retry
- [ ] Check all cable connections
- [ ] Try alternative method (scan vs. search)
- [ ] Restart the application
- [ ] Restart the device (last resort)

---

## Additional Resources

- **IT Help Desk:** ext. 4357
- **Store Manager:** [See posted schedule]
- **Quick Reference Card:** [Posted at register]

---

[← Payment](payment.md) | [Back to Index](index.md)

# Loyalty Account

Learn how to link your loyalty account to earn rewards and receive exclusive discounts.

---

## Benefits of Linking Your Account

When you link your loyalty account at self-checkout, you receive:

- **Automatic discounts** on eligible items
- **Loyalty points** on your purchase
- **Member-only pricing** where applicable
- **Digital receipt** sent to your email
- **Purchase history** saved to your account

![Loyalty Benefits](images/loyalty-benefits-wireframe.png)
*Linking your account unlocks member benefits*

---

## When to Link Your Account

After you've finished scanning all your items and tap "Proceed to Checkout," you'll see the loyalty lookup screen.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              Link Your Loyalty Account                      │
│                                                             │
│     Earn points and get exclusive member discounts!         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │        Enter Phone Number or Email                  │   │
│  │                                                     │   │
│  │   ┌───────────────────────────────────────────┐    │   │
│  │   │  Phone Number or Email                    │    │   │
│  │   └───────────────────────────────────────────┘    │   │
│  │                                                     │   │
│  │              [Use Phone]  [Use Email]              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│           [Skip - Continue without linking]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

![Loyalty Lookup Screen](images/loyalty-lookup-wireframe.png)
*The loyalty lookup screen appears before payment*

---

## Looking Up by Phone Number

### Step 1: Select Phone Lookup

Tap **"Use Phone"** to enter your phone number.

### Step 2: Enter Your Phone Number

A numeric keypad appears for easy entry:

```
┌─────────────────────────────────────┐
│                                     │
│     Enter Your Phone Number         │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  (555) 123-4567             │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────┬─────┬─────┐              │
│   │  1  │  2  │  3  │              │
│   ├─────┼─────┼─────┤              │
│   │  4  │  5  │  6  │              │
│   ├─────┼─────┼─────┤              │
│   │  7  │  8  │  9  │              │
│   ├─────┼─────┼─────┤              │
│   │  ⌫  │  0  │  ✓  │              │
│   └─────┴─────┴─────┘              │
│                                     │
│         [Cancel]                    │
└─────────────────────────────────────┘
```

![Phone Entry Keypad](images/phone-keypad-wireframe.png)
*Enter your 10-digit phone number*

### Step 3: Confirm and Search

1. Enter your **10-digit phone number**
2. The number formats automatically as you type
3. Tap **✓** (checkmark) when complete
4. The system searches for your account

---

## Looking Up by Email

### Step 1: Select Email Lookup

Tap **"Use Email"** to enter your email address.

### Step 2: Enter Your Email

A full keyboard appears:

![Email Entry Keyboard](images/email-keyboard-wireframe.png)
*Enter your email address using the on-screen keyboard*

```
┌─────────────────────────────────────┐
│                                     │
│      Enter Your Email Address       │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  customer@email.com         │  │
│   └─────────────────────────────┘  │
│                                     │
│  ┌───┬───┬───┬───┬───┬───┬───┬──┐ │
│  │ q │ w │ e │ r │ t │ y │ u │..│ │
│  ├───┼───┼───┼───┼───┼───┼───┼──┤ │
│  │ a │ s │ d │ f │ g │ h │ j │..│ │
│  ├───┼───┼───┼───┼───┼───┼───┼──┤ │
│  │ ⇧ │ z │ x │ c │ v │ b │ n │..│ │
│  ├───┴───┼───┴───┴───┼───┴───┴──┤ │
│  │  @.   │   SPACE   │   Done   │ │
│  └───────┴───────────┴──────────┘ │
│                                     │
│         [Cancel]                    │
└─────────────────────────────────────┘
```

### Quick Email Keys

The keyboard includes helpful shortcuts:
- **@** - Insert @ symbol
- **.com** - Quick domain suffix
- **.** - Period for domain entry

### Step 3: Confirm and Search

1. Enter your complete email address
2. Double-check for typos
3. Tap **"Done"** to search

---

## Account Found

When your account is found:

![Account Found](images/account-found-wireframe.png)
*Your account is successfully linked*

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    Account Found!                           │
│                                                             │
│              ┌─────────────────────┐                       │
│              │        👤           │                       │
│              │    Welcome back,    │                       │
│              │      Sarah M.       │                       │
│              └─────────────────────┘                       │
│                                                             │
│                  🎉 You have:                               │
│                  • 2,450 loyalty points                     │
│                  • 3 exclusive offers available             │
│                                                             │
│              ┌──────────────────────┐                      │
│              │  Continue to Payment │                      │
│              └──────────────────────┘                      │
│                                                             │
│              Not you? [Use Different Account]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What You'll See

- **Welcome message** with your name
- **Points balance** (if applicable)
- **Available offers** count
- **Discounts** automatically applied to eligible items

### Discounts Applied

After linking, check your cart for newly applied discounts:

![Loyalty Discounts](images/loyalty-discounts-wireframe.png)
*Loyalty discounts are applied automatically*

Loyalty discounts appear in the cart summary with a loyalty icon (♥️ or similar).

---

## Account Not Found

If your phone number or email isn't found:

![Account Not Found](images/account-not-found-wireframe.png)
*No matching account was found*

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│             Account Not Found                               │
│                                                             │
│   We couldn't find an account matching:                     │
│   (555) 123-4567                                            │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Try Again     │  Use Email Instead  │  Skip        │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   Don't have an account?                                    │
│   Sign up at customer service or online at                  │
│   www.example.com/loyalty                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Options When Not Found

| Option | Description |
|--------|-------------|
| **Try Again** | Re-enter the phone or email (in case of typo) |
| **Use Email/Phone Instead** | Try the other lookup method |
| **Skip** | Continue without linking an account |

### Common Reasons

- **Typo** in phone number or email
- **Different contact info** than what's on file
- **No account exists** - sign up at customer service

---

## Skipping Loyalty Lookup

You can always skip the loyalty lookup and continue as a guest:

1. Tap **"Skip"** or **"Continue without linking"**
2. You'll proceed directly to payment
3. No discounts or points will be applied

![Skip Loyalty](images/skip-loyalty-wireframe.png)
*You can skip linking and checkout as a guest*

---

## Using a Different Account

If the wrong account was linked:

1. Tap **"Not you?"** or **"Use Different Account"**
2. Enter the correct phone or email
3. The previous account is unlinked
4. New account discounts are applied

---

## Privacy & Security

### Your Information is Protected

- Only **first name and last initial** are displayed
- Full account details require PIN at customer service
- **Transaction data** is saved to your account history
- **No payment information** is stored from kiosk transactions

### Data We Use

| Data | Purpose |
|------|---------|
| Name | Personalized greeting |
| Points balance | Display your rewards status |
| Member discounts | Apply eligible savings |
| Email | Send digital receipt (if opted in) |

---

## Loyalty Program Benefits

### Earning Points

Points are earned on eligible purchases:

| Purchase Amount | Points Earned |
|-----------------|---------------|
| Every $1 spent | 1 point |
| Bonus items | 2x or more points |

### Redeeming Points

Points can be redeemed at traditional checkout lanes or online. Self-checkout kiosks do not currently support point redemption.

### Member Discounts

Exclusive pricing is automatically applied to:
- Weekly member specials
- Clearance items
- Seasonal promotions

---

## Troubleshooting

### "Please Try Again Later"

If you see this message:
1. The loyalty system may be temporarily unavailable
2. Tap **"Skip"** to continue checkout
3. Your receipt can be added to your account at customer service

### Account Shows Wrong Name

If someone else's account appears:
1. Tap **"Not you?"** immediately
2. Enter your own phone/email
3. Never use another person's account

### Missing Discounts

If expected discounts aren't applied:
1. Verify you're a member of the right loyalty program
2. Check that items are eligible for the discount
3. Ask for help if discounts should apply

---

## Next Steps

After linking your account (or skipping):

- [Complete your payment](checkout.md)

---

[← Managing Your Cart](cart-management.md) | [Back to Index](index.md) | [Next: Checkout & Payment →](checkout.md)

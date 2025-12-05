package org.example.model.customer;

import java.util.List;

/**
 * B2B-specific information for business customers. This record is null for D2C (consumer)
 * customers.
 *
 * @param parentCustomerId ID of parent account (null if root account)
 * @param companyInfo company details
 * @param childAccountIds IDs of child/sub-accounts
 * @param accountTier the B2B service tier
 * @param salesRepId assigned sales representative ID
 */
public record B2BInfo(
        String parentCustomerId,
        CompanyInfo companyInfo,
        List<String> childAccountIds,
        AccountTier accountTier,
        String salesRepId) {

    /**
     * Check if this is a root B2B account (no parent).
     *
     * @return true if this account has no parent
     */
    public boolean isRootAccount() {
        return parentCustomerId == null;
    }

    /**
     * Check if this account has sub-accounts.
     *
     * @return true if this account has child accounts
     */
    public boolean hasSubAccounts() {
        return childAccountIds != null && !childAccountIds.isEmpty();
    }
}

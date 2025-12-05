package org.example.discount.client;

import java.util.Set;

/**
 * Context about the current user from user-service.
 *
 * @param userType the type of user (EMPLOYEE, CUSTOMER, SERVICE_ACCOUNT)
 * @param permissions the user's permissions
 * @param storeNumber the store number (for employees)
 */
public record UserContext(UserType userType, Set<Permission> permissions, Integer storeNumber) {

    public static UserContext anonymous() {
        return new UserContext(UserType.CUSTOMER, Set.of(Permission.READ), null);
    }

    public boolean isEmployee() {
        return userType == UserType.EMPLOYEE;
    }

    public boolean canApplyMarkdown() {
        return isEmployee() && permissions.contains(Permission.ADMIN);
    }

    public enum UserType {
        SERVICE_ACCOUNT,
        CUSTOMER,
        EMPLOYEE
    }

    public enum Permission {
        READ,
        WRITE,
        ADMIN,
        CUSTOMER_SEARCH
    }
}

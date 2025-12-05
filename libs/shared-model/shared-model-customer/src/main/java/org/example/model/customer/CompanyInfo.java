package org.example.model.customer;

/**
 * Company information for B2B customers.
 *
 * @param companyName the registered company name
 * @param taxId tax identification number (e.g., EIN in US)
 * @param industry industry classification
 * @param dunsNumber Dun & Bradstreet D-U-N-S number
 * @param employeeCount approximate number of employees
 */
public record CompanyInfo(
        String companyName, String taxId, String industry, String dunsNumber, int employeeCount) {}

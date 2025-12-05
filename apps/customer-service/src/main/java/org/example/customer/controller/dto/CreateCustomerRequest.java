package org.example.customer.controller.dto;

import java.util.List;
import org.example.model.customer.Address;
import org.example.model.customer.CommunicationPreferences;
import org.example.model.customer.CompanyInfo;
import org.example.model.customer.CustomerType;
import org.example.model.customer.WalletReference;

/**
 * Request DTO for creating a new customer.
 *
 * @param storeNumber the store number
 * @param name customer name
 * @param email customer email
 * @param phone customer phone (optional)
 * @param type customer type (CONSUMER or BUSINESS)
 * @param addresses list of addresses (optional)
 * @param wallet wallet reference (optional)
 * @param communicationPreferences communication preferences (optional)
 * @param companyInfo company info (required for BUSINESS type)
 */
public record CreateCustomerRequest(
    int storeNumber,
    String name,
    String email,
    String phone,
    CustomerType type,
    List<Address> addresses,
    WalletReference wallet,
    CommunicationPreferences communicationPreferences,
    CompanyInfo companyInfo) {}

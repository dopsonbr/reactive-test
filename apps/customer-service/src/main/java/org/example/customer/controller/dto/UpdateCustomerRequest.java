package org.example.customer.controller.dto;

import java.util.List;
import org.example.model.customer.Address;
import org.example.model.customer.B2BInfo;
import org.example.model.customer.CommunicationPreferences;
import org.example.model.customer.CustomerStatus;
import org.example.model.customer.LoyaltyInfo;
import org.example.model.customer.WalletReference;

/**
 * Request DTO for updating an existing customer. All fields are optional - only provided fields
 * will be updated.
 *
 * @param name updated name
 * @param email updated email
 * @param phone updated phone
 * @param status updated status
 * @param addresses updated addresses
 * @param wallet updated wallet reference
 * @param communicationPreferences updated communication preferences
 * @param loyalty updated loyalty info
 * @param b2bInfo updated B2B info
 */
public record UpdateCustomerRequest(
        String name,
        String email,
        String phone,
        CustomerStatus status,
        List<Address> addresses,
        WalletReference wallet,
        CommunicationPreferences communicationPreferences,
        LoyaltyInfo loyalty,
        B2BInfo b2bInfo) {}

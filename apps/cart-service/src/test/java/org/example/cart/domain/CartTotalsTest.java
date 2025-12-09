package org.example.cart.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import org.example.model.discount.AppliedDiscount;
import org.example.model.discount.DiscountType;
import org.example.model.fulfillment.Fulfillment;
import org.example.model.fulfillment.FulfillmentType;
import org.example.model.product.CartProduct;
import org.junit.jupiter.api.Test;

/** Unit tests for CartTotals calculation. */
class CartTotalsTest {

  @Test
  void empty_returnsAllZeros() {
    CartTotals totals = CartTotals.empty();

    assertThat(totals.subtotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.discountTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.fulfillmentTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.taxTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.grandTotal()).isEqualByComparingTo(BigDecimal.ZERO);
  }

  @Test
  void calculate_emptyLists_returnsZeroTotals() {
    CartTotals totals = CartTotals.calculate(List.of(), List.of(), List.of());

    assertThat(totals.subtotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.discountTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.fulfillmentTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.grandTotal()).isEqualByComparingTo(BigDecimal.ZERO);
  }

  @Test
  void calculate_productsOnly_calculatesSubtotalAndGrandTotal() {
    List<CartProduct> products =
        List.of(
            new CartProduct(
                123456L,
                "Product A",
                "Description A",
                new BigDecimal("10.00"),
                null,
                2,
                100,
                "https://cdn.example.com/a.jpg",
                "General"), // 20.00
            new CartProduct(
                234567L,
                "Product B",
                "Description B",
                new BigDecimal("15.50"),
                null,
                1,
                50,
                "https://cdn.example.com/b.jpg",
                "General") // 15.50
            );

    CartTotals totals = CartTotals.calculate(products, List.of(), List.of());

    assertThat(totals.subtotal()).isEqualByComparingTo("35.50");
    assertThat(totals.discountTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.fulfillmentTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.grandTotal()).isEqualByComparingTo("35.50");
  }

  @Test
  void calculate_withDiscount_subtractsFromGrandTotal() {
    List<CartProduct> products =
        List.of(
            new CartProduct(
                123456L,
                "Product A",
                "Description A",
                new BigDecimal("100.00"),
                null,
                1,
                100,
                "https://cdn.example.com/a.jpg",
                "General"));
    List<AppliedDiscount> discounts =
        List.of(
            new AppliedDiscount(
                "d1",
                "SAVE10",
                DiscountType.PERCENTAGE,
                new BigDecimal("10"),
                new BigDecimal("10.00"),
                List.of()));

    CartTotals totals = CartTotals.calculate(products, discounts, List.of());

    assertThat(totals.subtotal()).isEqualByComparingTo("100.00");
    assertThat(totals.discountTotal()).isEqualByComparingTo("10.00");
    assertThat(totals.grandTotal()).isEqualByComparingTo("90.00");
  }

  @Test
  void calculate_withFulfillment_addsToGrandTotal() {
    List<CartProduct> products =
        List.of(
            new CartProduct(
                123456L,
                "Product A",
                "Description A",
                new BigDecimal("50.00"),
                null,
                1,
                100,
                "https://cdn.example.com/a.jpg",
                "General"));
    List<Fulfillment> fulfillments =
        List.of(
            new Fulfillment(
                "f1", FulfillmentType.DELIVERY, List.of(123456L), new BigDecimal("9.99")));

    CartTotals totals = CartTotals.calculate(products, List.of(), fulfillments);

    assertThat(totals.subtotal()).isEqualByComparingTo("50.00");
    assertThat(totals.fulfillmentTotal()).isEqualByComparingTo("9.99");
    assertThat(totals.grandTotal()).isEqualByComparingTo("59.99");
  }

  @Test
  void calculate_fullCart_calculatesCorrectly() {
    // Products: 20.00 + 30.00 = 50.00
    List<CartProduct> products =
        List.of(
            new CartProduct(
                123456L,
                "Product A",
                "Description A",
                new BigDecimal("10.00"),
                null,
                2,
                100,
                "https://cdn.example.com/a.jpg",
                "General"),
            new CartProduct(
                234567L,
                "Product B",
                "Description B",
                new BigDecimal("30.00"),
                null,
                1,
                50,
                "https://cdn.example.com/b.jpg",
                "General"));

    // Discounts: 5.00 + 2.50 = 7.50
    List<AppliedDiscount> discounts =
        List.of(
            new AppliedDiscount(
                "d1",
                "SAVE5",
                DiscountType.FIXED_AMOUNT,
                new BigDecimal("5"),
                new BigDecimal("5.00"),
                List.of()),
            new AppliedDiscount(
                "d2",
                "EXTRA",
                DiscountType.PERCENTAGE,
                new BigDecimal("5"),
                new BigDecimal("2.50"),
                List.of()));

    // Fulfillments: 9.99 + 0.00 = 9.99
    List<Fulfillment> fulfillments =
        List.of(
            new Fulfillment(
                "f1", FulfillmentType.DELIVERY, List.of(123456L), new BigDecimal("9.99")),
            new Fulfillment("f2", FulfillmentType.PICKUP, List.of(234567L), BigDecimal.ZERO));

    CartTotals totals = CartTotals.calculate(products, discounts, fulfillments);

    // Grand total = 50.00 - 7.50 + 9.99 = 52.49
    assertThat(totals.subtotal()).isEqualByComparingTo("50.00");
    assertThat(totals.discountTotal()).isEqualByComparingTo("7.50");
    assertThat(totals.fulfillmentTotal()).isEqualByComparingTo("9.99");
    assertThat(totals.taxTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    assertThat(totals.grandTotal()).isEqualByComparingTo("52.49");
  }

  @Test
  void calculate_discountExceedsSubtotal_grandTotalIsZero() {
    List<CartProduct> products =
        List.of(
            new CartProduct(
                123456L,
                "Product A",
                "Description A",
                new BigDecimal("10.00"),
                null,
                1,
                100,
                "https://cdn.example.com/a.jpg",
                "General"));
    List<AppliedDiscount> discounts =
        List.of(
            new AppliedDiscount(
                "d1",
                "HUGE",
                DiscountType.FIXED_AMOUNT,
                new BigDecimal("100"),
                new BigDecimal("100.00"),
                List.of()));

    CartTotals totals = CartTotals.calculate(products, discounts, List.of());

    assertThat(totals.subtotal()).isEqualByComparingTo("10.00");
    assertThat(totals.discountTotal()).isEqualByComparingTo("100.00");
    // Grand total should be 0, not negative
    assertThat(totals.grandTotal()).isEqualByComparingTo(BigDecimal.ZERO);
  }

  @Test
  void calculate_multipleProducts_sumsLineTotalsCorrectly() {
    List<CartProduct> products =
        List.of(
            new CartProduct(
                111111L,
                "A",
                "Description A",
                new BigDecimal("1.99"),
                null,
                3,
                10,
                "https://cdn.example.com/a.jpg",
                "General"), // 5.97
            new CartProduct(
                222222L,
                "B",
                "Description B",
                new BigDecimal("24.99"),
                null,
                2,
                20,
                "https://cdn.example.com/b.jpg",
                "General"), // 49.98
            new CartProduct(
                333333L,
                "C",
                "Description C",
                new BigDecimal("199.99"),
                null,
                1,
                5,
                "https://cdn.example.com/c.jpg",
                "General") // 199.99
            );

    CartTotals totals = CartTotals.calculate(products, List.of(), List.of());

    // 5.97 + 49.98 + 199.99 = 255.94
    assertThat(totals.subtotal()).isEqualByComparingTo("255.94");
    assertThat(totals.grandTotal()).isEqualByComparingTo("255.94");
  }
}

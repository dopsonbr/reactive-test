package org.example.fulfillment.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.example.fulfillment.dto.FulfillmentSlot;
import org.example.fulfillment.dto.FulfillmentSlotsResponse;
import org.example.model.fulfillment.FulfillmentType;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Controller for querying available fulfillment time slots. Supports PICKUP, WILL_CALL, DELIVERY,
 * and INSTALLATION slot queries.
 */
@RestController
@RequestMapping("/fulfillments/slots")
public class FulfillmentSlotsController {

  /**
   * Get available fulfillment slots for a given type, store, and date range.
   *
   * @param type the fulfillment type (PICKUP, WILL_CALL, DELIVERY, INSTALLATION)
   * @param storeNumber the store number for PICKUP/WILL_CALL
   * @param startDate the start of the date range (defaults to today)
   * @param endDate the end of the date range (defaults to 7 days from now)
   * @return available slots within the date range
   */
  @GetMapping
  public Mono<FulfillmentSlotsResponse> getSlots(
      @RequestParam FulfillmentType type,
      @RequestParam int storeNumber,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate) {

    LocalDate start = startDate != null ? startDate : LocalDate.now();
    LocalDate end = endDate != null ? endDate : start.plusDays(7);

    return Mono.deferContextual(ctx -> generateSlots(type, storeNumber, start, end));
  }

  /**
   * Get available slots for a specific date.
   *
   * @param type the fulfillment type
   * @param storeNumber the store number
   * @param date the specific date to query
   * @return available slots for that date
   */
  @GetMapping("/{date}")
  public Mono<FulfillmentSlotsResponse> getSlotsForDate(
      @RequestParam FulfillmentType type,
      @RequestParam int storeNumber,
      @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

    return Mono.deferContextual(ctx -> generateSlots(type, storeNumber, date, date));
  }

  private Mono<FulfillmentSlotsResponse> generateSlots(
      FulfillmentType type, int storeNumber, LocalDate startDate, LocalDate endDate) {
    // In a real implementation, this would query inventory and capacity systems
    // For now, generate mock slots based on fulfillment type

    List<FulfillmentSlot> slots = new ArrayList<>();
    LocalDate current = startDate;

    while (!current.isAfter(endDate)) {
      slots.addAll(generateSlotsForDay(type, current));
      current = current.plusDays(1);
    }

    return Mono.just(new FulfillmentSlotsResponse(type, storeNumber, slots));
  }

  private List<FulfillmentSlot> generateSlotsForDay(FulfillmentType type, LocalDate date) {
    List<FulfillmentSlot> slots = new ArrayList<>();

    switch (type) {
      case PICKUP, WILL_CALL -> {
        // Store hours: 9am-9pm, 2-hour windows
        for (int hour = 9; hour < 21; hour += 2) {
          slots.add(
              new FulfillmentSlot(
                  date,
                  LocalTime.of(hour, 0),
                  LocalTime.of(hour + 2, 0),
                  10, // capacity
                  true));
        }
      }
      case DELIVERY -> {
        // Delivery windows: 9am-12pm, 12pm-3pm, 3pm-6pm, 6pm-9pm
        slots.add(new FulfillmentSlot(date, LocalTime.of(9, 0), LocalTime.of(12, 0), 5, true));
        slots.add(new FulfillmentSlot(date, LocalTime.of(12, 0), LocalTime.of(15, 0), 5, true));
        slots.add(new FulfillmentSlot(date, LocalTime.of(15, 0), LocalTime.of(18, 0), 5, true));
        slots.add(new FulfillmentSlot(date, LocalTime.of(18, 0), LocalTime.of(21, 0), 3, true));
      }
      case INSTALLATION -> {
        // Installation: 8am-12pm or 1pm-5pm
        slots.add(new FulfillmentSlot(date, LocalTime.of(8, 0), LocalTime.of(12, 0), 2, true));
        slots.add(new FulfillmentSlot(date, LocalTime.of(13, 0), LocalTime.of(17, 0), 2, true));
      }
    }

    return slots;
  }
}

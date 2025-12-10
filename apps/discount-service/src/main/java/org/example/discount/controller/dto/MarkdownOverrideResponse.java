package org.example.discount.controller.dto;

import org.example.model.discount.Markdown;

/**
 * Response for a markdown override request.
 *
 * @param success whether the override was successful
 * @param markdown the applied markdown if successful
 * @param approvedBy the manager ID who approved
 * @param approverName the name of the approving manager
 * @param error error message if not successful
 */
public record MarkdownOverrideResponse(
    boolean success, Markdown markdown, String approvedBy, String approverName, String error) {

  public static MarkdownOverrideResponse success(
      Markdown markdown, String approvedBy, String approverName) {
    return new MarkdownOverrideResponse(true, markdown, approvedBy, approverName, null);
  }

  public static MarkdownOverrideResponse failure(String error) {
    return new MarkdownOverrideResponse(false, null, null, null, error);
  }
}

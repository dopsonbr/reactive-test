package org.example.order.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import graphql.GraphQLError;
import graphql.execution.ExecutionStepInfo;
import graphql.execution.MergedField;
import graphql.execution.ResultPath;
import graphql.language.Field;
import graphql.language.SourceLocation;
import graphql.schema.DataFetchingEnvironment;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import org.example.platform.error.ValidationException;
import org.example.platform.error.ValidationException.ValidationError;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

/** Unit tests for GraphQLExceptionResolver. */
class GraphQLExceptionResolverTest {

  private GraphQLExceptionResolver resolver;
  private DataFetchingEnvironment env;

  @BeforeEach
  void setUp() {
    resolver = new GraphQLExceptionResolver();
    env = mock(DataFetchingEnvironment.class);

    // Mock Field
    Field field = mock(Field.class);
    when(field.getName()).thenReturn("testField");
    when(field.getSourceLocation()).thenReturn(new SourceLocation(1, 1));
    when(env.getField()).thenReturn(field);

    // Mock MergedField
    MergedField mergedField = mock(MergedField.class);
    when(mergedField.getSingleField()).thenReturn(field);
    when(mergedField.getFields()).thenReturn(List.of(field));
    when(env.getMergedField()).thenReturn(mergedField);

    // Mock ExecutionStepInfo with ResultPath
    ExecutionStepInfo stepInfo = mock(ExecutionStepInfo.class);
    when(stepInfo.getPath()).thenReturn(ResultPath.rootPath().segment("testField"));
    when(env.getExecutionStepInfo()).thenReturn(stepInfo);
  }

  @Nested
  class ValidationExceptionHandling {

    @Test
    void mapsToBAD_REQUEST() {
      ValidationException ex =
          new ValidationException(List.of(new ValidationError("field1", "error1")));

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.BAD_REQUEST);
      assertThat(error.getMessage()).isEqualTo("Validation failed");
    }

    @Test
    void includesValidationErrorsInExtensions() {
      ValidationException ex =
          new ValidationException(
              List.of(
                  new ValidationError("field1", "error1"),
                  new ValidationError("field2", "error2")));

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getExtensions()).containsKey("validationErrors");
      @SuppressWarnings("unchecked")
      Map<String, String> validationErrors =
          (Map<String, String>) error.getExtensions().get("validationErrors");
      assertThat(validationErrors).containsEntry("field1", "error1");
      assertThat(validationErrors).containsEntry("field2", "error2");
    }

    @Test
    void mergesDuplicateFieldErrors() {
      ValidationException ex =
          new ValidationException(
              List.of(
                  new ValidationError("field1", "error1"),
                  new ValidationError("field1", "error2")));

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      @SuppressWarnings("unchecked")
      Map<String, String> validationErrors =
          (Map<String, String>) error.getExtensions().get("validationErrors");
      assertThat(validationErrors.get("field1")).contains("error1").contains("error2");
    }
  }

  @Nested
  class ResponseStatusExceptionHandling {

    @Test
    void notFound_mapsToNOT_FOUND() {
      ResponseStatusException ex =
          new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.NOT_FOUND);
      assertThat(error.getMessage()).isEqualTo("Order not found");
    }

    @Test
    void notFound_withNullReason_usesDefault() {
      ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND);

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.NOT_FOUND);
      assertThat(error.getMessage()).isEqualTo("Not found");
    }

    @Test
    void badRequest_mapsToBAD_REQUEST() {
      ResponseStatusException ex =
          new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status transition");

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.BAD_REQUEST);
      assertThat(error.getMessage()).isEqualTo("Invalid status transition");
    }

    @Test
    void badRequest_withNullReason_usesDefault() {
      ResponseStatusException ex = new ResponseStatusException(HttpStatus.BAD_REQUEST);

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.BAD_REQUEST);
      assertThat(error.getMessage()).isEqualTo("Bad request");
    }

    @Test
    void conflict_mapsToBAD_REQUEST() {
      ResponseStatusException ex =
          new ResponseStatusException(HttpStatus.CONFLICT, "Conflict occurred");

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.BAD_REQUEST);
      assertThat(error.getMessage()).isEqualTo("Conflict occurred");
    }

    @Test
    void conflict_withNullReason_usesDefault() {
      ResponseStatusException ex = new ResponseStatusException(HttpStatus.CONFLICT);

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.BAD_REQUEST);
      assertThat(error.getMessage()).isEqualTo("Conflict");
    }
  }

  @Nested
  class StandardExceptionHandling {

    @Test
    void noSuchElementException_mapsToNOT_FOUND() {
      NoSuchElementException ex = new NoSuchElementException("Element not found");

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.NOT_FOUND);
      assertThat(error.getMessage()).isEqualTo("Element not found");
    }

    @Test
    void illegalArgumentException_mapsToBAD_REQUEST() {
      IllegalArgumentException ex = new IllegalArgumentException("Invalid argument");

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.BAD_REQUEST);
      assertThat(error.getMessage()).isEqualTo("Invalid argument");
    }

    @Test
    void accessDeniedException_mapsToFORBIDDEN() {
      AccessDeniedException ex = new AccessDeniedException("Not authorized");

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.FORBIDDEN);
      assertThat(error.getMessage()).isEqualTo("Access denied");
    }
  }

  @Nested
  class DefaultHandling {

    @Test
    void unknownException_mapsToINTERNAL_ERROR() {
      RuntimeException ex = new RuntimeException("Something unexpected");

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getErrorType()).isEqualTo(ErrorType.INTERNAL_ERROR);
      assertThat(error.getMessage()).isEqualTo("Internal server error");
    }

    @Test
    void unknownException_doesNotExposeDetails() {
      RuntimeException ex = new RuntimeException("Sensitive database error details");

      GraphQLError error = resolver.resolveToSingleError(ex, env);

      assertThat(error.getMessage()).doesNotContain("database");
      assertThat(error.getMessage()).isEqualTo("Internal server error");
    }
  }
}

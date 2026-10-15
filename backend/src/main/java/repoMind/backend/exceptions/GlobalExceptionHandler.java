package repoMind.backend.exceptions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<Map<String, Object>> handleNotFound(NotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<Map<String, Object>> handleNoResource(NoResourceFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "Resource not found");
    }

    @ExceptionHandler(BadRequestException.class)
    ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class
    })
    ResponseEntity<Map<String, Object>> handleMalformedRequest(Exception ex) {
        return error(HttpStatus.BAD_REQUEST, "Malformed or invalid request");
    }

    @ExceptionHandler(UnauthorizedException.class)
    ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedException ex) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .orElse("Validation failed");
        return error(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * Errors coming back from the GitHub API (bad/expired token, rate limit, empty repo...).
     */
    @ExceptionHandler(RestClientResponseException.class)
    ResponseEntity<Map<String, Object>> handleUpstream(RestClientResponseException ex) {
        int upstream = ex.getStatusCode().value();
        log.warn("Upstream HTTP error {}: {}", upstream, ex.getMessage());

        return switch (upstream) {
            case 401 -> error(HttpStatus.UNAUTHORIZED,
                    "GitHub rejected the stored access token. Please sign out and sign in again.");
            case 403, 429 -> error(HttpStatus.TOO_MANY_REQUESTS,
                    "GitHub rate limit or permission problem. Please try again in a few minutes.");
            case 404 -> error(HttpStatus.NOT_FOUND,
                    "GitHub could not find that resource (it may be private or deleted).");
            case 409 -> error(HttpStatus.BAD_REQUEST,
                    "This repository is empty or has no commits on its default branch.");
            default -> error(HttpStatus.BAD_GATEWAY,
                    "GitHub request failed (HTTP " + upstream + ").");
        };
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR,
                ex.getMessage() != null ? ex.getMessage() : "Unexpected error");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message == null ? status.getReasonPhrase() : message,
                "timestamp", Instant.now().toString()
        ));
    }
}

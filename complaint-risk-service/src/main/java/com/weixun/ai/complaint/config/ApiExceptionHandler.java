package com.weixun.ai.complaint.config;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<Map<String, Object>> badRequest(IllegalArgumentException error) {
    return response(HttpStatus.BAD_REQUEST, error.getMessage());
  }

  @ExceptionHandler(SecurityException.class)
  ResponseEntity<Map<String, Object>> forbidden(SecurityException error) {
    return response(HttpStatus.FORBIDDEN, error.getMessage());
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
  ResponseEntity<Map<String, Object>> validation(Exception error) {
    return response(HttpStatus.BAD_REQUEST, "请求参数校验失败");
  }

  @ExceptionHandler(IllegalStateException.class)
  ResponseEntity<Map<String, Object>> conflict(IllegalStateException error) {
    return response(HttpStatus.CONFLICT, error.getMessage());
  }

  private ResponseEntity<Map<String, Object>> response(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(Map.of(
        "status", status.value(),
        "message", message == null ? status.getReasonPhrase() : message,
        "timestamp", Instant.now().toString()
    ));
  }
}

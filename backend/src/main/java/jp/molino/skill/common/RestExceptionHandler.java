package jp.molino.skill.common;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class RestExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handle(ApiException exception) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", exception.getMessage());
        body.put("fields", exception.getFields());
        return ResponseEntity.status(exception.getStatus()).body(body);
    }
}

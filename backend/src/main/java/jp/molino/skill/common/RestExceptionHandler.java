package jp.molino.skill.common;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class RestExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handle(ApiException exception) {
        return body(exception.getStatus(), exception.getMessage(), exception.getFields());
    }

    // 本文が JSON として読めない、または DTO の型に変換できないとき（例: 文字列の項目に配列が送られた）。
    // Spring 標準の英語の形式ではなく、ほかのエラーと同じ { message, fields } の形で返す
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException exception) {
        return body(HttpStatus.BAD_REQUEST, "入力内容を確認してください", Map.of());
    }

    private ResponseEntity<Map<String, Object>> body(HttpStatus status, String message, Map<String, String> fields) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        body.put("fields", fields);
        return ResponseEntity.status(status).body(body);
    }
}

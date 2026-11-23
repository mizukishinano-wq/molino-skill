package jp.molino.skill.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final int MIN_SECRET_LENGTH = 32;
    // 公開リポジトリにコミットされていた値。設定されていても受け付けない
    private static final String LEAKED_SECRET = "molino-skill-dev-secret-key-change-me-32b";

    private final SecretKey key;
    private final int days;

    public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.days}") int days) {
        this.key = createKey(secret);
        this.days = days;
    }

    private static SecretKey createKey(String secret) {
        if (secret == null || secret.isBlank()) {
            // ローカル開発用。起動ごとに鍵が変わるので、再起動するとログインし直しになる
            log.warn("JWT_SECRET が未設定のため、一時的な鍵を生成しました。公開環境では必ず設定してください");
            return Jwts.SIG.HS256.key().build();
        }
        if (secret.length() < MIN_SECRET_LENGTH || secret.equals(LEAKED_SECRET)) {
            throw new IllegalStateException("JWT_SECRET は公開されていない32文字以上の値にしてください");
        }
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String create(String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(days * 24L * 60L * 60L)))
                .signWith(key)
                .compact();
    }

    public String parseEmail(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
    }
}

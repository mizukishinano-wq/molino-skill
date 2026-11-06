package jp.molino.skill.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final int days;

    public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.days}") int days) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.days = days;
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

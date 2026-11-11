package jp.molino.skill.auth;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Decides which accounts may log in: the manager plus the addresses in ALLOWED_EMAILS. */
@Component
public class AllowedUsers {
    private static final String MANAGER_EMAIL = "sato@example.com";

    private final Set<String> emails;

    public AllowedUsers(@Value("${app.auth.allowed-emails:}") String allowedEmails) {
        this.emails = Arrays.stream(allowedEmails.split(","))
                .map(AllowedUsers::normalize)
                .filter(email -> !email.isEmpty())
                .collect(Collectors.toSet());
    }

    public boolean contains(String email) {
        String normalized = normalize(email);
        return MANAGER_EMAIL.equals(normalized) || emails.contains(normalized);
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}

package jp.molino.skill.auth;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * ログインできるアカウントを決める。
 * 通常は店長と ALLOWED_EMAILS の登録者だけ。デモ環境（OPEN_SIGNUP=true）では、登録済みの全員を許可する。
 */
@Component
public class AllowedUsers {
    private static final String MANAGER_EMAIL = "sato@example.com";

    private final Set<String> emails;
    private final boolean openSignup;

    public AllowedUsers(
            @Value("${app.auth.allowed-emails:}") String allowedEmails,
            @Value("${app.auth.open-signup:false}") boolean openSignup) {
        this.emails = Arrays.stream(allowedEmails.split(","))
                .map(AllowedUsers::normalize)
                .filter(email -> !email.isEmpty())
                .collect(Collectors.toSet());
        this.openSignup = openSignup;
    }

    public boolean isOpenSignup() {
        return openSignup;
    }

    public boolean contains(String email) {
        String normalized = normalize(email);
        if (normalized.isEmpty()) {
            return false;
        }
        return openSignup || MANAGER_EMAIL.equals(normalized) || emails.contains(normalized);
    }

    static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}

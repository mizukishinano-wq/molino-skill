package jp.molino.skill.auth;

import java.util.Map;
import jp.molino.skill.common.ApiException;
import jp.molino.skill.security.JwtService;
import jp.molino.skill.user.UserAccount;
import jp.molino.skill.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AllowedUsers allowedUsers;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService, AllowedUsers allowedUsers) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.allowedUsers = allowedUsers;
    }

    public Map<String, String> signup() {
        throw new ApiException(HttpStatus.FORBIDDEN, "新規登録は停止しています。管理者に連絡してください");
    }

    public Map<String, String> login(Map<String, String> body) {
        String email = text(body.get("email"));
        String password = body.get("password") == null ? "" : body.get("password");
        UserAccount user = users.findByEmail(email).orElse(null);
        if (user == null || !allowedUsers.contains(user.getEmail()) || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "メールアドレスまたはパスワードが正しくありません");
        }
        return tokenBody(user);
    }

    public Map<String, String> me() {
        String email = currentEmail();
        UserAccount user = users.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "ログインしてください"));
        return Map.of("name", user.getName(), "email", user.getEmail());
    }

    public String currentEmail() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "ログインしてください");
        }
        return authentication.getName();
    }

    private Map<String, String> tokenBody(UserAccount user) {
        return Map.of("token", jwtService.create(user.getEmail()), "name", user.getName(), "email", user.getEmail());
    }

    private String text(String value) {
        return value == null ? "" : value.trim();
    }
}

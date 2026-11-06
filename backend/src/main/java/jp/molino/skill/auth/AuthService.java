package jp.molino.skill.auth;

import java.util.LinkedHashMap;
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

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public Map<String, String> signup(Map<String, String> body) {
        String name = text(body.get("name"));
        String email = text(body.get("email"));
        String password = body.get("password") == null ? "" : body.get("password");
        String confirm = body.get("passwordConfirm") == null ? "" : body.get("passwordConfirm");
        Map<String, String> fields = new LinkedHashMap<>();
        if (name.isEmpty()) {
            fields.put("name", "名前を入力してください");
        } else if (name.length() > 20) {
            fields.put("name", "名前は20文字以内で入力してください");
        }
        if (email.isEmpty()) {
            fields.put("email", "メールアドレスを入力してください");
        } else if (!email.contains("@") || email.startsWith("@") || email.endsWith("@")) {
            fields.put("email", "メールアドレスの形式が正しくありません");
        } else if (users.existsByEmail(email)) {
            fields.put("email", "このメールアドレスはすでに登録されています");
        }
        if (password.length() < 8) {
            fields.put("password", "パスワードは8文字以上で入力してください");
        }
        if (!password.equals(confirm)) {
            fields.put("passwordConfirm", "パスワードが一致しません");
        }
        if (!fields.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "入力内容を確認してください", fields);
        }
        UserAccount user = new UserAccount();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        users.save(user);
        return tokenBody(user);
    }

    public Map<String, String> login(Map<String, String> body) {
        String email = text(body.get("email"));
        String password = body.get("password") == null ? "" : body.get("password");
        UserAccount user = users.findByEmail(email).orElse(null);
        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
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

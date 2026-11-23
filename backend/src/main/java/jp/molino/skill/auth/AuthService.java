package jp.molino.skill.auth;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import jp.molino.skill.common.ApiException;
import jp.molino.skill.security.JwtService;
import jp.molino.skill.user.UserAccount;
import jp.molino.skill.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private static final int MAX_NAME_LENGTH = 20;
    private static final int MAX_EMAIL_LENGTH = 255;
    private static final int MIN_PASSWORD_LENGTH = 8;
    // bcrypt は先頭72バイトまでしか使わず、それを超えると Spring Security が例外を投げる
    private static final int MAX_PASSWORD_BYTES = 72;
    private static final String EMAIL_TAKEN = "このメールアドレスはすでに登録されています";

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

    public Map<String, String> signup(Map<String, String> body) {
        if (!allowedUsers.isOpenSignup()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "新規登録は停止しています。管理者に連絡してください");
        }
        String name = text(body.get("name"));
        String email = AllowedUsers.normalize(body.get("email"));
        String password = body.get("password") == null ? "" : body.get("password");
        String confirm = body.get("passwordConfirm") == null ? "" : body.get("passwordConfirm");

        Map<String, String> fields = new LinkedHashMap<>();
        if (name.isEmpty()) {
            fields.put("name", "名前を入力してください");
        } else if (name.length() > MAX_NAME_LENGTH) {
            fields.put("name", "名前は20文字以内で入力してください");
        }
        if (email.isEmpty()) {
            fields.put("email", "メールアドレスを入力してください");
        } else if (!isEmailFormat(email)) {
            fields.put("email", "メールアドレスの形式が正しくありません");
        } else if (users.existsByEmail(email)) {
            fields.put("email", EMAIL_TAKEN);
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            fields.put("password", "パスワードは8文字以上で入力してください");
        } else if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            fields.put("password", "パスワードが長すぎます（半角72文字以内）");
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
        try {
            users.save(user);
        } catch (DataIntegrityViolationException exception) {
            // 重複チェックの直後に同じメールアドレスで登録された場合
            throw new ApiException(HttpStatus.BAD_REQUEST, "入力内容を確認してください", Map.of("email", EMAIL_TAKEN));
        }
        return tokenBody(user);
    }

    public Map<String, String> login(Map<String, String> body) {
        String email = AllowedUsers.normalize(body.get("email"));
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

    private static boolean isEmailFormat(String email) {
        int at = email.indexOf('@');
        return email.length() <= MAX_EMAIL_LENGTH && at > 0 && at == email.lastIndexOf('@') && at < email.length() - 1;
    }

    private String text(String value) {
        return value == null ? "" : value.trim();
    }
}

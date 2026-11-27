package jp.molino.skill.auth;

/** 認証の API でやり取りする値。どれも小さいので1つのファイルにまとめている。 */
public final class AuthDtos {
    private AuthDtos() {
    }

    public record LoginRequest(String email, String password) {
    }

    public record SignupRequest(String name, String email, String password, String passwordConfirm) {
    }

    /** ログイン・新規登録に成功したときに返す値。token は以後のリクエストで Authorization ヘッダーに付ける。 */
    public record AuthResponse(String token, String name, String email) {
    }

    public record UserResponse(String name, String email) {
    }
}

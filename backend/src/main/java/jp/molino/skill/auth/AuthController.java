package jp.molino.skill.auth;

import jp.molino.skill.auth.AuthDtos.AuthResponse;
import jp.molino.skill.auth.AuthDtos.LoginRequest;
import jp.molino.skill.auth.AuthDtos.SignupRequest;
import jp.molino.skill.auth.AuthDtos.UserResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public AuthResponse signup(@RequestBody(required = false) SignupRequest request) {
        return authService.signup(request == null ? new SignupRequest(null, null, null, null) : request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me() {
        return authService.me();
    }
}

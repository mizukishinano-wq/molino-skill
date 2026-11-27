package jp.molino.skill.advice;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdviceController {
    private final AdviceService adviceService;

    public AdviceController(AdviceService adviceService) {
        this.adviceService = adviceService;
    }

    // AI を呼ぶと料金がかかり、結果も毎回変わるため、GET ではなく POST にする（ブラウザの先読みなどで勝手に呼ばれないように）
    @PostMapping("/api/staffs/{id}/advice")
    public AdviceResponse advise(@PathVariable Long id) {
        return adviceService.advise(id);
    }
}

package jp.molino.skill.skill;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SkillController {
    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping("/api/skill-map")
    public Map<String, Object> map(
            @RequestParam(defaultValue = "全て") String position,
            @RequestParam(defaultValue = "false") boolean newcomersOnly) {
        return skillService.map(position, newcomersOnly);
    }

    @GetMapping("/api/staffs/{id}/skills")
    public List<Map<String, Object>> skills(@PathVariable Long id) {
        return skillService.staffSkills(id);
    }

    @PutMapping("/api/staffs/{id}/skills")
    public List<Map<String, Object>> save(@PathVariable Long id, @RequestBody Map<String, List<Map<String, Object>>> body) {
        return skillService.saveAll(id, body.get("items"));
    }
}

package jp.molino.skill.staff;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staffs")
public class StaffController {
    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public List<StaffResponse> list(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String position,
            @RequestParam(defaultValue = "false") boolean includeRetired) {
        return staffService.list(name, position, includeRetired);
    }

    @GetMapping("/{id}")
    public StaffResponse get(@PathVariable Long id) {
        return staffService.get(id);
    }

    @PostMapping
    public StaffResponse create(@RequestBody StaffRequest request) {
        return staffService.create(request);
    }

    @PutMapping("/{id}")
    public StaffResponse update(@PathVariable Long id, @RequestBody StaffRequest request) {
        return staffService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        staffService.delete(id);
        return Map.of("message", "削除しました");
    }
}

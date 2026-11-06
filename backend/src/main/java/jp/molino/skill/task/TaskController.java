package jp.molino.skill.task;

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
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) String position) {
        return taskService.list(position);
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable Long id, @RequestParam(defaultValue = "2") int minLevel) {
        return taskService.detail(id, minLevel);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, String> body) {
        return taskService.create(body);
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return taskService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        taskService.delete(id);
        return Map.of("message", "削除しました");
    }
}

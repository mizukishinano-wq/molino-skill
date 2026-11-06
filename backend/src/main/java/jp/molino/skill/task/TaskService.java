package jp.molino.skill.task;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import jp.molino.skill.common.ApiException;
import jp.molino.skill.common.Positions;
import jp.molino.skill.common.TaskOrder;
import jp.molino.skill.skill.Skill;
import jp.molino.skill.skill.SkillRepository;
import jp.molino.skill.staff.Staff;
import jp.molino.skill.staff.StaffService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {
    private final TaskRepository tasks;
    private final SkillRepository skills;
    private final StaffService staffService;

    public TaskService(TaskRepository tasks, SkillRepository skills, StaffService staffService) {
        this.tasks = tasks;
        this.skills = skills;
        this.staffService = staffService;
    }

    public List<Map<String, Object>> list(String position) {
        return tasks.findAllByOrderByIdAsc().stream()
                .filter(task -> position == null || position.isBlank() || position.equals("全て") || task.getPosition().equals(position))
                .sorted(Comparator.comparingInt(TaskOrder::index))
                .map(this::toMap)
                .toList();
    }

    public Map<String, Object> detail(Long id, int minLevel) {
        WorkTask task = find(id);
        List<Map<String, Object>> people = skills.findByTaskId(id).stream()
                .filter(skill -> skill.getLevel() >= minLevel)
                .map(skill -> Map.entry(skill, staffService.find(skill.getStaffId())))
                .filter(entry -> entry.getValue().isActive())
                .sorted(Comparator.<Map.Entry<Skill, Staff>>comparingInt(entry -> entry.getKey().getLevel()).reversed()
                        .thenComparing(entry -> entry.getValue().getName()))
                .map(entry -> {
                    Map<String, Object> person = new LinkedHashMap<>();
                    person.put("staffId", entry.getValue().getId());
                    person.put("name", entry.getValue().getName());
                    person.put("position", entry.getValue().getPosition());
                    person.put("newcomer", StaffService.isNewcomer(entry.getValue().getJoinDate()));
                    person.put("level", entry.getKey().getLevel());
                    person.put("updatedOn", entry.getKey().getUpdatedOn().toString());
                    return person;
                })
                .toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("task", toMap(task));
        body.put("people", people);
        return body;
    }

    @Transactional
    public Map<String, Object> create(Map<String, String> body) {
        WorkTask task = new WorkTask();
        apply(task, body);
        return toMap(tasks.save(task));
    }

    @Transactional
    public Map<String, Object> update(Long id, Map<String, String> body) {
        WorkTask task = find(id);
        apply(task, body);
        return toMap(tasks.save(task));
    }

    @Transactional
    public void delete(Long id) {
        find(id);
        skills.deleteByTaskId(id);
        tasks.deleteById(id);
    }

    public WorkTask find(Long id) {
        return tasks.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "仕事が見つかりません"));
    }

    public Map<String, Object> toMap(WorkTask task) {
        long capable = skills.findByTaskId(task.getId()).stream()
                .filter(skill -> skill.getLevel() >= 2)
                .filter(skill -> staffService.find(skill.getStaffId()).isActive())
                .count();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", task.getId());
        map.put("name", task.getName());
        map.put("position", task.getPosition());
        map.put("capableCount", capable);
        return map;
    }

    private void apply(WorkTask task, Map<String, String> body) {
        String name = body.get("name") == null ? "" : body.get("name").trim();
        String position = body.get("position") == null ? "" : body.get("position").trim();
        Map<String, String> fields = new LinkedHashMap<>();
        if (name.isEmpty()) {
            fields.put("name", "仕事名を入力してください");
        } else if (name.length() > 30) {
            fields.put("name", "仕事名は30文字以内で入力してください");
        }
        if (!Positions.contains(position)) {
            fields.put("position", "ポジションを選んでください");
        }
        if (!fields.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "入力内容を確認してください", fields);
        }
        tasks.findByNameAndPosition(name, position).ifPresent(existing -> {
            if (task.getId() == null || !existing.getId().equals(task.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, position + "の「" + name + "」はすでに登録されています",
                        Map.of("name", position + "の「" + name + "」はすでに登録されています"));
            }
        });
        task.setName(name);
        task.setPosition(position);
    }
}

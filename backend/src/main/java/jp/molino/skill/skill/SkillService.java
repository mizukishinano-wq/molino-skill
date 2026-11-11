package jp.molino.skill.skill;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import jp.molino.skill.common.ApiException;
import jp.molino.skill.common.Positions;
import jp.molino.skill.common.TaskOrder;
import jp.molino.skill.staff.Staff;
import jp.molino.skill.staff.StaffService;
import jp.molino.skill.task.TaskRepository;
import jp.molino.skill.task.TaskService;
import jp.molino.skill.task.WorkTask;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SkillService {
    private final SkillRepository skills;
    private final TaskRepository tasks;
    private final StaffService staffService;
    private final TaskService taskService;

    public SkillService(SkillRepository skills, TaskRepository tasks, StaffService staffService, TaskService taskService) {
        this.skills = skills;
        this.tasks = tasks;
        this.staffService = staffService;
        this.taskService = taskService;
    }

    public List<Map<String, Object>> staffSkills(Long staffId) {
        staffService.find(staffId);
        return skills.findByStaffId(staffId).stream()
                .map(skill -> {
                    WorkTask task = taskService.find(skill.getTaskId());
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("taskId", task.getId());
                    row.put("taskName", task.getName());
                    row.put("position", task.getPosition());
                    row.put("level", skill.getLevel());
                    row.put("updatedOn", skill.getUpdatedOn().toString());
                    return row;
                })
                .sorted(Comparator.<Map<String, Object>>comparingInt(row -> Positions.NAMES.indexOf(row.get("position")))
                        .thenComparing(Comparator.<Map<String, Object>>comparingInt(row -> (Integer) row.get("level")).reversed())
                        .thenComparing(row -> String.valueOf(row.get("taskName"))))
                .toList();
    }

    @Transactional
    public List<Map<String, Object>> saveAll(Long staffId, List<Map<String, Object>> items) {
        staffService.find(staffId);
        if (items == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "保存するスキルがありません");
        }
        for (Map<String, Object> item : items) {
            Long taskId = parseTaskId(item);
            taskService.find(taskId);
            int level = parseLevel(item);
            var existing = skills.findByStaffIdAndTaskId(staffId, taskId);
            if (level == 0) {
                existing.ifPresent(skills::delete);
                continue;
            }
            if (existing.isPresent()) {
                Skill skill = existing.get();
                if (skill.getLevel() != level) {
                    skill.setLevel(level);
                    skill.setUpdatedOn(LocalDate.now());
                    skills.save(skill);
                }
            } else {
                Skill skill = new Skill();
                skill.setStaffId(staffId);
                skill.setTaskId(taskId);
                skill.setLevel(level);
                skill.setUpdatedOn(LocalDate.now());
                skills.save(skill);
            }
        }
        return staffSkills(staffId);
    }

    private Long parseTaskId(Map<String, Object> item) {
        try {
            return Long.valueOf(String.valueOf(item == null ? null : item.get("taskId")));
        } catch (NumberFormatException exception) {
            throw new ApiException(HttpStatus.NOT_FOUND, "仕事が見つかりません");
        }
    }

    private int parseLevel(Map<String, Object> item) {
        int level;
        try {
            level = Integer.parseInt(String.valueOf(item.get("level")));
        } catch (NumberFormatException exception) {
            level = -1;
        }
        if (level < 0 || level > 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "習熟度は未登録、1、2、3から選んでください");
        }
        return level;
    }

    public Map<String, Object> map(String position, boolean newcomersOnly) {
        List<Staff> people = staffService.list(null, null, false).stream()
                .map(row -> staffService.find(Long.valueOf(String.valueOf(row.get("id")))))
                .filter(staff -> !newcomersOnly || StaffService.isNewcomer(staff.getJoinDate()))
                .toList();
        List<WorkTask> taskList = tasks.findAllByOrderByIdAsc().stream()
                .filter(task -> position == null || position.isBlank() || position.equals("全て") || task.getPosition().equals(position))
                .sorted(Comparator.comparingInt(TaskOrder::index))
                .toList();
        List<Map<String, Object>> cells = new ArrayList<>();
        List<Map<String, Object>> taskRows = new ArrayList<>();
        LocalDate latest = null;
        for (WorkTask task : taskList) {
            int capable = 0;
            for (Staff staff : people) {
                var skill = skills.findByStaffIdAndTaskId(staff.getId(), task.getId());
                int level = skill.map(Skill::getLevel).orElse(0);
                if (level >= 2) {
                    capable++;
                }
                if (level > 0) {
                    LocalDate updated = skill.get().getUpdatedOn();
                    if (latest == null || updated.isAfter(latest)) {
                        latest = updated;
                    }
                    cells.add(Map.of("staffId", staff.getId(), "taskId", task.getId(), "level", level));
                }
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", task.getId());
            row.put("name", task.getName());
            row.put("position", task.getPosition());
            row.put("capableCount", capable);
            taskRows.add(row);
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("staffs", people.stream().map(staffService::toMap).toList());
        body.put("tasks", taskRows);
        body.put("cells", cells);
        body.put("updatedOn", latest == null ? "" : latest.toString());
        return body;
    }
}

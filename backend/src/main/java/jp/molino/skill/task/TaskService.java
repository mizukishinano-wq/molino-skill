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

    public List<TaskResponse> list(String position) {
        return tasks.findAllByOrderByIdAsc().stream()
                .filter(task -> position == null || position.isBlank() || position.equals("全て") || task.getPosition().equals(position))
                .sorted(Comparator.comparingInt(TaskOrder::index))
                .map(this::toResponse)
                .toList();
    }

    public TaskDetailResponse detail(Long id, int minLevel) {
        WorkTask task = find(id);
        List<TaskDetailResponse.Person> people = skills.findByTaskId(id).stream()
                .filter(skill -> skill.getLevel() >= minLevel)
                .map(skill -> Map.entry(skill, staffService.find(skill.getStaffId())))
                .filter(entry -> entry.getValue().isActive())
                .sorted(Comparator.<Map.Entry<Skill, Staff>>comparingInt(entry -> entry.getKey().getLevel()).reversed()
                        .thenComparing(entry -> entry.getValue().getName()))
                .map(entry -> new TaskDetailResponse.Person(
                        entry.getValue().getId(),
                        entry.getValue().getName(),
                        entry.getValue().getPosition(),
                        StaffService.isNewcomer(entry.getValue().getJoinDate()),
                        entry.getKey().getLevel(),
                        entry.getKey().getUpdatedOn().toString()))
                .toList();
        return new TaskDetailResponse(toResponse(task), people);
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        WorkTask task = new WorkTask();
        apply(task, request);
        return toResponse(tasks.save(task));
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        WorkTask task = find(id);
        apply(task, request);
        return toResponse(tasks.save(task));
    }

    @Transactional
    public void delete(Long id) {
        find(id);
        // スキルは仕事を参照しているため、先にスキルを消してから仕事を消す
        skills.deleteByTaskId(id);
        tasks.deleteById(id);
    }

    public WorkTask find(Long id) {
        return tasks.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "仕事が見つかりません"));
    }

    /** 「できる人」（習熟度2以上かつ在籍中）の人数を数えて、画面用の値にする。 */
    public TaskResponse toResponse(WorkTask task) {
        long capable = skills.findByTaskId(task.getId()).stream()
                .filter(skill -> skill.getLevel() >= 2)
                .filter(skill -> staffService.find(skill.getStaffId()).isActive())
                .count();
        return TaskResponse.of(task, capable);
    }

    private void apply(WorkTask task, TaskRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        String position = request.position() == null ? "" : request.position().trim();
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

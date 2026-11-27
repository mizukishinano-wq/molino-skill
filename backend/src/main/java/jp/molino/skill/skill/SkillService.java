package jp.molino.skill.skill;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import jp.molino.skill.common.ApiException;
import jp.molino.skill.common.Positions;
import jp.molino.skill.common.TaskOrder;
import jp.molino.skill.staff.Staff;
import jp.molino.skill.staff.StaffResponse;
import jp.molino.skill.staff.StaffService;
import jp.molino.skill.task.TaskRepository;
import jp.molino.skill.task.TaskResponse;
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

    /** スタッフのスキルを、ポジションの順 → 習熟度の高い順 → 仕事名の順に並べて返す。 */
    public List<StaffSkillResponse> staffSkills(Long staffId) {
        staffService.find(staffId);
        return skills.findByStaffId(staffId).stream()
                .map(skill -> {
                    WorkTask task = taskService.find(skill.getTaskId());
                    return new StaffSkillResponse(task.getId(), task.getName(), task.getPosition(), skill.getLevel(),
                            skill.getUpdatedOn().toString());
                })
                .sorted(Comparator.comparingInt((StaffSkillResponse row) -> Positions.NAMES.indexOf(row.position()))
                        .thenComparing(Comparator.comparingInt(StaffSkillResponse::level).reversed())
                        .thenComparing(StaffSkillResponse::taskName))
                .toList();
    }

    /**
     * スタッフ1人分のスキルをまとめて保存する。
     * 途中で1件でも不正な値があれば、@Transactional により全件の変更を取り消す。
     */
    @Transactional
    public List<StaffSkillResponse> saveAll(Long staffId, List<SkillSaveRequest.Item> items) {
        staffService.find(staffId);
        if (items == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "保存するスキルがありません");
        }
        for (SkillSaveRequest.Item item : items) {
            Long taskId = parseTaskId(item);
            taskService.find(taskId);
            int level = parseLevel(item);
            var existing = skills.findByStaffIdAndTaskId(staffId, taskId);
            // 習熟度0（未登録）は行を持たない。0 に戻されたら行を削除する
            if (level == 0) {
                existing.ifPresent(skills::delete);
                continue;
            }
            if (existing.isPresent()) {
                Skill skill = existing.get();
                // 最終更新日は「習熟度が変わった日」を表すため、同じ値で保存されたときは更新しない
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

    private Long parseTaskId(SkillSaveRequest.Item item) {
        try {
            return Long.valueOf(String.valueOf(item == null ? null : item.taskId()));
        } catch (NumberFormatException exception) {
            throw new ApiException(HttpStatus.NOT_FOUND, "仕事が見つかりません");
        }
    }

    private int parseLevel(SkillSaveRequest.Item item) {
        int level;
        try {
            level = Integer.parseInt(String.valueOf(item.level()));
        } catch (NumberFormatException exception) {
            level = -1;
        }
        if (level < 0 || level > 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "習熟度は未登録、1、2、3から選んでください");
        }
        return level;
    }

    /** スキルマップの表を作る。在籍中のスタッフだけを対象にし、「できる人」の人数もこの範囲で数える。 */
    public SkillMapResponse map(String position, boolean newcomersOnly) {
        List<Staff> people = staffService.list(null, null, false).stream()
                .map(row -> staffService.find(row.id()))
                .filter(staff -> !newcomersOnly || StaffService.isNewcomer(staff.getJoinDate()))
                .toList();
        List<WorkTask> taskList = tasks.findAllByOrderByIdAsc().stream()
                .filter(task -> position == null || position.isBlank() || position.equals("全て") || task.getPosition().equals(position))
                .sorted(Comparator.comparingInt(TaskOrder::index))
                .toList();
        List<SkillMapResponse.Cell> cells = new ArrayList<>();
        List<TaskResponse> taskRows = new ArrayList<>();
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
                    cells.add(new SkillMapResponse.Cell(staff.getId(), task.getId(), level));
                }
            }
            taskRows.add(TaskResponse.of(task, capable));
        }
        List<StaffResponse> staffRows = people.stream().map(StaffResponse::from).toList();
        return new SkillMapResponse(staffRows, taskRows, cells, latest == null ? "" : latest.toString());
    }
}
